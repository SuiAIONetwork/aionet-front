/**
 * pAION Token Service
 * Manages pAION token operations including balance management, transfers, and transaction history
 */

import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Initialize Supabase client with service role for server-side operations
// Note: This will only work on the server side where SUPABASE_SERVICE_ROLE_KEY is available
const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use regular client for now
    return supabase
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not available, falling back to regular client')
    return supabase
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { persistSession: false }
    }
  )
}

// Regular client for client-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PaionBalance {
  id: string
  user_address: string
  balance: number
  locked_balance: number
  total_earned: number
  total_spent: number
  last_transaction_at: string | null
  created_at: string
  updated_at: string
}

export interface PaionTransaction {
  id: string
  user_address: string
  transaction_type: 'earned' | 'spent' | 'transfer_in' | 'transfer_out' | 'locked' | 'unlocked'
  amount: number
  balance_before: number
  balance_after: number
  description: string
  source_type: 'achievement' | 'level_reward' | 'quiz' | 'swap' | 'marketplace' | 'referral' | 'manual' | 'transfer'
  source_id?: string
  metadata: Record<string, any>
  transaction_hash?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface TokenOperationResult {
  success: boolean
  balance?: number
  transaction?: PaionTransaction
  error?: string
}

export interface TransactionHistory {
  transactions: PaionTransaction[]
  totalCount: number
  hasMore: boolean
}

export class PaionTokenService {
  /**
   * Get user's pAION balance
   */
  async getBalance(userAddress: string): Promise<number> {
    try {
      // Use API route for client-side requests to bypass RLS issues
      if (typeof window !== 'undefined') {
        const response = await fetch(`/api/paion/balance?address=${encodeURIComponent(userAddress)}`)
        const result = await response.json()

        if (result.success) {
          return result.balance || 0
        } else {
          console.error('API error fetching balance:', result.error)
          return 0
        }
      }

      // Server-side: use direct database query
      const { data, error } = await supabase
        .from('paion_balances')
        .select('balance')
        .eq('user_address', userAddress)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No balance record found, return 0
          return 0
        }
        throw error
      }

      return data?.balance || 0
    } catch (error) {
      console.error('Error fetching pAION balance:', error)
      return 0
    }
  }

  /**
   * Get detailed balance information
   */
  async getDetailedBalance(userAddress: string): Promise<PaionBalance | null> {
    try {
      // Use API route for client-side requests
      if (typeof window !== 'undefined') {
        const response = await fetch(`/api/paion/balance?address=${encodeURIComponent(userAddress)}`)
        const result = await response.json()

        if (result.success) {
          return {
            id: '', // Not needed for client-side
            user_address: userAddress,
            balance: result.balance || 0,
            locked_balance: 0, // Not implemented yet
            total_earned: result.total_earned || 0,
            total_spent: result.total_spent || 0,
            last_transaction_at: result.updated_at || null,
            created_at: result.updated_at || new Date().toISOString(),
            updated_at: result.updated_at || new Date().toISOString()
          }
        } else {
          console.error('API error fetching detailed balance:', result.error)
          return null
        }
      }

      // Server-side: use direct database query
      const { data, error } = await supabase
        .from('paion_balances')
        .select('*')
        .eq('user_address', userAddress)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching detailed pAION balance:', error)
      return null
    }
  }

  /**
   * Add pAION tokens to user's balance
   */
  async addTokens(
    userAddress: string,
    amount: number,
    description: string,
    sourceType: PaionTransaction['source_type'],
    sourceId?: string,
    metadata: Record<string, any> = {}
  ): Promise<TokenOperationResult> {
    try {
      console.log(`💰 Adding ${amount} pAION to ${userAddress}`)

      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.rpc('update_paion_balance', {
        user_addr: userAddress,
        amount_change: amount,
        trans_type: 'earned',
        description_text: description,
        source_type_val: sourceType,
        source_id_val: sourceId,
        metadata_val: metadata
      })

      if (error) {
        console.error('Error adding pAION tokens:', error)
        return { success: false, error: error.message }
      }

      // Get updated balance
      const newBalance = await this.getBalance(userAddress)

      // Get the transaction record
      const { data: transaction } = await supabase
        .from('paion_transactions')
        .select('*')
        .eq('user_address', userAddress)
        .eq('source_type', sourceType)
        .eq('source_id', sourceId || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      toast.success(`Earned ${amount} pAION tokens!`)

      return {
        success: true,
        balance: newBalance,
        transaction: transaction || undefined
      }
    } catch (error) {
      console.error('Error adding pAION tokens:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to add pAION tokens: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Spend pAION tokens from user's balance
   */
  async spendTokens(
    userAddress: string,
    amount: number,
    description: string,
    sourceType: PaionTransaction['source_type'],
    sourceId?: string,
    metadata: Record<string, any> = {}
  ): Promise<TokenOperationResult> {
    try {
      console.log(`💸 Spending ${amount} pAION from ${userAddress}`)

      // Check if user has sufficient balance
      const currentBalance = await this.getBalance(userAddress)
      if (currentBalance < amount) {
        const errorMessage = `Insufficient pAION balance. Current: ${currentBalance}, Required: ${amount}`
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.rpc('update_paion_balance', {
        user_addr: userAddress,
        amount_change: -amount,
        trans_type: 'spent',
        description_text: description,
        source_type_val: sourceType,
        source_id_val: sourceId,
        metadata_val: metadata
      })

      if (error) {
        console.error('Error spending pAION tokens:', error)
        return { success: false, error: error.message }
      }

      // Get updated balance
      const newBalance = await this.getBalance(userAddress)

      // Get the transaction record
      const { data: transaction } = await supabase
        .from('paion_transactions')
        .select('*')
        .eq('user_address', userAddress)
        .eq('source_type', sourceType)
        .eq('source_id', sourceId || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      toast.success(`Spent ${amount} pAION tokens!`)

      return {
        success: true,
        balance: newBalance,
        transaction: transaction || undefined
      }
    } catch (error) {
      console.error('Error spending pAION tokens:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to spend pAION tokens: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(
    userAddress: string,
    limit: number = 20,
    offset: number = 0,
    transactionType?: PaionTransaction['transaction_type']
  ): Promise<TransactionHistory> {
    try {
      // Use API route for client-side requests
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams({
          address: userAddress,
          limit: limit.toString(),
          offset: offset.toString()
        })

        if (transactionType) {
          params.append('type', transactionType)
        }

        const response = await fetch(`/api/paion/transactions?${params}`)
        const result = await response.json()

        if (result.success) {
          return {
            transactions: result.transactions || [],
            totalCount: result.totalCount || 0,
            hasMore: result.hasMore || false
          }
        } else {
          console.error('API error fetching transactions:', result.error)
          return {
            transactions: [],
            totalCount: 0,
            hasMore: false
          }
        }
      }

      // Server-side: use direct database query
      let query = supabase
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

      return {
        transactions: data || [],
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      return {
        transactions: [],
        totalCount: 0,
        hasMore: false
      }
    }
  }

  /**
   * Get recent transactions (last 5)
   */
  async getRecentTransactions(userAddress: string): Promise<PaionTransaction[]> {
    const history = await this.getTransactionHistory(userAddress, 5, 0)
    return history.transactions
  }

  /**
   * Initialize user's pAION balance (create record if doesn't exist)
   */
  async initializeBalance(userAddress: string): Promise<boolean> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('paion_balances')
        .insert({
          user_address: userAddress,
          balance: 0,
          locked_balance: 0,
          total_earned: 0,
          total_spent: 0
        })

      if (error && error.code !== '23505') { // Ignore unique constraint violation
        console.error('Error initializing pAION balance:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error initializing pAION balance:', error)
      return false
    }
  }

  /**
   * Get total pAION statistics
   */
  async getTotalStats(): Promise<{
    totalSupply: number
    totalUsers: number
    totalTransactions: number
  }> {
    try {
      const [balanceResult, transactionResult] = await Promise.all([
        supabase
          .from('paion_balances')
          .select('balance', { count: 'exact' }),
        supabase
          .from('paion_transactions')
          .select('id', { count: 'exact' })
      ])

      const totalSupply = balanceResult.data?.reduce((sum, record) => sum + (record.balance || 0), 0) || 0
      const totalUsers = balanceResult.count || 0
      const totalTransactions = transactionResult.count || 0

      return {
        totalSupply,
        totalUsers,
        totalTransactions
      }
    } catch (error) {
      console.error('Error fetching pAION stats:', error)
      return {
        totalSupply: 0,
        totalUsers: 0,
        totalTransactions: 0
      }
    }
  }

  /**
   * Migrate points to pAION (one-time migration)
   */
  async migratePointsToPaion(): Promise<boolean> {
    try {
      console.log('🔄 Starting points to pAION migration...')

      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.rpc('migrate_points_to_paion')

      if (error) {
        console.error('Migration error:', error)
        return false
      }

      console.log('✅ Points to pAION migration completed successfully')
      return true
    } catch (error) {
      console.error('Error during migration:', error)
      return false
    }
  }
}

// Export singleton instance
export const paionTokenService = new PaionTokenService()


