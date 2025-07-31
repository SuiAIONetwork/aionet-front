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
 * GET /api/paion/balance?address=0x...
 * Get pAION balance for a user address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')

    if (!userAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'User address is required' 
      }, { status: 400 })
    }

    console.log(`🔍 Getting pAION balance for: ${userAddress}`)

    // Get balance from paion_balances table
    const { data, error } = await supabaseAdmin
      .from('paion_balances')
      .select('balance, total_earned, total_spent, updated_at')
      .eq('user_address', userAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No balance record found, return 0
        console.log(`📊 No balance record found for ${userAddress}, returning 0`)
        return NextResponse.json({
          success: true,
          balance: 0,
          total_earned: 0,
          total_spent: 0
        })
      }
      throw error
    }

    console.log(`💰 Balance found: ${data.balance} pAION for ${userAddress}`)

    return NextResponse.json({
      success: true,
      balance: parseFloat(data.balance || '0'),
      total_earned: parseFloat(data.total_earned || '0'),
      total_spent: parseFloat(data.total_spent || '0'),
      updated_at: data.updated_at
    })

  } catch (error) {
    console.error('❌ Error fetching pAION balance:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
