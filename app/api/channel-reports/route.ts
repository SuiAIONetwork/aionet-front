/**
 * Channel Reports API
 * POST /api/channel-reports - Submit a new channel report
 * GET /api/channel-reports - Get reports (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { 
  CreateChannelReportRequest, 
  ChannelReport,
  ChannelReportResponse 
} from '@/types/channel-reports'

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin wallet address for authorization
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

/**
 * POST /api/channel-reports
 * Submit a new channel report
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateChannelReportRequest = await request.json()

    console.log('📢 Channel report submission received:', {
      reporter: body.reporter_address,
      channel: body.channel_name,
      category: body.report_category,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    console.log('🔍 Validating request body:', {
      has_reporter_address: !!body.reporter_address,
      has_channel_id: !!body.channel_id,
      has_channel_name: !!body.channel_name,
      has_creator_address: !!body.creator_address,
      has_report_category: !!body.report_category,
      has_report_description: !!body.report_description,
      description_length: body.report_description?.length || 0
    })

    if (!body.reporter_address || !body.channel_id || !body.channel_name ||
        !body.creator_address || !body.report_category || !body.report_description) {
      console.error('❌ Missing required fields in request')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate description length
    if (body.report_description.trim().length < 20) {
      console.error('❌ Description too short:', body.report_description.trim().length)
      return NextResponse.json(
        { error: 'Description must be at least 20 characters long' },
        { status: 400 }
      )
    }

    console.log('✅ Request validation passed')

    // Check if user has already reported this channel recently (prevent spam)
    const { data: existingReport, error: checkError } = await supabase
      .from('channel_reports')
      .select('id, created_at')
      .eq('reporter_address', body.reporter_address)
      .eq('channel_id', body.channel_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single()

    // If table doesn't exist, skip the duplicate check
    if (checkError && checkError.code === '42P01') {
      console.warn('Channel reports table does not exist yet, skipping duplicate check')
    } else if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this channel recently. Please wait 24 hours before submitting another report.' },
        { status: 429 }
      )
    }

    // Prepare report data
    const reportData = {
      reporter_address: body.reporter_address,
      channel_id: body.channel_id,
      channel_name: body.channel_name,
      creator_address: body.creator_address,
      creator_name: body.creator_name || null,
      report_category: body.report_category,
      report_description: body.report_description.trim(),
      evidence_urls: body.evidence_urls || [],
      metadata: {
        ...body.metadata,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        submitted_at: new Date().toISOString()
      }
    }

    console.log('💾 Attempting to insert report data:', {
      reporter_address: reportData.reporter_address,
      channel_id: reportData.channel_id,
      channel_name: reportData.channel_name,
      report_category: reportData.report_category,
      description_length: reportData.report_description.length
    })

    // Insert the report
    const { data: report, error } = await supabase
      .from('channel_reports')
      .insert(reportData)
      .select()
      .single()

    console.log('📊 Database insert result:', {
      success: !error,
      error: error?.message,
      error_code: error?.code,
      report_id: report?.id
    })

    if (error) {
      console.error('Error creating channel report:', error)

      // Handle case where tables don't exist yet
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Channel reporting system is not yet available. Please contact the administrator to set up the database tables.' },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    // Send notification to admin about new report
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_address: ADMIN_ADDRESS,
          title: 'New Channel Report Submitted',
          message: `A new report has been submitted for channel "${body.channel_name}" (${body.report_category}). Please review in the admin dashboard.`,
          type: 'warning',
          category: 'system',
          priority: 3,
          action_url: '/admin/reports',
          action_label: 'Review Report',
          metadata: {
            report_id: report.id,
            channel_id: body.channel_id,
            report_category: body.report_category,
            reporter_address: body.reporter_address
          }
        })
      })
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError)
      // Don't fail the report submission if notification fails
    }

    // Log the report submission
    console.log('📢 New channel report submitted:', {
      report_id: report.id,
      channel_id: body.channel_id,
      channel_name: body.channel_name,
      category: body.report_category,
      reporter: body.reporter_address,
      timestamp: new Date().toISOString()
    })

    const response: ChannelReportResponse = {
      report: report as ChannelReport,
      message: 'Report submitted successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/channel-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/channel-reports
 * Get channel reports (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminAddress = searchParams.get('admin_address')
    const channelId = searchParams.get('channel_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate admin access
    if (adminAddress !== ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Build query - simplified to avoid join issues
    let query = supabase
      .from('channel_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reports, error } = await query

    console.log('📊 Admin reports query result:', {
      success: !error,
      error: error?.message,
      reports_count: reports?.length || 0,
      admin_address: adminAddress
    })

    if (error) {
      console.error('Error fetching channel reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('channel_reports')
      .select('status')

    const summary = {
      total_reports: stats?.length || 0,
      pending_reports: stats?.filter(r => r.status === 'pending').length || 0,
      under_review_reports: stats?.filter(r => r.status === 'under_review').length || 0,
      resolved_reports: stats?.filter(r => r.status === 'resolved').length || 0,
      dismissed_reports: stats?.filter(r => r.status === 'dismissed').length || 0
    }

    return NextResponse.json({
      reports: reports || [],
      summary,
      pagination: {
        limit,
        offset,
        has_more: (reports?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Error in GET /api/channel-reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
