// API Route: Get raffle and winners history
// GET /api/rafflecraft/history?limit=10&type=raffles|winners

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const type = searchParams.get('type') || 'raffles'
    
    const limit = limitParam ? parseInt(limitParam) : 10

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    let data
    if (type === 'winners') {
      data = await raffleCraftService.getWinnersHistory(limit)
    } else {
      data = await raffleCraftService.getRaffleHistory(limit)
    }

    return NextResponse.json({
      success: true,
      data,
      type
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
