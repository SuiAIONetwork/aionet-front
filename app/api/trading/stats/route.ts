/**
 * Trading Stats API
 * GET /api/trading/stats - Get user trading statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { tradingService } from '@/lib/trading-service'
import { getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/trading/stats
 * Get user trading statistics
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

    const stats = await tradingService.getUserTradingStats(userAddress)

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No trading statistics found for this user'
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Failed to get trading stats:', error)
    return NextResponse.json(
      { error: 'Failed to get trading stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trading/stats/refresh
 * Manually refresh user trading statistics
 */
export async function POST(request: NextRequest) {
  try {
    const userAddress = getUserAddressFromRequest(request)

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await tradingService.updateTradingStats(userAddress)
    const updatedStats = await tradingService.getUserTradingStats(userAddress)

    return NextResponse.json({
      success: true,
      data: updatedStats,
      message: 'Trading statistics refreshed successfully'
    })
  } catch (error) {
    console.error('Failed to refresh trading stats:', error)
    return NextResponse.json(
      { error: 'Failed to refresh trading stats' },
      { status: 500 }
    )
  }
}
