import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/affiliate/stats
 * Get affiliate statistics and metrics
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, '/api/affiliate/stats', async () => {
    try {
      console.log('🔄 Affiliate stats API called')

      // Get user address and token from headers
      const userAddress = request.headers.get('x-user-address') || 'demo-user'
      const authToken = request.headers.get('authorization')

      console.log('👤 User address for affiliate stats:', userAddress)
      console.log('🔑 Has auth token:', !!authToken)

      // Try to call edge function with user's JWT token
      // Use local backend URL for development
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
      const edgeFunctionUrl = `${backendUrl}/affiliate-stats`

      if (authToken) {
        try {
          console.log('🔄 Calling affiliate-stats edge function with user token')
          const response = await fetch(edgeFunctionUrl, {
            method: 'GET',
            headers: {
              'Authorization': authToken,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Content-Type': 'application/json',
              'X-User-Address': userAddress
            }
          })

          if (response.ok) {
            const data = await response.json()
            console.log('✅ Edge function success:', data)
            return NextResponse.json(data)
          } else {
            const errorText = await response.text()
            console.error('Edge function error:', errorText)
          }
        } catch (edgeError) {
          console.error('Edge function call failed:', edgeError)
        }
      }

      console.log('📊 Using mock data fallback')

      // Fallback to mock data if edge function fails or is not available
      console.log('📊 Using mock affiliate stats data')
      const affiliateStats = {
        success: true,
        data: {
          // Network metrics
          totalNetworkSize: 25,
          directReferrals: 8,
          indirectReferrals: 17,
          networkDepth: 3,
          monthlyGrowth: 15,
          networkValue: 1250,

          // User breakdown
          personalNomadUsers: 5,
          personalProUsers: 2,
          personalRoyalUsers: 1,
          networkNomadUsers: 12,
          networkProUsers: 4,
          networkRoyalUsers: 1,

          // Profile level breakdown
          networkLevel5Users: 3,
          networkLevel6Users: 2,
          networkLevel7Users: 1,
          networkLevel8Users: 1,
          networkLevel9Users: 0,
          networkLevel10Users: 0,

          // Commission data
          totalEarned: 125.50,
          monthlyEarned: 45.25,
          pendingCommissions: 15.75,
          paidCommissions: 109.75,
          commissionRate: 0.05,
          totalCommissions: 125.50,

          // Performance metrics
          performanceMetrics: {
            clickThroughRate: 12.5,
            conversionRate: 8.3,
            averageOrderValue: 85.50
          },

          // Tier breakdown
          tierBreakdown: {
            nomadCommissions: 45.25,
            proCommissions: 65.50,
            royalCommissions: 14.75
          },

          // Recent transactions (empty for now)
          recentTransactions: [],

          // Affiliate users list (empty for now)
          affiliateUsers: [],
          totalCount: 0,

          // User profile level
          userProfileLevel: {
            level: 1,
            name: 'Starter',
            requirements: {
              minReferrals: 0,
              minCommissions: 0,
              minNetworkSize: 0
            },
            benefits: ['Basic access'],
            commissionRate: 0.05,
            bonuses: {}
          }
        },
        message: 'Affiliate statistics retrieved successfully (mock data)'
      }

      return NextResponse.json(affiliateStats)

    } catch (error) {
      console.error('Error fetching affiliate stats:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch affiliate statistics',
          message: 'An error occurred while retrieving affiliate data'
        },
        { status: 500 }
      )
    }
  })
}
