/**
 * Leaderboard Service for Database Integration
 * Handles all leaderboard-related database operations with Supabase
 */

import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'
import { tradingService } from './trading-service'
import { creatorService } from './creator-service'
import { getImageUrl } from './supabase-storage'

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

// Types
export interface LeaderboardUser {
  address: string
  username: string
  profileImageUrl: string | null
  roleTier: 'NOMAD' | 'PRO' | 'ROYAL'
  profileLevel: number
  currentXp: number
  totalXp: number
  points: number
  location: string | null
  kycStatus: string
  joinDate: string
  lastActive: string
  rank: number
  score: number
  metrics: Record<string, any>
}

export interface CountryStats {
  code: string
  name: string
  flag: string
  rank: number
  members: number
  totalVolume: number
  totalActivity: number
  avgLevel: number
  topTier: 'NOMAD' | 'PRO' | 'ROYAL'
  metrics: {
    members: number
    volume: number
    activity: number
    avg_level: number
    top_tier: string
  }
}

export interface LeaderboardCategory {
  id: string
  name: string
  description: string
  icon: string
  scoreField: string
  additionalMetrics: string[]
}

export interface LeaderboardFilters {
  category: string
  timePeriod: 'weekly' | 'monthly' | 'all-time'
  limit: number
  offset: number
  locationFilter?: string
}

export interface LeaderboardResponse {
  users: LeaderboardUser[]
  countries?: CountryStats[]
  totalCount: number
  hasMore: boolean
  lastUpdated: string
  isCountryView?: boolean
}

// Leaderboard categories configuration
export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  {
    id: 'all',
    name: 'All Categories',
    description: 'Overall ranking based on profile level, personal referrals and copy trading volume',
    icon: 'Trophy',
    scoreField: 'overall_score',
    additionalMetrics: ['profile_level', 'direct_referrals', 'usd_copy_volume']
  },
  {
    id: 'affiliates',
    name: 'Top Affiliates',
    description: 'Based on personal members, SUI commissions from all levels, and total network members',
    icon: 'Users',
    scoreField: 'affiliate_score',
    additionalMetrics: ['direct_referrals', 'network_commissions', 'total_network_users']
  },
  {
    id: 'traders',
    name: 'Top Copiers',
    description: 'Based on trading volume and copy trading performance',
    icon: 'TrendingUp',
    scoreField: 'trading_score',
    additionalMetrics: ['trading_volume', 'trades_count', 'active_bots_following']
  },

  {
    id: 'xp',
    name: 'Top XP',
    description: 'Based on total experience points earned',
    icon: 'Zap',
    scoreField: 'total_xp',
    additionalMetrics: ['current_xp', 'profile_level', 'achievements_count']
  },
  // TEMPORARILY HIDDEN - Quiz Champions
  // {
  //   id: 'quiz',
  //   name: 'Quiz Champions',
  //   description: 'Based on RaffleQuiz participation and success',
  //   icon: 'Brain',
  //   scoreField: 'quiz_score',
  //   additionalMetrics: ['correct_answers', 'quiz_participation', 'tickets_minted']
  // },
  // TEMPORARILY HIDDEN - Top Channel Creators
  // {
  //   id: 'creators',
  //   name: 'Top Channel Creators',
  //   description: 'Based on posts created and engagement',
  //   icon: 'Video',
  //   scoreField: 'creator_score',
  //   additionalMetrics: ['total_posts', 'subscribers', 'engagement_rate']
  // },

]

class LeaderboardService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    leaderboard: 5 * 60 * 1000, // 5 minutes
    stats: 10 * 60 * 1000,      // 10 minutes
  }

  /**
   * Generate encryption key from user's wallet address
   */
  private generateEncryptionKey(address: string): string {
    const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
    return CryptoJS.SHA256(address + appSecret).toString()
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * Set data in cache with TTL
   */
  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clear cache for specific key or all cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
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

  // Note: getImageUrl function is now imported from ./supabase-storage

  /**
   * Calculate affiliate score based on direct referrals, network commissions and total network size
   * Optimized scoring algorithm with balanced weights for multi-level affiliate system
   */
  private calculateAffiliateScore(referralData: any): number {
    const directReferrals = referralData?.direct_referrals || referralData?.referral_count || 0
    const networkCommissions = referralData?.network_commissions || referralData?.total_commissions || 0
    const totalNetworkUsers = referralData?.total_network_users || referralData?.network_size || 0

    // Enhanced weighted scoring with logarithmic scaling for large numbers
    const directReferralScore = directReferrals * 20 + Math.log10(directReferrals + 1) * 60 // Higher weight for direct referrals
    const networkCommissionScore = Math.min(networkCommissions * 2, 1200) // Network commissions from all 5 levels
    const networkSizeBonus = Math.min(totalNetworkUsers * 5, 800) // Bonus for large network across all levels
    const consistencyBonus = (directReferrals > 0 && totalNetworkUsers > directReferrals) ? 150 : 0 // Bonus for active multi-level network

    return Math.round(directReferralScore + networkCommissionScore + networkSizeBonus + consistencyBonus)
  }

  /**
   * Calculate trading score based on actual trading data
   */
  private async calculateTradingScore(userData: any): Promise<number> {
    try {
      const tradingStats = await tradingService.getUserTradingStats(userData.address)
      if (!tradingStats) {
        // Fallback for users with no trading data
        const level = userData.profile_level || 1
        const xp = userData.total_xp || 0
        return Math.round((level * 10) + (xp * 0.02))
      }

      return tradingService.calculateTradingScore(tradingStats)
    } catch (error) {
      console.error('Failed to calculate trading score:', error)
      // Fallback calculation
      const level = userData.profile_level || 1
      const xp = userData.total_xp || 0
      return Math.round((level * 10) + (xp * 0.02))
    }
  }

  /**
   * Calculate quiz score (removed - fallback only)
   */
  private async calculateQuizScore(userData: any): Promise<number> {
    // Fallback calculation since quiz functionality is removed
    const level = userData.profile_level || 1
    const xp = userData.total_xp || 0
    return Math.round((level * 5) + (xp * 0.01))
  }

  /**
   * Calculate creator score based on actual creator data
   */
  private async calculateCreatorScore(userData: any): Promise<number> {
    try {
      const creatorStats = await creatorService.getUserCreatorStats(userData.address)
      if (!creatorStats) {
        // Fallback for users who are not creators
        const level = userData.profile_level || 1
        const xp = userData.total_xp || 0
        return Math.round((level * 2) + (xp * 0.005))
      }

      return creatorService.calculateCreatorScore(creatorStats)
    } catch (error) {
      console.error('Failed to calculate creator score:', error)
      // Fallback calculation
      const level = userData.profile_level || 1
      const xp = userData.total_xp || 0
      return Math.round((level * 2) + (xp * 0.005))
    }
  }

  /**
   * Calculate overall score combining all activities
   * Enhanced algorithm with balanced weights and tier bonuses
   */
  private calculateOverallScore(userData: any, affiliateScore: number, tradingScore: number, quizScore: number, creatorScore: number): number {
    const xp = userData.total_xp || 0
    const level = userData.profile_level || 1
    const tier = userData.role_tier || 'NOMAD'

    // Base score from XP and level
    const baseScore = (xp * 0.4) + (level * 150)

    // Activity scores with balanced weights
    const activityScore = (
      (affiliateScore * 0.25) +
      (tradingScore * 0.25) +
      (quizScore * 0.25) +
      (creatorScore * 0.25)
    )

    // Tier multiplier bonus
    const tierMultiplier = tier === 'ROYAL' ? 1.3 : tier === 'PRO' ? 1.15 : 1.0

    // Engagement bonus for users active in multiple areas
    const activeAreas = [affiliateScore, tradingScore, quizScore, creatorScore].filter(score => score > 0).length
    const engagementBonus = activeAreas >= 3 ? 500 : activeAreas >= 2 ? 200 : 0

    return Math.round((baseScore + activityScore) * tierMultiplier + engagementBonus)
  }

  /**
   * Get leaderboard data for a specific category
   */
  async getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardResponse> {
    try {
      const { category, timePeriod, limit, offset, locationFilter = 'all' } = filters

      // Always fetch country stats for sidebar (top 10)
      const normalizedCategory = category === 'all' ? 'overall' : category
      const countryStatsPromise = this.getCountryStats(normalizedCategory, timePeriod, 0, 10)

      // If locationFilter is 'all', show all users (no location filtering)
      // Countries will be shown in the sidebar only

      // Generate cache key
      const cacheKey = `leaderboard:${category}:${timePeriod}:${limit}:${offset}:${locationFilter}`

      // Check cache first
      const cachedData = this.getCachedData<LeaderboardResponse>(cacheKey)
      if (cachedData) {
        return cachedData
      }
      
      // Base query for user profiles with referral data
      let query = supabase
        .from('user_profiles')
        .select(`
          address,
          username_encrypted,
          profile_image_blob_id,
          role_tier,
          profile_level,
          current_xp,
          total_xp,
          points,
          location_encrypted,
          kyc_status,
          join_date,
          last_active,
          referral_data,
          achievements_data
        `)
        .not('username_encrypted', 'is', null)

      // Apply initial ordering based on category
      if (category === 'xp' || category === 'community') {
        query = query.order('total_xp', { ascending: false })
      } else if (category === 'affiliates') {
        query = query.order('total_xp', { ascending: false }) // Will be re-sorted by affiliate score
      } else {
        query = query.order('total_xp', { ascending: false }) // Default ordering, will be re-sorted
      }

      // Apply time period filtering if needed
      if (timePeriod !== 'all-time') {
        const now = new Date()
        let startDate: Date
        
        if (timePeriod === 'weekly') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else { // monthly
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
        
        query = query.gte('last_active', startDate.toISOString())
      }

      const { data: users, error, count } = await query
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Filter users by location if specific location is selected
      let filteredUsers = users || []
      if (locationFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => {
          if (!user.location_encrypted) return false
          try {
            const userLocation = this.decrypt(user.location_encrypted, user.address)
            // Match by location code or name
            return userLocation && (
              userLocation.toLowerCase() === locationFilter.toLowerCase() ||
              userLocation.toLowerCase().includes(locationFilter.toLowerCase())
            )
          } catch (error) {
            return false
          }
        })
      }

      // Process and score users based on category (async processing)
      const processedUsers: LeaderboardUser[] = await Promise.all(
        filteredUsers.map(async (user, index) => {
          const username = this.decrypt(user.username_encrypted, user.address)
          const location = user.location_encrypted ? this.decrypt(user.location_encrypted, user.address) : null
          const profileImageUrl = getImageUrl(user.profile_image_blob_id)

          // Calculate scores based on category (some are async now)
          const affiliateScore = this.calculateAffiliateScore(user.referral_data)
          const tradingScore = await this.calculateTradingScore(user)
          const quizScore = await this.calculateQuizScore(user)
          const creatorScore = await this.calculateCreatorScore(user)
          const overallScore = this.calculateOverallScore(user, affiliateScore, tradingScore, quizScore, creatorScore)

          let score: number
          let metrics: Record<string, any> = {}

          // Get trading stats for traders category
          let tradingStats = null
          if (category === 'traders') {
            try {
              tradingStats = await tradingService.getUserTradingStats(user.address)
            } catch (error) {
              console.error('Failed to get trading stats for user:', user.address, error)
            }
          }

          // Quiz functionality removed - no stats needed

          // Get creator stats for creators category
          let creatorStats = null
          if (category === 'creators') {
            try {
              creatorStats = await creatorService.getCreatorStatsForLeaderboard(user.address)
            } catch (error) {
              console.error('Failed to get creator stats for user:', user.address, error)
            }
          }

          switch (category) {
            case 'all':
            case 'overall':
            default:
              score = overallScore
              metrics = {
                profile_level: user.profile_level || 1,
                direct_referrals: user.referral_data?.direct_referrals || user.referral_data?.referral_count || 0,
                usd_copy_volume: tradingStats?.total_volume || 0
              }
              break
            case 'affiliates':
              score = affiliateScore
              metrics = {
                direct_referrals: user.referral_data?.direct_referrals || user.referral_data?.referral_count || 0,
                network_commissions: user.referral_data?.network_commissions || user.referral_data?.total_commissions || 0,
                total_network_users: user.referral_data?.total_network_users || user.referral_data?.network_size || 0
              }
              break
            case 'traders':
              score = tradingScore
              metrics = {
                trading_volume: tradingStats?.total_volume || 0,
                trades_count: tradingStats?.total_trades || 0,
                active_bots_following: 0 // This would need to come from a different source
              }
              break
          case 'community':
            score = user.total_xp
            metrics = {
              achievements_count: user.achievements_data?.length || 0,
              level_rewards: user.profile_level * 100,
              community_engagement: user.total_xp
            }
            break
          case 'xp':
            score = user.total_xp
            metrics = {
              current_xp: user.current_xp,
              profile_level: user.profile_level,
              achievements_count: user.achievements_data?.length || 0
            }
            break
          case 'quiz':
            // Quiz functionality removed - use fallback score
            score = quizScore
            metrics = {
              correct_answers: 0,
              quiz_participation: 0,
              tickets_minted: 0
            }
            break
          case 'creators':
            score = creatorScore
            metrics = {
              total_posts: creatorStats?.total_posts || 0,
              subscribers: creatorStats?.subscribers || 0,
              engagement_rate: creatorStats?.engagement_rate || 0
            }
            break
          }

          return {
            address: user.address,
            username: username || 'Anonymous',
            profileImageUrl,
            roleTier: user.role_tier,
            profileLevel: user.profile_level,
            currentXp: user.current_xp,
            totalXp: user.total_xp,
            points: user.points || 0,
            location,
            kycStatus: user.kyc_status,
            joinDate: user.join_date,
            lastActive: user.last_active,
            rank: offset + index + 1,
            score,
            metrics
          }
        })
      )

      // Sort by score (descending) and reassign ranks
      const sortedUsers = processedUsers
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          ...user,
          rank: offset + index + 1
        }))

      // Get country stats for sidebar
      const countryStats = await countryStatsPromise

      const result: LeaderboardResponse = {
        users: sortedUsers,
        countries: countryStats.countries,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit,
        lastUpdated: new Date().toISOString(),
        isCountryView: false
      }

      // Cache the result
      this.setCachedData(cacheKey, result, this.CACHE_TTL.leaderboard)

      return result
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      throw error
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(): Promise<Record<string, any>> {
    try {
      // Check cache first
      const cacheKey = 'leaderboard:stats'
      const cachedStats = this.getCachedData<Record<string, any>>(cacheKey)
      if (cachedStats) {
        return cachedStats
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_tier, profile_level, total_xp, referral_data')
        .not('username_encrypted', 'is', null)

      if (error) throw error

      const stats = {
        totalUsers: data?.length || 0,
        tierDistribution: {
          NOMAD: 0,
          PRO: 0,
          ROYAL: 0
        },
        averageLevel: 0,
        totalXP: 0,
        totalReferrals: 0
      }

      data?.forEach(user => {
        stats.tierDistribution[user.role_tier as keyof typeof stats.tierDistribution]++
        stats.totalXP += user.total_xp || 0
        stats.totalReferrals += user.referral_data?.referral_count || 0
      })

      stats.averageLevel = data?.reduce((sum, user) => sum + (user.profile_level || 0), 0) / (data?.length || 1)

      // Cache the stats
      this.setCachedData(cacheKey, stats, this.CACHE_TTL.stats)

      return stats
    } catch (error) {
      console.error('Failed to fetch leaderboard stats:', error)
      return {}
    }
  }

  /**
   * Get country statistics for country-level leaderboard
   */
  async getCountryStats(
    category: string = 'overall',
    timePeriod: 'weekly' | 'monthly' | 'all-time' = 'all-time',
    offset: number = 0,
    limit: number = 20
  ): Promise<LeaderboardResponse> {
    try {
      // Get all users with their locations and metrics
      let query = supabase
        .from('user_profiles')
        .select(`
          address,
          username_encrypted,
          profile_image_blob_id,
          role_tier,
          profile_level,
          current_xp,
          total_xp,
          points,
          location_encrypted,
          kyc_status,
          join_date,
          last_active,
          referral_data,
          achievements_data
        `)
        .not('username_encrypted', 'is', null)
        .not('location_encrypted', 'is', null)

      const { data: users, error } = await query

      if (error) throw error



      // Group users by country and calculate statistics
      const countryMap = new Map<string, {
        users: any[]
        totalVolume: number
        totalActivity: number
        totalXp: number
        totalPoints: number
        tierCounts: Record<string, number>
      }>()

      users?.forEach(user => {
        if (user.location_encrypted) {
          try {
            const location = this.decrypt(user.location_encrypted, user.address)
            if (location) {
              if (!countryMap.has(location)) {
                countryMap.set(location, {
                  users: [],
                  totalVolume: 0,
                  totalActivity: 0,
                  totalXp: 0,
                  totalPoints: 0,
                  tierCounts: { NOMAD: 0, PRO: 0, ROYAL: 0 }
                })
              }

              const countryData = countryMap.get(location)!
              countryData.users.push(user)
              countryData.totalXp += user.total_xp || 0
              countryData.totalPoints += user.points || 0
              countryData.tierCounts[user.role_tier] = (countryData.tierCounts[user.role_tier] || 0) + 1

              // Calculate volume and activity based on user data
              const referralData = user.referral_data ? JSON.parse(user.referral_data) : {}
              const achievementsData = user.achievements_data ? JSON.parse(user.achievements_data) : {}

              // Volume calculation (based on category)
              switch (category) {
                case 'affiliates':
                  countryData.totalVolume += (referralData.network_commissions || referralData.total_commissions || 0)
                  break
                case 'traders':
                  countryData.totalVolume += (user.points || 0) // Use points as trading volume proxy
                  break
                case 'xp':
                  countryData.totalVolume += (user.total_xp || 0)
                  break
                case 'quiz':
                  // Quiz functionality removed - use XP as fallback
                  countryData.totalVolume += (user.current_xp || 0)
                  break
                case 'creators':
                  countryData.totalVolume += (achievementsData.total_posts || 0) * 100
                  break
                default:
                  countryData.totalVolume += (user.total_xp || 0) + (referralData.network_commissions || referralData.total_commissions || 0) * 10
              }

              // Activity calculation
              countryData.totalActivity += (achievementsData.achievements_count || 0) + (user.current_xp || 0) / 100
            }
          } catch (error) {
            // Skip if decryption fails
          }
        }
      })

      // Import locations data for flags
      const { LOCATIONS, getLocationByCode, getCountryCodeByName } = await import('./locations')

      // Convert to CountryStats array
      const countries: CountryStats[] = Array.from(countryMap.entries()).map(([locationName, data], index) => {
        // Use our improved country code mapping function
        const countryCode = getCountryCodeByName(locationName)

        // Determine top tier
        const topTier = data.tierCounts.ROYAL > 0 ? 'ROYAL' :
                      data.tierCounts.PRO > 0 ? 'PRO' : 'NOMAD'

        return {
          code: countryCode || locationName.toLowerCase().replace(/\s+/g, '_'),
          name: locationName,
          flag: '🌍', // We'll use ReactCountryFlag with the code instead
          rank: index + 1,
          members: data.users.length,
          totalVolume: Math.round(data.totalVolume),
          totalActivity: Math.round(data.totalActivity),
          avgLevel: data.users.length > 0 ? Math.round(data.totalXp / data.users.length / 1000) : 0,
          topTier,
          metrics: {
            members: data.users.length,
            volume: Math.round(data.totalVolume),
            activity: Math.round(data.totalActivity),
            avg_level: data.users.length > 0 ? Math.round(data.totalXp / data.users.length / 1000) : 0,
            top_tier: topTier
          }
        }
      })

      // Sort countries by member count (highest first) for all categories
      countries.sort((a, b) => b.members - a.members)

      // Reassign ranks after sorting
      countries.forEach((country, index) => {
        country.rank = index + 1
      })

      // Apply pagination
      const paginatedCountries = countries.slice(offset, offset + limit)

      return {
        users: [], // Empty for country view
        countries: paginatedCountries,
        totalCount: countries.length,
        hasMore: countries.length > offset + limit,
        lastUpdated: new Date().toISOString(),
        isCountryView: true
      }

    } catch (error) {
      console.error('Failed to fetch country stats:', error)
      throw error
    }
  }

  /**
   * Get available locations from database (based on user locations)
   */
  async getAvailableLocations(): Promise<Array<{code: string, name: string, flag: string, count: number}>> {
    try {
      // Get all unique encrypted locations from user profiles
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('location_encrypted, address')
        .not('location_encrypted', 'is', null)
        .not('username_encrypted', 'is', null)

      if (error) throw error

      // Decrypt locations and count occurrences
      const locationCounts = new Map<string, number>()

      users?.forEach(user => {
        if (user.location_encrypted) {
          try {
            const decryptedLocation = this.decrypt(user.location_encrypted, user.address)
            if (decryptedLocation) {
              const currentCount = locationCounts.get(decryptedLocation) || 0
              locationCounts.set(decryptedLocation, currentCount + 1)
            }
          } catch (error) {
            // Skip if decryption fails
            console.warn('Failed to decrypt location for user:', user.address)
          }
        }
      })

      // Import locations data and match with database locations
      const { LOCATIONS, getLocationByCode, getCountryCodeByName } = await import('./locations')

      const availableLocations: Array<{code: string, name: string, flag: string, count: number}> = []

      locationCounts.forEach((count, locationName) => {
        // Use our improved country code mapping function
        const countryCode = getCountryCodeByName(locationName)

        if (countryCode) {
          // Find the proper country name from LOCATIONS
          const location = LOCATIONS.find(l => l.code === countryCode)
          availableLocations.push({
            code: countryCode,
            name: location?.name || locationName,
            flag: '🌍', // We'll use ReactCountryFlag with the code instead
            count
          })
        } else {
          // If no match found, create a generic entry
          availableLocations.push({
            code: locationName.toLowerCase().replace(/\s+/g, '_'),
            name: locationName,
            flag: '🌍',
            count
          })
        }
      })

      // Sort by count (descending) then by name
      return availableLocations.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      })

    } catch (error) {
      console.error('Failed to fetch available locations:', error)
      return []
    }
  }

  /**
   * Preload leaderboard data for better performance
   */
  async preloadLeaderboards(): Promise<void> {
    const categories = ['overall', 'community', 'xp', 'affiliates']
    const timePeriods: Array<'weekly' | 'monthly' | 'all-time'> = ['all-time', 'monthly']

    const preloadPromises = categories.flatMap(category =>
      timePeriods.map(timePeriod =>
        this.getLeaderboard({
          category,
          timePeriod,
          limit: 20,
          offset: 0
        }).catch(error => {
          console.warn(`Failed to preload ${category}:${timePeriod}:`, error)
        })
      )
    )

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Get optimized user count for pagination
   */
  async getUserCount(category: string, timePeriod: string): Promise<number> {
    try {
      const cacheKey = `usercount:${category}:${timePeriod}`
      const cachedCount = this.getCachedData<number>(cacheKey)
      if (cachedCount !== null) {
        return cachedCount
      }

      let query = supabase
        .from('user_profiles')
        .select('address', { count: 'exact', head: true })
        .not('username_encrypted', 'is', null)

      // Apply time period filtering
      if (timePeriod !== 'all-time') {
        const now = new Date()
        let startDate: Date

        if (timePeriod === 'weekly') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        query = query.gte('last_active', startDate.toISOString())
      }

      const { count, error } = await query

      if (error) throw error

      const userCount = count || 0
      this.setCachedData(cacheKey, userCount, this.CACHE_TTL.leaderboard)

      return userCount
    } catch (error) {
      console.error('Failed to get user count:', error)
      return 0
    }
  }
}

export const leaderboardService = new LeaderboardService()
