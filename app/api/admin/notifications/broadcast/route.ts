/**
 * Admin API for Broadcasting Notifications to All Users
 * POST /api/admin/notifications/broadcast - Send notification to all users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotificationType, NotificationCategory } from '@/types/notifications'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin wallet address
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface BroadcastRequest {
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority?: number
  action_url?: string
  action_label?: string
  admin_address: string
}

/**
 * POST /api/admin/notifications/broadcast
 * Send notification to all users who have notification settings
 */
export async function POST(request: NextRequest) {
  try {
    const body: BroadcastRequest = await request.json()

    // Validate admin access
    if (body.admin_address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!body.title || !body.message || !body.type || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, type, category' },
        { status: 400 }
      )
    }

    // Get all users who have notification settings (active users)
    const { data: userSettings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_address')

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch user list' },
        { status: 500 }
      )
    }

    // If no users found, get unique user addresses from existing notifications
    let userAddresses: string[] = []
    
    if (userSettings && userSettings.length > 0) {
      userAddresses = userSettings.map(setting => setting.user_address)
    } else {
      // Fallback: get unique user addresses from notifications table
      const { data: notificationUsers, error: notificationError } = await supabase
        .from('notifications')
        .select('user_address')
        .not('user_address', 'like', 'sample_%') // Exclude sample data

      if (notificationError) {
        console.error('Error fetching notification users:', notificationError)
        return NextResponse.json(
          { error: 'Failed to fetch user list' },
          { status: 500 }
        )
      }

      if (notificationUsers) {
        // Get unique addresses
        const uniqueAddresses = [...new Set(notificationUsers.map(n => n.user_address))]
        userAddresses = uniqueAddresses
      }
    }

    if (userAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send notifications to' },
        { status: 400 }
      )
    }

    // Prepare notification data for all users
    const notifications = userAddresses.map(userAddress => ({
      user_address: userAddress,
      title: body.title,
      message: body.message,
      type: body.type,
      category: body.category,
      priority: body.priority || 2,
      action_url: body.action_url,
      action_label: body.action_label,
      metadata: {
        broadcast: true,
        admin_sent: true,
        admin_address: body.admin_address,
        sent_at: new Date().toISOString()
      },
      scheduled_for: new Date().toISOString()
    }))

    // Insert notifications in batches to avoid hitting limits
    const batchSize = 100
    let totalSent = 0
    const errors: any[] = []

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(batch)
        .select('id')

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
        errors.push(error)
      } else {
        totalSent += data?.length || 0
      }
    }

    // Log admin action
    console.log(`📢 Admin broadcast sent by ${body.admin_address}:`, {
      title: body.title,
      category: body.category,
      type: body.type,
      recipients: totalSent,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'Broadcast notification sent successfully',
      sent_count: totalSent,
      total_users: userAddresses.length,
      errors: errors.length > 0 ? errors : undefined,
      notification: {
        title: body.title,
        message: body.message,
        type: body.type,
        category: body.category
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/notifications/broadcast:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/notifications/broadcast
 * Get broadcast statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminAddress = searchParams.get('admin_address')

    // Validate admin access
    if (adminAddress !== ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Get broadcast statistics
    const { data: broadcasts, error } = await supabase
      .from('notifications')
      .select('title, category, type, created_at, metadata')
      .eq('metadata->>broadcast', 'true')
      .eq('metadata->>admin_address', adminAddress)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching broadcast stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch broadcast statistics' },
        { status: 500 }
      )
    }

    // Get user count
    const { data: userCount, error: userError } = await supabase
      .from('notification_settings')
      .select('user_address', { count: 'exact' })

    const totalUsers = userCount?.length || 0

    return NextResponse.json({
      recent_broadcasts: broadcasts || [],
      total_users: totalUsers,
      admin_address: adminAddress
    })

  } catch (error) {
    console.error('Error in GET /api/admin/notifications/broadcast:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
