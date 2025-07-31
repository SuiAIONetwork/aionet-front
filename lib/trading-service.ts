/**
 * Trading Service for Database Integration
 * Handles all trading-related database operations with Supabase
 */

import { createClient } from '@supabase/supabase-js'

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

export interface TradingActivity {
  id: string
  user_address: string
  trade_type: 'buy' | 'sell' | 'long' | 'short'
  symbol: string
  amount: number
  price: number
  volume: number // amount * price
  profit_loss?: number
  profit_loss_percentage?: number
  status: 'pending' | 'completed' | 'cancelled' | 'failed'
  platform: 'bybit' | 'binance' | 'manual' | 'other'
  trade_opened_at: string
  trade_closed_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TradingStats {
  user_address: string
  total_volume: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_profit_loss: number
  best_trade: number
  worst_trade: number
  average_trade_size: number
  last_trade_at?: string
  created_at: string
  updated_at: string
}

export interface TradingFilters {
  userAddress?: string
  platform?: string
  tradeType?: string
  symbol?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

class TradingService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    stats: 5 * 60 * 1000,      // 5 minutes
    activities: 2 * 60 * 1000, // 2 minutes
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
   * Record a new trading activity
   */
  async recordTradingActivity(activity: Omit<TradingActivity, 'id' | 'created_at' | 'updated_at' | 'volume'>): Promise<TradingActivity> {
    try {
      const { data, error } = await supabase
        .from('trading_activities')
        .insert([{
          ...activity,
          volume: activity.amount * activity.price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Update user trading stats
      await this.updateTradingStats(activity.user_address)

      // Clear cache for this user
      this.cache.delete(`trading_stats:${activity.user_address}`)
      this.cache.delete(`trading_activities:${activity.user_address}`)

      return data
    } catch (error) {
      console.error('Failed to record trading activity:', error)
      throw error
    }
  }

  /**
   * Update trading activity (e.g., when trade is closed)
   */
  async updateTradingActivity(
    activityId: string, 
    updates: Partial<Pick<TradingActivity, 'profit_loss' | 'profit_loss_percentage' | 'status' | 'trade_closed_at' | 'metadata'>>
  ): Promise<TradingActivity> {
    try {
      const { data, error } = await supabase
        .from('trading_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .select()
        .single()

      if (error) throw error

      // Update user trading stats
      await this.updateTradingStats(data.user_address)

      // Clear cache for this user
      this.cache.delete(`trading_stats:${data.user_address}`)
      this.cache.delete(`trading_activities:${data.user_address}`)

      return data
    } catch (error) {
      console.error('Failed to update trading activity:', error)
      throw error
    }
  }

  /**
   * Get user trading activities
   */
  async getUserTradingActivities(filters: TradingFilters): Promise<TradingActivity[]> {
    try {
      const cacheKey = `trading_activities:${filters.userAddress}:${JSON.stringify(filters)}`
      const cachedData = this.getCachedData<TradingActivity[]>(cacheKey)
      if (cachedData) return cachedData

      let query = supabase
        .from('trading_activities')
        .select('*')

      if (filters.userAddress) {
        query = query.eq('user_address', filters.userAddress)
      }
      if (filters.platform) {
        query = query.eq('platform', filters.platform)
      }
      if (filters.tradeType) {
        query = query.eq('trade_type', filters.tradeType)
      }
      if (filters.symbol) {
        query = query.eq('symbol', filters.symbol)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('trade_opened_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('trade_opened_at', filters.dateTo)
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0

      query = query
        .order('trade_opened_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error

      this.setCachedData(cacheKey, data || [], this.CACHE_TTL.activities)
      return data || []
    } catch (error) {
      console.error('Failed to get trading activities:', error)
      throw error
    }
  }

  /**
   * Get user trading stats
   */
  async getUserTradingStats(userAddress: string): Promise<TradingStats | null> {
    try {
      const cacheKey = `trading_stats:${userAddress}`
      const cachedData = this.getCachedData<TradingStats>(cacheKey)
      if (cachedData) return cachedData

      const { data, error } = await supabase
        .from('trading_stats')
        .select('*')
        .eq('user_address', userAddress)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      this.setCachedData(cacheKey, data, this.CACHE_TTL.stats)
      return data || null
    } catch (error) {
      console.error('Failed to get trading stats:', error)
      return null
    }
  }

  /**
   * Update user trading stats (called after each trade)
   */
  async updateTradingStats(userAddress: string): Promise<void> {
    try {
      // Get all completed trades for this user
      const { data: activities, error: activitiesError } = await supabase
        .from('trading_activities')
        .select('*')
        .eq('user_address', userAddress)
        .eq('status', 'completed')

      if (activitiesError) throw activitiesError

      if (!activities || activities.length === 0) {
        return
      }

      // Calculate stats
      const totalTrades = activities.length
      const totalVolume = activities.reduce((sum, activity) => sum + activity.volume, 0)
      const completedTrades = activities.filter(a => a.profit_loss !== null && a.profit_loss !== undefined)
      const winningTrades = completedTrades.filter(a => (a.profit_loss || 0) > 0).length
      const losingTrades = completedTrades.filter(a => (a.profit_loss || 0) < 0).length
      const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0
      const totalProfitLoss = completedTrades.reduce((sum, activity) => sum + (activity.profit_loss || 0), 0)
      const bestTrade = Math.max(...completedTrades.map(a => a.profit_loss || 0), 0)
      const worstTrade = Math.min(...completedTrades.map(a => a.profit_loss || 0), 0)
      const averageTradeSize = totalVolume / totalTrades
      const lastTradeAt = activities[0]?.trade_opened_at

      // Upsert trading stats
      const { error: upsertError } = await supabase
        .from('trading_stats')
        .upsert({
          user_address: userAddress,
          total_volume: totalVolume,
          total_trades: totalTrades,
          winning_trades: winningTrades,
          losing_trades: losingTrades,
          win_rate: winRate,
          total_profit_loss: totalProfitLoss,
          best_trade: bestTrade,
          worst_trade: worstTrade,
          average_trade_size: averageTradeSize,
          last_trade_at: lastTradeAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_address'
        })

      if (upsertError) throw upsertError

      // Clear cache
      this.cache.delete(`trading_stats:${userAddress}`)
    } catch (error) {
      console.error('Failed to update trading stats:', error)
      throw error
    }
  }

  /**
   * Get top traders for leaderboard
   */
  async getTopTraders(limit: number = 50, offset: number = 0): Promise<TradingStats[]> {
    try {
      const cacheKey = `top_traders:${limit}:${offset}`
      const cachedData = this.getCachedData<TradingStats[]>(cacheKey)
      if (cachedData) return cachedData

      const { data, error } = await supabase
        .from('trading_stats')
        .select('*')
        .order('total_volume', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      this.setCachedData(cacheKey, data || [], this.CACHE_TTL.stats)
      return data || []
    } catch (error) {
      console.error('Failed to get top traders:', error)
      return []
    }
  }

  /**
   * Calculate trading score for leaderboard
   * Enhanced algorithm with balanced risk/reward metrics
   */
  calculateTradingScore(stats: TradingStats): number {
    if (!stats) return 0

    // Enhanced weighted scoring algorithm
    const volumeScore = Math.log10(stats.total_volume + 1) * 80 // Logarithmic scaling for volume
    const winRateScore = Math.pow(stats.win_rate / 100, 1.5) * 400 // Non-linear win rate bonus
    const profitScore = Math.max(stats.total_profit_loss, 0) * 0.2 // Profit contribution (only positive)
    const activityScore = Math.min(stats.total_trades, 500) * 1.0 // Activity bonus (capped at 500 trades)
    const consistencyBonus = stats.win_rate > 60 && stats.total_trades > 10 ? 200 : 0 // Bonus for consistent traders
    const riskManagementBonus = stats.worst_trade > -1000 ? 100 : 0 // Bonus for good risk management

    return Math.round(volumeScore + winRateScore + profitScore + activityScore + consistencyBonus + riskManagementBonus)
  }
}

export const tradingService = new TradingService()
