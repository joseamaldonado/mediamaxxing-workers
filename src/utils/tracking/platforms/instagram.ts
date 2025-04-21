import { ApifyClient } from 'apify-client'

/**
 * Instagram view tracker - extracts view counts from Instagram videos using Apify API
 * 
 * @param url The Instagram video URL
 * @returns The current view count or null if tracking failed
 */
export async function instagramTracker(url: string): Promise<number | null> {
  try {
    console.log(`Tracking Instagram views for: ${url}`)
    
    // Extract shortcode from URL for validation
    const shortcode = extractInstagramShortcode(url)
    if (!shortcode) {
      console.error('Could not extract Instagram shortcode from URL:', url)
      return null
    }
    
    // API token should be stored in environment variables
    const apiToken = process.env.APIFY_API_TOKEN
    if (!apiToken) {
      console.error('Apify API token is missing. Set APIFY_API_TOKEN in .env.local')
      return null
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
    
    // Fetch and extract the playcount
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    
    if (items && items.length > 0 && items[0].videoPlayCount) {
      // Ensure we convert the playCount to a number
      const playCountValue = items[0].videoPlayCount
      const playCount = typeof playCountValue === 'number' 
        ? playCountValue 
        : parseInt(String(playCountValue), 10)
      
      if (isNaN(playCount)) {
        console.error('Invalid play count format:', playCountValue)
        return null
      }
      
      console.log(`Instagram post ${shortcode} has ${playCount} views (from Apify)`)
      return playCount
    } else {
      console.error('Could not extract view count from Instagram using Apify')
      if (items && items.length > 0) {
        console.error('Response data:', items[0])
      }
      return null
    }
    
  } catch (error) {
    console.error('Error tracking Instagram views:', error)
    return null
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