// API Route: Get user's raffle data
// GET /api/rafflecraft/user/[address]?week=1

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const userAddress = params.address
    const { searchParams } = new URL(request.url)
    const weekNumber = searchParams.get('week')

    // Validate user_address format
    if (!userAddress.startsWith('0x') || userAddress.length < 42) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Get user's tickets
    const tickets = await raffleCraftService.getUserTickets(
      userAddress, 
      weekNumber ? parseInt(weekNumber) : undefined
    )

    // Get user's quiz attempt for current/specified week
    let quizAttempt = null
    if (weekNumber) {
      quizAttempt = await raffleCraftService.getUserQuizAttempt(
        userAddress, 
        parseInt(weekNumber)
      )
    }

    // Get user eligibility
    const eligibility = await raffleCraftService.checkUserEligibility(userAddress)

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        quiz_attempt: quizAttempt,
        eligibility
      }
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/user/[address]:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
