/**
 * Raffle Stats API
 * GET /api/raffle/stats - Get user raffle statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { raffleService } from '@/lib/raffle-service'
import { getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/raffle/stats
 * Get user raffle statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = getUserAddressFromRequest(request) || searchParams.get('user_address')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      )
    }

    const stats = await raffleService.getUserRaffleStats(userAddress)

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No raffle statistics found for this user'
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Failed to get raffle stats:', error)
    return NextResponse.json(
      { error: 'Failed to get raffle stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/raffle/stats/leaderboard
 * Get raffle statistics for leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'leaderboard') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const topParticipants = await raffleService.getTopRaffleParticipants(limit, offset)

      return NextResponse.json({
        success: true,
        data: topParticipants,
        count: topParticipants.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to get raffle leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to get raffle leaderboard' },
      { status: 500 }
    )
  }
}
