import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Simple in-memory cache for creators data
let creatorsCache: { data: any[], timestamp: number } | null = null
const CACHE_DURATION = 30 * 1000 // 30 seconds cache

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creatorData, userAddress } = body

    console.log('🔄 API: Creating creator for address:', userAddress)
    console.log('📝 API: Creator data:', creatorData)

    // Validate required fields
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      )
    }

    if (!creatorData) {
      return NextResponse.json(
        { error: 'Creator data is required' },
        { status: 400 }
      )
    }

    // Add timestamps
    const now = new Date().toISOString()
    const finalCreatorData = {
      ...creatorData,
      creator_address: userAddress,
      created_at: now,
      updated_at: now,
      last_active: now
    }

    console.log('💾 API: Inserting into database:', finalCreatorData)

    // Insert into database using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('creators')
      .upsert(finalCreatorData, { 
        onConflict: 'creator_address',
        ignoreDuplicates: false 
      })
      .select('*')
      .single()

    if (error) {
      console.error('❌ API: Database error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('✅ API: Creator created successfully:', data.id)

    // Invalidate cache when new creator is added
    creatorsCache = null

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('❌ API: Server error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Getting all creators')

    // Check cache first
    const now = Date.now()
    if (creatorsCache && (now - creatorsCache.timestamp) < CACHE_DURATION) {
      console.log('✅ API: Returning cached creators data')
      return NextResponse.json({
        success: true,
        data: creatorsCache.data,
        cached: true
      })
    }

    // Get all creators using admin client
    const { data, error } = await supabaseAdmin
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ API: Database error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    // Update cache
    creatorsCache = {
      data: data || [],
      timestamp: now
    }

    console.log(`✅ API: Retrieved ${data?.length || 0} creators (fresh from DB)`)

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('❌ API: Server error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
