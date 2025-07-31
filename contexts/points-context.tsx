"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { paionTokenService, type PaionTransaction } from "@/lib/paion-token-service"
import { toast } from "sonner"

interface TokenContextType {
  balance: number
  isLoading: boolean
  addTokens: (amount: number, description?: string, sourceType?: string, sourceId?: string) => Promise<boolean>
  spendTokens: (amount: number, itemName: string, sourceType?: string, sourceId?: string) => Promise<boolean>
  transactions: TokenTransaction[]
  refreshBalance: () => Promise<void>
  refreshTransactions: () => Promise<void>
}

interface TokenTransaction {
  id: string
  type: "earned" | "spent"
  amount: number
  description: string
  timestamp: Date
  source_type: string
  metadata?: Record<string, any>
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSuiAuth()
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])

  // Convert PaionTransaction to TokenTransaction format
  const convertTransaction = (paionTx: PaionTransaction): TokenTransaction => ({
    id: paionTx.id,
    type: paionTx.transaction_type === 'earned' ? 'earned' : 'spent',
    amount: paionTx.amount,
    description: paionTx.description,
    timestamp: new Date(paionTx.created_at),
    source_type: paionTx.source_type,
    metadata: paionTx.metadata
  })

  // Load balance and transactions from database
  const loadUserData = async () => {
    if (!user?.address) return

    console.log('🔄 Loading pAION data for address:', user.address)
    setIsLoading(true)
    try {
      // Load balance
      console.log('🔄 Fetching pAION balance...')
      const userBalance = await paionTokenService.getBalance(user.address)
      console.log('💰 pAION balance received:', userBalance)
      setBalance(userBalance)

      // Load recent transactions
      console.log('🔄 Fetching pAION transactions...')
      const recentTxs = await paionTokenService.getRecentTransactions(user.address)
      const convertedTxs = recentTxs.map(convertTransaction)
      console.log('📊 pAION transactions received:', convertedTxs.length)
      setTransactions(convertedTxs)
    } catch (error) {
      console.error('❌ Error loading user token data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh balance from database
  const refreshBalance = async () => {
    if (!user?.address) return

    try {
      console.log('🔄 Refreshing pAION balance for:', user.address)
      const userBalance = await paionTokenService.getBalance(user.address)
      console.log('💰 Refreshed pAION balance:', userBalance)
      setBalance(userBalance)
    } catch (error) {
      console.error('❌ Error refreshing balance:', error)
    }
  }

  // Refresh transactions from database
  const refreshTransactions = async () => {
    if (!user?.address) return

    try {
      const recentTxs = await paionTokenService.getRecentTransactions(user.address)
      const convertedTxs = recentTxs.map(convertTransaction)
      setTransactions(convertedTxs)
    } catch (error) {
      console.error('Error refreshing transactions:', error)
    }
  }

  // Add tokens to user's balance
  const addTokens = async (
    amount: number,
    description?: string,
    sourceType: string = 'manual',
    sourceId?: string
  ): Promise<boolean> => {
    if (!user?.address) {
      toast.error("Please connect your wallet first")
      return false
    }

    try {
      const result = await paionTokenService.addTokens(
        user.address,
        amount,
        description || "pAION tokens earned",
        sourceType as any,
        sourceId
      )

      if (result.success) {
        // Update local state
        setBalance(result.balance || balance + amount)
        await refreshTransactions()
        return true
      } else {
        toast.error(result.error || "Failed to add tokens")
        return false
      }
    } catch (error) {
      console.error('Error adding tokens:', error)
      toast.error("Failed to add tokens")
      return false
    }
  }

  // Spend tokens from user's balance
  const spendTokens = async (
    amount: number,
    itemName: string,
    sourceType: string = 'marketplace',
    sourceId?: string
  ): Promise<boolean> => {
    if (!user?.address) {
      toast.error("Please connect your wallet first")
      return false
    }

    try {
      const result = await paionTokenService.spendTokens(
        user.address,
        amount,
        `Redeemed: ${itemName}`,
        sourceType as any,
        sourceId
      )

      if (result.success) {
        // Update local state
        setBalance(result.balance || balance - amount)
        await refreshTransactions()
        return true
      } else {
        toast.error(result.error || "Failed to spend tokens")
        return false
      }
    } catch (error) {
      console.error('Error spending tokens:', error)
      toast.error("Failed to spend tokens")
      return false
    }
  }

  // Load user data when user changes
  useEffect(() => {
    if (user?.address) {
      loadUserData()
    } else {
      // Reset state when user disconnects
      setBalance(0)
      setTransactions([])
    }
  }, [user?.address])

  return (
    <TokenContext.Provider
      value={{
        balance,
        isLoading,
        addTokens,
        spendTokens,
        transactions,
        refreshBalance,
        refreshTransactions,
      }}
    >
      {children}
    </TokenContext.Provider>
  )
}

export function useTokens() {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error("useTokens must be used within a TokenProvider")
  }
  return context
}

// Backward compatibility - alias for useTokens
export function usePoints() {
  return useTokens()
}

// Backward compatibility - alias for TokenProvider
export const PointsProvider = TokenProvider
