// Vercel Cron API endpoint for automated raffle processing
// This endpoint is called by Vercel's cron jobs

import { NextRequest, NextResponse } from 'next/server'
import { processRafflesCronJob } from '@/lib/cron/raffle-processor'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Cron job triggered: processing raffles...')
    
    // Run the raffle processing
    await processRafflesCronJob()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Raffles processed successfully',
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}
