// TypeScript types and interfaces for RaffleCraft Quiz System

export interface WeeklyRaffle {
  id: string
  week_number: number
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'cancelled'
  
  // Prize pool management
  prize_pool_sui: number
  ticket_price_sui: number
  total_tickets_sold: number
  
  // Winner information
  winner_address?: string
  winning_ticket_number?: number
  winning_transaction_hash?: string
  winner_selected_at?: string
  prize_distributed_at?: string
  
  // Quiz configuration
  quiz_question_id?: string
  max_attempts_per_user: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  week_number: number
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'text_input'
  
  // Multiple choice options
  options: string[]
  correct_answer: string
  explanation?: string
  
  // Question metadata
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'blockchain' | 'defi' | 'sui' | 'security' | 'general'
  points_reward: number
  
  // Status
  is_active: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface UserQuizAttempt {
  id: string
  user_address: string
  week_number: number
  quiz_question_id: string
  
  // Attempt details
  user_answer: string
  is_correct: boolean
  attempt_number: number
  time_taken_seconds?: number
  
  // Results
  points_earned: number
  can_mint_ticket: boolean
  
  // Timestamp
  attempted_at: string
}

export interface RaffleTicket {
  id: string
  week_number: number
  ticket_number: number
  
  // Owner information
  owner_address: string
  
  // Blockchain transaction data
  transaction_hash: string
  block_number?: number
  transaction_timestamp: string
  
  // Payment details
  amount_paid_sui: number
  gas_fee_sui?: number
  
  // Ticket metadata
  minted_at: string
  is_winning_ticket: boolean
}

export interface RaffleWinner {
  id: string
  week_number: number
  winner_address: string
  winning_ticket_id: string
  
  // Prize details
  prize_amount_sui: number
  prize_distribution_hash?: string
  
  // Selection details
  total_tickets_in_raffle: number
  selection_method: 'random' | 'manual'
  selection_timestamp: string
  
  // Distribution status
  prize_claimed: boolean
  prize_claimed_at?: string
  
  // Metadata
  created_at: string
}

// API Response Types
export interface CurrentWeekQuizResponse {
  week_number: number
  question_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'text_input'
  options: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  points_reward: number
  raffle_end_date: string
  ticket_price_sui: number
  total_tickets_sold: number
  prize_pool_sui: number
}

export interface UserEligibilityResponse {
  can_mint: boolean
  week_number: number
  reason: string
  quiz_completed: boolean
  answer_correct: boolean
}

export interface TicketMintingRequest {
  user_address: string
  week_number: number
  transaction_hash: string
  amount_paid_sui: number
  gas_fee_sui?: number
  block_number?: number
}

export interface TicketMintingResponse {
  success: boolean
  ticket_id?: string
  ticket_number?: number
  transaction_hash?: string
  error?: string
}

export interface QuizSubmissionRequest {
  user_address: string
  week_number: number
  quiz_question_id: string
  user_answer: string
  time_taken_seconds?: number
}

export interface QuizSubmissionResponse {
  success: boolean
  is_correct: boolean
  points_earned: number
  can_mint_ticket: boolean
  correct_answer?: string
  explanation?: string
  error?: string
}

// Frontend State Types
export interface RaffleCraftState {
  // Current week data
  currentWeek: CurrentWeekQuizResponse | null
  
  // User state
  userEligibility: UserEligibilityResponse | null
  userTickets: RaffleTicket[]
  userQuizAttempt: UserQuizAttempt | null
  
  // Quiz state
  quizCompleted: boolean
  quizAnswer: string
  quizStartTime: number
  
  // Ticket minting state
  isMintingTicket: boolean
  mintingError: string | null
  
  // Loading states
  isLoadingQuiz: boolean
  isLoadingEligibility: boolean
  isSubmittingQuiz: boolean
  
  // UI state
  showQuizResults: boolean
  showTicketMinting: boolean
}

// Blockchain Integration Types
export interface SuiTransactionResult {
  digest: string
  effects?: {
    status: { status: string }
    gasUsed: {
      computationCost: string
      storageCost: string
      storageRebate: string
    }
  }
  events?: any[]
  objectChanges?: any[]
  balanceChanges?: any[]
}

export interface TicketMintTransaction {
  transaction_hash: string
  sender_address: string
  amount_sui: number
  gas_fee_sui: number
  block_number?: number
  timestamp: string
  status: 'pending' | 'confirmed' | 'failed'
}

// Admin Types
export interface AdminRaffleStats {
  total_weeks: number
  active_raffles: number
  total_tickets_sold: number
  total_prize_distributed: number
  total_participants: number
  average_participation_rate: number
}

export interface AdminWeeklyStats {
  week_number: number
  quiz_attempts: number
  correct_answers: number
  tickets_sold: number
  prize_pool: number
  winner_address?: string
  completion_rate: number
}

// Utility Types
export type RaffleStatus = 'active' | 'completed' | 'cancelled'
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuizCategory = 'blockchain' | 'defi' | 'sui' | 'security' | 'general'
export type QuestionType = 'multiple_choice' | 'true_false' | 'text_input'

// Constants
export const RAFFLE_CONFIG = {
  WEEK_DURATION_DAYS: 7,
  DEFAULT_TICKET_PRICE_SUI: 1.0,
  MAX_ATTEMPTS_PER_USER: 1,
  MIN_TICKETS_FOR_RAFFLE: 1,
  QUIZ_TIME_LIMIT_SECONDS: 300, // 5 minutes
  POINTS_REWARDS: {
    easy: 10,
    medium: 15,
    hard: 20
  }
} as const

// Error Types
export class RaffleCraftError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'RaffleCraftError'
  }
}

export class QuizError extends RaffleCraftError {
  constructor(message: string, details?: any) {
    super(message, 'QUIZ_ERROR', details)
  }
}

export class TicketMintingError extends RaffleCraftError {
  constructor(message: string, details?: any) {
    super(message, 'TICKET_MINTING_ERROR', details)
  }
}

export class BlockchainError extends RaffleCraftError {
  constructor(message: string, details?: any) {
    super(message, 'BLOCKCHAIN_ERROR', details)
  }
}
