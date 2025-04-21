import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { tiktokTracker } from './platforms/tiktok'
import { youtubeTracker } from './platforms/youtube'
import { instagramTracker } from './platforms/instagram'

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

type PlatformType = Database['public']['Enums']['platform_type']
type TrackerFunction = (url: string) => Promise<number | null>

// Platform-specific trackers map
const trackers: Record<PlatformType, TrackerFunction> = {
  'tiktok': tiktokTracker,
  'youtube': youtubeTracker,
  'instagram': instagramTracker
}

/**
 * Main function to track views for all active submissions
 * @returns A summary of the tracking process
 */
export async function trackAllViews() {
  console.log('Starting view tracking process...')
  const supabase = getSupabaseClient()
  const results = { tracked: 0, skipped: 0, error: 0 }
  
  try {
    // Fetch all approved submissions that should be tracked
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, asset_url, platform, views, campaign_id')
      .eq('status', 'approved')
      .not('platform', 'is', null) // Skip submissions without a platform
    
    if (error) throw error
    
    if (!submissions || submissions.length === 0) {
      console.log('No approved submissions to track')
      return { ...results, message: 'No approved submissions to track' }
    }
    
    console.log(`Found ${submissions.length} submissions to track`)
    
    // Process each submission
    for (const submission of submissions) {
      try {
        const result = await processSubmission(submission)
        if (result.success) {
          if (result.viewDifference && result.viewDifference > 0) {
            results.tracked++
          } else {
            results.skipped++
          }
        } else {
          results.skipped++
        }
      } catch (error) {
        results.error++
        console.error(`Error processing submission ${submission.id}:`, error)
      }
    }
    
    console.log('View tracking completed successfully')
    return {
      ...results,
      message: 'View tracking completed successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error tracking views:', error)
    return {
      ...results,
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Process a single submission
 * @param submission The submission to process
 * @returns Result object with success status and tracking details
 */
export async function processSubmission(submission: any) {
  const supabase = getSupabaseClient()
  
  try {
    const platform = submission.platform as PlatformType
    
    // Skip if platform is not specified or invalid
    if (!platform || !trackers[platform]) {
      console.log(`Skipping submission ${submission.id}: invalid or missing platform`)
      return { 
        success: false,
        message: `Invalid or missing platform: ${platform}` 
      }
    }
    
    console.log(`Processing submission ${submission.id} (${platform}): ${submission.asset_url}`)
    
    // Get the appropriate tracker
    const tracker = trackers[platform]
    
    // Track views for this submission
    const currentViews = await tracker(submission.asset_url)
    
    if (currentViews === null) {
      console.log(`Unable to track views for submission ${submission.id}`)
      return { 
        success: false,
        message: 'Unable to track views' 
      }
    }
    
    // Calculate difference from last known view count
    const viewDifference = Math.max(0, currentViews - submission.views)
    
    // Skip if no new views
    if (viewDifference === 0) {
      console.log(`No new views for submission ${submission.id}`)
      return { 
        success: true, 
        viewDifference: 0, 
        currentViews,
        message: 'No new views' 
      }
    }
    
    console.log(`Submission ${submission.id} has ${viewDifference} new views (total: ${currentViews})`)
    
    // FIXED: Use a cleaner approach to call the stored procedure
    // 1. Use a separate try/catch for the database operation
    try {
      // Call the stored procedure
      const { data, error } = await supabase.rpc('track_new_views', {
        p_submission_id: submission.id,
        p_current_views: currentViews,
        p_view_difference: viewDifference
      });
      
      // Handle any errors from the stored procedure
      if (error) {
        console.error('Stored procedure error:', error);
        return { 
          success: false, 
          message: `Database error: ${error.message}`
        };
      }
      
      console.log(`Successfully tracked ${viewDifference} new views for submission ${submission.id}`);
      
      return { 
        success: true, 
        viewDifference, 
        currentViews,
        message: `Successfully tracked ${viewDifference} new views` 
      };
    } catch (dbError) {
      // Handle any unexpected errors during the database operation
      console.error('Unexpected database error:', dbError);
      return { 
        success: false, 
        message: dbError instanceof Error ? dbError.message : 'Database operation failed'
      };
    }
  } catch (error) {
    console.error(`Error processing submission ${submission.id}:`, error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 