import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

interface SyncResult {
  creator_address: string
  old_count: number
  new_count: number
  change_amount: number
}

interface SyncResponse {
  success: boolean
  message: string
  results?: SyncResult[]
  summary?: {
    total_creators: number
    creators_updated: number
    total_change: number
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      creator_address = null,
      force_recalculate = false
    } = body

    console.log('🔄 Starting subscriber count sync:', {
      creator_address,
      force_recalculate
    })

    const supabase = getSupabaseServer()

    if (creator_address) {
      // Sync specific creator
      const { data, error } = await supabase
        .rpc('update_creator_subscriber_count', {
          creator_addr: creator_address
        })

      if (error) {
        console.error('❌ Error syncing specific creator:', error)
        return NextResponse.json({
          success: false,
          message: 'Failed to sync subscriber count for specific creator',
          error: error.message
        } as SyncResponse, { status: 500 })
      }

      // Get breakdown for the creator
      const { data: breakdown, error: breakdownError } = await supabase
        .rpc('get_creator_subscriber_breakdown', {
          creator_addr: creator_address
        })

      return NextResponse.json({
        success: true,
        message: `Successfully updated subscriber count for creator ${creator_address}`,
        results: [{
          creator_address,
          old_count: 0, // We don't have the old count for single updates
          new_count: data,
          change_amount: 0
        }],
        breakdown: breakdown?.[0] || null,
        summary: {
          total_creators: 1,
          creators_updated: 1,
          total_change: 0
        }
      } as SyncResponse)
    } else {
      // Sync all creators
      const { data, error } = await supabase
        .rpc('recalculate_all_subscriber_counts')

      if (error) {
        console.error('❌ Error syncing all creators:', error)
        return NextResponse.json({
          success: false,
          message: 'Failed to sync subscriber counts',
          error: error.message
        } as SyncResponse, { status: 500 })
      }

      const results = data as SyncResult[]
      const creatorsUpdated = results.filter(r => r.change_amount !== 0).length
      const totalChange = results.reduce((sum, r) => sum + Math.abs(r.change_amount), 0)

      console.log('✅ Subscriber count sync completed:', {
        total_creators: results.length,
        creators_updated: creatorsUpdated,
        total_change: totalChange
      })

      return NextResponse.json({
        success: true,
        message: `Successfully synced subscriber counts for ${results.length} creators`,
        results,
        summary: {
          total_creators: results.length,
          creators_updated: creatorsUpdated,
          total_change: totalChange
        }
      } as SyncResponse)
    }
  } catch (error) {
    console.error('❌ Unexpected error in subscriber count sync:', error)
    return NextResponse.json({
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as SyncResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creator_address = searchParams.get('creator_address')

    const supabase = getSupabaseServer()

    if (creator_address) {
      // Get breakdown for specific creator
      const { data: breakdown, error } = await supabase
        .rpc('get_creator_subscriber_breakdown', {
          creator_addr: creator_address
        })

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to get creator breakdown',
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        creator_address,
        breakdown: breakdown?.[0] || null
      })
    } else {
      // Get audit view of all creators
      const { data: audit, error } = await supabase
        .from('creator_subscriber_audit')
        .select('*')
        .order('count_difference', { ascending: false })

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to get subscriber audit',
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Subscriber count audit retrieved',
        audit
      })
    }
  } catch (error) {
    console.error('❌ Error in GET subscriber count sync:', error)
    return NextResponse.json({
      success: false,
      message: 'Unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
