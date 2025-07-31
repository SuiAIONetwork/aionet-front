"use client"

import { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { affiliateSubscriptionService } from '@/lib/affiliate-subscription-service'
import { toast } from 'sonner'

interface RaffleCraftTicketEvent {
  ticketId: string
  transactionHash: string
  raffleId: string
  userAddress: string
  timestamp: string
}

interface UseRaffleCraftIntegrationReturn {
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  processTicketPurchase: (event: RaffleCraftTicketEvent) => Promise<boolean>
  recentBonuses: RaffleCraftTicketEvent[]
}

/**
 * Hook for integrating with RaffleCraft ticket purchases
 * Automatically detects ticket purchases and applies affiliate subscription bonuses
 */
export function useRaffleCraftIntegration(): UseRaffleCraftIntegrationReturn {
  const [isListening, setIsListening] = useState(false)
  const [recentBonuses, setRecentBonuses] = useState<RaffleCraftTicketEvent[]>([])
  const account = useCurrentAccount()

  /**
   * Process a ticket purchase event and apply bonus
   */
  const processTicketPurchase = async (event: RaffleCraftTicketEvent): Promise<boolean> => {
    try {
      console.log('🎟️ Processing RaffleCraft ticket purchase:', event)

      if (!account?.address) {
        console.error('No wallet connected')
        return false
      }

      // Verify the event is for the current user
      if (event.userAddress.toLowerCase() !== account.address.toLowerCase()) {
        console.log('Ticket purchase is not for current user, skipping bonus')
        return false
      }

      // Apply the bonus through the service
      const bonusApplied = await affiliateSubscriptionService.processRaffleCraftBonus(
        event.userAddress,
        event.ticketId,
        event.transactionHash,
        event.raffleId,
        7 // 7 days bonus
      )

      if (bonusApplied) {
        // Add to recent bonuses
        setRecentBonuses(prev => [event, ...prev.slice(0, 4)]) // Keep last 5
        
        // Show success notification
        toast.success('🎟️ RaffleCraft Bonus Applied!', {
          description: '+7 days added to your affiliate subscription'
        })
        
        return true
      } else {
        console.log('Bonus not applied - may already exist for this ticket')
        return false
      }

    } catch (error) {
      console.error('Error processing RaffleCraft ticket purchase:', error)
      toast.error('Failed to apply RaffleCraft bonus', {
        description: 'Please contact support if this persists'
      })
      return false
    }
  }

  /**
   * Start listening for RaffleCraft events
   * In a real implementation, this would connect to RaffleCraft's event system
   */
  const startListening = () => {
    if (!account?.address) {
      console.error('Cannot start listening without wallet connection')
      return
    }

    console.log('🎧 Starting RaffleCraft event listener for:', account.address)
    setIsListening(true)

    // In production, this would:
    // 1. Connect to RaffleCraft's WebSocket or event stream
    // 2. Filter events for the current user
    // 3. Process ticket purchase/mint events automatically
    
    // For demo purposes, we'll simulate this with a mock listener
    simulateRaffleCraftListener()
  }

  /**
   * Stop listening for RaffleCraft events
   */
  const stopListening = () => {
    console.log('🔇 Stopping RaffleCraft event listener')
    setIsListening(false)
  }

  /**
   * Simulate RaffleCraft event listener (for demo purposes)
   * In production, replace with actual RaffleCraft integration
   */
  const simulateRaffleCraftListener = () => {
    // This is just for demonstration
    // In production, you would integrate with RaffleCraft's actual event system
    
    console.log('🎮 RaffleCraft listener simulation started')
    
    // Example: Listen for custom events from RaffleCraft DApp
    const handleRaffleCraftEvent = (event: CustomEvent) => {
      if (event.detail?.type === 'ticket_purchased' || event.detail?.type === 'ticket_minted') {
        processTicketPurchase({
          ticketId: event.detail.ticketId,
          transactionHash: event.detail.transactionHash,
          raffleId: event.detail.raffleId,
          userAddress: event.detail.userAddress,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Listen for custom RaffleCraft events
    window.addEventListener('rafflecraft-ticket-event', handleRaffleCraftEvent as EventListener)

    // Cleanup function would remove the listener
    return () => {
      window.removeEventListener('rafflecraft-ticket-event', handleRaffleCraftEvent as EventListener)
    }
  }

  /**
   * Manual trigger for testing RaffleCraft integration
   * This function can be called from the UI for testing purposes
   */
  const triggerTestBonus = async () => {
    if (!account?.address) return

    const testEvent: RaffleCraftTicketEvent = {
      ticketId: `test-ticket-${Date.now()}`,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      raffleId: 'test-raffle-1',
      userAddress: account.address,
      timestamp: new Date().toISOString()
    }

    return await processTicketPurchase(testEvent)
  }

  // Auto-start listening when wallet connects
  useEffect(() => {
    if (account?.address && !isListening) {
      // Auto-start listening when user connects wallet
      // startListening()
    }

    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [account?.address])

  // Expose test function in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore - Adding to window for testing
      window.triggerRaffleCraftBonus = triggerTestBonus
      console.log('🧪 Test function available: window.triggerRaffleCraftBonus()')
    }
  }, [account?.address])

  return {
    isListening,
    startListening,
    stopListening,
    processTicketPurchase,
    recentBonuses
  }
}

/**
 * Utility function to manually trigger RaffleCraft bonus (for testing)
 * Call this from browser console: triggerRaffleCraftTestBonus()
 */
export const triggerRaffleCraftTestBonus = async (userAddress: string) => {
  try {
    const response = await fetch('/api/rafflecraft/bonus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'ticket_purchased',
        user_address: userAddress,
        ticket_id: `test-ticket-${Date.now()}`,
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        raffle_id: 'test-raffle-demo',
        ticket_price: 1.0,
        timestamp: new Date().toISOString()
      })
    })

    const result = await response.json()
    
    if (result.success) {
      toast.success('🎟️ Test RaffleCraft bonus applied!', {
        description: '+7 days added to affiliate subscription'
      })
      return true
    } else {
      toast.error('Test bonus failed', {
        description: result.message
      })
      return false
    }
  } catch (error) {
    console.error('Test bonus error:', error)
    toast.error('Test bonus failed', {
      description: 'Check console for details'
    })
    return false
  }
}

// Make test function globally available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.triggerRaffleCraftTestBonus = triggerRaffleCraftTestBonus
}
