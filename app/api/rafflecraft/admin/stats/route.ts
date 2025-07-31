// API Route: Get raffle statistics (Admin)
// GET /api/rafflecraft/admin/stats

import { NextRequest, NextResponse } from 'next/server'
import { raffleManagementService } from '@/lib/services/raffle-management-service'

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check (in production, use proper admin authentication)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.RAFFLE_ADMIN_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stats = await raffleManagementService.getRaffleStatistics()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/admin/stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
