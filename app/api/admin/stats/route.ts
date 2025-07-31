/**
 * Admin Statistics API
 * GET /api/admin/stats - Get platform overview statistics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin wallet address for authorization
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface AdminStats {
  totalUsers: number
  proUsers: number
  royalUsers: number
  nomadUsers: number
  latestReport: {
    id: string
    channel_name: string
    category: string
    status: string
    created_at: string
  } | null
}

/**
 * GET /api/admin/stats
 * Get platform overview statistics (admin only)
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

    // Fetch user statistics
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('role_tier')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      )
    }

    // Count users by tier
    const totalUsers = users?.length || 0
    const proUsers = users?.filter(user => user.role_tier === 'PRO').length || 0
    const royalUsers = users?.filter(user => user.role_tier === 'ROYAL').length || 0
    const nomadUsers = users?.filter(user => user.role_tier === 'NOMAD').length || 0

    // Fetch latest channel report
    const { data: latestReport, error: reportError } = await supabase
      .from('channel_reports')
      .select('id, channel_name, category, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('Error fetching latest report:', reportError)
    }

    const stats: AdminStats = {
      totalUsers,
      proUsers,
      royalUsers,
      nomadUsers,
      latestReport: latestReport || null
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
