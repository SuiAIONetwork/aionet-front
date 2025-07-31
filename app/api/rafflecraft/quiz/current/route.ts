// API Route: Get current week's quiz
// GET /api/rafflecraft/quiz/current

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'

export async function GET(request: NextRequest) {
  try {
    const currentQuiz = await raffleCraftService.getCurrentWeekQuiz()
    
    if (!currentQuiz) {
      return NextResponse.json(
        { error: 'No active quiz this week' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: currentQuiz
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/quiz/current:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch current quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
