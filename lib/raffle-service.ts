/**
 * Raffle Service for Leaderboard Integration
 * Handles raffle ticket and RaffleCraft related operations for leaderboard scoring
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

export interface RaffleStats {
  user_address: string
  total_tickets_minted: number
  total_amount_spent: number
  weeks_participated: number
  winning_tickets: number
  total_winnings: number
  average_ticket_price: number
  first_ticket_date?: string
  last_ticket_date?: string
  favorite_week?: number
  participation_streak: number
  created_at: string
  updated_at: string
}

export interface RaffleFilters {
  userAddress?: string
  weekNumber?: number
  isWinning?: boolean
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

class RaffleService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    stats: 5 * 60 * 1000,      // 5 minutes
    tickets: 2 * 60 * 1000,    // 2 minutes
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
   * Get user raffle statistics
   */
  async getUserRaffleStats(userAddress: string): Promise<RaffleStats | null> {
    try {
      const cacheKey = `raffle_stats:${userAddress}`
      const cachedData = this.getCachedData<RaffleStats>(cacheKey)
      if (cachedData) return cachedData

      // Get all raffle tickets for this user
      const { data: tickets, error: ticketsError } = await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('owner_address', userAddress)
        .order('minted_at', { ascending: true })

      if (ticketsError) throw ticketsError

      if (!tickets || tickets.length === 0) {
        return null
      }

      // Calculate statistics
      const totalTickets = tickets.length
      const totalAmountSpent = tickets.reduce((sum, ticket) => sum + (ticket.amount_paid_sui || 0), 0)
      const uniqueWeeks = new Set(tickets.map(ticket => ticket.week_number)).size
      const winningTickets = tickets.filter(ticket => ticket.is_winning_ticket).length
      
      // Calculate total winnings (would need to join with weekly_raffles table for prize amounts)
      const { data: winnings, error: winningsError } = await supabase
        .from('weekly_raffles')
        .select('prize_pool_sui, winner_address, week_number')
        .eq('winner_address', userAddress)

      if (winningsError) {
        console.warn('Failed to get winnings data:', winningsError)
      }

      const totalWinnings = winnings?.reduce((sum, win) => sum + (win.prize_pool_sui || 0), 0) || 0
      const averageTicketPrice = totalTickets > 0 ? totalAmountSpent / totalTickets : 0
      const firstTicketDate = tickets[0]?.minted_at
      const lastTicketDate = tickets[tickets.length - 1]?.minted_at

      // Find most participated week
      const weekCounts = new Map<number, number>()
      tickets.forEach(ticket => {
        const count = weekCounts.get(ticket.week_number) || 0
        weekCounts.set(ticket.week_number, count + 1)
      })
      
      let favoriteWeek: number | undefined
      let maxCount = 0
      weekCounts.forEach((count, week) => {
        if (count > maxCount) {
          maxCount = count
          favoriteWeek = week
        }
      })

      // Calculate participation streak (consecutive weeks)
      const participationStreak = this.calculateParticipationStreak(tickets)

      const stats: RaffleStats = {
        user_address: userAddress,
        total_tickets_minted: totalTickets,
        total_amount_spent: totalAmountSpent,
        weeks_participated: uniqueWeeks,
        winning_tickets: winningTickets,
        total_winnings: totalWinnings,
        average_ticket_price: averageTicketPrice,
        first_ticket_date: firstTicketDate,
        last_ticket_date: lastTicketDate,
        favorite_week: favoriteWeek,
        participation_streak: participationStreak,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.setCachedData(cacheKey, stats, this.CACHE_TTL.stats)
      return stats
    } catch (error) {
      console.error('Failed to get user raffle stats:', error)
      return null
    }
  }

  /**
   * Calculate participation streak (consecutive weeks)
   */
  private calculateParticipationStreak(tickets: any[]): number {
    if (tickets.length === 0) return 0

    // Get unique weeks and sort them
    const weeks = Array.from(new Set(tickets.map(ticket => ticket.week_number))).sort((a, b) => b - a)
    
    let streak = 0
    let expectedWeek = weeks[0]

    for (const week of weeks) {
      if (week === expectedWeek) {
        streak++
        expectedWeek = week - 1
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Get user raffle tickets with filters
   */
  async getUserRaffleTickets(filters: RaffleFilters): Promise<any[]> {
    try {
      const cacheKey = `raffle_tickets:${JSON.stringify(filters)}`
      const cachedData = this.getCachedData<any[]>(cacheKey)
      if (cachedData) return cachedData

      let query = supabase
        .from('raffle_tickets')
        .select(`
          *,
          weekly_raffles (
            week_number,
            prize_pool_sui,
            ticket_price_sui,
            status
          )
        `)

      if (filters.userAddress) {
        query = query.eq('owner_address', filters.userAddress)
      }
      if (filters.weekNumber) {
        query = query.eq('week_number', filters.weekNumber)
      }
      if (filters.isWinning !== undefined) {
        query = query.eq('is_winning_ticket', filters.isWinning)
      }
      if (filters.dateFrom) {
        query = query.gte('minted_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('minted_at', filters.dateTo)
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0

      query = query
        .order('minted_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error

      this.setCachedData(cacheKey, data || [], this.CACHE_TTL.tickets)
      return data || []
    } catch (error) {
      console.error('Failed to get raffle tickets:', error)
      return []
    }
  }

  /**
   * Get top raffle participants for leaderboard
   */
  async getTopRaffleParticipants(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const cacheKey = `top_raffle_participants:${limit}:${offset}`
      const cachedData = this.getCachedData<any[]>(cacheKey)
      if (cachedData) return cachedData

      // Get all tickets and group by user
      const { data: allTickets, error } = await supabase
        .from('raffle_tickets')
        .select('owner_address, amount_paid_sui, week_number, is_winning_ticket, minted_at')

      if (error) throw error

      // Group by user and calculate stats
      const userStats = new Map<string, any>()
      
      allTickets?.forEach(ticket => {
        const userAddress = ticket.owner_address
        if (!userStats.has(userAddress)) {
          userStats.set(userAddress, {
            user_address: userAddress,
            total_tickets: 0,
            total_spent: 0,
            weeks_participated: new Set(),
            winning_tickets: 0,
            last_ticket: ticket.minted_at
          })
        }

        const stats = userStats.get(userAddress)
        stats.total_tickets++
        stats.total_spent += ticket.amount_paid_sui || 0
        stats.weeks_participated.add(ticket.week_number)
        if (ticket.is_winning_ticket) stats.winning_tickets++
        if (ticket.minted_at > stats.last_ticket) {
          stats.last_ticket = ticket.minted_at
        }
      })

      // Convert to array and calculate final scores
      const participants = Array.from(userStats.values()).map(stats => ({
        ...stats,
        weeks_participated: stats.weeks_participated.size,
        average_ticket_price: stats.total_tickets > 0 ? stats.total_spent / stats.total_tickets : 0,
        raffle_score: this.calculateRaffleScore(stats)
      }))

      // Sort by raffle score and apply pagination
      const sortedParticipants = participants
        .sort((a, b) => b.raffle_score - a.raffle_score)
        .slice(offset, offset + limit)

      this.setCachedData(cacheKey, sortedParticipants, this.CACHE_TTL.stats)
      return sortedParticipants
    } catch (error) {
      console.error('Failed to get top raffle participants:', error)
      return []
    }
  }

  /**
   * Calculate raffle score for leaderboard
   * Enhanced algorithm with loyalty and luck bonuses
   */
  calculateRaffleScore(stats: any): number {
    if (!stats) return 0

    // Enhanced weighted scoring algorithm
    const ticketsScore = (stats.total_tickets || 0) * 15 // Increased base points per ticket
    const participationBonus = (stats.weeks_participated || 0) * 40 // Increased participation bonus
    const winningBonus = (stats.winning_tickets || 0) * 200 // Increased winning bonus
    const spendingBonus = Math.min((stats.total_spent || 0), 200) * 1.5 // Spending bonus (capped at 200 SUI)
    const loyaltyBonus = (stats.participation_streak || 0) * 30 // Streak bonus for consecutive participation
    const consistencyBonus = (stats.weeks_participated || 0) >= 5 ? 150 : 0 // Bonus for long-term participants
    const luckBonus = (stats.winning_tickets || 0) > 0 ? 100 : 0 // Base luck bonus for any wins

    return Math.round(ticketsScore + participationBonus + winningBonus + spendingBonus + loyaltyBonus + consistencyBonus + luckBonus)
  }

  /**
   * Get raffle statistics for leaderboard integration
   */
  async getRaffleStatsForLeaderboard(userAddress: string): Promise<{
    tickets_minted: number
    weeks_participated: number
    total_spent: number
  }> {
    try {
      const stats = await this.getUserRaffleStats(userAddress)
      
      if (!stats) {
        return {
          tickets_minted: 0,
          weeks_participated: 0,
          total_spent: 0
        }
      }

      return {
        tickets_minted: stats.total_tickets_minted,
        weeks_participated: stats.weeks_participated,
        total_spent: stats.total_amount_spent
      }
    } catch (error) {
      console.error('Failed to get raffle stats for leaderboard:', error)
      return {
        tickets_minted: 0,
        weeks_participated: 0,
        total_spent: 0
      }
    }
  }
}

export const raffleService = new RaffleService()
