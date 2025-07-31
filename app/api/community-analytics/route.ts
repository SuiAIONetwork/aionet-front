/**
 * Community Analytics API
 * GET /api/community-analytics - Get real-time community statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CommunityAnalytics {
  totalHolders: number
  nomadUsers: number
  proHolders: number
  royalHolders: number
  targetHolders: number
  dewhaleTargetHolders: number
  monthlyGrowth: string
  lastUpdated: string
}

/**
 * GET /api/community-analytics
 * Get real-time community statistics from database
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching community analytics from database...')

    // Get all user profiles with role tiers
    const { data: userProfiles, error } = await supabase
      .from('user_profiles')
      .select('role_tier, created_at')
      .not('role_tier', 'is', null)

    if (error) {
      console.error('Error fetching user profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch community analytics' },
        { status: 500 }
      )
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('No user profiles found')
      return NextResponse.json({
        totalHolders: 0,
        nomadUsers: 0,
        proHolders: 0,
        royalHolders: 0,
        targetHolders: 1100, // Static target
        dewhaleTargetHolders: 500, // Static target
        monthlyGrowth: "+0%",
        lastUpdated: new Date().toISOString()
      })
    }

    // Count users by role tier
    const totalHolders = userProfiles.length
    const nomadUsers = userProfiles.filter(user => user.role_tier === 'NOMAD').length
    const proHolders = userProfiles.filter(user => user.role_tier === 'PRO').length
    const royalHolders = userProfiles.filter(user => user.role_tier === 'ROYAL').length

    // Calculate monthly growth (users created in the last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentUsers = userProfiles.filter(user => 
      new Date(user.created_at) >= thirtyDaysAgo
    ).length

    const previousMonthUsers = userProfiles.filter(user => {
      const createdAt = new Date(user.created_at)
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
    }).length

    let monthlyGrowth = "+0%"
    if (previousMonthUsers > 0) {
      const growthRate = ((recentUsers - previousMonthUsers) / previousMonthUsers) * 100
      monthlyGrowth = growthRate >= 0 ? `+${growthRate.toFixed(1)}%` : `${growthRate.toFixed(1)}%`
    } else if (recentUsers > 0) {
      monthlyGrowth = "+100%"
    }

    const analytics: CommunityAnalytics = {
      totalHolders,
      nomadUsers,
      proHolders,
      royalHolders,
      targetHolders: 1100, // Static target
      dewhaleTargetHolders: 500, // Static target for DEWhale deployment
      monthlyGrowth,
      lastUpdated: new Date().toISOString()
    }

    console.log('📊 Community analytics:', {
      totalHolders,
      nomadUsers,
      proHolders,
      royalHolders,
      monthlyGrowth,
      recentUsers,
      previousMonthUsers
    })

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error in GET /api/community-analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
