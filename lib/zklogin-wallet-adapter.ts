/**
 * zkLogin Wallet Adapter
 * Provides a wallet-like interface for zkLogin that integrates with existing wallet infrastructure
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { zkTransactionService, type ZkLoginTransactionResult } from './zklogin-transaction-service'

export interface ZkLoginWalletConfig {
  jwt: string
  ephemeralKeyPair: Ed25519Keypair
  userSalt: string
  maxEpoch: number
  randomness: string
  address: string
  suiClient: SuiClient
}

/**
 * zkLogin Wallet Adapter
 * Provides wallet-like functionality for zkLogin authentication
 */
export class ZkLoginWalletAdapter {
  private config: ZkLoginWalletConfig

  constructor(config: ZkLoginWalletConfig) {
    this.config = config
  }

  /**
   * Get the wallet address
   */
  getAddress(): string {
    return this.config.address
  }

  /**
   * Get the public key (ephemeral)
   */
  getPublicKey(): Uint8Array {
    return this.config.ephemeralKeyPair.getPublicKey().toRawBytes()
  }

  /**
   * Check if the wallet can sign transactions
   */
  canSign(): boolean {
    const validation = zkTransactionService.validateZkLoginSession(
      this.config.jwt,
      this.config.maxEpoch,
      this.getCurrentEpoch()
    )
    return validation.isValid
  }

  /**
   * Sign and execute a transaction
   */
  async signAndExecuteTransaction(
    transaction: Transaction,
    options?: {
      showEffects?: boolean
      showObjectChanges?: boolean
    }
  ): Promise<ZkLoginTransactionResult> {
    if (!this.canSign()) {
      throw new Error('zkLogin session is expired or invalid')
    }

    return await zkTransactionService.signAndExecuteTransaction({
      transaction,
      jwt: this.config.jwt,
      ephemeralKeyPair: this.config.ephemeralKeyPair,
      userSalt: this.config.userSalt,
      maxEpoch: this.config.maxEpoch,
      randomness: this.config.randomness,
      suiClient: this.config.suiClient,
    })
  }

  /**
   * Sign a transaction without executing it
   */
  async signTransaction(transaction: Transaction): Promise<string> {
    if (!this.canSign()) {
      throw new Error('zkLogin session is expired or invalid')
    }

    return await zkTransactionService.signTransaction({
      transaction,
      jwt: this.config.jwt,
      ephemeralKeyPair: this.config.ephemeralKeyPair,
      userSalt: this.config.userSalt,
      maxEpoch: this.config.maxEpoch,
      randomness: this.config.randomness,
    })
  }

  /**
   * Get account balance
   */
  async getBalance(coinType: string = '0x2::sui::SUI'): Promise<string> {
    try {
      const balance = await this.config.suiClient.getBalance({
        owner: this.config.address,
        coinType,
      })
      return balance.totalBalance
    } catch (error) {
      console.error('Failed to get balance:', error)
      return '0'
    }
  }

  /**
   * Get owned objects
   */
  async getOwnedObjects(options?: {
    filter?: any
    limit?: number
    cursor?: string
  }) {
    try {
      return await this.config.suiClient.getOwnedObjects({
        owner: this.config.address,
        options: {
          showType: true,
          showContent: true,
          showDisplay: true,
          ...options,
        },
      })
    } catch (error) {
      console.error('Failed to get owned objects:', error)
      return { data: [], hasNextPage: false }
    }
  }

  /**
   * Transfer SUI to another address
   */
  async transferSui(
    recipientAddress: string,
    amount: string
  ): Promise<ZkLoginTransactionResult> {
    const tx = new Transaction()
    const [coin] = tx.splitCoins(tx.gas, [amount])
    tx.transferObjects([coin], recipientAddress)
    
    return await this.signAndExecuteTransaction(tx)
  }

  /**
   * Transfer objects to another address
   */
  async transferObjects(
    objectIds: string[],
    recipientAddress: string
  ): Promise<ZkLoginTransactionResult> {
    const tx = new Transaction()
    tx.transferObjects(objectIds, recipientAddress)
    
    return await this.signAndExecuteTransaction(tx)
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(options?: {
    limit?: number
    cursor?: string
  }) {
    try {
      return await this.config.suiClient.queryTransactionBlocks({
        filter: {
          FromAddress: this.config.address,
        },
        options: {
          showEffects: true,
          showInput: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: options?.limit || 20,
        cursor: options?.cursor,
        order: 'descending',
      })
    } catch (error) {
      console.error('Failed to get transaction history:', error)
      return { data: [], hasNextPage: false }
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: Transaction): Promise<string> {
    return await zkTransactionService.estimateGas(
      transaction,
      this.config.address,
      this.config.suiClient
    )
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      address: this.config.address,
      maxEpoch: this.config.maxEpoch,
      currentEpoch: this.getCurrentEpoch(),
      isValid: this.canSign(),
      expiresIn: this.config.maxEpoch - this.getCurrentEpoch(),
    }
  }

  /**
   * Update configuration (for session refresh)
   */
  updateConfig(newConfig: Partial<ZkLoginWalletConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current epoch (placeholder - should be fetched from network)
   */
  private getCurrentEpoch(): number {
    // This should be fetched from the Sui network
    // For now, return a placeholder value
    return 100 // You should implement proper epoch fetching
  }

  /**
   * Create a wallet adapter from zkLogin session data
   */
  static fromZkLoginSession(
    sessionData: {
      jwt: string
      ephemeralKey: string
      userSalt: string
      maxEpoch: number
      randomness: string
      address: string
    },
    suiClient: SuiClient
  ): ZkLoginWalletAdapter {
    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(sessionData.ephemeralKey)

    return new ZkLoginWalletAdapter({
      jwt: sessionData.jwt,
      ephemeralKeyPair,
      userSalt: sessionData.userSalt,
      maxEpoch: sessionData.maxEpoch,
      randomness: sessionData.randomness,
      address: sessionData.address,
      suiClient,
    })
  }

  /**
   * Check if two wallet adapters are the same
   */
  equals(other: ZkLoginWalletAdapter): boolean {
    return this.config.address === other.config.address
  }

  /**
   * Get a summary of the wallet
   */
  getSummary() {
    return {
      address: this.config.address,
      type: 'zkLogin',
      canSign: this.canSign(),
      sessionInfo: this.getSessionInfo(),
    }
  }
}

/**
 * Helper function to create a zkLogin wallet adapter from context
 */
export function createZkLoginWalletAdapter(
  zkLoginData: {
    jwt: string
    ephemeralKeyPair: Ed25519Keypair
    userSalt: string
    maxEpoch: number
    randomness: string
    zkLoginUserAddress: string
  },
  suiClient: SuiClient
): ZkLoginWalletAdapter {
  return new ZkLoginWalletAdapter({
    jwt: zkLoginData.jwt,
    ephemeralKeyPair: zkLoginData.ephemeralKeyPair,
    userSalt: zkLoginData.userSalt,
    maxEpoch: zkLoginData.maxEpoch,
    randomness: zkLoginData.randomness,
    address: zkLoginData.zkLoginUserAddress,
    suiClient,
  })
}
