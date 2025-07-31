/**
 * Quiz Stats API
 * GET /api/quiz/stats - Get user quiz statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { quizService } from '@/lib/quiz-service'
import { getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/quiz/stats
 * Get user quiz statistics
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

    const stats = await quizService.getUserQuizStats(userAddress)

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No quiz statistics found for this user'
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Failed to get quiz stats:', error)
    return NextResponse.json(
      { error: 'Failed to get quiz stats' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/quiz/stats/leaderboard
 * Get quiz statistics for leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'leaderboard') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const topPerformers = await quizService.getTopQuizPerformers(limit, offset)

      return NextResponse.json({
        success: true,
        data: topPerformers,
        count: topPerformers.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to get quiz leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to get quiz leaderboard' },
      { status: 500 }
    )
  }
}
