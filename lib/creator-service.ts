/**
 * Creator Service for Leaderboard Integration
 * Handles creator and channel related operations for leaderboard scoring
 */

import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    },
  }
)

export interface CreatorStats {
  user_address: string
  channels_created: number
  total_posts: number
  total_subscribers: number
  premium_channels: number
  free_channels: number
  average_channel_price: number
  total_revenue: number
  engagement_rate: number
  channel_categories: string[]
  most_popular_channel?: string
  first_channel_date?: string
  last_channel_date?: string
  verified_status: boolean
  tier: 'PRO' | 'ROYAL'
  created_at: string
  updated_at: string
}

export interface CreatorFilters {
  userAddress?: string
  tier?: 'PRO' | 'ROYAL'
  verified?: boolean
  category?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

class CreatorService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    stats: 5 * 60 * 1000,      // 5 minutes
    creators: 2 * 60 * 1000,   // 2 minutes
  }

  /**
   * Cache management
   */
  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * Generate encryption key from user's wallet address
   */
  private generateEncryptionKey(address: string): string {
    const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
    return CryptoJS.SHA256(address + appSecret).toString()
  }

  /**
   * Decrypt encrypted field
   */
  private decrypt(encryptedData: string, address: string): string {
    try {
      const key = this.generateEncryptionKey(address)
      const bytes = CryptoJS.AES.decrypt(encryptedData, key)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      console.error('Decryption failed:', error)
      return ''
    }
  }

  /**
   * Get user creator statistics
   */
  async getUserCreatorStats(userAddress: string): Promise<CreatorStats | null> {
    try {
      const cacheKey = `creator_stats:${userAddress}`
      const cachedData = this.getCachedData<CreatorStats>(cacheKey)
      if (cachedData) return cachedData

      // Get creator profile
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('creator_address', userAddress)
        .single()

      if (creatorError || !creator) {
        return null // User is not a creator
      }

      // Get channel subscriptions to calculate subscriber count and revenue
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('channel_subscriptions')
        .select('*')
        .eq('creator_address', userAddress)

      if (subscriptionsError) {
        console.warn('Failed to get channel subscriptions:', subscriptionsError)
      }

      // Calculate statistics
      const channelsData = creator.channels_data || []
      const channelsCreated = channelsData.length
      const premiumChannels = channelsData.filter((ch: any) => ch.type === 'premium' || ch.type === 'vip').length
      const freeChannels = channelsData.filter((ch: any) => ch.type === 'free').length
      
      // Calculate total subscribers from subscriptions
      const totalSubscribers = subscriptions?.length || creator.subscribers_count || 0
      
      // Calculate total revenue from paid subscriptions
      const totalRevenue = subscriptions?.reduce((sum, sub) => sum + (sub.price_paid || 0), 0) || 0
      
      // Calculate average channel price
      const paidChannels = channelsData.filter((ch: any) => ch.type !== 'free')
      const averageChannelPrice = paidChannels.length > 0 
        ? paidChannels.reduce((sum: number, ch: any) => sum + (ch.price || 0), 0) / paidChannels.length
        : 0

      // Calculate total posts by this creator
      const { count: totalPosts } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_address', userAddress)
        .eq('is_deleted', false)
        .eq('post_type', 'creator_post')

      // Calculate engagement rate (simplified: subscribers per channel)
      const engagementRate = channelsCreated > 0 ? (totalSubscribers / channelsCreated) * 100 : 0

      // Get most popular channel (by subscriber count)
      let mostPopularChannel: string | undefined
      if (channelsData.length > 0) {
        const popularChannel = channelsData.reduce((prev: any, current: any) =>
          (current.subscribers || 0) > (prev.subscribers || 0) ? current : prev
        )
        mostPopularChannel = popularChannel.name
      }

      const stats: CreatorStats = {
        user_address: userAddress,
        channels_created: channelsCreated,
        total_posts: totalPosts || 0,
        total_subscribers: totalSubscribers,
        premium_channels: premiumChannels,
        free_channels: freeChannels,
        average_channel_price: averageChannelPrice,
        total_revenue: totalRevenue,
        engagement_rate: engagementRate,
        channel_categories: creator.channel_categories || [],
        most_popular_channel: mostPopularChannel,
        first_channel_date: creator.created_at,
        last_channel_date: creator.updated_at,
        verified_status: creator.verified || false,
        tier: creator.tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.setCachedData(cacheKey, stats, this.CACHE_TTL.stats)
      return stats
    } catch (error) {
      console.error('Failed to get user creator stats:', error)
      return null
    }
  }

  /**
   * Get top creators for leaderboard
   */
  async getTopCreators(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const cacheKey = `top_creators:${limit}:${offset}`
      const cachedData = this.getCachedData<any[]>(cacheKey)
      if (cachedData) return cachedData

      // Get all creators with their data
      const { data: creators, error } = await supabase
        .from('creators')
        .select('creator_address, subscribers_count, channels_data, tier, verified, channel_categories, created_at')

      if (error) throw error

      // Get subscription data for revenue calculation
      const { data: allSubscriptions, error: subsError } = await supabase
        .from('channel_subscriptions')
        .select('creator_address, price_paid')

      if (subsError) {
        console.warn('Failed to get subscription data:', subsError)
      }

      // Group subscriptions by creator
      const subscriptionsByCreator = new Map<string, any[]>()
      allSubscriptions?.forEach(sub => {
        const existing = subscriptionsByCreator.get(sub.creator_address) || []
        existing.push(sub)
        subscriptionsByCreator.set(sub.creator_address, existing)
      })

      // Calculate stats for each creator
      const creatorStats = creators?.map(creator => {
        const channelsData = creator.channels_data || []
        const subscriptions = subscriptionsByCreator.get(creator.creator_address) || []
        
        const channelsCreated = channelsData.length
        const totalSubscribers = subscriptions.length || creator.subscribers_count || 0
        const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.price_paid || 0), 0)
        const premiumChannels = channelsData.filter((ch: any) => ch.type === 'premium' || ch.type === 'vip').length
        const engagementRate = channelsCreated > 0 ? (totalSubscribers / channelsCreated) * 100 : 0

        return {
          user_address: creator.creator_address,
          channels_created: channelsCreated,
          total_subscribers: totalSubscribers,
          premium_channels: premiumChannels,
          total_revenue: totalRevenue,
          engagement_rate: engagementRate,
          tier: creator.tier,
          verified: creator.verified,
          categories: creator.channel_categories,
          creator_score: this.calculateCreatorScore({
            channels_created: channelsCreated,
            total_subscribers: totalSubscribers,
            premium_channels: premiumChannels,
            total_revenue: totalRevenue,
            engagement_rate: engagementRate,
            verified: creator.verified,
            tier: creator.tier
          })
        }
      }) || []

      // Sort by creator score and apply pagination
      const sortedCreators = creatorStats
        .sort((a, b) => b.creator_score - a.creator_score)
        .slice(offset, offset + limit)

      this.setCachedData(cacheKey, sortedCreators, this.CACHE_TTL.stats)
      return sortedCreators
    } catch (error) {
      console.error('Failed to get top creators:', error)
      return []
    }
  }

  /**
   * Calculate creator score for leaderboard
   * Enhanced algorithm with quality metrics and growth incentives
   */
  calculateCreatorScore(stats: any): number {
    if (!stats) return 0

    // Enhanced weighted scoring algorithm
    const channelsScore = (stats.channels_created || 0) * 75 // Increased base points per channel
    const subscribersScore = Math.log10((stats.total_subscribers || 0) + 1) * 100 // Logarithmic subscriber scaling
    const premiumBonus = (stats.premium_channels || 0) * 150 // Increased premium channel bonus
    const revenueScore = Math.min((stats.total_revenue || 0), 2000) * 0.4 // Revenue bonus (capped at 2000 SUI)
    const engagementBonus = Math.pow(Math.min((stats.engagement_rate || 0), 100) / 100, 1.3) * 400 // Non-linear engagement bonus
    const verifiedBonus = stats.verified ? 300 : 0 // Increased verified creator bonus
    const tierBonus = stats.tier === 'ROYAL' ? 400 : 150 // Enhanced tier bonus
    const qualityBonus = (stats.premium_channels || 0) > 0 && (stats.engagement_rate || 0) > 50 ? 250 : 0 // Quality creator bonus
    const diversityBonus = (stats.channel_categories?.length || 0) > 2 ? 100 : 0 // Multi-category bonus

    return Math.round(channelsScore + subscribersScore + premiumBonus + revenueScore + engagementBonus + verifiedBonus + tierBonus + qualityBonus + diversityBonus)
  }

  /**
   * Get creator statistics for leaderboard integration
   */
  async getCreatorStatsForLeaderboard(userAddress: string): Promise<{
    total_posts: number
    subscribers: number
    engagement_rate: number
  }> {
    try {
      const stats = await this.getUserCreatorStats(userAddress)

      if (!stats) {
        return {
          total_posts: 0,
          subscribers: 0,
          engagement_rate: 0
        }
      }

      return {
        total_posts: stats.total_posts,
        subscribers: stats.total_subscribers,
        engagement_rate: stats.engagement_rate
      }
    } catch (error) {
      console.error('Failed to get creator stats for leaderboard:', error)
      return {
        total_posts: 0,
        subscribers: 0,
        engagement_rate: 0
      }
    }
  }
}

export const creatorService = new CreatorService()
