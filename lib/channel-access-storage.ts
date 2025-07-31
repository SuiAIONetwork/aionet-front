/**
 * Channel Access Storage Service
 * Manages database-based channel access instead of localStorage
 */

import { createClient } from '@supabase/supabase-js'

// Database interfaces
interface ChannelAccessRecord {
  id: string
  user_address: string
  creator_id: string
  channel_id: string
  access_type: 'paid' | 'free_premium' | 'subscription'
  price_paid: number
  granted_date: string
  expiry_date: string
  last_accessed: string
  created_at: string
  updated_at: string
}

interface PremiumAccessRecord {
  id: string
  user_address: string
  creator_id: string
  channel_id: string
  tier: 'PRO' | 'ROYAL'
  accessed_date: string
  created_at: string
}

// UI-friendly interfaces
export interface UserChannelAccess {
  creatorId: string
  channelId: string
  accessType: 'paid' | 'free_premium' | 'subscription'
  pricePaid: number
  grantedDate: Date
  expiryDate: Date
  lastAccessed: Date
  isActive: boolean
  daysRemaining: number
}

export interface UserPremiumAccess {
  creatorId: string
  channelId: string
  tier: 'PRO' | 'ROYAL'
  accessedDate: Date
}

class ChannelAccessStorage {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Get all active channel access for a user
   */
  async getUserChannelAccess(userAddress: string): Promise<UserChannelAccess[]> {
    try {
      console.log('📺 Fetching channel access for user:', userAddress)

      const { data, error } = await this.supabase
        .from('channel_access')
        .select('*')
        .eq('user_address', userAddress)
        .gt('expiry_date', new Date().toISOString()) // Only active access
        .order('granted_date', { ascending: false })

      if (error) {
        console.error('❌ Error fetching channel access:', error)
        throw error
      }

      const accessRecords: UserChannelAccess[] = (data || []).map((record: ChannelAccessRecord) => {
        const expiryDate = new Date(record.expiry_date)
        const now = new Date()
        const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          creatorId: record.creator_id,
          channelId: record.channel_id,
          accessType: record.access_type,
          pricePaid: record.price_paid,
          grantedDate: new Date(record.granted_date),
          expiryDate,
          lastAccessed: new Date(record.last_accessed),
          isActive: expiryDate > now,
          daysRemaining
        }
      })

      console.log(`✅ Found ${accessRecords.length} active channel access records`)
      return accessRecords

    } catch (error) {
      console.error('❌ Failed to fetch user channel access:', error)
      throw error
    }
  }

  /**
   * Grant channel access to a user
   */
  async grantChannelAccess(
    userAddress: string,
    creatorId: string,
    channelId: string,
    accessType: 'paid' | 'free_premium' | 'subscription',
    expiryDate: Date,
    pricePaid: number = 0
  ): Promise<void> {
    try {
      console.log(`🔑 Granting ${accessType} access to ${creatorId}_${channelId} for user ${userAddress}`)

      const { error } = await this.supabase
        .from('channel_access')
        .upsert({
          user_address: userAddress,
          creator_id: creatorId,
          channel_id: channelId,
          access_type: accessType,
          price_paid: pricePaid,
          expiry_date: expiryDate.toISOString(),
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'user_address,creator_id,channel_id'
        })

      if (error) {
        console.error('❌ Error granting channel access:', error)
        throw error
      }

      console.log('✅ Channel access granted successfully')

    } catch (error) {
      console.error('❌ Failed to grant channel access:', error)
      throw error
    }
  }

  /**
   * Remove channel access for a user
   */
  async removeChannelAccess(userAddress: string, creatorId: string, channelId: string): Promise<void> {
    try {
      console.log(`🗑️ Removing channel access for ${creatorId}_${channelId} from user ${userAddress}`)

      const { error } = await this.supabase
        .from('channel_access')
        .delete()
        .eq('user_address', userAddress)
        .eq('creator_id', creatorId)
        .eq('channel_id', channelId)

      if (error) {
        console.error('❌ Error removing channel access:', error)
        throw error
      }

      console.log('✅ Channel access removed successfully')

    } catch (error) {
      console.error('❌ Failed to remove channel access:', error)
      throw error
    }
  }

  /**
   * Check if user has access to a specific channel
   */
  async hasChannelAccess(userAddress: string, creatorId: string, channelId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('channel_access')
        .select('expiry_date')
        .eq('user_address', userAddress)
        .eq('creator_id', creatorId)
        .eq('channel_id', channelId)
        .gt('expiry_date', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking channel access:', error)
        throw error
      }

      return !!data

    } catch (error) {
      console.error('❌ Failed to check channel access:', error)
      return false
    }
  }

  /**
   * Get premium access records for a user
   */
  async getUserPremiumAccess(userAddress: string): Promise<UserPremiumAccess[]> {
    try {
      console.log('🎖️ Fetching premium access records for user:', userAddress)

      const { data, error } = await this.supabase
        .from('premium_access_records')
        .select('*')
        .eq('user_address', userAddress)
        .order('accessed_date', { ascending: false })

      if (error) {
        console.error('❌ Error fetching premium access records:', error)
        throw error
      }

      const premiumRecords: UserPremiumAccess[] = (data || []).map((record: PremiumAccessRecord) => ({
        creatorId: record.creator_id,
        channelId: record.channel_id,
        tier: record.tier,
        accessedDate: new Date(record.accessed_date)
      }))

      console.log(`✅ Found ${premiumRecords.length} premium access records`)
      return premiumRecords

    } catch (error) {
      console.error('❌ Failed to fetch premium access records:', error)
      throw error
    }
  }

  /**
   * Record premium access usage
   */
  async recordPremiumAccess(
    userAddress: string,
    creatorId: string,
    channelId: string,
    tier: 'PRO' | 'ROYAL'
  ): Promise<void> {
    try {
      console.log(`🎖️ Recording premium access for ${creatorId}_${channelId} by ${tier} user ${userAddress}`)

      const { error } = await this.supabase
        .from('premium_access_records')
        .upsert({
          user_address: userAddress,
          creator_id: creatorId,
          channel_id: channelId,
          tier,
          accessed_date: new Date().toISOString()
        }, {
          onConflict: 'user_address,creator_id,channel_id'
        })

      if (error) {
        console.error('❌ Error recording premium access:', error)
        throw error
      }

      console.log('✅ Premium access recorded successfully')

    } catch (error) {
      console.error('❌ Failed to record premium access:', error)
      throw error
    }
  }

  /**
   * Remove premium access record
   */
  async removePremiumAccess(userAddress: string, creatorId: string, channelId: string): Promise<void> {
    try {
      console.log(`🗑️ Removing premium access record for ${creatorId}_${channelId} from user ${userAddress}`)

      const { error } = await this.supabase
        .from('premium_access_records')
        .delete()
        .eq('user_address', userAddress)
        .eq('creator_id', creatorId)
        .eq('channel_id', channelId)

      if (error) {
        console.error('❌ Error removing premium access record:', error)
        throw error
      }

      console.log('✅ Premium access record removed successfully')

    } catch (error) {
      console.error('❌ Failed to remove premium access record:', error)
      throw error
    }
  }

  /**
   * Update last accessed time for channel access
   */
  async updateLastAccessed(userAddress: string, creatorId: string, channelId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('channel_access')
        .update({ last_accessed: new Date().toISOString() })
        .eq('user_address', userAddress)
        .eq('creator_id', creatorId)
        .eq('channel_id', channelId)

      if (error) {
        console.error('❌ Error updating last accessed:', error)
        // Don't throw error for this non-critical operation
      }

    } catch (error) {
      console.error('❌ Failed to update last accessed:', error)
      // Don't throw error for this non-critical operation
    }
  }
}

// Export singleton
export const channelAccessStorage = new ChannelAccessStorage()

// Helper functions for React components
export async function getUserChannelAccess(userAddress: string): Promise<UserChannelAccess[]> {
  return channelAccessStorage.getUserChannelAccess(userAddress)
}

export async function grantChannelAccess(
  userAddress: string,
  creatorId: string,
  channelId: string,
  accessType: 'paid' | 'free_premium' | 'subscription',
  expiryDate: Date,
  pricePaid: number = 0
): Promise<void> {
  return channelAccessStorage.grantChannelAccess(userAddress, creatorId, channelId, accessType, expiryDate, pricePaid)
}

export async function hasChannelAccess(userAddress: string, creatorId: string, channelId: string): Promise<boolean> {
  return channelAccessStorage.hasChannelAccess(userAddress, creatorId, channelId)
}

export async function getUserPremiumAccess(userAddress: string): Promise<UserPremiumAccess[]> {
  return channelAccessStorage.getUserPremiumAccess(userAddress)
}

export async function recordPremiumAccess(
  userAddress: string,
  creatorId: string,
  channelId: string,
  tier: 'PRO' | 'ROYAL'
): Promise<void> {
  return channelAccessStorage.recordPremiumAccess(userAddress, creatorId, channelId, tier)
}
