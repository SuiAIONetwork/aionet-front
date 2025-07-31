/**
 * zkLogin Transaction Service
 * Handles transaction signing with zkLogin signatures
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { zkProofService, type ZkLoginInputs } from './zklogin-proof-service'
import { toast } from 'sonner'

export interface ZkLoginTransactionRequest {
  transaction: Transaction
  jwt: string
  ephemeralKeyPair: Ed25519Keypair
  userSalt: string
  maxEpoch: number
  randomness: string
  suiClient: SuiClient
}

export interface ZkLoginTransactionResult {
  digest: string
  effects?: any
  objectChanges?: any
}

/**
 * zkLogin Transaction Service
 * Manages transaction signing and execution with zkLogin
 */
export class ZkLoginTransactionService {
  private static instance: ZkLoginTransactionService

  private constructor() {}

  static getInstance(): ZkLoginTransactionService {
    if (!ZkLoginTransactionService.instance) {
      ZkLoginTransactionService.instance = new ZkLoginTransactionService()
    }
    return ZkLoginTransactionService.instance
  }

  /**
   * Sign and execute a transaction using zkLogin
   */
  async signAndExecuteTransaction(request: ZkLoginTransactionRequest): Promise<ZkLoginTransactionResult> {
    try {
      console.log('Starting zkLogin transaction signing...')

      // Import required zkLogin functions
      const { getZkLoginSignature } = await import('@mysten/sui/zklogin')

      // Prepare zkLogin inputs (this generates the ZK proof)
      const zkLoginInputs = await zkProofService.prepareZkLoginInputs(
        request.jwt,
        request.ephemeralKeyPair,
        request.userSalt,
        request.maxEpoch,
        request.randomness
      )

      console.log('ZK proof generated, preparing transaction...')

      // Set sender and gas budget
      const senderAddress = this.deriveZkLoginAddress(request.jwt, request.userSalt)
      request.transaction.setSender(senderAddress)

      // Build transaction bytes
      const transactionBytes = await request.transaction.build({
        client: request.suiClient,
      })

      console.log('Transaction built, creating ephemeral signature...')

      // Sign transaction with ephemeral key
      const ephemeralSignature = await request.ephemeralKeyPair.sign(transactionBytes)

      console.log('Creating zkLogin signature...')

      // Create zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: zkLoginInputs,
        maxEpoch: request.maxEpoch,
        userSignature: ephemeralSignature,
      })

      console.log('Executing transaction...')

      // Execute transaction
      const result = await request.suiClient.executeTransactionBlock({
        transactionBlock: transactionBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      console.log('zkLogin transaction executed successfully:', result.digest)

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges,
      }

    } catch (error) {
      console.error('zkLogin transaction failed:', error)
      throw new Error(`zkLogin transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sign a transaction without executing it
   */
  async signTransaction(request: Omit<ZkLoginTransactionRequest, 'suiClient'>): Promise<string> {
    try {
      console.log('Signing transaction with zkLogin...')

      // Import required zkLogin functions
      const { getZkLoginSignature } = await import('@mysten/sui/zklogin')

      // Prepare zkLogin inputs
      const zkLoginInputs = await zkProofService.prepareZkLoginInputs(
        request.jwt,
        request.ephemeralKeyPair,
        request.userSalt,
        request.maxEpoch,
        request.randomness
      )

      // Set sender
      const senderAddress = this.deriveZkLoginAddress(request.jwt, request.userSalt)
      request.transaction.setSender(senderAddress)

      // Build transaction bytes (requires a client for gas estimation)
      // Note: For signing only, you might need to provide gas budget manually
      const transactionBytes = await request.transaction.build({
        client: new (await import('@mysten/sui/client')).SuiClient({
          url: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.devnet.sui.io'
        }),
      })

      // Sign with ephemeral key
      const ephemeralSignature = await request.ephemeralKeyPair.sign(transactionBytes)

      // Create zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: zkLoginInputs,
        maxEpoch: request.maxEpoch,
        userSignature: ephemeralSignature,
      })

      console.log('Transaction signed successfully')
      return zkLoginSignature

    } catch (error) {
      console.error('Failed to sign transaction:', error)
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Derive zkLogin address from JWT and salt
   */
  private deriveZkLoginAddress(jwt: string, userSalt: string): string {
    try {
      const { jwtToAddress } = require('@mysten/sui/zklogin')
      return jwtToAddress(jwt, userSalt)
    } catch (error) {
      throw new Error('Failed to derive zkLogin address')
    }
  }

  /**
   * Check if ephemeral key is still valid
   */
  isEphemeralKeyValid(maxEpoch: number, currentEpoch: number): boolean {
    return currentEpoch < maxEpoch
  }

  /**
   * Estimate gas for a zkLogin transaction
   */
  async estimateGas(
    transaction: Transaction,
    senderAddress: string,
    suiClient: SuiClient
  ): Promise<string> {
    try {
      // Set sender for gas estimation
      transaction.setSender(senderAddress)

      // Dry run to estimate gas
      const dryRunResult = await suiClient.dryRunTransactionBlock({
        transactionBlock: await transaction.build({ client: suiClient }),
      })

      if (dryRunResult.effects.status.status === 'failure') {
        throw new Error(`Transaction simulation failed: ${dryRunResult.effects.status.error}`)
      }

      // Return gas used
      return dryRunResult.effects.gasUsed.computationCost

    } catch (error) {
      console.error('Gas estimation failed:', error)
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a simple transfer transaction for testing
   */
  createTransferTransaction(
    recipientAddress: string,
    amount: string,
    coinType: string = '0x2::sui::SUI'
  ): Transaction {
    const tx = new Transaction()
    
    const [coin] = tx.splitCoins(tx.gas, [amount])
    tx.transferObjects([coin], recipientAddress)
    
    return tx
  }

  /**
   * Validate zkLogin session before transaction
   */
  validateZkLoginSession(
    jwt: string,
    maxEpoch: number,
    currentEpoch: number
  ): { isValid: boolean; reason?: string } {
    try {
      // Check if JWT is expired
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      const jwtExp = payload.exp * 1000 // Convert to milliseconds
      
      if (Date.now() > jwtExp) {
        return { isValid: false, reason: 'JWT expired' }
      }

      // Check if ephemeral key is expired
      if (currentEpoch >= maxEpoch) {
        return { isValid: false, reason: 'Ephemeral key expired' }
      }

      return { isValid: true }

    } catch (error) {
      return { isValid: false, reason: 'Invalid JWT format' }
    }
  }
}

// Export singleton instance
export const zkTransactionService = ZkLoginTransactionService.getInstance()

// Helper function for easy transaction execution
export async function executeZkLoginTransaction(
  transaction: Transaction,
  zkLoginData: {
    jwt: string
    ephemeralKeyPair: Ed25519Keypair
    userSalt: string
    maxEpoch: number
    randomness: string
  },
  suiClient: SuiClient,
  options?: {
    showToast?: boolean
    onSuccess?: (result: ZkLoginTransactionResult) => void
    onError?: (error: Error) => void
  }
): Promise<ZkLoginTransactionResult> {
  try {
    if (options?.showToast) {
      toast.loading('Executing zkLogin transaction...')
    }

    const result = await zkTransactionService.signAndExecuteTransaction({
      transaction,
      ...zkLoginData,
      suiClient,
    })

    if (options?.showToast) {
      toast.success('Transaction executed successfully!')
    }

    options?.onSuccess?.(result)
    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
    
    if (options?.showToast) {
      toast.error(errorMessage)
    }

    options?.onError?.(error instanceof Error ? error : new Error(errorMessage))
    throw error
  }
}
