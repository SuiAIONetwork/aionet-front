/**
 * zkLogin Wallet Hook
 * Provides easy access to zkLogin wallet functionality
 */
"use client"

import { useState, useEffect, useMemo } from 'react'
import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { useZkLogin } from '@/components/zklogin-provider'
import { ZkLoginWalletAdapter, createZkLoginWalletAdapter } from '@/lib/zklogin-wallet-adapter'
import { executeZkLoginTransaction, type ZkLoginTransactionResult } from '@/lib/zklogin-transaction-service'
import { toast } from 'sonner'

export interface UseZkLoginWalletReturn {
  // Wallet instance
  wallet: ZkLoginWalletAdapter | null
  
  // State
  isConnected: boolean
  isLoading: boolean
  error: string | null
  
  // Account info
  address: string | null
  balance: string | null
  
  // Transaction methods
  signAndExecuteTransaction: (transaction: Transaction, options?: {
    showToast?: boolean
    onSuccess?: (result: ZkLoginTransactionResult) => void
    onError?: (error: Error) => void
  }) => Promise<ZkLoginTransactionResult>
  
  signTransaction: (transaction: Transaction) => Promise<string>
  
  // Convenience methods
  transferSui: (recipientAddress: string, amount: string) => Promise<ZkLoginTransactionResult>
  transferObjects: (objectIds: string[], recipientAddress: string) => Promise<ZkLoginTransactionResult>
  
  // Utility methods
  getBalance: (coinType?: string) => Promise<string>
  getOwnedObjects: (options?: any) => Promise<any>
  getTransactionHistory: (options?: any) => Promise<any>
  estimateGas: (transaction: Transaction) => Promise<string>
  
  // Session info
  sessionInfo: {
    address: string | null
    maxEpoch: number | null
    currentEpoch: number | null
    isValid: boolean
    expiresIn: number | null
  }
  
  // Refresh methods
  refreshBalance: () => Promise<void>
  refreshSession: () => void
}

/**
 * Hook to use zkLogin wallet functionality
 */
export function useZkLoginWallet(): UseZkLoginWalletReturn {
  const zkLogin = useZkLogin()
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create SuiClient instance
  const suiClient = useMemo(() => {
    return new SuiClient({
      url: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.devnet.sui.io'
    })
  }, [])

  // Create wallet adapter
  const wallet = useMemo(() => {
    if (!zkLogin.canSignTransactions()) {
      return null
    }

    return createZkLoginWalletAdapter({
      jwt: zkLogin.jwt!,
      ephemeralKeyPair: zkLogin.ephemeralKeyPair!,
      userSalt: zkLogin.userSalt!,
      maxEpoch: zkLogin.maxEpoch!,
      randomness: zkLogin.randomness!,
      zkLoginUserAddress: zkLogin.zkLoginUserAddress!,
    }, suiClient)
  }, [
    zkLogin.jwt,
    zkLogin.ephemeralKeyPair,
    zkLogin.userSalt,
    zkLogin.maxEpoch,
    zkLogin.randomness,
    zkLogin.zkLoginUserAddress,
    suiClient
  ])

  // Connection state
  const isConnected = !!wallet && zkLogin.canSignTransactions()
  const address = zkLogin.zkLoginUserAddress

  // Session info
  const sessionInfo = useMemo(() => ({
    address: zkLogin.zkLoginUserAddress,
    maxEpoch: zkLogin.maxEpoch,
    currentEpoch: zkLogin.currentEpoch,
    isValid: zkLogin.isSessionValid(),
    expiresIn: zkLogin.maxEpoch && zkLogin.currentEpoch 
      ? zkLogin.maxEpoch - zkLogin.currentEpoch 
      : null,
  }), [zkLogin.zkLoginUserAddress, zkLogin.maxEpoch, zkLogin.currentEpoch, zkLogin.isSessionValid])

  // Refresh balance when wallet changes
  useEffect(() => {
    if (wallet && isConnected) {
      refreshBalance()
    } else {
      setBalance(null)
    }
  }, [wallet, isConnected])

  // Transaction methods
  const signAndExecuteTransaction = async (
    transaction: Transaction,
    options?: {
      showToast?: boolean
      onSuccess?: (result: ZkLoginTransactionResult) => void
      onError?: (error: Error) => void
    }
  ): Promise<ZkLoginTransactionResult> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }

    return await executeZkLoginTransaction(
      transaction,
      {
        jwt: zkLogin.jwt!,
        ephemeralKeyPair: zkLogin.ephemeralKeyPair!,
        userSalt: zkLogin.userSalt!,
        maxEpoch: zkLogin.maxEpoch!,
        randomness: zkLogin.randomness!,
      },
      suiClient,
      options
    )
  }

  const signTransaction = async (transaction: Transaction): Promise<string> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.signTransaction(transaction)
  }

  // Convenience methods
  const transferSui = async (
    recipientAddress: string,
    amount: string
  ): Promise<ZkLoginTransactionResult> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.transferSui(recipientAddress, amount)
  }

  const transferObjects = async (
    objectIds: string[],
    recipientAddress: string
  ): Promise<ZkLoginTransactionResult> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.transferObjects(objectIds, recipientAddress)
  }

  // Utility methods
  const getBalance = async (coinType?: string): Promise<string> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.getBalance(coinType)
  }

  const getOwnedObjects = async (options?: any) => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.getOwnedObjects(options)
  }

  const getTransactionHistory = async (options?: any) => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.getTransactionHistory(options)
  }

  const estimateGas = async (transaction: Transaction): Promise<string> => {
    if (!wallet) {
      throw new Error('zkLogin wallet not available')
    }
    return await wallet.estimateGas(transaction)
  }

  // Refresh methods
  const refreshBalance = async (): Promise<void> => {
    if (!wallet) return

    try {
      setIsLoading(true)
      setError(null)
      const newBalance = await wallet.getBalance()
      setBalance(newBalance)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh balance'
      setError(errorMessage)
      console.error('Failed to refresh balance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = (): void => {
    // This would trigger a re-evaluation of the zkLogin session
    // The actual refresh logic is handled by the zkLogin provider
    zkLogin.reset()
  }

  return {
    wallet,
    isConnected,
    isLoading: isLoading || zkLogin.isLoading,
    error: error || zkLogin.error,
    address,
    balance,
    signAndExecuteTransaction,
    signTransaction,
    transferSui,
    transferObjects,
    getBalance,
    getOwnedObjects,
    getTransactionHistory,
    estimateGas,
    sessionInfo,
    refreshBalance,
    refreshSession,
  }
}

/**
 * Hook for zkLogin transaction utilities
 */
export function useZkLoginTransactions() {
  const { wallet, isConnected } = useZkLoginWallet()

  const createTransferTransaction = (
    recipientAddress: string,
    amount: string,
    coinType: string = '0x2::sui::SUI'
  ): Transaction => {
    const tx = new Transaction()
    const [coin] = tx.splitCoins(tx.gas, [amount])
    tx.transferObjects([coin], recipientAddress)
    return tx
  }

  const createObjectTransferTransaction = (
    objectIds: string[],
    recipientAddress: string
  ): Transaction => {
    const tx = new Transaction()
    tx.transferObjects(objectIds, recipientAddress)
    return tx
  }

  return {
    wallet,
    isConnected,
    createTransferTransaction,
    createObjectTransferTransaction,
  }
}
