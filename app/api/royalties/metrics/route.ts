import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { royaltiesService } from '@/lib/royalties-service'

// Initialize Supabase client with service key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching royalties metrics...')

    // Get ROYAL NFT holders count from blockchain
    const totalRoyalHolders = await royaltiesService.getRoyalHoldersCount()

    // Get wallet balance from blockchain
    const walletBalance = await royaltiesService.getRoyaltiesWalletBalance()

    // Get distribution data from database
    const { data: distributionSummary, error: summaryError } = await supabase
      .from('royalties_summary')
      .select('*')
      .single()

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching distribution summary:', summaryError)
    }

    // Get latest wallet snapshot
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('royalties_wallet_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (snapshotError && snapshotError.code !== 'PGRST116') {
      console.error('Error fetching latest snapshot:', snapshotError)
    }

    // Get weekly change (compare with snapshot from 7 days ago)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: weeklySnapshot, error: weeklyError } = await supabase
      .from('royalties_wallet_snapshots')
      .select('balance_sui')
      .lte('snapshot_date', weekAgo.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (weeklyError && weeklyError.code !== 'PGRST116') {
      console.error('Error fetching weekly snapshot:', weeklyError)
    }

    // Calculate weekly change
    const currentBalance = walletBalance.cumulative
    const weeklyBalance = weeklySnapshot?.balance_sui ? parseFloat(weeklySnapshot.balance_sui) : 0
    const weeklyChange = Math.max(0, currentBalance - weeklyBalance)

    // Prepare response data
    const metrics = {
      totalRoyalHolders,
      weeklyRoyaltiesAmount: weeklyChange,
      cumulativeRoyaltiesAmount: currentBalance,
      totalDistributed: distributionSummary?.total_distributed_sui ? 
        parseFloat(distributionSummary.total_distributed_sui) : 0,
      
      // Additional metrics for future use
      additionalData: {
        totalDistributions: distributionSummary?.total_distributions || 0,
        totalDistributedUSD: distributionSummary?.total_distributed_usd || 0,
        avgRecipientsPerDistribution: distributionSummary?.avg_recipients_per_distribution || 0,
        lastDistributionDate: distributionSummary?.last_distribution_date,
        uniqueRecipients: distributionSummary?.unique_recipients || 0,
        currentWalletBalanceUSD: latestSnapshot?.balance_usd || 0,
        lastSnapshotDate: latestSnapshot?.snapshot_date
      }
    }

    console.log('✅ Royalties metrics fetched successfully:', metrics)

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('❌ Error fetching royalties metrics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch royalties metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to manually trigger a wallet snapshot
export async function POST(request: NextRequest) {
  try {
    console.log('📸 Creating manual wallet snapshot...')

    // Get current wallet balance and metrics
    const [walletBalance, totalRoyalHolders] = await Promise.all([
      royaltiesService.getRoyaltiesWalletBalance(),
      royaltiesService.getRoyalHoldersCount()
    ])

    // Get total distributed amount
    const { data: distributionSummary } = await supabase
      .from('royalties_summary')
      .select('total_distributed_sui')
      .single()

    const totalDistributed = distributionSummary?.total_distributed_sui ? 
      parseFloat(distributionSummary.total_distributed_sui) : 0

    // Create snapshot record
    const { data: snapshot, error: snapshotError } = await supabase
      .from('royalties_wallet_snapshots')
      .insert({
        snapshot_date: new Date().toISOString().split('T')[0],
        wallet_address: process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || 
          '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4',
        balance_sui: walletBalance.cumulative,
        total_distributed_to_date: totalDistributed,
        royal_holders_count: totalRoyalHolders,
        snapshot_type: 'manual',
        metadata: {
          triggered_by: 'api',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (snapshotError) {
      throw snapshotError
    }

    console.log('✅ Manual snapshot created successfully:', snapshot)

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'Wallet snapshot created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating wallet snapshot:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create wallet snapshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
