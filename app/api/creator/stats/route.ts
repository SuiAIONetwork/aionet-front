/**
 * Creator Stats API
 * GET /api/creator/stats - Get user creator statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { creatorService } from '@/lib/creator-service'
import { getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/creator/stats
 * Get user creator statistics
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

    const stats = await creatorService.getUserCreatorStats(userAddress)

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No creator statistics found for this user (user is not a creator)'
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Failed to get creator stats:', error)
    return NextResponse.json(
      { error: 'Failed to get creator stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/creator/stats/leaderboard
 * Get creator statistics for leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'leaderboard') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const topCreators = await creatorService.getTopCreators(limit, offset)

      return NextResponse.json({
        success: true,
        data: topCreators,
        count: topCreators.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to get creator leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to get creator leaderboard' },
      { status: 500 }
    )
  }
}
