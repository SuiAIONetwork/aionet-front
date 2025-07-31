/**
 * Quiz Service for Leaderboard Integration
 * Handles quiz-related database operations for leaderboard scoring
 */

import { createClient } from '@supabase/supabase-js'
import { raffleService } from './raffle-service'

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

export interface QuizStats {
  user_address: string
  total_attempts: number
  correct_answers: number
  total_points_earned: number
  quiz_participation_weeks: number
  accuracy_rate: number
  average_time_per_quiz: number
  tickets_minted: number
  best_streak: number
  current_streak: number
  last_attempt_at?: string
  created_at: string
  updated_at: string
}

export interface QuizFilters {
  userAddress?: string
  weekNumber?: number
  isCorrect?: boolean
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

class QuizService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL = {
    stats: 5 * 60 * 1000,      // 5 minutes
    attempts: 2 * 60 * 1000,   // 2 minutes
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
   * Get user quiz statistics
   */
  async getUserQuizStats(userAddress: string): Promise<QuizStats | null> {
    try {
      const cacheKey = `quiz_stats:${userAddress}`
      const cachedData = this.getCachedData<QuizStats>(cacheKey)
      if (cachedData) return cachedData

      // Get all quiz attempts for this user
      const { data: attempts, error: attemptsError } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_address', userAddress)
        .order('attempted_at', { ascending: true })

      if (attemptsError) throw attemptsError

      if (!attempts || attempts.length === 0) {
        return null
      }

      // Get raffle tickets for this user using raffle service
      const raffleStats = await raffleService.getUserRaffleStats(userAddress)

      // Calculate statistics
      const totalAttempts = attempts.length
      const correctAnswers = attempts.filter(a => a.is_correct).length
      const totalPointsEarned = attempts.reduce((sum, a) => sum + (a.points_earned || 0), 0)
      const uniqueWeeks = new Set(attempts.map(a => a.week_number)).size
      const accuracyRate = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0
      
      // Calculate average time (only for attempts with time data)
      const attemptsWithTime = attempts.filter(a => a.time_taken_seconds)
      const averageTime = attemptsWithTime.length > 0 
        ? attemptsWithTime.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / attemptsWithTime.length
        : 0

      const ticketsMinted = raffleStats?.total_tickets_minted || 0
      const lastAttemptAt = attempts[attempts.length - 1]?.attempted_at

      // Calculate streaks
      const { bestStreak, currentStreak } = this.calculateStreaks(attempts)

      const stats: QuizStats = {
        user_address: userAddress,
        total_attempts: totalAttempts,
        correct_answers: correctAnswers,
        total_points_earned: totalPointsEarned,
        quiz_participation_weeks: uniqueWeeks,
        accuracy_rate: accuracyRate,
        average_time_per_quiz: averageTime,
        tickets_minted: ticketsMinted,
        best_streak: bestStreak,
        current_streak: currentStreak,
        last_attempt_at: lastAttemptAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      this.setCachedData(cacheKey, stats, this.CACHE_TTL.stats)
      return stats
    } catch (error) {
      console.error('Failed to get user quiz stats:', error)
      return null
    }
  }

  /**
   * Calculate best and current streaks
   */
  private calculateStreaks(attempts: any[]): { bestStreak: number; currentStreak: number } {
    if (attempts.length === 0) return { bestStreak: 0, currentStreak: 0 }

    // Group attempts by week to get one result per week
    const weeklyResults = new Map<number, boolean>()
    attempts.forEach(attempt => {
      // Only count the first attempt per week (or best result if multiple)
      const existing = weeklyResults.get(attempt.week_number)
      if (!existing || attempt.is_correct) {
        weeklyResults.set(attempt.week_number, attempt.is_correct)
      }
    })

    // Sort weeks and calculate streaks
    const sortedWeeks = Array.from(weeklyResults.keys()).sort((a, b) => a - b)
    const results = sortedWeeks.map(week => weeklyResults.get(week)!)

    let bestStreak = 0
    let currentStreak = 0
    let tempStreak = 0

    for (let i = 0; i < results.length; i++) {
      if (results[i]) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate current streak (from the end)
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i]) {
        currentStreak++
      } else {
        break
      }
    }

    return { bestStreak, currentStreak }
  }

  /**
   * Get user quiz attempts with filters
   */
  async getUserQuizAttempts(filters: QuizFilters): Promise<any[]> {
    try {
      const cacheKey = `quiz_attempts:${JSON.stringify(filters)}`
      const cachedData = this.getCachedData<any[]>(cacheKey)
      if (cachedData) return cachedData

      let query = supabase
        .from('user_quiz_attempts')
        .select(`
          *,
          quiz_questions (
            question_text,
            difficulty,
            category,
            points_reward
          )
        `)

      if (filters.userAddress) {
        query = query.eq('user_address', filters.userAddress)
      }
      if (filters.weekNumber) {
        query = query.eq('week_number', filters.weekNumber)
      }
      if (filters.isCorrect !== undefined) {
        query = query.eq('is_correct', filters.isCorrect)
      }
      if (filters.dateFrom) {
        query = query.gte('attempted_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('attempted_at', filters.dateTo)
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0

      query = query
        .order('attempted_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error

      this.setCachedData(cacheKey, data || [], this.CACHE_TTL.attempts)
      return data || []
    } catch (error) {
      console.error('Failed to get quiz attempts:', error)
      return []
    }
  }

  /**
   * Get top quiz performers for leaderboard
   */
  async getTopQuizPerformers(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const cacheKey = `top_quiz_performers:${limit}:${offset}`
      const cachedData = this.getCachedData<any[]>(cacheKey)
      if (cachedData) return cachedData

      // Get all users with quiz attempts and calculate their stats
      const { data: allAttempts, error } = await supabase
        .from('user_quiz_attempts')
        .select('user_address, is_correct, points_earned, week_number, attempted_at')

      if (error) throw error

      // Group by user and calculate stats
      const userStats = new Map<string, any>()
      
      allAttempts?.forEach(attempt => {
        const userAddress = attempt.user_address
        if (!userStats.has(userAddress)) {
          userStats.set(userAddress, {
            user_address: userAddress,
            total_attempts: 0,
            correct_answers: 0,
            total_points: 0,
            weeks_participated: new Set(),
            last_attempt: attempt.attempted_at
          })
        }

        const stats = userStats.get(userAddress)
        stats.total_attempts++
        if (attempt.is_correct) stats.correct_answers++
        stats.total_points += attempt.points_earned || 0
        stats.weeks_participated.add(attempt.week_number)
        if (attempt.attempted_at > stats.last_attempt) {
          stats.last_attempt = attempt.attempted_at
        }
      })

      // Convert to array and calculate final scores
      const performers = Array.from(userStats.values()).map(stats => ({
        ...stats,
        weeks_participated: stats.weeks_participated.size,
        accuracy_rate: stats.total_attempts > 0 ? (stats.correct_answers / stats.total_attempts) * 100 : 0,
        quiz_score: this.calculateQuizScore(stats)
      }))

      // Sort by quiz score and apply pagination
      const sortedPerformers = performers
        .sort((a, b) => b.quiz_score - a.quiz_score)
        .slice(offset, offset + limit)

      this.setCachedData(cacheKey, sortedPerformers, this.CACHE_TTL.stats)
      return sortedPerformers
    } catch (error) {
      console.error('Failed to get top quiz performers:', error)
      return []
    }
  }

  /**
   * Calculate quiz score for leaderboard
   * Enhanced algorithm with streak bonuses and difficulty scaling
   */
  calculateQuizScore(stats: any): number {
    if (!stats) return 0

    // Enhanced weighted scoring algorithm
    const pointsScore = (stats.total_points || 0) * 1.5 // Direct points from correct answers (boosted)
    const accuracyBonus = Math.pow((stats.accuracy_rate || 0) / 100, 1.2) * 300 // Non-linear accuracy bonus
    const participationBonus = (stats.weeks_participated || 0) * 75 // Increased participation bonus
    const consistencyBonus = Math.min(stats.total_attempts || 0, 15) * 15 // Consistency bonus (capped at 15 attempts)
    const streakBonus = (stats.best_streak || 0) * 100 // Streak bonus for consecutive correct answers
    const currentStreakBonus = (stats.current_streak || 0) * 50 // Current streak bonus
    const speedBonus = stats.average_time_per_quiz < 120 ? 100 : 0 // Bonus for quick answers (under 2 minutes)

    return Math.round(pointsScore + accuracyBonus + participationBonus + consistencyBonus + streakBonus + currentStreakBonus + speedBonus)
  }

  /**
   * Get quiz statistics for a specific user (for leaderboard integration)
   */
  async getQuizStatsForLeaderboard(userAddress: string): Promise<{
    correct_answers: number
    quiz_participation: number
    tickets_minted: number
  }> {
    try {
      const stats = await this.getUserQuizStats(userAddress)
      
      if (!stats) {
        return {
          correct_answers: 0,
          quiz_participation: 0,
          tickets_minted: 0
        }
      }

      return {
        correct_answers: stats.correct_answers,
        quiz_participation: stats.quiz_participation_weeks,
        tickets_minted: stats.tickets_minted
      }
    } catch (error) {
      console.error('Failed to get quiz stats for leaderboard:', error)
      return {
        correct_answers: 0,
        quiz_participation: 0,
        tickets_minted: 0
      }
    }
  }
}

export const quizService = new QuizService()
