import axios from 'axios'

/**
 * YouTube engagement data structure
 */
export interface YouTubeEngagement {
  views: number | null
  likes: number | null
  comments: number | null
}

/**
 * YouTube engagement tracker - extracts views, likes, and comments from YouTube videos using the YouTube Data API
 * 
 * @param url The YouTube video URL
 * @returns Object containing views, likes, and comments or null values if tracking failed
 */
export async function youtubeTracker(url: string): Promise<YouTubeEngagement> {
  try {
    console.log(`Tracking YouTube engagement for: ${url}`)
    
    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      console.error('Could not extract YouTube video ID from URL:', url)
      return { views: null, likes: null, comments: null }
    }
    
    // API key should be stored in environment variables
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error('YouTube API key is missing. Set YOUTUBE_API_KEY in .env.local')
      return { views: null, likes: null, comments: null }
    }
    
    // Make API requests in parallel for better performance
    const [videoResponse, commentsResponse] = await Promise.all([
      // Get video statistics (views, likes)
      axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
      part: 'statistics',
      id: videoId,
      key: apiKey
    }
      }),
      // Get comment count
      axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          part: 'id',
          videoId: videoId,
          maxResults: 1, // We only need the total count
          key: apiKey
        }
      }).catch(error => {
        // Comments might be disabled, return null instead of failing
        console.warn(`Comments disabled or unavailable for video ${videoId}:`, error.response?.status)
        return null
      })
    ])
    
    // Extract video statistics
    let views: number | null = null
    let likes: number | null = null
    
    if (videoResponse.data?.items && videoResponse.data.items.length > 0) {
      const stats = videoResponse.data.items[0].statistics
      
      views = stats.viewCount ? parseInt(stats.viewCount, 10) : null
      likes = stats.likeCount ? parseInt(stats.likeCount, 10) : null
      
      if (views && isNaN(views)) views = null
      if (likes && isNaN(likes)) likes = null
    } else {
      console.error('Failed to retrieve video statistics from YouTube API')
      return { views: null, likes: null, comments: null }
    }
    
    // Extract comment count
    let comments: number | null = null
    
    if (commentsResponse?.data) {
      // The totalResults in pageInfo gives us the total comment count
      comments = commentsResponse.data.pageInfo?.totalResults || null
      if (comments && isNaN(comments)) comments = null
    }
    
    console.log(`YouTube video ${videoId} engagement:`, {
      views,
      likes,
      comments
    })
    
    return {
      views,
      likes,
      comments
    }
    
  } catch (error) {
    console.error('Error tracking YouTube engagement:', error)
    return { views: null, likes: null, comments: null }
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