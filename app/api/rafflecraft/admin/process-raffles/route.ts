// API Route: Process completed raffles (Admin/Cron job)
// POST /api/rafflecraft/admin/process-raffles

import { NextRequest, NextResponse } from 'next/server'
import { raffleManagementService } from '@/lib/services/raffle-management-service'

// This endpoint should be called by a cron job or admin interface
export async function POST(request: NextRequest) {
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

    console.log('Processing completed raffles...')
    
    // Process all completed raffles
    await raffleManagementService.processCompletedRaffles()
    
    // Create next week's raffle if needed
    const nextRaffle = await raffleManagementService.createNextWeekRaffle()
    
    return NextResponse.json({
      success: true,
      message: 'Raffles processed successfully',
      next_raffle: nextRaffle
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/admin/process-raffles:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process raffles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
