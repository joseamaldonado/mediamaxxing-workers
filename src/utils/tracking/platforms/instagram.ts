import { ApifyClient } from 'apify-client'

/**
 * Instagram engagement data structure
 */
export interface InstagramEngagement {
  views: number | null
  likes: number | null
  comments: number | null
}

/**
 * Instagram engagement tracker - extracts views, likes, and comments from Instagram videos using Apify API
 * 
 * @param url The Instagram video URL
 * @returns Object containing views, likes, and comments or null values if tracking failed
 */
export async function instagramTracker(url: string): Promise<InstagramEngagement> {
  try {
    console.log(`Tracking Instagram engagement for: ${url}`)
    
    // Extract shortcode from URL for validation
    const shortcode = extractInstagramShortcode(url)
    if (!shortcode) {
      console.error('Could not extract Instagram shortcode from URL:', url)
      return { views: null, likes: null, comments: null }
    }
    
    // API token should be stored in environment variables
    const apiToken = process.env.APIFY_API_TOKEN
    if (!apiToken) {
      console.error('Apify API token is missing. Set APIFY_API_TOKEN in .env.local')
      return { views: null, likes: null, comments: null }
    }
    
    // Initialize the ApifyClient with your Apify API token
    const client = new ApifyClient({
      token: apiToken
    })
    
    // Prepare Actor input
    const input = {
      "addParentData": false,
      "directUrls": [url],
      "enhanceUserSearchWithFacebookPage": false,
      "isUserReelFeedURL": false,
      "isUserTaggedFeedURL": false,
      "resultsLimit": 1,
      "resultsType": "posts",
      "searchLimit": 1,
      "searchType": "hashtag"
    }
    
    // Run the Actor and wait for it to finish
    const run = await client.actor("apify/instagram-scraper").call(input)
    
    // Fetch and extract the engagement data
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    
    if (items && items.length > 0) {
      const post = items[0]
      
      // Extract engagement metrics
      const views = post.videoPlayCount ? 
        (typeof post.videoPlayCount === 'number' ? post.videoPlayCount : parseInt(String(post.videoPlayCount), 10)) : 
        null
      
      const likes = post.likesCount ? 
        (typeof post.likesCount === 'number' ? post.likesCount : parseInt(String(post.likesCount), 10)) : 
        null
      
      const comments = post.commentsCount ? 
        (typeof post.commentsCount === 'number' ? post.commentsCount : parseInt(String(post.commentsCount), 10)) : 
        null
      
      // Validate parsed numbers
      const validViews = views && !isNaN(views) ? views : null
      const validLikes = likes && !isNaN(likes) ? likes : null
      const validComments = comments && !isNaN(comments) ? comments : null
      
      console.log(`Instagram post ${shortcode} engagement:`, {
        views: validViews,
        likes: validLikes,
        comments: validComments
      })
      
      return {
        views: validViews,
        likes: validLikes,
        comments: validComments
      }
    } else {
      console.error('Could not extract engagement data from Instagram using Apify')
      if (items && items.length > 0) {
        console.error('Response data:', items[0])
      }
      return { views: null, likes: null, comments: null }
    }
    
  } catch (error) {
    console.error('Error tracking Instagram engagement:', error)
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Extract the Instagram shortcode from a URL
 */
function extractInstagramShortcode(url: string): string | null {
  try {
    // Try to extract the shortcode from URLs like:
    // https://www.instagram.com/p/SHORTCODE/
    // https://www.instagram.com/reel/SHORTCODE/
    // https://www.instagram.com/tv/SHORTCODE/
    
    const regex = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/
    const match = url.match(regex)
    
    if (match && match[2]) {
      return match[2]
    }
    
    return null
  } catch (error) {
    console.error('Error extracting Instagram shortcode:', error)
    return null
  }
} 