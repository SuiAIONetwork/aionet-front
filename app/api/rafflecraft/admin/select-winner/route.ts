// API Route: Manual winner selection (Admin)
// POST /api/rafflecraft/admin/select-winner

import { NextRequest, NextResponse } from 'next/server'
import { raffleManagementService } from '@/lib/services/raffle-management-service'

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

    const body = await request.json()
    const { week_number, ticket_id } = body

    // Validate required fields
    if (!week_number || !ticket_id) {
      return NextResponse.json(
        { error: 'Missing required fields: week_number, ticket_id' },
        { status: 400 }
      )
    }

    // Validate week_number is a positive integer
    if (!Number.isInteger(week_number) || week_number < 1) {
      return NextResponse.json(
        { error: 'Invalid week_number: must be a positive integer' },
        { status: 400 }
      )
    }

    // Validate ticket_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(ticket_id)) {
      return NextResponse.json(
        { error: 'Invalid ticket_id format' },
        { status: 400 }
      )
    }

    // Select winner manually
    await raffleManagementService.selectWinnerManually(week_number, ticket_id)
    
    return NextResponse.json({
      success: true,
      message: `Winner selected manually for week ${week_number}`
    })
  } catch (error) {
    console.error('Error in /api/rafflecraft/admin/select-winner:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Raffle or ticket not found' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to select winner',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
