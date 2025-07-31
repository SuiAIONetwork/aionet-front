import 'server-only'
import { getCurrentUser, User } from './auth'
import { createClient } from '@supabase/supabase-js'
// Note: experimental_taintObjectReference removed due to React version compatibility

// Server-side Supabase client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Data Transfer Objects
export interface TradingActivityDTO {
  id: string
  type: 'buy' | 'sell'
  symbol: string
  amount: number
  price: number
  profit: number
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
}

export interface TradingStatsDTO {
  totalTrades: number
  winRate: number
  totalProfit: number
  bestTrade: number
  worstTrade: number
  averageProfit: number
  activePositions: number
  monthlyProfit: number
}

export interface LeaderboardEntryDTO {
  rank: number
  username: string
  address: string
  totalProfit: number
  winRate: number
  totalTrades: number
  role: 'NOMAD' | 'PRO' | 'ROYAL'
}

// Permission checking functions
function canViewTradingData(viewer: User | null, targetAddress: string): boolean {
  // Users can only view their own trading data, admins can view all
  return viewer?.address === targetAddress || viewer?.isAdmin === true
}

function canViewLeaderboard(viewer: User | null): boolean {
  // All authenticated users can view leaderboard
  return viewer !== null
}

// Get user's trading activities
export async function getTradingActivitiesDTO(
  address: string,
  limit: number = 20,
  offset: number = 0
): Promise<TradingActivityDTO[]> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!canViewTradingData(currentUser, address)) {
      return []
    }

    const { data: activities, error } = await supabaseServer
      .from('trading_activities')
      .select(`
        id,
        activity_type,
        symbol,
        amount,
        price,
        profit,
        created_at,
        status
      `)
      .eq('user_address', address)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !activities) {
      return []
    }

    return activities.map(activity => {
      // Security note: Ensure raw trading activity data is not accidentally exposed to client
      // (experimental_taintObjectReference removed due to React version compatibility)

      return {
        id: activity.id,
        type: activity.activity_type,
        symbol: activity.symbol,
        amount: activity.amount,
        price: activity.price,
        profit: activity.profit || 0,
        timestamp: activity.created_at,
        status: activity.status || 'completed'
      }
    })
  } catch (error) {
    console.error('Error fetching trading activities:', error)
    return []
  }
}

// Get user's trading statistics
export async function getTradingStatsDTO(address: string): Promise<TradingStatsDTO | null> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!canViewTradingData(currentUser, address)) {
      return null
    }

    const { data: stats, error } = await supabaseServer
      .from('trading_stats')
      .select(`
        total_trades,
        win_rate,
        total_profit,
        best_trade,
        worst_trade,
        average_profit,
        active_positions,
        monthly_profit
      `)
      .eq('user_address', address)
      .single()

    if (error || !stats) {
      // Return default stats if none exist
      return {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        bestTrade: 0,
        worstTrade: 0,
        averageProfit: 0,
        activePositions: 0,
        monthlyProfit: 0
      }
    }

    // Security note: Ensure raw trading stats data is not accidentally exposed to client
    // (experimental_taintObjectReference removed due to React version compatibility)

    return {
      totalTrades: stats.total_trades || 0,
      winRate: stats.win_rate || 0,
      totalProfit: stats.total_profit || 0,
      bestTrade: stats.best_trade || 0,
      worstTrade: stats.worst_trade || 0,
      averageProfit: stats.average_profit || 0,
      activePositions: stats.active_positions || 0,
      monthlyProfit: stats.monthly_profit || 0
    }
  } catch (error) {
    console.error('Error fetching trading stats:', error)
    return null
  }
}

// Get trading leaderboard
export async function getTradingLeaderboardDTO(limit: number = 50): Promise<LeaderboardEntryDTO[]> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!canViewLeaderboard(currentUser)) {
      return []
    }

    const { data: leaderboard, error } = await supabaseServer
      .from('trading_stats')
      .select(`
        user_address,
        total_profit,
        win_rate,
        total_trades,
        user_profiles!inner(username, nft_tier)
      `)
      .order('total_profit', { ascending: false })
      .limit(limit)

    if (error || !leaderboard) {
      return []
    }

    return leaderboard.map((entry, index) => {
      // Security note: Ensure raw leaderboard data is not accidentally exposed to client
      // (experimental_taintObjectReference removed due to React version compatibility)

      return {
        rank: index + 1,
        username: (entry.user_profiles as any)?.username || 'Anonymous',
        address: entry.user_address,
        totalProfit: entry.total_profit || 0,
        winRate: entry.win_rate || 0,
        totalTrades: entry.total_trades || 0,
        role: mapNftTierToRole((entry.user_profiles as any)?.nft_tier)
      }
    })
  } catch (error) {
    console.error('Error fetching trading leaderboard:', error)
    return []
  }
}

// Get user's rank in leaderboard
export async function getUserRankDTO(address: string): Promise<number | null> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!canViewTradingData(currentUser, address)) {
      return null
    }

    // Get user's total profit
    const { data: userStats, error: userError } = await supabaseServer
      .from('trading_stats')
      .select('total_profit')
      .eq('user_address', address)
      .single()

    if (userError || !userStats) {
      return null
    }

    // Count how many users have higher profit
    const { count, error: countError } = await supabaseServer
      .from('trading_stats')
      .select('*', { count: 'exact', head: true })
      .gt('total_profit', userStats.total_profit)

    if (countError) {
      return null
    }

    return (count || 0) + 1
  } catch (error) {
    console.error('Error fetching user rank:', error)
    return null
  }
}

// Helper function to map NFT tier to role
function mapNftTierToRole(nftTier: string | null): 'NOMAD' | 'PRO' | 'ROYAL' {
  switch (nftTier) {
    case 'ROYAL':
      return 'ROYAL'
    case 'PRO':
      return 'PRO'
    default:
      return 'NOMAD'
  }
}

// Get aggregated trading statistics for admin dashboard
export async function getAggregatedTradingStatsDTO() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser?.isAdmin) {
      return null
    }

    // Get total users with trading activity
    const { count: totalTraders } = await supabaseServer
      .from('trading_stats')
      .select('*', { count: 'exact', head: true })
      .gt('total_trades', 0)

    // Get total trades across all users
    const { data: totalTradesData } = await supabaseServer
      .from('trading_stats')
      .select('total_trades')

    const totalTrades = totalTradesData?.reduce((sum, stat) => sum + (stat.total_trades || 0), 0) || 0

    // Get total profit across all users
    const { data: totalProfitData } = await supabaseServer
      .from('trading_stats')
      .select('total_profit')

    const totalProfit = totalProfitData?.reduce((sum, stat) => sum + (stat.total_profit || 0), 0) || 0

    return {
      totalTraders: totalTraders || 0,
      totalTrades,
      totalProfit,
      averageProfitPerUser: totalTraders ? totalProfit / totalTraders : 0
    }
  } catch (error) {
    console.error('Error fetching aggregated trading stats:', error)
    return null
  }
}
