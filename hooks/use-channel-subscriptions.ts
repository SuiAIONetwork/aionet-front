/**
 * React hook for managing user channel subscriptions
 * Integrates with database + Walrus storage
 */

import { useState, useEffect, useCallback } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { getUserJoinedChannels, addSampleChannelSubscriptions, type UserChannel } from '@/lib/channel-subscriptions-storage'
import { toast } from 'sonner'

interface UseChannelSubscriptionsReturn {
  channels: UserChannel[]
  isLoading: boolean
  error: string | null
  refreshChannels: () => Promise<void>
  addSampleChannels: () => Promise<void>
}

export function useChannelSubscriptions(): UseChannelSubscriptionsReturn {
  const { user } = useSuiAuth()
  const [channels, setChannels] = useState<UserChannel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's joined channels
  const fetchChannels = useCallback(async () => {
    if (!user?.address) {
      setChannels([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching channels for user:', user.address)
      const userChannels = await getUserJoinedChannels(user.address)


      console.log(`✅ Loaded ${userChannels.length} channels from database`)
      console.log('📺 Channel types breakdown:', userChannels.map(ch => ({ name: ch.name, type: ch.type, isActive: ch.isActive })))

      // Fetch creator data to get correct channel images (same as successful forum pages)
      const response = await fetch('/api/creators')
      const result = await response.json()

      if (result.success && result.data) {
        // Update channels with correct images from database (same as forum)
        const updatedChannels = userChannels.map(channel => {
          // Find the creator in database
          const dbCreator = result.data.find((c: any) =>
            c.creator_address === channel.creatorAddress ||
            c.id === channel.creatorAddress
          )

          if (dbCreator) {
            // Find the specific channel in channels_data
            const channelData = dbCreator.channels_data?.find((ch: any) => ch.id === channel.id)

            if (channelData) {
              console.log('✅ Profile: Found channel images for:', channel.name, {
                channelAvatar: channelData.channelAvatar,
                channelCover: channelData.channelCover
              })

              // Use channel-specific images from database (same as successful forum pages)
              return {
                ...channel,
                avatarUrl: channelData.channelAvatar || channel.avatarUrl,
                coverUrl: channelData.channelCover || channel.coverUrl
              }
            }
          }

          return channel
        })

        setChannels(updatedChannels)
        console.log(`📺 Set ${updatedChannels.length} channels with updated images`)
      } else {
        setChannels(userChannels)
        console.log(`📺 Set ${userChannels.length} channels without image updates`)
      }

    } catch (err) {
      console.error('❌ Failed to fetch channels:', err)
      setError(err instanceof Error ? err.message : 'Failed to load channels')
      setChannels([]) // Show empty state on error instead of sample data

    } finally {
      setIsLoading(false)
    }
  }, [user?.address])

  // Refresh channels
  const refreshChannels = useCallback(async () => {
    await fetchChannels()
  }, [fetchChannels])

  // Add sample channels for demo/testing
  const addSampleChannels = useCallback(async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsLoading(true)
      console.log('📺 Adding sample channels to database for user:', user.address)

      // Add sample data to the database
      await addSampleChannelSubscriptions(user.address)

      // Refresh channels to show the new data
      await fetchChannels()

      toast.success('Sample channels added successfully!')

    } catch (err) {
      console.error('❌ Failed to add sample channels:', err)
      toast.error('Failed to add sample channels')
    } finally {
      setIsLoading(false)
    }
  }, [user?.address, fetchChannels])

  // Load channels when user connects
  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  // Listen for channel removal events from other parts of the app
  useEffect(() => {
    const handleChannelRemoved = (event: CustomEvent) => {
      console.log('🔄 Channel removed event received, refreshing channels...')
      fetchChannels()
    }

    const handleChannelAdded = (event: CustomEvent) => {
      console.log('🔄 Channel added event received, refreshing channels...')
      fetchChannels()
    }

    window.addEventListener('channelRemoved', handleChannelRemoved as EventListener)
    window.addEventListener('channelAdded', handleChannelAdded as EventListener)

    return () => {
      window.removeEventListener('channelRemoved', handleChannelRemoved as EventListener)
      window.removeEventListener('channelAdded', handleChannelAdded as EventListener)
    }
  }, [fetchChannels])

  return {
    channels,
    isLoading,
    error,
    refreshChannels,
    addSampleChannels
  }
}



// Helper function to get channel type badge color
export function getChannelTypeBadgeColor(type: 'free' | 'premium' | 'vip'): string {
  switch (type) {
    case 'free':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'premium':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'vip':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

// Helper function to format subscription status
export function formatSubscriptionStatus(channel: UserChannel): string {
  if (!channel.isActive) return 'Expired'
  if (channel.type === 'free') return 'Active'
  if (channel.daysRemaining !== undefined) {
    return `${channel.daysRemaining} days left`
  }
  return 'Active'
}
