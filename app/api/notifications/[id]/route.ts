/**
 * API Routes for Individual Notification Operations
 * GET /api/notifications/[id] - Get specific notification
 * PATCH /api/notifications/[id] - Update notification (mark as read, etc.)
 * DELETE /api/notifications/[id] - Delete notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { DatabaseNotification, UpdateNotificationRequest } from '@/types/notifications'
import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/notifications/[id]
 * Get a specific notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_address', userAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching notification:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notification: notification as DatabaseNotification
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/[id]
 * Update a specific notification (mark as read, update delivery status, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: UpdateNotificationRequest & { user_address: string } = await request.json()

    if (!body.user_address) {
      return NextResponse.json(
        { error: 'user_address is required' },
        { status: 400 }
      )
    }

    // Use server-side client
    const supabase = getSupabaseServer()

    // Prepare update data
    const updateData: any = {}
    
    if (body.read !== undefined) {
      updateData.read = body.read
    }
    
    if (body.delivered_at !== undefined) {
      updateData.delivered_at = body.delivered_at
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .eq('user_address', body.user_address)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notification: notification as DatabaseNotification,
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/notifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    const { data: notification, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_address', userAddress)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting notification:', error)
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Notification deleted successfully',
      deleted_notification: notification as DatabaseNotification
    })

  } catch (error) {
    console.error('Error in DELETE /api/notifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
