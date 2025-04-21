import axios from 'axios'

/**
 * YouTube view tracker - extracts view counts from YouTube videos using the YouTube Data API
 * 
 * @param url The YouTube video URL
 * @returns The current view count or null if tracking failed
 */
export async function youtubeTracker(url: string): Promise<number | null> {
  try {
    console.log(`Tracking YouTube views for: ${url}`)
    
    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      console.error('Could not extract YouTube video ID from URL:', url)
      return null
    }
    
    // API key should be stored in environment variables
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error('YouTube API key is missing. Set YOUTUBE_API_KEY in .env.local')
      return null
    }
    
    // Make API request
    const apiUrl = 'https://www.googleapis.com/youtube/v3/videos'
    const params = {
      part: 'statistics',
      id: videoId,
      key: apiKey
    }
    
    const response = await axios.get(apiUrl, { params })
    const data = response.data
    
    // Extract and return view count
    if (data.items && data.items.length > 0) {
      const stats = data.items[0].statistics
      const viewCount = parseInt(stats.viewCount || '0', 10)
      console.log(`YouTube video ${videoId} has ${viewCount} views (from API)`)
      return viewCount
    } else {
      console.error('Failed to retrieve video statistics from YouTube API', data)
      return null
    }
    
  } catch (error) {
    console.error('Error tracking YouTube views:', error)
    return null
  }
}

/**
 * Extract the YouTube video ID from a URL
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    // Handle both youtu.be and youtube.com URLs
    let videoId = null
    
    // Case 1: youtu.be/XXXXXXXXXXX
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/')
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0]
      }
    } 
    // Case 2: youtube.com/watch?v=XXXXXXXXXXX
    else if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url)
      videoId = urlObj.searchParams.get('v')
    }
    // Case 3: youtube.com/v/XXXXXXXXXXX
    else if (url.includes('youtube.com/v/')) {
      const parts = url.split('youtube.com/v/')
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0]
      }
    }
    // Case 4: youtube.com/embed/XXXXXXXXXXX
    else if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/')
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0]
      }
    }
    // Case 5: youtube.com/shorts/XXXXXXXXXXX
    else if (url.includes('youtube.com/shorts/')) {
      const parts = url.split('youtube.com/shorts/')
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0]
      }
    }
    
    return videoId
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error)
    return null
  }
} 