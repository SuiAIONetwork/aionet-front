import { NextRequest, NextResponse } from 'next/server'
import { affiliateSubscriptionService } from '@/lib/affiliate-subscription-service'
import { withFullCSRFProtection } from '@/lib/csrf-protection'

// RaffleCraft webhook payload interface
interface RaffleCraftWebhookPayload {
  event_type: 'ticket_purchased' | 'ticket_minted'
  user_address: string
  ticket_id: string
  transaction_hash: string
  raffle_id: string
  ticket_price: number
  timestamp: string
  signature?: string // For webhook verification
}

/**
 * POST /api/rafflecraft/bonus
 * Webhook endpoint for RaffleCraft to notify about ticket purchases/mints
 * Automatically adds 7-day bonus to user's affiliate subscription
 * Protected with CSRF validation
 */
const postHandler = async (request: NextRequest) => {
  try {
    console.log('🎟️ RaffleCraft bonus webhook received')

    // Parse webhook payload
    const payload: RaffleCraftWebhookPayload = await request.json()
    
    // Validate required fields
    if (!payload.user_address || !payload.ticket_id || !payload.transaction_hash) {
      return NextResponse.json(
        { error: 'Missing required fields: user_address, ticket_id, transaction_hash' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!['ticket_purchased', 'ticket_minted'].includes(payload.event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type. Must be ticket_purchased or ticket_minted' },
        { status: 400 }
      )
    }

    // Validate wallet address format (basic SUI address validation)
    if (!payload.user_address.startsWith('0x') || payload.user_address.length !== 66) {
      return NextResponse.json(
        { error: 'Invalid user_address format' },
        { status: 400 }
      )
    }

    // Optional: Verify webhook signature (implement if RaffleCraft provides signatures)
    if (payload.signature) {
      const isValidSignature = await verifyWebhookSignature(payload, payload.signature)
      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }

    console.log('📝 Processing RaffleCraft bonus for:', {
      user: payload.user_address,
      ticket: payload.ticket_id,
      raffle: payload.raffle_id,
      event: payload.event_type
    })

    // Process the bonus
    const bonusApplied = await affiliateSubscriptionService.processRaffleCraftBonus(
      payload.user_address,
      payload.ticket_id,
      payload.transaction_hash,
      payload.raffle_id,
      7 // 7 days bonus
    )

    if (bonusApplied) {
      console.log('✅ RaffleCraft bonus applied successfully')
      return NextResponse.json({
        success: true,
        message: '7-day affiliate subscription bonus applied successfully',
        bonus_days: 7,
        user_address: payload.user_address,
        ticket_id: payload.ticket_id
      })
    } else {
      console.log('⚠️ RaffleCraft bonus not applied (possibly already exists)')
      return NextResponse.json({
        success: false,
        message: 'Bonus not applied - may already exist for this ticket',
        user_address: payload.user_address,
        ticket_id: payload.ticket_id
      }, { status: 409 })
    }

  } catch (error) {
    console.error('❌ RaffleCraft bonus webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error processing RaffleCraft bonus',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rafflecraft/bonus
 * Health check endpoint for RaffleCraft integration
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'RaffleCraft Affiliate Bonus Integration',
    version: '1.0.0',
    endpoints: {
      webhook: 'POST /api/rafflecraft/bonus',
      health: 'GET /api/rafflecraft/bonus'
    },
    bonus_details: {
      days_per_ticket: 7,
      supported_events: ['ticket_purchased', 'ticket_minted'],
      duplicate_protection: true
    }
  })
}

/**
 * Verify webhook signature (implement based on RaffleCraft's signing method)
 * This is a placeholder - implement actual signature verification
 */
async function verifyWebhookSignature(
  payload: RaffleCraftWebhookPayload, 
  signature: string
): Promise<boolean> {
  try {
    // In production, implement actual signature verification
    // Example using HMAC-SHA256:
    // const secret = process.env.RAFFLECRAFT_WEBHOOK_SECRET
    // const expectedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(JSON.stringify(payload))
    //   .digest('hex')
    // return signature === expectedSignature

    // For now, return true (no verification)
    // Replace with actual implementation when RaffleCraft provides signing details
    return true
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Manual bonus application endpoint (for testing or admin use)
 * POST /api/rafflecraft/bonus/manual
 */
export async function PUT(request: NextRequest) {
  try {
    const { user_address, ticket_id, transaction_hash, raffle_id, bonus_days = 7 } = await request.json()

    // Basic validation
    if (!user_address || !ticket_id || !transaction_hash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Optional: Add admin authentication here
    // const isAdmin = await verifyAdminAccess(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🔧 Manual RaffleCraft bonus application:', {
      user_address,
      ticket_id,
      bonus_days
    })

    const bonusApplied = await affiliateSubscriptionService.processRaffleCraftBonus(
      user_address,
      ticket_id,
      transaction_hash,
      raffle_id,
      bonus_days
    )

    return NextResponse.json({
      success: bonusApplied,
      message: bonusApplied 
        ? `${bonus_days}-day bonus applied successfully`
        : 'Bonus not applied - may already exist',
      user_address,
      ticket_id,
      bonus_days
    })

  } catch (error) {
    console.error('Manual bonus application error:', error)
    return NextResponse.json(
      { error: 'Failed to apply manual bonus' },
      { status: 500 }
    )
  }
}

// Export the CSRF-protected handler
export const POST = withFullCSRFProtection(postHandler)
