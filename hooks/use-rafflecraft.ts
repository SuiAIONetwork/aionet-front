// React Hook for RaffleCraft Quiz System
// Manages all state and API interactions for the quiz-based raffle
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import {
  RaffleCraftState,
  CurrentWeekQuizResponse,
  UserEligibilityResponse,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
  TicketMintingRequest,
  RaffleTicket,
  UserQuizAttempt
} from '@/lib/types/rafflecraft-types'

export function useRaffleCraft() {
  const { user } = useSuiAuth()
  
  const [state, setState] = useState<RaffleCraftState>({
    currentWeek: null,
    userEligibility: null,
    userTickets: [],
    userQuizAttempt: null,
    quizCompleted: false,
    quizAnswer: '',
    quizStartTime: 0,
    isMintingTicket: false,
    mintingError: null,
    isLoadingQuiz: false,
    isLoadingEligibility: false,
    isSubmittingQuiz: false,
    showQuizResults: false,
    showTicketMinting: false
  })

  /**
   * Load current week's quiz
   */
  const loadCurrentQuiz = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingQuiz: true }))
    
    try {
      const response = await fetch('/api/rafflecraft/quiz/current')
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          currentWeek: result.data,
          isLoadingQuiz: false 
        }))
      } else {
        console.error('Failed to load current quiz:', result.error)
        setState(prev => ({ 
          ...prev, 
          currentWeek: null,
          isLoadingQuiz: false 
        }))
      }
    } catch (error) {
      console.error('Error loading current quiz:', error)
      setState(prev => ({ 
        ...prev, 
        currentWeek: null,
        isLoadingQuiz: false 
      }))
    }
  }, [])

  /**
   * Check user eligibility
   */
  const checkEligibility = useCallback(async () => {
    if (!user?.address) return
    
    setState(prev => ({ ...prev, isLoadingEligibility: true }))
    
    try {
      const response = await fetch(`/api/rafflecraft/eligibility?address=${user.address}`)
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          userEligibility: result.data,
          isLoadingEligibility: false 
        }))
      } else {
        console.error('Failed to check eligibility:', result.error)
        setState(prev => ({ 
          ...prev, 
          userEligibility: null,
          isLoadingEligibility: false 
        }))
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
      setState(prev => ({ 
        ...prev, 
        userEligibility: null,
        isLoadingEligibility: false 
      }))
    }
  }, [user?.address])

  /**
   * Load user data (tickets and quiz attempt)
   */
  const loadUserData = useCallback(async () => {
    if (!user?.address || !state.currentWeek) return
    
    try {
      const response = await fetch(
        `/api/rafflecraft/user/${user.address}?week=${state.currentWeek.week_number}`
      )
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          userTickets: result.data.tickets || [],
          userQuizAttempt: result.data.quiz_attempt,
          quizCompleted: !!result.data.quiz_attempt
        }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [user?.address, state.currentWeek])

  /**
   * Start quiz
   */
  const startQuiz = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      quizStartTime: Date.now(),
      quizAnswer: '',
      showQuizResults: false 
    }))
  }, [])

  /**
   * Submit quiz answer
   */
  const submitQuiz = useCallback(async (answer: string): Promise<QuizSubmissionResponse | null> => {
    if (!user?.address || !state.currentWeek) return null
    
    setState(prev => ({ ...prev, isSubmittingQuiz: true }))
    
    try {
      const timeTaken = state.quizStartTime > 0 
        ? Math.floor((Date.now() - state.quizStartTime) / 1000) 
        : undefined

      const submission: QuizSubmissionRequest = {
        user_address: user.address,
        week_number: state.currentWeek.week_number,
        quiz_question_id: state.currentWeek.question_id,
        user_answer: answer,
        time_taken_seconds: timeTaken
      }

      const response = await fetch('/api/rafflecraft/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      const result = await response.json()
      
      if (result.success) {
        // Create a mock user quiz attempt object to update the state immediately
        const mockQuizAttempt: UserQuizAttempt = {
          id: 'temp-id',
          user_address: user.address,
          week_number: state.currentWeek.week_number,
          quiz_question_id: state.currentWeek.question_id,
          user_answer: answer,
          is_correct: result.data.is_correct,
          attempt_number: 1,
          points_earned: result.data.points_earned,
          can_mint_ticket: result.data.can_mint_ticket,
          attempted_at: new Date().toISOString()
        }

        setState(prev => ({
          ...prev,
          quizCompleted: true,
          quizAnswer: answer,
          showQuizResults: true,
          isSubmittingQuiz: false,
          showTicketMinting: result.data.can_mint_ticket,
          userQuizAttempt: mockQuizAttempt
        }))

        // Refresh eligibility and user data after quiz submission
        await Promise.all([
          checkEligibility(),
          loadUserData()
        ])

        return result.data
      } else {
        setState(prev => ({ ...prev, isSubmittingQuiz: false }))
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      setState(prev => ({ ...prev, isSubmittingQuiz: false }))
      throw error
    }
  }, [user?.address, state.currentWeek, state.quizStartTime, checkEligibility])

  /**
   * Mint raffle ticket
   */
  const mintTicket = useCallback(async (
    transactionHash: string, 
    amountPaid: number,
    gasFee?: number
  ): Promise<boolean> => {
    if (!user?.address || !state.currentWeek) return false
    
    setState(prev => ({ 
      ...prev, 
      isMintingTicket: true, 
      mintingError: null 
    }))
    
    try {
      const request: TicketMintingRequest = {
        user_address: user.address,
        week_number: state.currentWeek.week_number,
        transaction_hash: transactionHash,
        amount_paid_sui: amountPaid,
        gas_fee_sui: gasFee
      }

      const response = await fetch('/api/rafflecraft/tickets/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          isMintingTicket: false,
          showTicketMinting: false
        }))
        
        // Refresh user data to show new ticket
        await loadUserData()
        await checkEligibility()
        
        return true
      } else {
        setState(prev => ({ 
          ...prev, 
          isMintingTicket: false,
          mintingError: result.error 
        }))
        return false
      }
    } catch (error) {
      console.error('Error minting ticket:', error)
      setState(prev => ({ 
        ...prev, 
        isMintingTicket: false,
        mintingError: error instanceof Error ? error.message : 'Unknown error'
      }))
      return false
    }
  }, [user?.address, state.currentWeek, loadUserData, checkEligibility])

  /**
   * Reset quiz state
   */
  const resetQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      quizAnswer: '',
      quizStartTime: 0,
      showQuizResults: false,
      showTicketMinting: false
    }))
  }, [])

  /**
   * Show ticket minting interface
   */
  const showTicketMintingInterface = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTicketMinting: true,
      showQuizResults: false
    }))
  }, [])

  /**
   * Initialize data on mount and user change
   */
  useEffect(() => {
    loadCurrentQuiz()
  }, [loadCurrentQuiz])

  useEffect(() => {
    if (user?.address) {
      checkEligibility()
    }
  }, [user?.address, checkEligibility])

  useEffect(() => {
    if (user?.address && state.currentWeek) {
      loadUserData()
    }
  }, [user?.address, state.currentWeek, loadUserData])

  return {
    // State
    ...state,
    
    // Actions
    loadCurrentQuiz,
    checkEligibility,
    loadUserData,
    startQuiz,
    submitQuiz,
    mintTicket,
    resetQuiz,
    showTicketMintingInterface,
    
    // Computed values
    canTakeQuiz: !state.quizCompleted && state.currentWeek && !state.userQuizAttempt,
    canMintTicket: state.userEligibility?.can_mint || false,
    hasTicketThisWeek: state.userTickets.some(
      ticket => ticket.week_number === state.currentWeek?.week_number
    ),
    timeRemaining: state.currentWeek 
      ? Math.max(0, new Date(state.currentWeek.raffle_end_date).getTime() - Date.now())
      : 0
  }
}
