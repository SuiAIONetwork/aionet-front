/**
 * Trading Activities API
 * GET /api/trading/activities - Get user trading activities
 * POST /api/trading/activities - Record new trading activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { tradingService } from '@/lib/trading-service'
import { getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/trading/activities
 * Get user trading activities with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = getUserAddressFromRequest(request)

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const filters = {
      userAddress,
      platform: searchParams.get('platform') || undefined,
      tradeType: searchParams.get('trade_type') || undefined,
      symbol: searchParams.get('symbol') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('date_from') || undefined,
      dateTo: searchParams.get('date_to') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const activities = await tradingService.getUserTradingActivities(filters)

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length
    })
  } catch (error) {
    console.error('Failed to get trading activities:', error)
    return NextResponse.json(
      { error: 'Failed to get trading activities' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trading/activities
 * Record new trading activity
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

    const body = await request.json()
    const {
      trade_type,
      symbol,
      amount,
      price,
      profit_loss,
      profit_loss_percentage,
      status = 'completed',
      platform = 'manual',
      trade_opened_at,
      trade_closed_at,
      metadata = {}
    } = body

    // Validate required fields
    if (!trade_type || !symbol || !amount || !price || !trade_opened_at) {
      return NextResponse.json(
        { error: 'Missing required fields: trade_type, symbol, amount, price, trade_opened_at' },
        { status: 400 }
      )
    }

    // Validate trade_type
    if (!['buy', 'sell', 'long', 'short'].includes(trade_type)) {
      return NextResponse.json(
        { error: 'Invalid trade_type. Must be: buy, sell, long, or short' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['pending', 'completed', 'cancelled', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, completed, cancelled, or failed' },
        { status: 400 }
      )
    }

    // Validate platform
    if (!['bybit', 'binance', 'manual', 'other'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: bybit, binance, manual, or other' },
        { status: 400 }
      )
    }

    const activity = await tradingService.recordTradingActivity({
      user_address: userAddress,
      trade_type,
      symbol,
      amount: parseFloat(amount),
      price: parseFloat(price),
      profit_loss: profit_loss ? parseFloat(profit_loss) : undefined,
      profit_loss_percentage: profit_loss_percentage ? parseFloat(profit_loss_percentage) : undefined,
      status,
      platform,
      trade_opened_at,
      trade_closed_at: trade_closed_at || undefined,
      metadata
    })

    return NextResponse.json({
      success: true,
      data: activity
    })
  } catch (error) {
    console.error('Failed to record trading activity:', error)
    return NextResponse.json(
      { error: 'Failed to record trading activity' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/trading/activities/[id]
 * Update existing trading activity
 */
export async function PUT(request: NextRequest) {
  try {
    const userAddress = getUserAddressFromRequest(request)

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      profit_loss,
      profit_loss_percentage,
      status,
      trade_closed_at,
      metadata
    } = body

    const updates: any = {}
    if (profit_loss !== undefined) updates.profit_loss = parseFloat(profit_loss)
    if (profit_loss_percentage !== undefined) updates.profit_loss_percentage = parseFloat(profit_loss_percentage)
    if (status) updates.status = status
    if (trade_closed_at) updates.trade_closed_at = trade_closed_at
    if (metadata) updates.metadata = metadata

    const activity = await tradingService.updateTradingActivity(activityId, updates)

    return NextResponse.json({
      success: true,
      data: activity
    })
  } catch (error) {
    console.error('Failed to update trading activity:', error)
    return NextResponse.json(
      { error: 'Failed to update trading activity' },
      { status: 500 }
    )
  }
}
