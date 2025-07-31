import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Test endpoint for platform notifications (direct template calls)
 * POST /api/notifications/test-platform
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, type, ...params } = body

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      )
    }

    let templateKey = ''
    let variables = {}

    switch (type) {
      case 'bot_deactivated':
        templateKey = 'bot_deactivated'
        variables = {
          botName: params.botName || 'Test Bot',
          botId: params.botId || 'bot-123',
          reason: params.reason || 'Low balance'
        }
        break

      case 'bot_activated':
        templateKey = 'bot_activated'
        variables = {
          botName: params.botName || 'Test Bot',
          botId: params.botId || 'bot-123'
        }
        break

      case 'bot_error':
        templateKey = 'bot_error'
        variables = {
          botName: params.botName || 'Test Bot',
          botId: params.botId || 'bot-123',
          errorMessage: params.errorMessage || 'Connection timeout'
        }
        break

      case 'affiliate_subscription_expiring':
        templateKey = 'affiliate_subscription_expiring'
        variables = {
          days: (params.days || 2).toString()
        }
        break

      case 'affiliate_commission_earned':
        templateKey = 'affiliate_commission_earned'
        variables = {
          amount: (params.amount || 5.25).toFixed(4),
          currency: 'SUI'
        }
        break

      case 'platform_update':
        templateKey = 'platform_update'
        variables = {
          updateDetails: params.updateDetails || 'New trading features and improved UI'
        }
        break

      case 'maintenance_scheduled':
        templateKey = 'maintenance_scheduled'
        variables = {
          date: params.date || '2025-08-01',
          time: params.time || '02:00 UTC',
          duration: params.duration || '2 hours'
        }
        break

      case 'trade_opened':
        templateKey = 'trade_opened'
        variables = {
          symbol: params.symbol || 'BTC/USDT',
          tradeType: params.tradeType || 'LONG',
          price: params.price || '$45,000'
        }
        break

      case 'trade_closed':
        templateKey = 'trade_closed'
        variables = {
          symbol: params.symbol || 'BTC/USDT',
          tradeType: params.tradeType || 'LONG',
          profitLoss: params.profitLoss || 'profit',
          amount: params.amount || '$125.50'
        }
        break

      case 'subscription_expiring':
        templateKey = 'subscription_expiring'
        variables = {
          tier: params.tier || 'PRO',
          days: (params.days || 3).toString()
        }
        break

      case 'referral_bonus':
        templateKey = 'referral_bonus'
        variables = {
          amount: (params.amount || 10.0).toFixed(4),
          username: params.username || 'NewUser123'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    if (!templateKey) {
      return NextResponse.json(
        { error: 'Template key not found for type' },
        { status: 400 }
      )
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('enabled', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: `Template '${templateKey}' not found or disabled` },
        { status: 404 }
      )
    }

    // Replace variables in template
    let title = template.title_template
    let message = template.message_template
    let actionUrl = template.action_url_template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      title = title.replace(new RegExp(placeholder, 'g'), String(value))
      message = message.replace(new RegExp(placeholder, 'g'), String(value))
      if (actionUrl) {
        actionUrl = actionUrl.replace(new RegExp(placeholder, 'g'), String(value))
      }
    }

    // Create notification
    const notificationData = {
      user_address: userAddress,
      title,
      message,
      type: template.type,
      category: template.category,
      priority: template.priority,
      action_url: actionUrl,
      action_label: template.action_label,
      image_url: template.image_url,
      metadata: {
        template_key: templateKey,
        template_variables: variables
      },
      scheduled_for: new Date().toISOString(),
      expires_at: template.expires_in_hours ?
        new Date(Date.now() + template.expires_in_hours * 60 * 60 * 1000).toISOString() :
        null
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification,
      message: `${type} notification sent successfully`,
      // Include flag to trigger manual UI update
      triggerUIUpdate: true
    })

  } catch (error) {
    console.error('Error in test platform notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
