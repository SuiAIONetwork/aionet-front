/**
 * Hook to get channel counts for the current user
 * Returns joined channels count and created channels count with role-based limits
 */

import { useState, useEffect } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useSubscription } from '@/contexts/subscription-context'
import { getUserJoinedChannels } from '@/lib/channel-subscriptions-storage'
import { getUserPremiumAccess } from '@/lib/channel-access-storage'
import { supabase } from '@/lib/supabase-client'

interface ChannelCounts {
  joinedChannels: number // Premium channels joined using free access
  maxJoinedChannels: number // Premium access limit based on tier
  createdChannels: number
  maxCreatedChannels: number
  isLoading: boolean
}

export function useChannelCounts(): ChannelCounts {
  const { user } = useSuiAuth()

  // Safely get tier with fallback
  let tier: 'NOMAD' | 'PRO' | 'ROYAL' = 'NOMAD'
  let subscriptionAvailable = false
  try {
    const subscription = useSubscription()
    tier = subscription.tier
    subscriptionAvailable = true

  } catch (error) {
    // Subscription context not available, use default
    console.warn('⚠️ Subscription context not available, using NOMAD tier')
  }

  const [joinedChannels, setJoinedChannels] = useState(0)
  const [createdChannels, setCreatedChannels] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate max channels based on tier
  const maxCreatedChannels = tier === 'ROYAL' ? 3 : tier === 'PRO' ? 2 : 0
  // For premium channel access limits based on tier
  const maxJoinedChannels = tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0

  // Using singleton Supabase client to prevent multiple instances

  // Load both joined and created channels count
  useEffect(() => {
    const loadChannelCounts = async () => {
      console.log('📊 loadChannelCounts called, user:', user?.address)
      if (!user?.address) {
        console.log('⚠️ No user address found, setting counts to 0')
        setJoinedChannels(0)
        setCreatedChannels(0)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('📊 Loading channel counts for user:', user.address)

        // Load premium channels from subscriptions (only premium type channels)
        const userChannels = await getUserJoinedChannels(user.address)
        console.log('📺 All user channels:', userChannels)

        const premiumChannels = userChannels.filter(channel =>
          channel.type === 'premium' && channel.isActive
        )
        console.log('💎 Premium channels found:', premiumChannels)
        setJoinedChannels(premiumChannels.length)

        // Load created channels count from database
        const { data: creators, error } = await supabase
          .rpc('get_creator_channel_count', { user_address: user.address })

        let totalChannels = 0
        if (error) {
          console.warn('⚠️ Failed to load created channels count, trying fallback:', error)

          // Fallback: direct query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('creators')
            .select('channels_data')
            .eq('creator_address', user.address)

          if (!fallbackError && fallbackData) {
            totalChannels = fallbackData.reduce((total, creator) => {
              const channelsData = creator.channels_data || []
              return total + (Array.isArray(channelsData) ? channelsData.length : 0)
            }, 0)
          }
        } else {
          // Use RPC result
          totalChannels = creators || 0
        }

        setCreatedChannels(totalChannels)

        console.log(`📊 Final channel counts: ${premiumChannels.length} premium joined, ${totalChannels} created`)
      } catch (error) {
        console.error('❌ Failed to load channel counts:', error)
        setJoinedChannels(0)
        setCreatedChannels(0)
      } finally {
        setIsLoading(false)
      }
    }

    loadChannelCounts()
  }, [user?.address])

  return {
    joinedChannels,
    maxJoinedChannels,
    createdChannels,
    maxCreatedChannels,
    isLoading
  }
}
