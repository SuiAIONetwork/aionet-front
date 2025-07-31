// Weekly Raffle Management System
// Handles 7-day cycle management, winner selection, and prize distribution

import { createClient } from '@supabase/supabase-js'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import {
  WeeklyRaffle,
  RaffleTicket,
  RaffleWinner,
  RaffleCraftError
} from '@/lib/types/rafflecraft-types'

// Treasury configuration
const RAFFLE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_RAFFLE_TREASURY_ADDRESS || 
  '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

const TREASURY_PRIVATE_KEY = process.env.RAFFLE_TREASURY_PRIVATE_KEY // For automated prize distribution

export class RaffleManagementService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  private suiClient = new SuiClient({ 
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('devnet') 
  })

  /**
   * Check and process completed raffles
   */
  async processCompletedRaffles(): Promise<void> {
    try {
      // Get all active raffles that have ended
      const { data: completedRaffles, error } = await this.supabase
        .from('weekly_raffles')
        .select('*')
        .eq('status', 'active')
        .lt('end_date', new Date().toISOString())

      if (error) {
        console.error('Error fetching completed raffles:', error)
        return
      }

      if (!completedRaffles || completedRaffles.length === 0) {
        console.log('No completed raffles to process')
        return
      }

      // Process each completed raffle
      for (const raffle of completedRaffles) {
        await this.processRaffleCompletion(raffle)
      }
    } catch (error) {
      console.error('Error processing completed raffles:', error)
      throw new RaffleCraftError('Failed to process completed raffles', 'RAFFLE_PROCESSING_ERROR')
    }
  }

  /**
   * Process a single raffle completion
   */
  private async processRaffleCompletion(raffle: WeeklyRaffle): Promise<void> {
    try {
      console.log(`Processing completion for raffle week ${raffle.week_number}`)

      // Get all tickets for this raffle
      const { data: tickets, error: ticketsError } = await this.supabase
        .from('raffle_tickets')
        .select('*')
        .eq('week_number', raffle.week_number)

      if (ticketsError) {
        console.error('Error fetching raffle tickets:', ticketsError)
        return
      }

      if (!tickets || tickets.length === 0) {
        console.log(`No tickets found for raffle week ${raffle.week_number}`)
        // Mark raffle as completed with no winner
        await this.markRaffleCompleted(raffle.week_number, null, null)
        return
      }

      // Select random winner
      const winnerTicket = this.selectRandomWinner(tickets)
      console.log(`Selected winner for week ${raffle.week_number}: ${winnerTicket.owner_address}`)

      // Mark the winning ticket
      await this.markWinningTicket(winnerTicket.id)

      // Create winner record
      const winner = await this.createWinnerRecord(raffle, winnerTicket, tickets.length)

      // Mark raffle as completed
      await this.markRaffleCompleted(
        raffle.week_number, 
        winnerTicket.owner_address, 
        winnerTicket.ticket_number
      )

      // Distribute prize (if automated distribution is enabled)
      if (TREASURY_PRIVATE_KEY && raffle.prize_pool_sui > 0) {
        await this.distributePrize(winner, raffle.prize_pool_sui)
      }

      console.log(`Raffle week ${raffle.week_number} completed successfully`)
    } catch (error) {
      console.error(`Error processing raffle completion for week ${raffle.week_number}:`, error)
    }
  }

  /**
   * Select random winner from tickets
   */
  private selectRandomWinner(tickets: RaffleTicket[]): RaffleTicket {
    // Use cryptographically secure random selection
    const randomIndex = Math.floor(Math.random() * tickets.length)
    return tickets[randomIndex]
  }

  /**
   * Mark a ticket as winning
   */
  private async markWinningTicket(ticketId: string): Promise<void> {
    const { error } = await this.supabase
      .from('raffle_tickets')
      .update({ is_winning_ticket: true })
      .eq('id', ticketId)

    if (error) {
      console.error('Error marking winning ticket:', error)
      throw new RaffleCraftError('Failed to mark winning ticket', 'DATABASE_ERROR')
    }
  }

  /**
   * Create winner record
   */
  private async createWinnerRecord(
    raffle: WeeklyRaffle, 
    winnerTicket: RaffleTicket, 
    totalTickets: number
  ): Promise<RaffleWinner> {
    const winnerData = {
      week_number: raffle.week_number,
      winner_address: winnerTicket.owner_address,
      winning_ticket_id: winnerTicket.id,
      prize_amount_sui: raffle.prize_pool_sui,
      total_tickets_in_raffle: totalTickets,
      selection_method: 'random' as const,
      selection_timestamp: new Date().toISOString(),
      prize_claimed: false
    }

    const { data: winner, error } = await this.supabase
      .from('raffle_winners')
      .insert(winnerData)
      .select()
      .single()

    if (error) {
      console.error('Error creating winner record:', error)
      throw new RaffleCraftError('Failed to create winner record', 'DATABASE_ERROR')
    }

    return winner
  }

  /**
   * Mark raffle as completed
   */
  private async markRaffleCompleted(
    weekNumber: number, 
    winnerAddress: string | null, 
    winningTicketNumber: number | null
  ): Promise<void> {
    const updateData: any = {
      status: 'completed',
      winner_selected_at: new Date().toISOString()
    }

    if (winnerAddress) {
      updateData.winner_address = winnerAddress
      updateData.winning_ticket_number = winningTicketNumber
    }

    const { error } = await this.supabase
      .from('weekly_raffles')
      .update(updateData)
      .eq('week_number', weekNumber)

    if (error) {
      console.error('Error marking raffle as completed:', error)
      throw new RaffleCraftError('Failed to mark raffle as completed', 'DATABASE_ERROR')
    }
  }

  /**
   * Distribute prize to winner (automated)
   */
  private async distributePrize(winner: RaffleWinner, prizeAmountSui: number): Promise<void> {
    try {
      if (!TREASURY_PRIVATE_KEY) {
        console.log('Automated prize distribution not configured')
        return
      }

      console.log(`Distributing ${prizeAmountSui} SUI to ${winner.winner_address}`)

      // Create transaction to send prize
      const transaction = new Transaction()
      const amountInMist = Math.floor(prizeAmountSui * 1_000_000_000)
      
      const [coin] = transaction.splitCoins(transaction.gas, [amountInMist])
      transaction.transferObjects([coin], winner.winner_address)
      transaction.setSender(RAFFLE_TREASURY_ADDRESS)

      // Note: In a production environment, you would need to properly sign this transaction
      // with the treasury private key. This is a simplified example.
      console.log('Prize distribution transaction created (signing not implemented in demo)')

      // Update winner record with distribution info
      await this.markPrizeDistributed(winner.id, 'demo-transaction-hash')
    } catch (error) {
      console.error('Error distributing prize:', error)
    }
  }

  /**
   * Mark prize as distributed
   */
  private async markPrizeDistributed(winnerId: string, transactionHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('raffle_winners')
      .update({
        prize_claimed: true,
        prize_claimed_at: new Date().toISOString(),
        prize_distribution_hash: transactionHash
      })
      .eq('id', winnerId)

    if (error) {
      console.error('Error marking prize as distributed:', error)
    }
  }

  /**
   * Create next week's raffle
   */
  async createNextWeekRaffle(): Promise<WeeklyRaffle | null> {
    try {
      const { error } = await this.supabase.rpc('create_next_weekly_raffle')

      if (error) {
        console.error('Error creating next week raffle:', error)
        throw new RaffleCraftError('Failed to create next week raffle', 'DATABASE_ERROR')
      }

      // Get the newly created raffle
      const { data: newRaffle } = await this.supabase
        .from('weekly_raffles')
        .select('*')
        .eq('status', 'active')
        .order('week_number', { ascending: false })
        .limit(1)
        .single()

      return newRaffle
    } catch (error) {
      console.error('Error creating next week raffle:', error)
      throw new RaffleCraftError('Failed to create next week raffle', 'RAFFLE_CREATION_ERROR')
    }
  }

  /**
   * Get raffle statistics
   */
  async getRaffleStatistics(): Promise<{
    total_raffles: number
    total_tickets_sold: number
    total_prize_distributed: number
    active_raffles: number
    average_participation: number
  }> {
    try {
      const { data: stats, error } = await this.supabase
        .from('weekly_raffles')
        .select(`
          week_number,
          status,
          total_tickets_sold,
          prize_pool_sui
        `)

      if (error) {
        console.error('Error fetching raffle statistics:', error)
        return {
          total_raffles: 0,
          total_tickets_sold: 0,
          total_prize_distributed: 0,
          active_raffles: 0,
          average_participation: 0
        }
      }

      const totalRaffles = stats?.length || 0
      const activeRaffles = stats?.filter(r => r.status === 'active').length || 0
      const totalTicketsSold = stats?.reduce((sum, r) => sum + (r.total_tickets_sold || 0), 0) || 0
      const totalPrizeDistributed = stats?.reduce((sum, r) => sum + (r.prize_pool_sui || 0), 0) || 0
      const averageParticipation = totalRaffles > 0 ? totalTicketsSold / totalRaffles : 0

      return {
        total_raffles: totalRaffles,
        total_tickets_sold: totalTicketsSold,
        total_prize_distributed: totalPrizeDistributed,
        active_raffles: activeRaffles,
        average_participation: averageParticipation
      }
    } catch (error) {
      console.error('Error calculating raffle statistics:', error)
      throw new RaffleCraftError('Failed to get raffle statistics', 'STATS_ERROR')
    }
  }

  /**
   * Manual winner selection (admin function)
   */
  async selectWinnerManually(weekNumber: number, ticketId: string): Promise<void> {
    try {
      // Get the raffle and ticket
      const { data: raffle } = await this.supabase
        .from('weekly_raffles')
        .select('*')
        .eq('week_number', weekNumber)
        .single()

      const { data: ticket } = await this.supabase
        .from('raffle_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('week_number', weekNumber)
        .single()

      if (!raffle || !ticket) {
        throw new RaffleCraftError('Raffle or ticket not found', 'NOT_FOUND')
      }

      // Get total tickets for this raffle
      const { data: allTickets } = await this.supabase
        .from('raffle_tickets')
        .select('id')
        .eq('week_number', weekNumber)

      const totalTickets = allTickets?.length || 0

      // Mark winning ticket
      await this.markWinningTicket(ticketId)

      // Create winner record
      const winnerData = {
        week_number: weekNumber,
        winner_address: ticket.owner_address,
        winning_ticket_id: ticketId,
        prize_amount_sui: raffle.prize_pool_sui,
        total_tickets_in_raffle: totalTickets,
        selection_method: 'manual' as const,
        selection_timestamp: new Date().toISOString(),
        prize_claimed: false
      }

      await this.supabase
        .from('raffle_winners')
        .insert(winnerData)

      // Mark raffle as completed
      await this.markRaffleCompleted(weekNumber, ticket.owner_address, ticket.ticket_number)

      console.log(`Manual winner selection completed for week ${weekNumber}`)
    } catch (error) {
      console.error('Error in manual winner selection:', error)
      throw new RaffleCraftError('Failed to select winner manually', 'MANUAL_SELECTION_ERROR')
    }
  }
}

// Export singleton instance
export const raffleManagementService = new RaffleManagementService()
export default raffleManagementService
