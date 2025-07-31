// API Route: Validate SUI transaction for ticket purchase
// POST /api/rafflecraft/validate-transaction

import { NextRequest, NextResponse } from 'next/server'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { SuiRaffleServerService } from '@/lib/services/sui-raffle-server'

// Initialize SUI client
const suiClient = new SuiClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('testnet')
})

const raffleService = new SuiRaffleServerService(suiClient)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_hash, expected_amount_sui, user_address } = body

    // Validate required fields
    if (!transaction_hash || !expected_amount_sui || !user_address) {
      return NextResponse.json(
        { error: 'Missing required fields: transaction_hash, expected_amount_sui, user_address' },
        { status: 400 }
      )
    }

    // Validate transaction hash format
    if (!transaction_hash.startsWith('0x') || transaction_hash.length < 42) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    // Validate user address format
    if (!user_address.startsWith('0x') || user_address.length < 42) {
      return NextResponse.json(
        { error: 'Invalid user address format' },
        { status: 400 }
      )
    }

    // Validate expected amount
    if (expected_amount_sui <= 0) {
      return NextResponse.json(
        { error: 'Invalid expected amount: must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate the transaction
    const transactionDetails = await raffleService.validateTicketTransaction(transaction_hash)

    // Verify the sender matches the expected user
    if (transactionDetails.sender_address !== user_address) {
      return NextResponse.json(
        { error: 'Transaction sender does not match user address' },
        { status: 400 }
      )
    }

    // Verify the amount is correct (allow small tolerance for gas calculations)
    const tolerance = 0.001 // 0.001 SUI tolerance
    if (Math.abs(transactionDetails.amount_sui - expected_amount_sui) > tolerance) {
      return NextResponse.json(
        { 
          error: `Transaction amount mismatch. Expected: ${expected_amount_sui} SUI, Found: ${transactionDetails.amount_sui} SUI` 
        },
        { status: 400 }
      )
    }

    // Transaction is valid
    return NextResponse.json({
      success: true,
      data: {
        transaction_hash: transactionDetails.transaction_hash,
        sender_address: transactionDetails.sender_address,
        amount_sui: transactionDetails.amount_sui,
        gas_fee_sui: transactionDetails.gas_fee_sui,
        block_number: transactionDetails.block_number,
        timestamp: transactionDetails.timestamp,
        status: transactionDetails.status
      }
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/validate-transaction:', error)
    
    // Handle specific blockchain errors
    if (error instanceof Error) {
      if (error.message.includes('Transaction not found')) {
        return NextResponse.json(
          { error: 'Transaction not found on blockchain' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Transaction failed')) {
        return NextResponse.json(
          { error: 'Transaction failed on blockchain' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('not appear to be a valid ticket purchase')) {
        return NextResponse.json(
          { error: 'Transaction does not appear to be a valid ticket purchase' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to validate transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
