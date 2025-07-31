'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAuth } from '@/data/auth'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Input validation schemas
const RecordTradingActivitySchema = z.object({
  type: z.enum(['buy', 'sell'], {
    required_error: 'Trade type is required'
  }),
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .regex(/^[A-Z0-9/]+$/, 'Symbol must contain only uppercase letters, numbers, and forward slashes'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount is too large'),
  price: z.number()
    .positive('Price must be positive')
    .max(1000000000, 'Price is too large'),
  profit: z.number()
    .min(-1000000000, 'Profit is too low')
    .max(1000000000, 'Profit is too high')
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
})

const UpdateTradingSettingsSchema = z.object({
  autoRecord: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  maxPositionSize: z.number()
    .positive('Max position size must be positive')
    .max(1000000000, 'Max position size is too large'),
  stopLossPercentage: z.number()
    .min(0, 'Stop loss percentage must be non-negative')
    .max(100, 'Stop loss percentage cannot exceed 100%'),
  takeProfitPercentage: z.number()
    .min(0, 'Take profit percentage must be non-negative')
    .max(1000, 'Take profit percentage is too high')
})

// Server Action: Record a new trading activity
export async function recordTradingActivity(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      type: formData.get('type'),
      symbol: formData.get('symbol'),
      amount: parseFloat(formData.get('amount') as string),
      price: parseFloat(formData.get('price') as string),
      profit: formData.get('profit') ? parseFloat(formData.get('profit') as string) : undefined,
      notes: formData.get('notes')
    }

    const validatedData = RecordTradingActivitySchema.parse(rawData)
    
    // Calculate profit if not provided
    let calculatedProfit = validatedData.profit
    if (calculatedProfit === undefined) {
      // Simple profit calculation (you might want to make this more sophisticated)
      calculatedProfit = validatedData.type === 'sell' 
        ? (validatedData.amount * validatedData.price) * 0.01 // Assume 1% profit for demo
        : 0
    }

    // Insert the trading activity
    const { data: activity, error: insertError } = await supabaseServer
      .from('trading_activities')
      .insert({
        user_address: user.address,
        activity_type: validatedData.type,
        symbol: validatedData.symbol,
        amount: validatedData.amount,
        price: validatedData.price,
        profit: calculatedProfit,
        notes: validatedData.notes,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError || !activity) {
      throw new Error('Failed to record trading activity')
    }

    // Update user's trading statistics
    await updateTradingStats(user.address, validatedData.type, calculatedProfit)

    // Revalidate trading pages
    revalidatePath('/trading')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')

    return { 
      success: true, 
      message: 'Trading activity recorded successfully',
      activityId: activity.id
    }
  } catch (error) {
    console.error('Error recording trading activity:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to record trading activity'
    }
  }
}

// Server Action: Update trading settings
export async function updateTradingSettings(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      autoRecord: formData.get('autoRecord') === 'true',
      riskLevel: formData.get('riskLevel'),
      maxPositionSize: parseFloat(formData.get('maxPositionSize') as string),
      stopLossPercentage: parseFloat(formData.get('stopLossPercentage') as string),
      takeProfitPercentage: parseFloat(formData.get('takeProfitPercentage') as string)
    }

    const validatedData = UpdateTradingSettingsSchema.parse(rawData)
    
    // Update or insert trading settings
    const { error } = await supabaseServer
      .from('user_trading_settings')
      .upsert({
        user_address: user.address,
        auto_record: validatedData.autoRecord,
        risk_level: validatedData.riskLevel,
        max_position_size: validatedData.maxPositionSize,
        stop_loss_percentage: validatedData.stopLossPercentage,
        take_profit_percentage: validatedData.takeProfitPercentage,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error('Failed to update trading settings')
    }

    // Revalidate settings page
    revalidatePath('/settings')
    revalidatePath('/trading')

    return { success: true, message: 'Trading settings updated successfully' }
  } catch (error) {
    console.error('Error updating trading settings:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update trading settings'
    }
  }
}

// Server Action: Delete trading activity
export async function deleteTradingActivity(activityId: string) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Validate activity ID
    if (!activityId || !z.string().uuid().safeParse(activityId).success) {
      throw new Error('Invalid activity ID')
    }

    // Get the activity to verify ownership and get profit for stats update
    const { data: activity, error: fetchError } = await supabaseServer
      .from('trading_activities')
      .select('user_address, activity_type, profit')
      .eq('id', activityId)
      .single()

    if (fetchError || !activity) {
      throw new Error('Trading activity not found')
    }

    // Verify ownership
    if (activity.user_address !== user.address) {
      throw new Error('Unauthorized: You can only delete your own trading activities')
    }

    // Delete the activity
    const { error: deleteError } = await supabaseServer
      .from('trading_activities')
      .delete()
      .eq('id', activityId)

    if (deleteError) {
      throw new Error('Failed to delete trading activity')
    }

    // Update trading stats (reverse the effect of this activity)
    await updateTradingStats(user.address, activity.activity_type, -activity.profit)

    // Revalidate trading pages
    revalidatePath('/trading')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')

    return { success: true, message: 'Trading activity deleted successfully' }
  } catch (error) {
    console.error('Error deleting trading activity:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete trading activity'
    }
  }
}

// Server Action: Follow/Unfollow a trader
export async function toggleFollowTrader(traderAddress: string) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Validate trader address
    if (!traderAddress || typeof traderAddress !== 'string') {
      throw new Error('Invalid trader address')
    }

    if (traderAddress === user.address) {
      throw new Error('You cannot follow yourself')
    }

    // Check if already following
    const { data: existingFollow } = await supabaseServer
      .from('trader_follows')
      .select('id')
      .eq('follower_address', user.address)
      .eq('trader_address', traderAddress)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabaseServer
        .from('trader_follows')
        .delete()
        .eq('follower_address', user.address)
        .eq('trader_address', traderAddress)

      if (error) {
        throw new Error('Failed to unfollow trader')
      }

      revalidatePath('/trading')
      revalidatePath('/leaderboard')
      
      return { success: true, message: 'Unfollowed trader successfully', following: false }
    } else {
      // Follow
      const { error } = await supabaseServer
        .from('trader_follows')
        .insert({
          follower_address: user.address,
          trader_address: traderAddress,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw new Error('Failed to follow trader')
      }

      revalidatePath('/trading')
      revalidatePath('/leaderboard')
      
      return { success: true, message: 'Following trader successfully', following: true }
    }
  } catch (error) {
    console.error('Error toggling follow trader:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update follow status'
    }
  }
}

// Helper function to update trading statistics
async function updateTradingStats(userAddress: string, tradeType: string, profit: number) {
  try {
    // Get current stats
    const { data: currentStats } = await supabaseServer
      .from('trading_stats')
      .select('*')
      .eq('user_address', userAddress)
      .single()

    const isWin = profit > 0
    const totalTrades = (currentStats?.total_trades || 0) + 1
    const totalProfit = (currentStats?.total_profit || 0) + profit
    const winCount = (currentStats?.win_count || 0) + (isWin ? 1 : 0)
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
    const bestTrade = Math.max(currentStats?.best_trade || 0, profit)
    const worstTrade = Math.min(currentStats?.worst_trade || 0, profit)
    const averageProfit = totalTrades > 0 ? totalProfit / totalTrades : 0

    // Update or insert stats
    await supabaseServer
      .from('trading_stats')
      .upsert({
        user_address: userAddress,
        total_trades: totalTrades,
        total_profit: totalProfit,
        win_count: winCount,
        win_rate: winRate,
        best_trade: bestTrade,
        worst_trade: worstTrade,
        average_profit: averageProfit,
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error updating trading stats:', error)
    // Don't throw here as the main operation succeeded
  }
}
