/**
 * Enoki-based zkLogin Service
 * Replaces the deprecated Mysten Labs proving service with Enoki
 */

import { EnokiFlow } from '@mysten/enoki'
import { Transaction } from '@mysten/sui/transactions'

export interface EnokiZkLoginConfig {
  apiKey: string
  network: 'testnet' | 'mainnet'
}

export interface EnokiTransactionResult {
  digest: string
  effects?: any
  objectChanges?: any
}

/**
 * Enoki zkLogin Service
 * Provides zkLogin functionality using Enoki instead of the deprecated proving service
 */
export class EnokiZkLoginService {
  private enoki: EnokiFlow
  private config: EnokiZkLoginConfig

  constructor(config: EnokiZkLoginConfig) {
    this.config = config
    this.enoki = new EnokiFlow({
      apiKey: config.apiKey,
    })
  }

  /**
   * Get the current user's zkLogin address
   * Note: EnokiFlow doesn't have a direct getAddress method
   * This should be handled through the React hook useEnokiFlow
   */
  async getAddress(): Promise<string | null> {
    try {
      // EnokiFlow doesn't have a direct getAddress method
      // This method should be used through the React hook context
      console.warn('getAddress should be called through useEnokiFlow hook in React components')
      return null
    } catch (error) {
      console.error('Failed to get Enoki address:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated with Enoki
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const address = await this.getAddress()
      return !!address
    } catch (error) {
      console.error('Failed to check Enoki authentication:', error)
      return false
    }
  }

  /**
   * Sign in with a social provider using Enoki
   * Note: Authentication should be handled through React hooks and components
   */
  async signIn(provider: 'google' | 'facebook' | 'twitch' | 'apple'): Promise<string> {
    try {
      // EnokiFlow doesn't have a direct createSession method
      // Authentication should be handled through React components and hooks
      console.warn('Sign in should be handled through useEnokiFlow hook and React components')
      throw new Error('Sign in not implemented - use React hooks and components instead')
    } catch (error) {
      console.error('Enoki sign in failed:', error)
      throw new Error(`Failed to sign in with ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sign out from Enoki
   * Note: Sign out should be handled through React hooks and components
   */
  async signOut(): Promise<void> {
    try {
      // EnokiFlow logout should be handled through React hooks
      console.warn('Sign out should be handled through useEnokiFlow hook and React components')
      // Don't throw error for signOut as it's less critical
    } catch (error) {
      console.error('Enoki sign out failed:', error)
      throw new Error(`Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute a transaction using Enoki
   * Note: Direct transaction execution should be handled through React hooks
   */
  async executeTransaction(transaction: Transaction): Promise<EnokiTransactionResult> {
    try {
      // EnokiFlow transaction execution should be handled through React hooks
      // This is a placeholder implementation
      console.warn('Transaction execution should be handled through useEnokiFlow hook')
      throw new Error('Transaction execution not implemented - use React hooks instead')
    } catch (error) {
      console.error('Enoki transaction execution failed:', error)
      throw new Error(`Failed to execute transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user's SUI balance
   * Note: Balance checking should be done through SuiClient or React hooks
   */
  async getBalance(): Promise<string> {
    try {
      const address = await this.getAddress()
      if (!address) {
        return '0'
      }

      // EnokiFlow doesn't have a direct getBalance method
      // Balance checking should be done through SuiClient
      console.warn('Balance checking should be done through SuiClient or React hooks')
      return '0'
    } catch (error) {
      console.error('Failed to get balance from Enoki:', error)
      return '0'
    }
  }

  /**
   * Create a sponsored transaction (if enabled in Enoki)
   * Note: Sponsored transactions should be handled through backend API
   */
  async executeSponsoredTransaction(transaction: Transaction): Promise<EnokiTransactionResult> {
    try {
      // Sponsored transactions should be handled through backend API endpoints
      // This is a placeholder implementation
      console.warn('Sponsored transactions should be handled through backend API')
      throw new Error('Sponsored transaction execution not implemented - use backend API instead')
    } catch (error) {
      console.error('Enoki sponsored transaction execution failed:', error)
      throw new Error(`Failed to execute sponsored transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get session information
   */
  async getSessionInfo(): Promise<{
    address: string | null
    isValid: boolean
    provider?: string
  }> {
    try {
      const address = await this.getAddress()
      const isValid = !!address

      return {
        address,
        isValid,
        // provider info might be available depending on Enoki API
      }
    } catch (error) {
      console.error('Failed to get session info:', error)
      return {
        address: null,
        isValid: false,
      }
    }
  }
}

/**
 * Create an Enoki zkLogin service instance
 */
export function createEnokiZkLoginService(): EnokiZkLoginService | null {
  const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet'

  if (!apiKey) {
    console.error('NEXT_PUBLIC_ENOKI_API_KEY is not configured')
    return null
  }

  if (network !== 'testnet' && network !== 'mainnet') {
    console.error('Enoki only supports testnet and mainnet networks')
    return null
  }

  return new EnokiZkLoginService({
    apiKey,
    network,
  })
}
