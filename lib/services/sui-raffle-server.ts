// Server-side SUI Blockchain Integration for RaffleCraft
// This file can be used in API routes and server-side code

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import {
  SuiTransactionResult,
  TicketMintTransaction,
  BlockchainError
} from '@/lib/types/rafflecraft-types'

// RaffleCraft Treasury Address (replace with actual treasury address)
const RAFFLE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_RAFFLE_TREASURY_ADDRESS || 
  '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

// Minimum ticket price in SUI (1.0 SUI = 1,000,000,000 MIST)
const MIN_TICKET_PRICE_MIST = 1_000_000_000

export class SuiRaffleServerService {
  private suiClient: SuiClient

  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient
  }

  /**
   * Create a ticket purchase transaction
   */
  createTicketPurchaseTransaction(
    ticketPriceSui: number,
    buyerAddress: string
  ): Transaction {
    const transaction = new Transaction()
    
    // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
    const amountInMist = Math.floor(ticketPriceSui * 1_000_000_000)
    
    // Validate minimum price
    if (amountInMist < MIN_TICKET_PRICE_MIST) {
      throw new BlockchainError(`Minimum ticket price is 1.0 SUI`)
    }

    // Split coins for the ticket purchase
    const [coin] = transaction.splitCoins(transaction.gas, [amountInMist])
    
    // Transfer to treasury
    transaction.transferObjects([coin], RAFFLE_TREASURY_ADDRESS)
    
    // Set sender
    transaction.setSender(buyerAddress)
    
    return transaction
  }

  /**
   * Validate a transaction hash and extract payment details
   */
  async validateTicketTransaction(
    transactionHash: string
  ): Promise<TicketMintTransaction> {
    try {
      // Get transaction details from SUI network
      const txResponse = await this.suiClient.getTransactionBlock({
        digest: transactionHash,
        options: {
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true
        }
      })

      if (!txResponse) {
        throw new BlockchainError('Transaction not found')
      }

      // Check transaction status
      const status = txResponse.effects?.status?.status
      if (status !== 'success') {
        throw new BlockchainError(`Transaction failed with status: ${status}`)
      }

      // Extract sender address
      const senderAddress = txResponse.transaction?.data?.sender
      if (!senderAddress) {
        throw new BlockchainError('Could not determine sender address')
      }

      // Extract payment amount from balance changes
      let amountSui = 0
      let gasFeesSui = 0

      if (txResponse.balanceChanges) {
        for (const change of txResponse.balanceChanges) {
          if (change.owner === senderAddress && change.coinType === '0x2::sui::SUI') {
            const amountMist = Math.abs(parseInt(change.amount))
            
            // Check if this is a transfer to treasury
            if (change.amount.startsWith('-')) {
              // This is an outgoing transfer, could be payment or gas
              // We need to distinguish between payment and gas fees
              if (amountMist >= MIN_TICKET_PRICE_MIST) {
                amountSui = amountMist / 1_000_000_000
              }
            }
          }
        }
      }

      // Extract gas fees
      if (txResponse.effects?.gasUsed) {
        const gasUsed = txResponse.effects.gasUsed
        const totalGasCost = parseInt(gasUsed.computationCost) + 
                           parseInt(gasUsed.storageCost) - 
                           parseInt(gasUsed.storageRebate)
        gasFeesSui = totalGasCost / 1_000_000_000
      }

      // Validate that this looks like a ticket purchase
      if (amountSui < 1.0) {
        throw new BlockchainError('Transaction does not appear to be a valid ticket purchase')
      }

      // Get block number (checkpoint sequence number)
      const checkpoint = txResponse.checkpoint
      const blockNumber = checkpoint ? parseInt(checkpoint) : undefined

      return {
        transaction_hash: transactionHash,
        sender_address: senderAddress,
        amount_sui: amountSui,
        gas_fee_sui: gasFeesSui,
        block_number: blockNumber,
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      }
    } catch (error) {
      console.error('Error validating ticket transaction:', error)
      if (error instanceof BlockchainError) {
        throw error
      }
      throw new BlockchainError('Failed to validate transaction')
    }
  }

  /**
   * Get user's SUI balance
   */
  async getUserBalance(address: string): Promise<number> {
    try {
      const balance = await this.suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      })
      
      return parseInt(balance.totalBalance) / 1_000_000_000 // Convert MIST to SUI
    } catch (error) {
      console.error('Error getting user balance:', error)
      return 0
    }
  }

  /**
   * Estimate gas fees for ticket purchase
   */
  async estimateGasFees(
    ticketPriceSui: number,
    buyerAddress: string
  ): Promise<number> {
    try {
      const transaction = this.createTicketPurchaseTransaction(ticketPriceSui, buyerAddress)
      
      // Dry run the transaction to estimate gas
      const dryRunResult = await this.suiClient.dryRunTransactionBlock({
        transactionBlock: await transaction.build({ client: this.suiClient })
      })

      if (dryRunResult.effects.status.status !== 'success') {
        throw new BlockchainError('Transaction simulation failed')
      }

      const gasUsed = dryRunResult.effects.gasUsed
      const totalGasCost = parseInt(gasUsed.computationCost) + 
                         parseInt(gasUsed.storageCost) - 
                         parseInt(gasUsed.storageRebate)
      
      return totalGasCost / 1_000_000_000 // Convert MIST to SUI
    } catch (error) {
      console.error('Error estimating gas fees:', error)
      return 0.01 // Default estimate
    }
  }
}
