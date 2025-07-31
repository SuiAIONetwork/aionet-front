/**
 * Channel Report Management API
 * PATCH /api/channel-reports/[id] - Update a specific channel report (admin only)
 * GET /api/channel-reports/[id] - Get a specific channel report (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { 
  UpdateChannelReportRequest, 
  ChannelReport 
} from '@/types/channel-reports'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin wallet address for authorization
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

/**
 * GET /api/channel-reports/[id]
 * Get a specific channel report (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const adminAddress = searchParams.get('admin_address')
    const { id } = params

    // Validate admin access
    if (adminAddress !== ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch the report
    const { data: report, error } = await supabase
      .from('channel_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching channel report:', error)
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      report: report as ChannelReport
    })

  } catch (error) {
    console.error('Error in GET /api/channel-reports/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/channel-reports/[id]
 * Update a specific channel report (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: UpdateChannelReportRequest & { 
      admin_address: string
      resolved_by?: string 
    } = await request.json()

    // Validate admin access
    if (body.admin_address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.status !== undefined) {
      updateData.status = body.status
      
      // If status is being set to resolved or dismissed, record resolution details
      if (body.status === 'resolved' || body.status === 'dismissed') {
        updateData.resolved_by = body.resolved_by || body.admin_address
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes
    }

    if (body.severity !== undefined) {
      updateData.severity = body.severity
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }

    // Update the report
    const { data: updatedReport, error } = await supabase
      .from('channel_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }
      
      console.error('Error updating channel report:', error)
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      )
    }

    // Send notification to admin about status change if significant
    if (body.status && (body.status === 'resolved' || body.status === 'dismissed')) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_address: ADMIN_ADDRESS,
            title: `Channel Report ${body.status === 'resolved' ? 'Resolved' : 'Dismissed'}`,
            message: `Report for channel "${updatedReport.channel_name}" has been ${body.status}. ${body.admin_notes ? 'Notes: ' + body.admin_notes : ''}`,
            type: body.status === 'resolved' ? 'success' : 'info',
            category: 'system',
            priority: 2,
            action_url: '/admin/reports',
            action_label: 'View Reports',
            metadata: {
              report_id: id,
              channel_id: updatedReport.channel_id,
              status: body.status,
              resolved_by: body.resolved_by || body.admin_address
            }
          })
        })
      } catch (notificationError) {
        console.error('Failed to send status update notification:', notificationError)
        // Don't fail the update if notification fails
      }
    }

    // Log the admin action
    console.log('📝 Channel report updated by admin:', {
      report_id: id,
      channel_id: updatedReport.channel_id,
      channel_name: updatedReport.channel_name,
      old_status: body.status ? 'unknown' : updatedReport.status, // We don't have the old status
      new_status: body.status,
      admin_address: body.admin_address,
      has_notes: !!body.admin_notes,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      report: updatedReport as ChannelReport,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/channel-reports/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
