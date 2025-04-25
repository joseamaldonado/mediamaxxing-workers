/**
 * Comprehensive Integration Test for Tracking AND Payment Processing
 * This tests the end-to-end flow from tracking views to processing payments
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { processSubmission } from '../utils/tracking/processor';
import { processPayments } from '../utils/payments';
import { Database } from '../types/supabase';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper to log with timestamp and color
function log(message: string, color = colors.reset): void {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Test videos with real content
const TEST_VIDEOS = {
  youtube: [
    'https://www.youtube.com/shorts/5bADRYTR5Zw', // YouTube Short 1
    'https://www.youtube.com/shorts/AnLJHWX4eQY'  // YouTube Short 2
  ],
  tiktok: [
    'https://www.tiktok.com/@tysonliberto/video/7492472074842148127',  // TikTok 1
    'https://www.tiktok.com/@zibra_zubra/video/7493303783296945426'    // TikTok 2
  ]
};

// Platform types
type PlatformType = Database['public']['Enums']['platform_type'];

// Test data container
const testData = {
  campaignId: '',
  userId: '',
  submissions: [] as Array<{id: string; platform: PlatformType; url: string}>
};

// Configuration
const TEST_DURATION_MINUTES = 5; // More realistic timeframe
const TRACKING_INTERVAL_SECONDS = 60; // Run tracking once per minute (simulating hourly in production)
const PAYMENT_INTERVAL_COUNT = 5; // Process payments every 5 tracking runs (simulating daily in production)
const TEST_BUDGET = 10000.00; // $10K budget for testing

// Function to set up test submissions
async function setupTestData(): Promise<void> {
  log('Setting up test data...', colors.cyan);
  
  // Get a test campaign (first active one we find)
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('status', 'active')
    .limit(1);
  
  if (campaignError || !campaigns || campaigns.length === 0) {
    log('No active campaigns found. Create an active campaign first.', colors.red);
    process.exit(1);
  }
  
  const campaignId = campaigns[0].id;
  testData.campaignId = campaignId;
  
  log(`Using campaign: ${campaigns[0].title} (ID: ${campaignId})`, colors.cyan);
  
  // Get a test user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, stripe_connect_id')
    .not('stripe_connect_id', 'is', null)  // Must have Stripe connected
    .limit(1);
  
  if (userError || !users || users.length === 0) {
    log('No users with Stripe Connect accounts found.', colors.red);
    process.exit(1);
  }
  
  const userId = users[0].id;
  testData.userId = userId;
  
  log(`Using user: ${users[0].email} (ID: ${userId})`, colors.cyan);
  
  // Reset campaign with appropriate budget and rate
  const { error: updateCampaignError } = await supabase
    .from('campaigns')
    .update({ 
      status: 'active',
      budget: TEST_BUDGET,  // $10K budget
      total_paid: 0,
      rate_per_1000_views: 1.00 // $1.00 per 1000 views
    })
    .eq('id', campaignId);
  
  if (updateCampaignError) {
    log(`Error updating campaign: ${updateCampaignError.message}`, colors.red);
    process.exit(1);
  }
  
  // Clean up any existing test submissions
  const { error: deleteError } = await supabase
    .from('submissions')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .like('asset_url', '%youtube.com%')
    .or('asset_url.like.%tiktok.com%');
  
  if (deleteError) {
    log(`Error cleaning up old test submissions: ${deleteError.message}`, colors.red);
  } else {
    log('Cleaned up old test submissions', colors.yellow);
  }
  
  // Create test submissions for YouTube and TikTok
  async function createTestSubmission(url: string, platform: PlatformType) {
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        asset_url: url,
        platform,
        status: 'approved',
        views: 0,
        payout_amount: 0
      })
      .select()
      .single();
    
    if (error) {
      log(`Error creating ${platform} test submission: ${error.message}`, colors.red);
      return null;
    }
    
    log(`Created ${platform} submission: ${submission.id}`, colors.green);
    
    return submission;
  }
  
  // Create YouTube submissions
  for (const url of TEST_VIDEOS.youtube) {
    const submission = await createTestSubmission(url, 'youtube');
    if (submission) {
      testData.submissions.push({
        id: submission.id,
        platform: 'youtube',
        url
      });
    }
  }
  
  // Create TikTok submissions
  for (const url of TEST_VIDEOS.tiktok) {
    const submission = await createTestSubmission(url, 'tiktok');
    if (submission) {
      testData.submissions.push({
        id: submission.id,
        platform: 'tiktok',
        url
      });
    }
  }
  
  log(`Created ${testData.submissions.length} test submissions for tracking`, colors.green);
}

// Track views using actual processor implementation
async function trackViews() {
  log('\nTracking views using actual processor implementation...', colors.magenta);
  
  const results = {
    successful: 0,
    failed: 0,
    totalNewViews: 0
  };
  
  for (const submission of testData.submissions) {
    log(`Processing submission ${submission.id} (${submission.platform})...`, colors.cyan);
    
    try {
      // Get fresh submission data from DB
      const { data: submissionData, error } = await supabase
        .from('submissions')
        .select('id, asset_url, platform, views, campaign_id')
        .eq('id', submission.id)
        .single();
      
      if (error) throw new Error(`Failed to get submission: ${error.message}`);
      
      // Use the actual processor implementation
      const result = await processSubmission(submissionData);
      
      log(`Processing result: ${JSON.stringify(result)}`, colors.cyan);
      
      if (result.success) {
        results.successful++;
        if (result.viewDifference && result.viewDifference > 0) {
          results.totalNewViews += result.viewDifference;
          log(`★ Successfully tracked ${result.viewDifference} new views for ${submission.platform}!`, colors.green);
        } else {
          log(`No new views tracked for ${submission.platform}`, colors.yellow);
        }
      } else {
        results.failed++;
        log(`Failed to track views: ${result.message}`, colors.red);
      }
    } catch (error: any) {
      results.failed++;
      log(`Error tracking views: ${error.message}`, colors.red);
    }
  }
  
  log(`View tracking summary: ${results.successful} successful, ${results.failed} failed`, colors.cyan);
  log(`Total new views tracked: ${results.totalNewViews}`, colors.green);
  
  return results;
}

// Process payments using actual payment processor
async function processPaymentsForTest() {
  log('\nProcessing payments...', colors.blue);
  
  try {
    const result = await processPayments();
    log(`Payment processing result: ${JSON.stringify(result)}`, colors.green);
    return result;
  } catch (error: any) {
    log(`Error processing payments: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

// Check status of submissions and payments
async function checkStatus() {
  log('\nChecking current status...', colors.cyan);
  
  // Check campaign status
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, title, budget, total_paid, active')
    .eq('id', testData.campaignId)
    .single();
  
  if (campaign) {
    log(`Campaign: ${campaign.title}`, colors.cyan);
    log(`  Budget: $${campaign.budget.toFixed(2)}`, colors.cyan);
    log(`  Total Paid: $${campaign.total_paid.toFixed(2)}`, colors.cyan);
    log(`  Active: ${campaign.status === 'active' ? 'Yes' : 'No'}`, campaign.status === 'active' ? colors.green : colors.red);
  }
  
  // Check all submissions
  log('\nSubmissions status:', colors.cyan);
  
  for (const submission of testData.submissions) {
    // Get current submission data
    const { data: currentSubmission } = await supabase
      .from('submissions')
      .select('id, platform, views, payout_amount')
      .eq('id', submission.id)
      .single();
    
    if (currentSubmission) {
      log(`Submission ${currentSubmission.id} (${currentSubmission.platform}):`, colors.cyan);
      log(`  Views: ${currentSubmission.views}`, colors.cyan);
      log(`  Payout amount: $${(currentSubmission.payout_amount || 0).toFixed(4)}`, colors.cyan);
      
      // Get view history
      const { data: viewHistory } = await supabase
        .from('view_history')
        .select('id, view_count, tracked_at, paid')
        .eq('submission_id', submission.id)
        .order('tracked_at', { ascending: true });
      
      if (viewHistory && viewHistory.length > 0) {
        const paidViews = viewHistory.filter(v => v.paid);
        const unpaidViews = viewHistory.filter(v => !v.paid);
        
        log(`  View history records: ${viewHistory.length}`, colors.cyan);
        log(`    Paid records: ${paidViews.length}`, colors.green);
        log(`    Unpaid records: ${unpaidViews.length}`, colors.yellow);
        
        // Verify that the submission views match the latest view history
        const latestViewCount = viewHistory[viewHistory.length - 1].view_count;
        if (currentSubmission.views === latestViewCount) {
          log(`  ✅ Views match latest history record (${latestViewCount})`, colors.green);
        } else {
          log(`  ❌ Views don't match! Submission: ${currentSubmission.views}, History: ${latestViewCount}`, colors.red);
        }
      } else {
        log(`  No view history records found`, colors.yellow);
      }
    }
  }
}

// Run the integration test
async function runTest() {
  log('Starting comprehensive tracking & payment integration test', colors.bright + colors.blue);
  log(`Will run for ${TEST_DURATION_MINUTES} minutes with realistic production timing`, colors.blue);
  log(`Tracking every ${TRACKING_INTERVAL_SECONDS} seconds, payments every ${PAYMENT_INTERVAL_COUNT} tracking runs`, colors.blue);
  
  // Setup test data
  await setupTestData();
  
  // Initial status check
  await checkStatus();
  
  // Calculate iterations
  const totalIterations = Math.ceil((TEST_DURATION_MINUTES * 60) / TRACKING_INTERVAL_SECONDS);
  let currentIteration = 0;
  
  // Start the interval
  const interval = setInterval(async () => {
    currentIteration++;
    log(`\n======= Iteration ${currentIteration}/${totalIterations} =======`, colors.bright + colors.yellow);
    
    // Track views (simulates hourly cron)
    await trackViews();
    
    // Process payments periodically (simulates daily cron)
    if (currentIteration % PAYMENT_INTERVAL_COUNT === 0 || currentIteration === totalIterations) {
      log('\n💰 Simulating daily payment processing...', colors.bright + colors.blue);
      await processPaymentsForTest();
    }
    
    // Check status
    await checkStatus();
    
    // End the test when we're done
    if (currentIteration >= totalIterations) {
      clearInterval(interval);
      log('\n✨ Integration test completed! ✨', colors.bright + colors.green);
      process.exit(0);
    }
  }, TRACKING_INTERVAL_SECONDS * 1000);
}

// Run the test
runTest().catch(error => {
  log(`Error in test: ${error.message}`, colors.red);
  process.exit(1);
}); 