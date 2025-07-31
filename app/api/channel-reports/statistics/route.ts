/**
 * Channel Report Statistics API
 * GET /api/channel-reports/statistics - Get channel report statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ChannelReportStatistics } from '@/types/channel-reports'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/channel-reports/statistics
 * Get channel report statistics for public display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channel_id')
    const channelIds = searchParams.get('channel_ids')?.split(',')

    if (channelId) {
      // Get statistics for a single channel
      const { data: stats, error } = await supabase
        .from('channel_report_statistics')
        .select('*')
        .eq('channel_id', channelId)
        .single()

      if (error) {
        // PGRST116 = no rows returned, 42P01 = table doesn't exist
        if (error.code === 'PGRST116') {
          // No rows found - return null
        } else if (error.code === '42P01') {
          // Table doesn't exist yet - return empty statistics
          console.warn('Channel reports tables not yet created')
          return NextResponse.json({
            statistics: null
          })
        } else {
          console.error('Error fetching channel statistics:', error)
          return NextResponse.json(
            { error: 'Failed to fetch channel statistics' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        statistics: stats as ChannelReportStatistics | null
      })

    } else if (channelIds && channelIds.length > 0) {
      // Get statistics for multiple channels
      console.log('🔍 Fetching statistics for channels:', {
        channelIds: channelIds.slice(0, 3), // Show first 3 for debugging
        totalChannels: channelIds.length
      })

      const { data: stats, error } = await supabase
        .from('channel_report_statistics')
        .select('*')
        .in('channel_id', channelIds)

      console.log('📊 Statistics query result:', {
        success: !error,
        error: error?.message,
        statsCount: stats?.length || 0,
        stats: stats?.slice(0, 2) // Show first 2 for debugging
      })

      if (error) {
        // Handle table not existing yet
        if (error.code === '42P01') {
          console.warn('Channel reports tables not yet created')
          return NextResponse.json({
            statistics: {}
          })
        }
        console.error('Error fetching multiple channel statistics:', error)
        return NextResponse.json(
          { error: 'Failed to fetch channel statistics' },
          { status: 500 }
        )
      }

      // Create a map for easy lookup
      const statsMap: Record<string, ChannelReportStatistics> = {}
      stats?.forEach(stat => {
        statsMap[stat.channel_id] = stat as ChannelReportStatistics
      })

      console.log('📈 Final statistics map:', {
        mapKeys: Object.keys(statsMap),
        mapSize: Object.keys(statsMap).length
      })

      return NextResponse.json({
        statistics: statsMap
      })

    } else {
      // Get all flagged channels for admin overview
      const { data: flaggedChannels, error } = await supabase
        .from('channel_report_statistics')
        .select('*')
        .eq('is_flagged', true)
        .order('total_reports', { ascending: false })
        .limit(50)

      if (error) {
        // Handle table not existing yet
        if (error.code === '42P01') {
          console.warn('Channel reports tables not yet created')
          return NextResponse.json({
            flagged_channels: [],
            summary: {
              total_channels_with_reports: 0,
              flagged_channels: 0,
              high_warning_channels: 0,
              medium_warning_channels: 0,
              low_warning_channels: 0,
              total_reports_across_all_channels: 0
            }
          })
        }
        console.error('Error fetching flagged channels:', error)
        return NextResponse.json(
          { error: 'Failed to fetch flagged channels' },
          { status: 500 }
        )
      }

      // Get summary statistics
      const { data: allStats, error: summaryError } = await supabase
        .from('channel_report_statistics')
        .select('total_reports, is_flagged, warning_level')

      if (summaryError) {
        // Handle table not existing yet
        if (summaryError.code === '42P01') {
          console.warn('Channel reports tables not yet created')
          return NextResponse.json({
            flagged_channels: [],
            summary: {
              total_channels_with_reports: 0,
              flagged_channels: 0,
              high_warning_channels: 0,
              medium_warning_channels: 0,
              low_warning_channels: 0,
              total_reports_across_all_channels: 0
            }
          })
        }
        console.error('Error fetching summary statistics:', summaryError)
        return NextResponse.json(
          { error: 'Failed to fetch summary statistics' },
          { status: 500 }
        )
      }

      const summary = {
        total_channels_with_reports: allStats?.length || 0,
        flagged_channels: allStats?.filter(s => s.is_flagged).length || 0,
        high_warning_channels: allStats?.filter(s => s.warning_level === 'high').length || 0,
        medium_warning_channels: allStats?.filter(s => s.warning_level === 'medium').length || 0,
        low_warning_channels: allStats?.filter(s => s.warning_level === 'low').length || 0,
        total_reports_across_all_channels: allStats?.reduce((sum, s) => sum + s.total_reports, 0) || 0
      }

      return NextResponse.json({
        flagged_channels: flaggedChannels as ChannelReportStatistics[],
        summary
      })
    }

  } catch (error) {
    console.error('Error in GET /api/channel-reports/statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
