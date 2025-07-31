/**
 * API Routes for Notification Settings
 * GET /api/notifications/settings - Get user notification settings
 * POST /api/notifications/settings - Create/Update user notification settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { NotificationSettings } from '@/types/notifications'
import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/notifications/settings
 * Get user notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user_address')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'user_address is required' },
        { status: 400 }
      )
    }

    // Use server-side client
    const supabase = getSupabaseServer()

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_address', userAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        const defaultSettings: Partial<NotificationSettings> = {
          user_address: userAddress,
          email_enabled: true,
          push_enabled: true,
          browser_enabled: true,
          platform_enabled: true,
          monthly_enabled: true,
          community_enabled: true,
          trade_enabled: true,
          system_enabled: true,
          promotion_enabled: false,
          timezone: 'UTC',
          max_notifications_per_hour: 10,
          max_notifications_per_day: 50
        }

        return NextResponse.json({
          settings: defaultSettings,
          is_default: true
        })
      }

      console.error('Error fetching notification settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      settings: settings as NotificationSettings,
      is_default: false
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/settings
 * Create or update user notification settings
 */
export async function POST(request: NextRequest) {
  try {
    const body: Partial<NotificationSettings> = await request.json()

    if (!body.user_address) {
      return NextResponse.json(
        { error: 'user_address is required' },
        { status: 400 }
      )
    }

    // Use server-side client
    const supabase = getSupabaseServer()

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('user_address', body.user_address)
      .single()

    let result
    let operation

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          email_enabled: body.email_enabled,
          push_enabled: body.push_enabled,
          browser_enabled: body.browser_enabled,
          platform_enabled: body.platform_enabled,
          monthly_enabled: body.monthly_enabled,
          community_enabled: body.community_enabled,
          trade_enabled: body.trade_enabled,
          system_enabled: body.system_enabled,
          promotion_enabled: body.promotion_enabled,
          quiet_hours_start: body.quiet_hours_start,
          quiet_hours_end: body.quiet_hours_end,
          timezone: body.timezone,
          max_notifications_per_hour: body.max_notifications_per_hour,
          max_notifications_per_day: body.max_notifications_per_day,
          updated_at: new Date().toISOString()
        })
        .eq('user_address', body.user_address)
        .select()
        .single()

      result = data
      operation = 'updated'
      
      if (error) {
        console.error('Error updating notification settings:', error)
        return NextResponse.json(
          { error: 'Failed to update notification settings' },
          { status: 500 }
        )
      }
    } else {
      // Create new settings
      const settingsData = {
        user_address: body.user_address,
        email_enabled: body.email_enabled ?? true,
        push_enabled: body.push_enabled ?? true,
        browser_enabled: body.browser_enabled ?? true,
        platform_enabled: body.platform_enabled ?? true,
        monthly_enabled: body.monthly_enabled ?? true,
        community_enabled: body.community_enabled ?? true,
        trade_enabled: body.trade_enabled ?? true,
        system_enabled: body.system_enabled ?? true,
        promotion_enabled: body.promotion_enabled ?? false,
        quiet_hours_start: body.quiet_hours_start,
        quiet_hours_end: body.quiet_hours_end,
        timezone: body.timezone ?? 'UTC',
        max_notifications_per_hour: body.max_notifications_per_hour ?? 10,
        max_notifications_per_day: body.max_notifications_per_day ?? 50
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .insert(settingsData)
        .select()
        .single()

      result = data
      operation = 'created'

      if (error) {
        console.error('Error creating notification settings:', error)
        return NextResponse.json(
          { error: 'Failed to create notification settings' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      settings: result as NotificationSettings,
      message: `Notification settings ${operation} successfully`
    })

  } catch (error) {
    console.error('Error in POST /api/notifications/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
