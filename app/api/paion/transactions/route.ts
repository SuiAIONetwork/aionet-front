import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false }
  }
)

/**
 * GET /api/paion/transactions?address=0x...&limit=10&offset=0
 * Get pAION transaction history for a user address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const transactionType = searchParams.get('type')

    if (!userAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'User address is required' 
      }, { status: 400 })
    }

    console.log(`📜 Getting pAION transactions for: ${userAddress} (limit: ${limit}, offset: ${offset})`)

    let query = supabaseAdmin
      .from('paion_transactions')
      .select('*', { count: 'exact' })
      .eq('user_address', userAddress)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    console.log(`📊 Found ${data?.length || 0} transactions for ${userAddress}`)

    return NextResponse.json({
      success: true,
      transactions: data || [],
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('❌ Error fetching pAION transactions:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
