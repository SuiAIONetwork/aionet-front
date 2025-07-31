// API Route: Submit quiz answer
// POST /api/rafflecraft/quiz/submit

import { NextRequest, NextResponse } from 'next/server'
import { raffleCraftService } from '@/lib/services/rafflecraft-service'
import { QuizSubmissionRequest } from '@/lib/types/rafflecraft-types'

export async function POST(request: NextRequest) {
  try {
    const body: QuizSubmissionRequest = await request.json()

    // Validate required fields
    if (!body.user_address || !body.week_number || !body.quiz_question_id || !body.user_answer) {
      return NextResponse.json(
        { error: 'Missing required fields: user_address, week_number, quiz_question_id, user_answer' },
        { status: 400 }
      )
    }

    // Validate user_address format (basic Sui address validation)
    if (!body.user_address.startsWith('0x') || body.user_address.length < 42) {
      return NextResponse.json(
        { error: 'Invalid user address format' },
        { status: 400 }
      )
    }

    // Submit quiz answer
    const result = await raffleCraftService.submitQuizAnswer(body)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/quiz/submit:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already attempted')) {
        return NextResponse.json(
          { error: 'You have already attempted this week\'s quiz' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Quiz question not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to submit quiz answer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
