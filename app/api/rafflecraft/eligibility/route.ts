// API Route: Check user eligibility for ticket minting
// GET /api/rafflecraft/eligibility?address=0x...

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      )
    }

    // Validate user_address format
    if (!userAddress.startsWith('0x') || userAddress.length < 42) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    const eligibility = await raffleCraftService.checkUserEligibility(userAddress)

    return NextResponse.json({
      success: true,
      data: eligibility
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/eligibility:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check eligibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
