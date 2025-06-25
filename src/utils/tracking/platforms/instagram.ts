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
  console.log(`🔍 [INSTAGRAM DEBUG] Starting tracking for URL: ${url}`)
  console.log(`🔍 [INSTAGRAM DEBUG] Timestamp: ${new Date().toISOString()}`)
  
  try {
    console.log(`🎯 Tracking Instagram engagement for: ${url}`)
    
    // Extract shortcode from URL for validation
    console.log(`🔍 [INSTAGRAM DEBUG] Extracting shortcode from URL...`)
    const shortcode = extractInstagramShortcode(url)
    if (!shortcode) {
      console.error('❌ [INSTAGRAM DEBUG] Could not extract Instagram shortcode from URL:', url)
      return { views: null, likes: null, comments: null }
    }
    console.log(`✅ [INSTAGRAM DEBUG] Extracted shortcode: ${shortcode}`)

    // Method 1: Try Chinese GraphQL method (PRIMARY METHOD)
    console.log('🇨🇳 [INSTAGRAM DEBUG] Trying Chinese GraphQL method...')
    const chineseResult = await tryChineseGraphQLMethod(url, shortcode)
    console.log(`🔍 [INSTAGRAM DEBUG] Chinese method result:`, chineseResult)
    
    if (chineseResult.views !== null || chineseResult.likes !== null || chineseResult.comments !== null) {
      console.log('✅ [INSTAGRAM DEBUG] SUCCESS with Chinese GraphQL method!')
      console.log(`🔍 [INSTAGRAM DEBUG] Final result: views=${chineseResult.views}, likes=${chineseResult.likes}, comments=${chineseResult.comments}`)
      return chineseResult
    }

    // Method 2: Fallback to Apify API
    console.log('🔄 [INSTAGRAM DEBUG] Falling back to Apify API method...')
    const apifyResult = await originalInstagramTracker(url, shortcode)
    console.log(`🔍 [INSTAGRAM DEBUG] Apify method result:`, apifyResult)
    return apifyResult

  } catch (error) {
    console.error('❌ [INSTAGRAM DEBUG] Error in Instagram tracker:', error)
    console.error('❌ [INSTAGRAM DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Chinese GraphQL method (REVERSE ENGINEERED FROM CHINESE DEVELOPERS)
 */
async function tryChineseGraphQLMethod(url: string, shortcode: string): Promise<InstagramEngagement> {
  console.log(`🔍 [CHINESE DEBUG] Starting Chinese GraphQL method for shortcode: ${shortcode}`)
  
  try {
    const graphqlUrl = new URL('https://www.instagram.com/api/graphql')
    graphqlUrl.searchParams.set('variables', JSON.stringify({ shortcode }))
    graphqlUrl.searchParams.set('doc_id', '10015901848480474')
    graphqlUrl.searchParams.set('lsd', 'AVqbxe3J_YA')

    console.log(`🔍 [CHINESE DEBUG] GraphQL URL: ${graphqlUrl.toString()}`)
    console.log(`🔍 [CHINESE DEBUG] Variables: ${JSON.stringify({ shortcode })}`)

    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-IG-App-ID': '936619743392459',
      'X-FB-LSD': 'AVqbxe3J_YA',
      'X-ASBD-ID': '129477',
      'Sec-Fetch-Site': 'same-origin',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    }

    console.log(`🔍 [CHINESE DEBUG] Request headers:`, headers)
    console.log(`🔍 [CHINESE DEBUG] Making POST request...`)

    const response = await axios.post(graphqlUrl.toString(), {}, {
      headers,
      timeout: 15000
    })

    console.log(`🔍 [CHINESE DEBUG] Response status: ${response.status}`)
    console.log(`🔍 [CHINESE DEBUG] Response headers:`, response.headers)
    console.log(`🔍 [CHINESE DEBUG] Response data type: ${typeof response.data}`)
    console.log(`🔍 [CHINESE DEBUG] Response data keys:`, Object.keys(response.data || {}))

    if (response.data) {
      console.log(`🔍 [CHINESE DEBUG] Full response data:`, JSON.stringify(response.data, null, 2))
    }

    const data: InstagramGraphQLResponse = response.data

    if (data?.data?.xdt_shortcode_media) {
      const media = data.data.xdt_shortcode_media
      console.log('🔥 [CHINESE DEBUG] Chinese GraphQL success!')
      console.log(`🔍 [CHINESE DEBUG] Media data:`, {
        id: media.id,
        shortcode: media.shortcode,
        is_video: media.is_video,
        video_view_count: media.video_view_count,
        video_play_count: media.video_play_count,
        likes_count: media.edge_media_preview_like?.count,
        comments_count: media.edge_media_to_comment?.count
      })
      
      const result = {
        views: media.video_view_count || media.video_play_count || null,
        likes: media.edge_media_preview_like?.count || null,
        comments: media.edge_media_to_comment?.count || null
      }
      
      console.log(`🔍 [CHINESE DEBUG] Parsed result:`, result)
      return result
    } else {
      console.log('❌ [CHINESE DEBUG] Chinese GraphQL failed: No media data')
      console.log(`🔍 [CHINESE DEBUG] Data structure check:`, {
        hasData: !!data?.data,
        hasXdtShortcodeMedia: !!data?.data?.xdt_shortcode_media,
        dataKeys: data?.data ? Object.keys(data.data) : 'no data'
      })
      return { views: null, likes: null, comments: null }
    }

  } catch (error) {
    console.error('❌ [CHINESE DEBUG] Chinese GraphQL error:', error)
    if (axios.isAxiosError(error)) {
      console.error('❌ [CHINESE DEBUG] Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data
      })
    }
    console.error('❌ [CHINESE DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Original Instagram tracking method using Apify API (FALLBACK)
 */
async function originalInstagramTracker(url: string, shortcode: string): Promise<InstagramEngagement> {
  console.log(`🔍 [APIFY DEBUG] Starting Apify method for shortcode: ${shortcode}`)
  
  try {
    
    // API token should be stored in environment variables
    const apiToken = process.env.APIFY_API_TOKEN
    if (!apiToken) {
      console.error('❌ [APIFY DEBUG] Apify API token is missing. Set APIFY_API_TOKEN in .env.local')
      return { views: null, likes: null, comments: null }
    }
    
    console.log(`✅ [APIFY DEBUG] API token found: ${apiToken.substring(0, 10)}...`)
    
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
    
    console.log(`🔍 [APIFY DEBUG] Actor input:`, input)
    console.log(`🔍 [APIFY DEBUG] Starting Apify actor run...`)
    
    // Run the Actor and wait for it to finish
    const run = await client.actor("apify/instagram-scraper").call(input)
    
    console.log(`🔍 [APIFY DEBUG] Actor run completed:`, {
      id: run.id,
      status: run.status,
      defaultDatasetId: run.defaultDatasetId
    })
    
    // Fetch and extract the engagement data
    console.log(`🔍 [APIFY DEBUG] Fetching dataset items...`)
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    
    console.log(`🔍 [APIFY DEBUG] Dataset items count: ${items?.length || 0}`)
    
    if (items && items.length > 0) {
      const post = items[0]
      console.log(`🔍 [APIFY DEBUG] First item keys:`, Object.keys(post))
      console.log(`🔍 [APIFY DEBUG] Raw post data:`, JSON.stringify(post, null, 2))
      
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
      
      console.log(`🔍 [APIFY DEBUG] Raw extracted values:`, {
        videoPlayCount: post.videoPlayCount,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount
      })
      
      // Validate parsed numbers
      const validViews = views && !isNaN(views) ? views : null
      const validLikes = likes && !isNaN(likes) ? likes : null
      const validComments = comments && !isNaN(comments) ? comments : null
      
      console.log(`Instagram post ${shortcode} engagement:`, {
        views: validViews,
        likes: validLikes,
        comments: validComments
      })
      
      const result = {
        views: validViews,
        likes: validLikes,
        comments: validComments
      }
      
      console.log(`🔍 [APIFY DEBUG] Final Apify result:`, result)
      return result
    } else {
      console.error('❌ [APIFY DEBUG] Could not extract engagement data from Instagram using Apify')
      if (items && items.length > 0) {
        console.error('❌ [APIFY DEBUG] Response data:', items[0])
      }
      return { views: null, likes: null, comments: null }
    }
    
  } catch (error) {
    console.error('❌ [APIFY DEBUG] Error tracking Instagram engagement:', error)
    console.error('❌ [APIFY DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { views: null, likes: null, comments: null }
  }
}

/**
 * Extract the Instagram shortcode from a URL
 */
function extractInstagramShortcode(url: string): string | null {
  console.log(`🔍 [SHORTCODE DEBUG] Extracting shortcode from: ${url}`)
  
  try {
    // Try to extract the shortcode from URLs like:
    // https://www.instagram.com/p/SHORTCODE/
    // https://www.instagram.com/reel/SHORTCODE/
    // https://www.instagram.com/tv/SHORTCODE/
    
    const regex = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/
    const match = url.match(regex)
    
    console.log(`🔍 [SHORTCODE DEBUG] Regex match result:`, match)
    
    if (match && match[2]) {
      console.log(`✅ [SHORTCODE DEBUG] Successfully extracted shortcode: ${match[2]}`)
      return match[2]
    }
    
    console.log(`❌ [SHORTCODE DEBUG] No shortcode found in URL`)
    return null
  } catch (error) {
    console.error('❌ [SHORTCODE DEBUG] Error extracting Instagram shortcode:', error)
    return null
  }
} 