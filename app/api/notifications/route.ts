/**
 * API Routes for Notifications CRUD Operations
 * GET /api/notifications - Fetch user notifications
 * POST /api/notifications - Create new notification
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DatabaseNotification,
  CreateNotificationRequest,
  NotificationFilters,
  NotificationStats
} from '@/types/notifications'
import { getSupabaseServer, getUserAddressFromRequest } from '@/lib/supabase-server'

/**
 * GET /api/notifications
 * Fetch notifications for a user with optional filtering
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

    // Parse filters
    const filters: NotificationFilters = {
      category: searchParams.get('category') as any,
      type: searchParams.get('type') as any,
      read: searchParams.get('read') === 'true' ? true : searchParams.get('read') === 'false' ? false : undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!) as any : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      search: searchParams.get('search') || undefined
    }

    // Use server-side client that bypasses RLS
    const supabase = getSupabaseServer()

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_address', userAddress)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    // Execute query
    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get stats if requested
    const includeStats = searchParams.get('include_stats') === 'true'
    let stats: NotificationStats | undefined

    if (includeStats) {
      const { data: statsData, error: statsError } = await supabase
        .from('notifications')
        .select('category, type, read')
        .eq('user_address', userAddress)

      if (!statsError && statsData) {
        stats = {
          total: statsData.length,
          unread: statsData.filter(n => !n.read).length,
          by_category: statsData.reduce((acc, n) => {
            acc[n.category] = (acc[n.category] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          by_type: statsData.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      }
    }

    return NextResponse.json({
      notifications: notifications as DatabaseNotification[],
      stats,
      filters,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: notifications?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNotificationRequest = await request.json()

    // Validate required fields
    if (!body.user_address || !body.title || !body.message || !body.type || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: user_address, title, message, type, category' },
        { status: 400 }
      )
    }

    // Prepare notification data
    const notificationData = {
      user_address: body.user_address,
      title: body.title,
      message: body.message,
      type: body.type,
      category: body.category,
      priority: body.priority || 1,
      action_url: body.action_url,
      action_label: body.action_label,
      image_url: body.image_url,
      metadata: body.metadata || {},
      scheduled_for: body.scheduled_for || new Date().toISOString(),
      expires_at: body.expires_at
    }

    // Use server-side client for creating notifications
    const supabase = getSupabaseServer()

    // Insert notification
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

    // Check if user has browser notifications enabled and send browser notification
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('browser_enabled, *')
      .eq('user_address', body.user_address)
      .single()

    // If browser notifications are enabled, we'll let the client handle it via real-time subscription
    // The browser notification will be triggered by the real-time update

    return NextResponse.json({
      notification: notification as DatabaseNotification,
      message: 'Notification created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Bulk update notifications (e.g., mark all as read)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_address, action, filters } = body

    if (!user_address || !action) {
      return NextResponse.json(
        { error: 'user_address and action are required' },
        { status: 400 }
      )
    }

    // Use server-side client that bypasses RLS
    const supabase = getSupabaseServer()

    let query = supabase
      .from('notifications')
      .update({ read: action === 'mark_all_read' })
      .eq('user_address', user_address)

    // Apply filters if provided
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      updated_count: data?.length || 0,
      message: 'Notifications updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
