import { FeaturedChannel } from '@/app/api/creators/featured/route'

export interface FeaturedChannelsResponse {
  success: boolean
  data: FeaturedChannel[]
  count: number
  error?: string
}

/**
 * Service for fetching featured channels data
 */
export class FeaturedChannelsService {
  private static instance: FeaturedChannelsService
  private cache: { data: FeaturedChannel[]; timestamp: number } | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): FeaturedChannelsService {
    if (!FeaturedChannelsService.instance) {
      FeaturedChannelsService.instance = new FeaturedChannelsService()
    }
    return FeaturedChannelsService.instance
  }

  /**
   * Get featured channels with caching
   */
  async getFeaturedChannels(forceRefresh = false): Promise<FeaturedChannelsResponse> {
    try {
      // Check cache first
      const now = Date.now()
      if (!forceRefresh && this.cache && (now - this.cache.timestamp) < this.CACHE_DURATION) {
        return {
          success: true,
          data: this.cache.data,
          count: this.cache.data.length
        }
      }

      const response = await fetch('/api/creators/featured', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Featured channels API error:', errorData)
        return {
          success: false,
          data: [],
          count: 0,
          error: errorData.error || 'Failed to fetch featured channels'
        }
      }

      const result = await response.json()

      if (!result.success) {
        console.error('❌ Featured channels service error:', result.error)
        return {
          success: false,
          data: [],
          count: 0,
          error: result.error || 'Failed to fetch featured channels'
        }
      }

      // Update cache
      this.cache = {
        data: result.data || [],
        timestamp: now
      }

      return {
        success: true,
        data: result.data || [],
        count: result.count || 0
      }

    } catch (error) {
      console.error('❌ Featured channels service error:', error)
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clear cache to force refresh on next request
   */
  clearCache(): void {
    this.cache = null
  }

  /**
   * Get cached data without making API call
   */
  getCachedData(): FeaturedChannel[] | null {
    if (!this.cache) return null
    
    const now = Date.now()
    if ((now - this.cache.timestamp) >= this.CACHE_DURATION) {
      return null // Cache expired
    }
    
    return this.cache.data
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    if (!this.cache) return false
    
    const now = Date.now()
    return (now - this.cache.timestamp) < this.CACHE_DURATION
  }
}

// Export singleton instance
export const featuredChannelsService = FeaturedChannelsService.getInstance()
