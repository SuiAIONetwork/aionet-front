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

// Admin and treasury wallet addresses
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
const TREASURY_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
const ROYALTIES_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

/**
 * GET /api/admin/paion-stats
 * Get comprehensive pAION token statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching pAION token statistics...')

    // Get all balances and calculate statistics
    const { data: balances, error: balancesError } = await supabaseAdmin
      .from('paion_balances')
      .select('user_address, balance, total_earned, total_spent')
      .order('balance', { ascending: false })

    if (balancesError) {
      throw balancesError
    }

    if (!balances || balances.length === 0) {
      console.log('⚠️ No pAION balances found')
      return NextResponse.json({
        success: true,
        stats: {
          totalSupply: 0,
          circulatingSupply: 0,
          totalHolders: 0,
          averageBalance: 0,
          topHolders: [],
          treasuryBalance: 0,
          royaltiesBalance: 0
        }
      })
    }

    // Calculate basic statistics
    const totalSupply = balances.reduce((sum, record) => sum + (record.balance || 0), 0)
    const totalHolders = balances.length
    const averageBalance = totalSupply / totalHolders

    // Get treasury and royalties balances
    const treasuryBalance = balances.find(b => b.user_address === TREASURY_ADDRESS)?.balance || 0
    const royaltiesBalance = balances.find(b => b.user_address === ROYALTIES_ADDRESS)?.balance || 0

    // Calculate circulating supply (total supply minus treasury and royalties)
    const circulatingSupply = totalSupply - treasuryBalance - royaltiesBalance

    // Get top 10 holders with percentages
    const topHolders = balances
      .slice(0, 10)
      .map(holder => ({
        address: holder.user_address,
        balance: holder.balance || 0,
        percentage: totalSupply > 0 ? ((holder.balance || 0) / totalSupply) * 100 : 0
      }))

    const stats = {
      totalSupply: Math.round(totalSupply * 100) / 100, // Round to 2 decimal places
      circulatingSupply: Math.round(circulatingSupply * 100) / 100,
      totalHolders,
      averageBalance: Math.round(averageBalance * 100) / 100,
      topHolders,
      treasuryBalance: Math.round(treasuryBalance * 100) / 100,
      royaltiesBalance: Math.round(royaltiesBalance * 100) / 100
    }

    console.log('✅ pAION stats calculated:', {
      totalSupply: stats.totalSupply,
      totalHolders: stats.totalHolders,
      circulatingSupply: stats.circulatingSupply,
      treasuryBalance: stats.treasuryBalance
    })

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('💥 Error fetching pAION stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
