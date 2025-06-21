import { ApifyClient } from 'apify-client'
import axios from 'axios'

/**
 * Instagram engagement data structure
 */
export interface InstagramEngagement {
  views: number | null
  likes: number | null
  comments: number | null
}

/**
 * Chinese Instagram GraphQL response structure
 */
interface InstagramGraphQLResponse {
  data: {
    xdt_shortcode_media: {
      id: string
      shortcode: string
      edge_media_to_caption: {
        edges: Array<{
          node: {
            text: string
          }
        }>
      }
      edge_media_preview_like: {
        count: number
      }
      edge_media_to_comment: {
        count: number
      }
      video_view_count?: number
      video_play_count?: number
      is_video: boolean
      video_url?: string
      display_url: string
      dimensions: {
        height: number
        width: number
      }
      owner: {
        username: string
        full_name: string
        profile_pic_url: string
        is_verified: boolean
      }
      taken_at_timestamp: number
      location?: {
        name: string
      }
    }
  }
}

/**
 * Instagram engagement tracker - extracts views, likes, and comments from Instagram videos
 * Uses Chinese GraphQL method as primary with Apify API as fallback
 * 
 * @param url The Instagram video URL
 * @returns Object containing views, likes, and comments or null values if tracking failed
 */
export async function instagramTracker(url: string): Promise<InstagramEngagement> {
  try {
    console.log(`🎯 Tracking Instagram engagement for: ${url}`)
    
    // Extract shortcode from URL for validation
    const shortcode = extractInstagramShortcode(url)
    if (!shortcode) {
      console.error('Could not extract Instagram shortcode from URL:', url)
      return { views: null, likes: null, comments: null }
    }

    // Method 1: Try Chinese GraphQL method (PRIMARY METHOD)
    console.log('🇨🇳 Trying Chinese GraphQL method...')
    const chineseResult = await tryChineseGraphQLMethod(url, shortcode)
    if (chineseResult.views !== null || chineseResult.likes !== null || chineseResult.comments !== null) {
      console.log('✅ SUCCESS with Chinese GraphQL method!')
      return chineseResult
    }

    // Method 2: Fallback to Apify API
    console.log('🔄 Falling back to Apify API method...')
    return await originalInstagramTracker(url, shortcode)

  } catch (error) {
    console.error('❌ Error in Instagram tracker:', error)
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Chinese GraphQL method (REVERSE ENGINEERED FROM CHINESE DEVELOPERS)
 */
async function tryChineseGraphQLMethod(url: string, shortcode: string): Promise<InstagramEngagement> {
  try {
    const graphqlUrl = new URL('https://www.instagram.com/api/graphql')
    graphqlUrl.searchParams.set('variables', JSON.stringify({ shortcode }))
    graphqlUrl.searchParams.set('doc_id', '10015901848480474')
    graphqlUrl.searchParams.set('lsd', 'AVqbxe3J_YA')

    const response = await axios.post(graphqlUrl.toString(), {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': '936619743392459',
        'X-FB-LSD': 'AVqbxe3J_YA',
        'X-ASBD-ID': '129477',
        'Sec-Fetch-Site': 'same-origin',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    })

    const data: InstagramGraphQLResponse = response.data

    if (data?.data?.xdt_shortcode_media) {
      const media = data.data.xdt_shortcode_media
      console.log('🔥 Chinese GraphQL success!')
      
      return {
        views: media.video_view_count || media.video_play_count || null,
        likes: media.edge_media_preview_like?.count || null,
        comments: media.edge_media_to_comment?.count || null
      }
    } else {
      console.log('❌ Chinese GraphQL failed: No media data')
      return { views: null, likes: null, comments: null }
    }

  } catch (error) {
    console.error('❌ Chinese GraphQL error:', error)
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Original Instagram tracking method using Apify API (FALLBACK)
 */
async function originalInstagramTracker(url: string, shortcode: string): Promise<InstagramEngagement> {
  try {
    
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