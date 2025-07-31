// RaffleCraft Quiz System Service
// Handles all backend operations for the quiz-based raffle system

import { createClient } from '@supabase/supabase-js'
import {
  WeeklyRaffle,
  QuizQuestion,
  UserQuizAttempt,
  RaffleTicket,
  RaffleWinner,
  CurrentWeekQuizResponse,
  UserEligibilityResponse,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
  TicketMintingRequest,
  TicketMintingResponse,
  RaffleCraftError,
  QuizError,
  TicketMintingError
} from '@/lib/types/rafflecraft-types'

class RaffleCraftService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Get current week's quiz and raffle information
   */
  async getCurrentWeekQuiz(): Promise<CurrentWeekQuizResponse | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_current_week_quiz')
        .single()

      if (error) {
        console.error('Error fetching current week quiz:', error)
        return null
      }

      return data as CurrentWeekQuizResponse | null
    } catch (error) {
      console.error('Failed to get current week quiz:', error)
      throw new RaffleCraftError('Failed to load current quiz', 'FETCH_ERROR')
    }
  }

  /**
   * Check if user is eligible to mint a ticket
   */
  async checkUserEligibility(userAddress: string): Promise<UserEligibilityResponse> {
    try {
      const { data, error } = await this.supabase
        .rpc('can_user_mint_ticket', { user_wallet_address: userAddress })
        .single()

      if (error) {
        console.error('Error checking user eligibility:', error)
        throw new RaffleCraftError('Failed to check eligibility', 'ELIGIBILITY_ERROR')
      }

      return data as UserEligibilityResponse
    } catch (error) {
      console.error('Failed to check user eligibility:', error)
      throw new RaffleCraftError('Failed to check eligibility', 'ELIGIBILITY_ERROR')
    }
  }

  /**
   * Submit quiz answer
   */
  async submitQuizAnswer(submission: QuizSubmissionRequest): Promise<QuizSubmissionResponse> {
    try {
      // First, get the correct answer and question details
      const { data: question, error: questionError } = await this.supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', submission.quiz_question_id)
        .single()

      if (questionError || !question) {
        throw new QuizError('Quiz question not found')
      }

      // Check if user already attempted this week
      const { data: existingAttempt } = await this.supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_address', submission.user_address)
        .eq('week_number', submission.week_number)
        .single()

      if (existingAttempt) {
        throw new QuizError('You have already attempted this week\'s quiz')
      }

      // Validate answer
      const isCorrect = submission.user_answer.trim().toLowerCase() === 
                       question.correct_answer.trim().toLowerCase()
      
      const pointsEarned = isCorrect ? question.points_reward : 0

      // Insert quiz attempt
      const response = await this.supabase
        .from('user_quiz_attempts')
        .insert({
          user_address: submission.user_address,
          week_number: submission.week_number,
          quiz_question_id: submission.quiz_question_id,
          user_answer: submission.user_answer,
          is_correct: isCorrect,
          time_taken_seconds: submission.time_taken_seconds,
          points_earned: pointsEarned,
          can_mint_ticket: isCorrect
        })
        .select()
        .single()

      const { data: attempt, error: attemptError } = response

      if (attemptError) {
        console.error('Error inserting quiz attempt:', attemptError)
        throw new QuizError('Failed to save quiz attempt')
      }

      return {
        success: true,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        can_mint_ticket: isCorrect,
        correct_answer: isCorrect ? undefined : question.correct_answer,
        explanation: question.explanation
      }
    } catch (error) {
      console.error('Failed to submit quiz answer:', error)
      if (error instanceof QuizError) {
        throw error
      }
      throw new QuizError('Failed to submit quiz answer')
    }
  }

  /**
   * Mint a raffle ticket after successful quiz completion
   */
  async mintRaffleTicket(request: TicketMintingRequest): Promise<TicketMintingResponse> {
    try {
      // Verify user eligibility first
      const eligibility = await this.checkUserEligibility(request.user_address)
      if (!eligibility.can_mint) {
        throw new TicketMintingError(`Cannot mint ticket: ${eligibility.reason}`)
      }

      // Generate unique ticket number for this week
      const { data: existingTickets } = await this.supabase
        .from('raffle_tickets')
        .select('ticket_number')
        .eq('week_number', request.week_number)
        .order('ticket_number', { ascending: false })
        .limit(1)

      const ticketsData = existingTickets as { ticket_number: number }[] | null
      const nextTicketNumber = ticketsData && ticketsData.length > 0
        ? ticketsData[0].ticket_number + 1
        : 1

      // Insert the ticket
      const ticketResponse = await this.supabase
        .from('raffle_tickets')
        .insert({
          week_number: request.week_number,
          ticket_number: nextTicketNumber,
          owner_address: request.user_address,
          transaction_hash: request.transaction_hash,
          block_number: request.block_number,
          transaction_timestamp: new Date().toISOString(),
          amount_paid_sui: request.amount_paid_sui,
          gas_fee_sui: request.gas_fee_sui
        })
        .select()
        .single()

      const { data: ticket, error: ticketError } = ticketResponse

      if (ticketError) {
        console.error('Error inserting raffle ticket:', ticketError)
        throw new TicketMintingError('Failed to mint ticket')
      }

      // Update weekly raffle stats
      await this.updateWeeklyRaffleStats(request.week_number, request.amount_paid_sui)

      const ticketData = ticket as RaffleTicket
      return {
        success: true,
        ticket_id: ticketData.id,
        ticket_number: ticketData.ticket_number,
        transaction_hash: ticketData.transaction_hash
      }
    } catch (error) {
      console.error('Failed to mint raffle ticket:', error)
      if (error instanceof TicketMintingError) {
        throw error
      }
      throw new TicketMintingError('Failed to mint ticket')
    }
  }

  /**
   * Update weekly raffle statistics
   */
  private async updateWeeklyRaffleStats(weekNumber: number, amountPaid: number): Promise<void> {
    try {
      // First get the current values
      const { data: currentRaffle, error: fetchError } = await this.supabase
        .from('weekly_raffles')
        .select('total_tickets_sold, prize_pool_sui')
        .eq('week_number', weekNumber)
        .single()

      if (fetchError) {
        console.error('Error fetching current raffle stats:', fetchError)
        return
      }

      const raffleData = currentRaffle as { total_tickets_sold: number; prize_pool_sui: number }

      // Update with incremented values
      const { error } = await this.supabase
        .from('weekly_raffles')
        .update({
          total_tickets_sold: raffleData.total_tickets_sold + 1,
          prize_pool_sui: raffleData.prize_pool_sui + amountPaid
        })
        .eq('week_number', weekNumber)

      if (error) {
        console.error('Error updating weekly raffle stats:', error)
      }
    } catch (error) {
      console.error('Failed to update weekly raffle stats:', error)
    }
  }

  /**
   * Get user's tickets for a specific week
   */
  async getUserTickets(userAddress: string, weekNumber?: number): Promise<RaffleTicket[]> {
    try {
      let query = this.supabase
        .from('raffle_tickets')
        .select('*')
        .eq('owner_address', userAddress)
        .order('minted_at', { ascending: false })

      if (weekNumber) {
        query = query.eq('week_number', weekNumber)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user tickets:', error)
        return []
      }

      return (data as RaffleTicket[]) || []
    } catch (error) {
      console.error('Failed to get user tickets:', error)
      return []
    }
  }

  /**
   * Get user's quiz attempt for a specific week
   */
  async getUserQuizAttempt(userAddress: string, weekNumber: number): Promise<UserQuizAttempt | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_address', userAddress)
        .eq('week_number', weekNumber)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user quiz attempt:', error)
        return null
      }

      return data as UserQuizAttempt | null
    } catch (error) {
      console.error('Failed to get user quiz attempt:', error)
      return null
    }
  }

  /**
   * Get raffle history
   */
  async getRaffleHistory(limit: number = 10): Promise<WeeklyRaffle[]> {
    try {
      const { data, error } = await this.supabase
        .from('weekly_raffles')
        .select('*')
        .order('week_number', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching raffle history:', error)
        return []
      }

      return (data as WeeklyRaffle[]) || []
    } catch (error) {
      console.error('Failed to get raffle history:', error)
      return []
    }
  }

  /**
   * Get winners history
   */
  async getWinnersHistory(limit: number = 10): Promise<RaffleWinner[]> {
    try {
      const { data, error } = await this.supabase
        .from('raffle_winners')
        .select('*')
        .order('week_number', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching winners history:', error)
        return []
      }

      return (data as RaffleWinner[]) || []
    } catch (error) {
      console.error('Failed to get winners history:', error)
      return []
    }
  }

  /**
   * Create next week's raffle (admin function)
   */
  async createNextWeeklyRaffle(): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('create_next_weekly_raffle')

      if (error) {
        console.error('Error creating next weekly raffle:', error)
        throw new RaffleCraftError('Failed to create next weekly raffle', 'ADMIN_ERROR')
      }
    } catch (error) {
      console.error('Failed to create next weekly raffle:', error)
      throw new RaffleCraftError('Failed to create next weekly raffle', 'ADMIN_ERROR')
    }
  }
}

// Export singleton instance
export const raffleCraftService = new RaffleCraftService()
export default raffleCraftService
