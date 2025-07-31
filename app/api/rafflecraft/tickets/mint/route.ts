// API Route: Mint raffle ticket
// POST /api/rafflecraft/tickets/mint

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'
import { TicketMintingRequest } from '@/lib/types/rafflecraft-types'

export async function POST(request: NextRequest) {
  try {
    const body: TicketMintingRequest = await request.json()

    // Validate required fields
    if (!body.user_address || !body.week_number || !body.transaction_hash || !body.amount_paid_sui) {
      return NextResponse.json(
        { error: 'Missing required fields: user_address, week_number, transaction_hash, amount_paid_sui' },
        { status: 400 }
      )
    }

    // Validate user_address format
    if (!body.user_address.startsWith('0x') || body.user_address.length < 42) {
      return NextResponse.json(
        { error: 'Invalid user address format' },
        { status: 400 }
      )
    }

    // Validate transaction_hash format
    if (!body.transaction_hash.startsWith('0x') || body.transaction_hash.length < 42) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    // Validate amount
    if (body.amount_paid_sui <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be greater than 0' },
        { status: 400 }
      )
    }

    // Mint the ticket
    const result = await raffleCraftService.mintRaffleTicket(body)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/tickets/mint:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Cannot mint ticket')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      
      if (error.message.includes('already attempted')) {
        return NextResponse.json(
          { error: 'Quiz not completed or answer incorrect' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to mint ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
