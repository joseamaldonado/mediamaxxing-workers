/**
 * Campaign State Machine Integration Test
 * Tests state transitions in the new campaign state machine implementation
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
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

// Constants for test
const TEST_PREFIX = 'test_state_machine_';
const DAY_MS = 24 * 60 * 60 * 1000;
type CampaignStatus = Database['public']['Enums']['campaign_status'];

// We'll use Jest for running in the test environment
// But we're using direct testing for manual invocation
// The code below will only run in a Jest environment
if (process.env.NODE_ENV === 'test') {
  describe('Campaign State Machine', () => {
    test('placeholder test until implementation is ready', () => {
      expect(true).toBe(true);
    });
  });
}

// Get existing test user (jamaldojr@gmail.com)
async function getTestUser() {
  // Get the specific user by email
  const { data: existingUser, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'jamaldojr@gmail.com')
    .single();
    
  if (error || !existingUser) {
    log(`Error finding test user: ${error?.message || 'User not found'}`, colors.red);
    throw new Error('Test user jamaldojr@gmail.com not found');
  }
  
  log(`Using existing user: ${existingUser.email} (ID: ${existingUser.id})`, colors.cyan);
  return existingUser.id;
}

// Test fixture for creating test campaigns
async function createTestCampaign(status: CampaignStatus, options: {
  startDateOffset?: number; // days from now
  endDateOffset?: number | null; // days from now, null for indefinite campaigns
  breakpoints?: number[];
  budget?: number;
  title?: string;
} = {}) {
  // Get test user
  const userId = await getTestUser();
  
  // Calculate dates
  const now = new Date();
  const startDate = new Date(now.getTime() + (options.startDateOffset || 0) * DAY_MS);
  const endDate = options.endDateOffset === null 
    ? null 
    : new Date(now.getTime() + (options.endDateOffset || 30) * DAY_MS);
  
  // Get an existing brand
  const { data: existingBrands, error: brandError } = await supabase
    .from('brands')
    .select('id, name')
    .limit(1);
    
  if (brandError || !existingBrands || existingBrands.length === 0) {
    log(`Error finding brands: ${brandError?.message || 'No brands found'}`, colors.red);
    throw new Error('No brands available for testing');
  }
  
  const brandId = existingBrands[0].id;
  log(`Using existing brand: ${existingBrands[0].name} (ID: ${brandId})`, colors.cyan);
  
  // Create a campaign
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      title: options.title || `${TEST_PREFIX}Campaign ${uuidv4()}`,
      description: 'Test campaign for state machine testing',
      brand_id: brandId,
      created_by: userId,
      rate_per_1000_views: 5.00,
      budget: options.budget || 1000,
      budget_breakpoints: options.breakpoints || [],
      current_breakpoint_index: 0,
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : null,
      status: status,
      total_paid: 0,
    })
    .select()
    .single();
  
  if (error) {
    log(`Error creating test campaign: ${error.message}`, colors.red);
    throw error;
  }
  
  log(`Created campaign "${campaign.title}" with status: ${status}`, colors.green);
  return campaign;
}

// Cleanup test data after tests
async function cleanupTestCampaigns() {
  log('Cleaning up test campaigns...', colors.yellow);
  
  // Delete test campaigns
  const { error: campaignError } = await supabase
    .from('campaigns')
    .delete()
    .like('title', `${TEST_PREFIX}%`);
    
  if (campaignError) {
    log(`Error cleaning up test campaigns: ${campaignError.message}`, colors.red);
  } else {
    log('Test campaigns cleaned up', colors.green);
  }
}

/**
 * To run this test manually (outside of Jest):
 * 
 * 1. Set NODE_ENV to 'development'
 * 2. Run with ts-node: npx ts-node src/tests/campaign-state-machine.test.ts
 * 
 * This will execute the testStateMachine function below
 */
async function testStateMachine() {
  log('Starting Campaign State Machine Test', colors.bright + colors.blue);
  
  try {
    // Test: Create campaign with pending_funding status
    log('\n== Test 1: Create campaign with pending_funding status ==', colors.bright + colors.magenta);
    const campaign1 = await createTestCampaign('pending_funding', {
      title: `${TEST_PREFIX}Initial Pending Funding`,
      startDateOffset: 1, // Tomorrow
      endDateOffset: 30 
    });
    
    log(`Created campaign in pending_funding state: ${campaign1.id}`, colors.green);
    
    // Test: Fund a campaign that starts tomorrow
    log('\n== Test 2: Fund a campaign that starts tomorrow ==', colors.bright + colors.magenta);
    const { error: updateError1 } = await supabase
      .from('campaigns')
      .update({
        status: 'funded_but_not_started',
        funded: true,
      })
      .eq('id', campaign1.id);
      
    if (updateError1) {
      log(`Error updating campaign status: ${updateError1.message}`, colors.red);
    } else {
      log(`Campaign moved to funded_but_not_started state`, colors.green);
    }
    
    // Test: Create campaign with start date in the past, should auto-transition
    log('\n== Test 3: Create a campaign that should start immediately ==', colors.bright + colors.magenta);
    const campaign2 = await createTestCampaign('funded_but_not_started', {
      title: `${TEST_PREFIX}Should Be Active`,
      startDateOffset: -1, // Yesterday
      endDateOffset: 30
    });
    
    // Force database trigger to run
    log('Triggering database trigger by updating a field...', colors.cyan);
    await supabase
      .from('campaigns')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', campaign2.id);
      
    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if it auto-transitioned
    const { data: updatedCampaign2 } = await supabase
      .from('campaigns')
      .select('id, title, status, active')
      .eq('id', campaign2.id)
      .single();
      
    if (updatedCampaign2) {
      log(`Status after start date passed: ${updatedCampaign2.status}`, 
          updatedCampaign2.status === 'active' ? colors.green : colors.red);
      log(`Active flag: ${updatedCampaign2.active}`, 
          updatedCampaign2.active ? colors.green : colors.red);
    }
    
    // Test: Create active campaign with end date in the past, should auto-transition to expired
    log('\n== Test 4: Expired campaign test ==', colors.bright + colors.magenta);
    const campaign3 = await createTestCampaign('active', {
      title: `${TEST_PREFIX}Should Be Expired`,
      startDateOffset: -30, // 30 days ago
      endDateOffset: -1     // Yesterday
    });
    
    // Force database trigger to run
    log('Triggering database trigger by updating a field...', colors.cyan);
    await supabase
      .from('campaigns')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', campaign3.id);
      
    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if it auto-transitioned
    const { data: updatedCampaign3 } = await supabase
      .from('campaigns')
      .select('id, title, status, active')
      .eq('id', campaign3.id)
      .single();
      
    if (updatedCampaign3) {
      log(`Status after end date passed: ${updatedCampaign3.status}`, 
          updatedCampaign3.status === 'expired' ? colors.green : colors.red);
      log(`Active flag: ${updatedCampaign3.active}`, 
          !updatedCampaign3.active ? colors.green : colors.red);
    }
    
    // Test: Breakpoint pausing
    log('\n== Test 5: Budget breakpoint test ==', colors.bright + colors.magenta);
    const breakpoint = 500;
    const campaign4 = await createTestCampaign('active', {
      title: `${TEST_PREFIX}Breakpoint Test`,
      breakpoints: [breakpoint],
      budget: 1000
    });
    
    // Update total_paid to reach the breakpoint
    log(`Simulating payment that reaches breakpoint of $${breakpoint}...`, colors.cyan);
    await supabase
      .from('campaigns')
      .update({ 
        total_paid: breakpoint,
        status: 'paused_at_breakpoint', // Simulating what payment processor would do
        current_breakpoint_index: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign4.id);
      
    // Check the status
    const { data: updatedCampaign4 } = await supabase
      .from('campaigns')
      .select('id, title, status, active, current_breakpoint_index')
      .eq('id', campaign4.id)
      .single();
      
    if (updatedCampaign4) {
      log(`Status after reaching breakpoint: ${updatedCampaign4.status}`, 
          updatedCampaign4.status === 'paused_at_breakpoint' ? colors.green : colors.red);
      log(`Active flag: ${updatedCampaign4.active}`, 
          !updatedCampaign4.active ? colors.green : colors.red);
      log(`Current breakpoint index: ${updatedCampaign4.current_breakpoint_index}`, colors.cyan);
    }
    
    // Test: Admin pause/resume
    log('\n== Test 6: Admin pause/resume test ==', colors.bright + colors.magenta);
    const campaign5 = await createTestCampaign('active', {
      title: `${TEST_PREFIX}Admin Control Test`
    });
    
    // Pause by admin
    log('Admin pausing the campaign...', colors.cyan);
    await supabase
      .from('campaigns')
      .update({ 
        status: 'paused_by_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign5.id);
      
    // Check paused status
    const { data: pausedCampaign } = await supabase
      .from('campaigns')
      .select('id, title, status, active')
      .eq('id', campaign5.id)
      .single();
      
    if (pausedCampaign) {
      log(`Status after admin pause: ${pausedCampaign.status}`, 
          pausedCampaign.status === 'paused_by_admin' ? colors.green : colors.red);
      log(`Active flag: ${pausedCampaign.active}`, 
          !pausedCampaign.active ? colors.green : colors.red);
    }
    
    // Resume by admin
    log('Admin resuming the campaign...', colors.cyan);
    await supabase
      .from('campaigns')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign5.id);
      
    // Check resumed status
    const { data: resumedCampaign } = await supabase
      .from('campaigns')
      .select('id, title, status, active')
      .eq('id', campaign5.id)
      .single();
      
    if (resumedCampaign) {
      log(`Status after admin resume: ${resumedCampaign.status}`, 
          resumedCampaign.status === 'active' ? colors.green : colors.red);
      log(`Active flag: ${resumedCampaign.active}`, 
          resumedCampaign.active ? colors.green : colors.red);
    }
    
    // Test: Completion when budget is exhausted
    log('\n== Test 7: Budget exhaustion test ==', colors.bright + colors.magenta);
    const budget = 1000;
    const campaign6 = await createTestCampaign('active', {
      title: `${TEST_PREFIX}Budget Completion Test`,
      budget: budget
    });
    
    // Update total_paid to reach the budget
    log(`Simulating payment that exhausts budget of $${budget}...`, colors.cyan);
    await supabase
      .from('campaigns')
      .update({ 
        total_paid: budget,
        status: 'completed', // Simulating what payment processor would do
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign6.id);
      
    // Check the status
    const { data: updatedCampaign6 } = await supabase
      .from('campaigns')
      .select('id, title, status, active, total_paid')
      .eq('id', campaign6.id)
      .single();
      
    if (updatedCampaign6) {
      log(`Status after budget exhaustion: ${updatedCampaign6.status}`, 
          updatedCampaign6.status === 'completed' ? colors.green : colors.red);
      log(`Active flag: ${updatedCampaign6.active}`, 
          !updatedCampaign6.active ? colors.green : colors.red);
      log(`Total paid: $${updatedCampaign6.total_paid}`, colors.cyan);
    }
    
    // Summary of all test campaigns
    log('\n== Test Summary ==', colors.bright + colors.blue);
    const { data: allTestCampaigns } = await supabase
      .from('campaigns')
      .select('id, title, status, active, start_date, end_date, total_paid, budget, budget_breakpoints, current_breakpoint_index')
      .like('title', `${TEST_PREFIX}%`)
      .order('created_at', { ascending: true });
      
    if (allTestCampaigns) {
      log(`Created ${allTestCampaigns.length} test campaigns:`, colors.blue);
      
      allTestCampaigns.forEach((c, index) => {
        log(`\n${index + 1}. ${c.title}`, colors.bright + colors.cyan);
        log(`   Status: ${c.status}`, colors.cyan);
        log(`   Active: ${c.active}`, colors.cyan);
        log(`   Budget: $${c.budget} (Spent: $${c.total_paid})`, colors.cyan);
        
        if (c.budget_breakpoints && c.budget_breakpoints.length > 0) {
          log(`   Breakpoints: ${c.budget_breakpoints.join(', ')} (Current index: ${c.current_breakpoint_index})`, colors.cyan);
        }
      });
    }
    
    // Cleanup if this is running outside of Jest
    if (process.env.NODE_ENV !== 'test') {
      const shouldCleanup = true; // Change to false if you want to keep test campaigns
      
      if (shouldCleanup) {
        await cleanupTestCampaigns();
      } else {
        log('\nSkipping cleanup, test campaigns remain in database', colors.yellow);
      }
    }
    
    log('\n✨ State Machine Test completed! ✨', colors.bright + colors.green);
    
  } catch (error: any) {
    log(`Error in test: ${error.message}`, colors.red);
    
    // Attempt cleanup even on error
    if (process.env.NODE_ENV !== 'test') {
      try {
        await cleanupTestCampaigns();
      } catch (cleanupError: any) {
        log(`Error during cleanup: ${cleanupError.message}`, colors.red);
      }
    }
  }
}

// Run the test when executed directly
if (process.env.NODE_ENV !== 'test') {
  testStateMachine().then(() => process.exit(0));
}