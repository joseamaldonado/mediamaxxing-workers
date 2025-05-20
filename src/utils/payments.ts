import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Database } from '../types/supabase';
import { config } from 'dotenv';

// Load environment variables first
config({ path: '.env.local' });

// Verify we have the key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('WARNING: STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

// Service role client that bypasses RLS
function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  return supabase;
}

/**
 * Database triggers and scheduled jobs now handle campaign state transitions
 * based on dates. This is no longer needed in the application code.
 */

/**
 * Process payments for all submissions with unpaid views
 */
export async function processPayments() {
  // Database triggers now handle campaign state transitions based on dates
  
  // Use service role client to bypass RLS
  const supabase = createServiceClient();
  
  // 1. Get all submissions with approved status for active campaigns
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*, campaigns(*)')
    .eq('status', 'approved')
    .eq('campaigns.status', 'active');
  
  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
    return { success: false, error: submissionsError.message };
  }
  
  if (!submissions || submissions.length === 0) {
    console.log('No approved submissions found for active campaigns');
    return { success: true, message: 'No approved submissions found' };
  }
  
  let results = [];
  
  // Process each submission
  for (const submission of submissions) {
    const result = await processPaymentForSubmission(submission);
    results.push(result);
  }
  
  return { success: true, results };
}

/**
 * Process payment for a single submission
 */
async function processPaymentForSubmission(submission: any) {
  // Use service role client to bypass RLS
  const supabase = createServiceClient();
  const submissionId = submission.id;
  const campaignId = submission.campaign_id;
  const userId = submission.user_id;
  
  // Get latest campaign data to ensure we have the current total_paid value
  const { data: campaignData, error: getCampaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', submission.campaign_id)
    .single();
    
  if (getCampaignError || !campaignData) {
    return { 
      submissionId, 
      success: false, 
      error: 'Campaign not found or error fetching latest campaign data' 
    };
  }
  
  const campaign = campaignData;
  
  // Skip if campaign doesn't exist
  if (!campaign) {
    return { 
      submissionId, 
      success: false, 
      error: 'Campaign not found' 
    };
  }
  
  // Check campaign status
  if (campaign.status !== 'active') {
    return { 
      submissionId, 
      success: false, 
      error: `Campaign is not active. Current status: ${campaign.status}` 
    };
  }
  
  // Check if campaign has budget left
  if (Number(campaign.total_paid) >= Number(campaign.budget) && Number(campaign.budget) > 0) {
    return { 
      submissionId, 
      success: false, 
      error: 'Campaign budget exhausted' 
    };
  }
  
  // Check if we're about to hit a budget breakpoint
  if (campaign.budget_breakpoints && campaign.budget_breakpoints.length > 0) {
    const currentBreakpointIndex = campaign.current_breakpoint_index || 0;
    
    // Only check if we haven't processed all breakpoints yet
    if (currentBreakpointIndex < campaign.budget_breakpoints.length) {
      const nextBreakpoint = campaign.budget_breakpoints[currentBreakpointIndex];
      const currentTotal = Number(campaign.total_paid);
      
      // Get baseline and unpaid views to estimate payment
      const baselineViews = await getBaselineViews(supabase, submissionId);
      const highestUnpaidView = await getHighestUnpaidView(supabase, submissionId);
      
      if (highestUnpaidView) {
        const newViews = Math.max(0, highestUnpaidView.view_count - baselineViews);
        const ratePerView = Number(campaign.rate_per_1000_views) / 1000;
        let estimatedPayment = Number((newViews * ratePerView).toFixed(2));
        
        // Apply max payout per submission limit if set
        if (campaign.payout_max_per_submission && Number(campaign.payout_max_per_submission) > 0) {
          const { data: currentSubmission } = await supabase
            .from('submissions')
            .select('payout_amount')
            .eq('id', submissionId)
            .single();
          
          const currentPayoutAmount = Number(currentSubmission?.payout_amount || 0);
          const maxPayoutPerSubmission = Number(campaign.payout_max_per_submission);
          const remainingAllowedPayout = Math.max(0, maxPayoutPerSubmission - currentPayoutAmount);
          
          estimatedPayment = Math.min(estimatedPayment, remainingAllowedPayout);
        }
        
        // Apply campaign budget limit
        estimatedPayment = Math.min(estimatedPayment, Number(campaign.budget) - currentTotal);
        
        // Check if this payment would cross the breakpoint
        if (currentTotal + estimatedPayment >= nextBreakpoint) {
          // Pause the campaign at this breakpoint
          await supabase
            .from('campaigns')
            .update({
              status: 'paused_at_breakpoint' as Database['public']['Enums']['campaign_status'],
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);
          
          console.log(`Campaign ${campaignId} paused at breakpoint $${nextBreakpoint}`);
          
          return {
            submissionId,
            success: false,
            error: `Campaign paused at breakpoint $${nextBreakpoint}`
          };
        }
      }
    }
  }
  
  // Get the creator's Stripe Connect ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_connect_id, stripe_connect_onboarded')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile?.stripe_connect_id || !profile.stripe_connect_onboarded) {
    return { 
      submissionId, 
      success: false, 
      error: 'Creator has not completed Stripe Connect onboarding' 
    };
  }
  
  // 1. Get the highest paid view count (baseline) using our helper function
  const baselineViews = await getBaselineViews(supabase, submissionId);
  
  // 2. Get the highest unpaid view count (current total) using our helper function  
  const highestUnpaidView = await getHighestUnpaidView(supabase, submissionId);
  
  if (!highestUnpaidView) {
    return { 
      submissionId, 
      success: true, 
      message: 'No new views to pay for' 
    };
  }
  
  // 3. Calculate new views
  const newViews = Math.max(0, highestUnpaidView.view_count - baselineViews);
  
  if (newViews <= 0) {
    return { 
      submissionId, 
      success: true, 
      message: 'No new views to pay for' 
    };
  }
  
  // 4. Calculate payment amount
  const ratePerView = Number(campaign.rate_per_1000_views) / 1000;
  const paymentAmount = Number((newViews * ratePerView).toFixed(2));
  
  if (paymentAmount <= 0) {
    return { 
      submissionId, 
      success: true, 
      message: 'Payment amount too small' 
    };
  }
  
  // Check if payment would exceed campaign budget
  const remainingBudget = Number(campaign.budget) - Number(campaign.total_paid);
  let finalPaymentAmount = Math.min(paymentAmount, remainingBudget);
  
  if (finalPaymentAmount <= 0) {
    return { 
      submissionId, 
      success: false, 
      error: 'Campaign budget exhausted' 
    };
  }
  
  // Check if payment would exceed max payout per submission (if set)
  if (campaign.payout_max_per_submission && Number(campaign.payout_max_per_submission) > 0) {
    // Get current payout amount for this submission
    const { data: currentSubmission } = await supabase
      .from('submissions')
      .select('payout_amount')
      .eq('id', submissionId)
      .single();
    
    const currentPayoutAmount = Number(currentSubmission?.payout_amount || 0);
    const maxPayoutPerSubmission = Number(campaign.payout_max_per_submission);
    
    // Calculate remaining allowed payout for this submission
    const remainingAllowedPayout = Math.max(0, maxPayoutPerSubmission - currentPayoutAmount);
    
    // If we'll exceed the max, adjust the payment amount
    if (finalPaymentAmount > remainingAllowedPayout) {
      // If no more payment allowed, return early
      if (remainingAllowedPayout <= 0) {
        console.log(`Submission ${submissionId} has reached max payout limit of $${maxPayoutPerSubmission}`);
        return {
          submissionId,
          success: true,
          message: `Submission has reached max payout limit of $${maxPayoutPerSubmission}`
        };
      }
      
      console.log(`Adjusting payment from $${finalPaymentAmount} to $${remainingAllowedPayout} due to max payout limit`);
      finalPaymentAmount = remainingAllowedPayout;
    }
  }
  
  try {
    // 5. Process payment via Stripe Connect
    // Convert amount to cents for Stripe
    const paymentAmountCents = Math.round(finalPaymentAmount * 100);
    
    // Create a transfer to the creator's connected account
    const transfer = await stripe.transfers.create({
      amount: paymentAmountCents,
      currency: 'usd',
      destination: profile.stripe_connect_id,
      description: `Payment for ${newViews} views on submission ${submissionId}`,
      metadata: {
        submission_id: submissionId,
        campaign_id: campaignId,
        views: newViews.toString(),
        user_id: userId
      }
    });
    
    // Get the current values to ensure we're updating with the correct amounts
    const { data: currentSubmission } = await supabase
      .from('submissions')
      .select('payout_amount')
      .eq('id', submissionId)
      .single();
      
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('total_paid')
      .eq('id', campaignId)
      .single();
    
    const currentPayoutAmount = currentSubmission?.payout_amount || 0;
    const currentTotalPaid = currentCampaign?.total_paid || 0;
    
    console.log(`Current campaign total_paid: ${currentTotalPaid}, adding payment: ${finalPaymentAmount}`);
    
    // 6. Mark all unpaid view records as paid
    const { error: updateViewsError } = await supabase
      .from('view_history')
      .update({ paid: true })
      .eq('submission_id', submissionId)
      .eq('paid', false);
    
    if (updateViewsError) {
      console.error('Error updating view records:', updateViewsError);
      // Continue anyway as the payment was already sent
    }
    
    // 7. Update submission's payout_amount
    const newPayoutAmount = Number(currentPayoutAmount) + finalPaymentAmount;
    const { error: updateSubmissionError } = await supabase
      .from('submissions')
      .update({ 
        payout_amount: newPayoutAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);
    
    if (updateSubmissionError) {
      console.error('Error updating submission:', updateSubmissionError);
    }
    
    // 8. Update campaign's total_paid
    const newTotalPaid = Number(currentTotalPaid) + finalPaymentAmount;
    
    let updateData: any = { 
      total_paid: newTotalPaid,
      updated_at: new Date().toISOString(),
    };
    
    // Auto-complete campaign if budget is exhausted
    if (newTotalPaid >= Number(campaign.budget) && Number(campaign.budget) > 0) {
      updateData.status = 'completed' as Database['public']['Enums']['campaign_status'];
    } else if (campaign.budget_breakpoints && 
        campaign.budget_breakpoints.length > 0 && 
        (campaign.current_breakpoint_index || 0) < campaign.budget_breakpoints.length && 
        newTotalPaid >= campaign.budget_breakpoints[campaign.current_breakpoint_index || 0]) {
      // Mark as paused at breakpoint
      updateData.status = 'paused_at_breakpoint' as Database['public']['Enums']['campaign_status'];
      // Increment the breakpoint index for the next check
      updateData.current_breakpoint_index = (campaign.current_breakpoint_index || 0) + 1;
    }
    
    // Database triggers now handle date-based transitions
    
    const { error: updateCampaignError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId);
    
    if (updateCampaignError) {
      console.error('Error updating campaign:', updateCampaignError);
    }
    
    // If campaign status changed, log this information
    if (updateData.status && updateData.status !== campaign.status) {
      console.log(`Campaign ${campaignId} status changed from ${campaign.status} to ${updateData.status}`);
    }
    
    return { 
      submissionId, 
      success: true, 
      transfer: transfer.id,
      amount: finalPaymentAmount,
      views: newViews
    };
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return { 
      submissionId, 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Manually process payment for a specific submission
 */
export async function processPaymentForSubmissionById(submissionId: string) {
  // Use service role client to bypass RLS
  const supabase = createServiceClient();
  
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*, campaigns(*)')
    .eq('id', submissionId)
    .eq('status', 'approved')
    .single();
  
  if (error || !submission) {
    return { 
      success: false, 
      error: error?.message || 'Submission not found or not approved' 
    };
  }
  
  return await processPaymentForSubmission(submission);
}

/**
 * Helper to get the highest paid view count (baseline views)
 */
async function getBaselineViews(supabase: any, submissionId: string): Promise<number> {
  const { data: highestPaidView } = await supabase
    .from('view_history')
    .select('view_count')
    .eq('submission_id', submissionId)
    .eq('paid', true)
    .order('view_count', { ascending: false })
    .limit(1)
    .single();
  
  return highestPaidView ? highestPaidView.view_count : 0;
}

/**
 * Helper to get the highest unpaid view record
 */
async function getHighestUnpaidView(supabase: any, submissionId: string): Promise<{view_count: number} | null> {
  const { data: highestUnpaidView } = await supabase
    .from('view_history')
    .select('view_count')
    .eq('submission_id', submissionId)
    .eq('paid', false)
    .order('view_count', { ascending: false })
    .limit(1)
    .single();
  
  return highestUnpaidView || null;
} 