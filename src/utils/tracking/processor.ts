import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { tiktokTracker, TikTokEngagement } from './platforms/tiktok'
import { youtubeTracker, YouTubeEngagement } from './platforms/youtube'
import { instagramTracker, InstagramEngagement } from './platforms/instagram'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

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
type EngagementData = TikTokEngagement | YouTubeEngagement | InstagramEngagement

// Updated tracker function type to return engagement data
type TrackerFunction = (url: string) => Promise<EngagementData>

// Platform-specific trackers map
const trackers: Record<PlatformType, TrackerFunction> = {
  'tiktok': tiktokTracker,
  'youtube': youtubeTracker,
  'instagram': instagramTracker
}

/**
 * Main function to track engagement for all active submissions
 * @returns A summary of the tracking process
 */
export async function trackAllEngagement() {
  console.log('Starting engagement tracking process...')
  const supabase = getSupabaseClient()
  const results = { tracked: 0, skipped: 0, error: 0 }
  
  try {
    // Fetch all pending and approved submissions that should be tracked
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, asset_url, platform, views, likes, comments, campaign_id, status')
      .in('status', ['pending', 'approved'])
      .not('platform', 'is', null) // Skip submissions without a platform
    
    if (error) throw error
    
    if (!submissions || submissions.length === 0) {
      console.log('No pending or approved submissions to track')
      return { ...results, message: 'No pending or approved submissions to track' }
    }
    
    console.log(`Found ${submissions.length} submissions to track`)
    
    // Process each submission
    for (const submission of submissions) {
      try {
        const result = await processSubmission(submission)
        if (result.success) {
          if (result.hasNewData) {
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
    
    console.log('Engagement tracking completed successfully')
    return {
      ...results,
      message: 'Engagement tracking completed successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error tracking engagement:', error)
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
    
    console.log(`Processing submission ${submission.id} (${platform}) [${submission.status}]: ${submission.asset_url}`)
    
    // Get the appropriate tracker
    const tracker = trackers[platform]
    
    // Track engagement for this submission
    const currentEngagement = await tracker(submission.asset_url)
    
    if (!currentEngagement || (currentEngagement.views === null && currentEngagement.likes === null && currentEngagement.comments === null)) {
      console.log(`Unable to track engagement for submission ${submission.id}`)
      return { 
        success: false,
        message: 'Unable to track engagement' 
      }
    }
    
    // Calculate differences from last known counts
    const viewDifference = currentEngagement.views !== null ? Math.max(0, currentEngagement.views - (submission.views || 0)) : 0
    const likesDifference = currentEngagement.likes !== null ? Math.max(0, currentEngagement.likes - (submission.likes || 0)) : 0
    const commentsDifference = currentEngagement.comments !== null ? Math.max(0, currentEngagement.comments - (submission.comments || 0)) : 0
    
    let hasNewData = false
    let successfulUpdates: string[] = []
    
    // Track views if available and there are new views
    if (currentEngagement.views !== null && viewDifference > 0) {
      try {
        const { error } = await supabase.rpc('track_new_views', {
          p_submission_id: submission.id,
          p_current_views: currentEngagement.views,
          p_view_difference: viewDifference
        });
        
        if (error) {
          console.error('Error tracking views:', error);
        } else {
          console.log(`Successfully tracked ${viewDifference} new views for submission ${submission.id}`);
          successfulUpdates.push(`${viewDifference} views`)
          hasNewData = true
        }
      } catch (error) {
        console.error('Error tracking views:', error);
      }
    }
    
    // Track likes if available and there are new likes
    if (currentEngagement.likes !== null && likesDifference > 0) {
      try {
        const { error } = await supabase.rpc('track_new_likes', {
          p_submission_id: submission.id,
          p_current_likes: currentEngagement.likes,
          p_likes_difference: likesDifference
        });
        
        if (error) {
          console.error('Error tracking likes:', error);
        } else {
          console.log(`Successfully tracked ${likesDifference} new likes for submission ${submission.id}`);
          successfulUpdates.push(`${likesDifference} likes`)
          hasNewData = true
        }
      } catch (error) {
        console.error('Error tracking likes:', error);
      }
    }
    
    // Track comments if available and there are new comments
    if (currentEngagement.comments !== null && commentsDifference > 0) {
      try {
        const { error } = await supabase.rpc('track_new_comments', {
        p_submission_id: submission.id,
          p_current_comments: currentEngagement.comments,
          p_comments_difference: commentsDifference
      });
      
      if (error) {
          console.error('Error tracking comments:', error);
        } else {
          console.log(`Successfully tracked ${commentsDifference} new comments for submission ${submission.id}`);
          successfulUpdates.push(`${commentsDifference} comments`)
          hasNewData = true
        }
      } catch (error) {
        console.error('Error tracking comments:', error);
      }
    }
    
    if (hasNewData) {
      console.log(`Submission ${submission.id} successfully updated: ${successfulUpdates.join(', ')}`)
      return { 
        success: true, 
        hasNewData: true,
        currentEngagement,
        message: `Successfully tracked: ${successfulUpdates.join(', ')}` 
      }
    } else {
      console.log(`No new engagement data for submission ${submission.id}`)
      return { 
        success: true, 
        hasNewData: false,
        currentEngagement,
        message: 'No new engagement data' 
      }
    }
  } catch (error) {
    console.error(`Error processing submission ${submission.id}:`, error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Keep backward compatibility - this function now calls the new engagement tracker
export async function trackAllViews() {
  console.log('Note: trackAllViews() is deprecated. Use trackAllEngagement() instead.')
  return trackAllEngagement()
} 