import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * TikTok view tracker - extracts view counts from TikTok videos
 * 
 * @param url The TikTok video URL
 * @returns The current view count or null if tracking failed
 */
export async function tiktokTracker(url: string): Promise<number | null> {
  try {
    console.log(`Tracking TikTok views for: ${url}`)
    
    // Extract video ID from URL
    const videoId = extractTikTokVideoId(url)
    if (!videoId) {
      console.error('Could not extract TikTok video ID from URL:', url)
      return null
    }
    
    console.log(`Extracted video ID: ${videoId}`)
    
    // Use similar headers to the successful Python implementation
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.tiktok.com/'
    }
    
    const response = await axios.get(url, { headers })
    
    if (response.status !== 200) {
      console.error(`Failed to fetch TikTok page: HTTP ${response.status}`)
      return null
    }
    
    // Use Cheerio to parse the HTML
    const $ = cheerio.load(response.data)
    
    // Method 2: Look for view count in embedded JSON data (this worked in Python)
    // Prioritize this method as it was successful in the Python implementation
    console.log('Trying to extract view count from embedded JSON data')
    const scriptTags = $('script')
    
    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = $(scriptTags[i]).html()
      if (scriptContent && scriptContent.includes('"playCount":')) {
        const playCountMatch = scriptContent.match(/"playCount":(\d+)/)
        if (playCountMatch) {
          const viewCount = parseInt(playCountMatch[1], 10)
          console.log(`TikTok video ${videoId} has ${viewCount} views (from JSON data)`)
          return viewCount
        }
      }
    }
    
    // Method 1: Look for the view count element using the data-e2e attribute
    console.log('Trying to extract view count from CSS selector')
    const viewCountElement = $('[data-e2e="video-stat-count"]').first()
    if (viewCountElement.length) {
      const viewCountText = viewCountElement.text().trim()
      const viewCount = parseViewCount(viewCountText)
      console.log(`TikTok video ${videoId} has ${viewCount} views (from element)`)
      return viewCount
    }
    
    // Method 3: Look for SIGI_STATE JSON data (newer TikTok format)
    console.log('Trying to extract view count from SIGI_STATE')
    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = $(scriptTags[i]).html()
      if (scriptContent && scriptContent.includes('SIGI_STATE')) {
        const jsonDataMatch = scriptContent.match(/window\['SIGI_STATE'\]=([\s\S]*?);<\/script>/)
        if (jsonDataMatch) {
          try {
            const jsonData = JSON.parse(jsonDataMatch[1])
            // Navigate through the JSON to find the play count
            if (jsonData.ItemModule && jsonData.ItemModule[videoId]) {
              const item = jsonData.ItemModule[videoId]
              if (item.stats && item.stats.playCount) {
                const viewCount = parseInt(item.stats.playCount, 10)
                console.log(`TikTok video ${videoId} has ${viewCount} views (from SIGI_STATE)`)
                return viewCount
              }
            }
          } catch (e) {
            console.error(`Error parsing JSON data: ${e}`)
          }
        }
      }
    }
    
    console.error('Could not find view count on TikTok page')
    return null
    
  } catch (error) {
    console.error('Error tracking TikTok views:', error)
    return null
  }
}

/**
 * Extract the TikTok video ID from a URL
 */
function extractTikTokVideoId(url: string): string | null {
  try {
    // Check for mobile or web URLs
    const videoIdRegex = /\/video\/(\d+)/
    const match = url.match(videoIdRegex)
    
    if (match && match[1]) {
      return match[1]
    }
    
    return null
  } catch (error) {
    console.error('Error extracting TikTok video ID:', error)
    return null
  }
}

/**
 * Parse a view count string (e.g., "1.2M", "450.3K") into a number
 */
function parseViewCount(viewCountText: string): number {
  try {
    // Remove any non-numeric characters except for decimal points, K, M, B
    const cleaned = viewCountText.replace(/[^0-9\.KMB]/gi, '')
    
    // Check if we have K, M, or B suffix
    let multiplier = 1
    let numberPart = cleaned
    
    if (cleaned.endsWith('K')) {
      multiplier = 1000
      numberPart = cleaned.slice(0, -1)
    } else if (cleaned.endsWith('M')) {
      multiplier = 1000000
      numberPart = cleaned.slice(0, -1)
    } else if (cleaned.endsWith('B')) {
      multiplier = 1000000000
      numberPart = cleaned.slice(0, -1)
    }
    
    // Parse the number and apply the multiplier
    const value = parseFloat(numberPart) * multiplier
    
    // Return the rounded integer value
    return Math.round(value)
  } catch (error) {
    console.error('Error parsing view count:', error)
    return 0
  }
} 