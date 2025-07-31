"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import {
  getAllCreatorProfiles,
  createOrUpdateCreator,
  getCreatorProfile,
  type DecryptedCreator
} from "@/lib/creator-storage"
import { supabase } from '@/lib/supabase-client'
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { toast } from "sonner"

// Convert DecryptedCreator to the existing Creator interface for compatibility
interface Channel {
  id: string
  name: string
  type: 'free' | 'premium' | 'vip'
  price: number
  description: string
  subscribers: number
  subscriptionPackages?: string[]
  pricing?: {
    thirtyDays?: number
    sixtyDays?: number
    ninetyDays?: number
  }
  availability?: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
  // Channel-specific data for individual channel cards
  channelCategories?: string[]
  channelRole?: string
  channelLanguage?: string
  // Channel-specific images (separate from creator profile images)
  channelAvatar?: string
  channelCover?: string
  channelAvatarBlobId?: string
  channelCoverBlobId?: string
}

interface Creator {
  id: string
  creatorAddress: string // Wallet address of the creator (for ownership verification)
  name: string
  username: string
  avatar: string
  coverImage?: string
  role: string
  tier: 'PRO' | 'ROYAL'
  subscribers: number
  category: string
  categories: string[]
  channels: Channel[]
  contentTypes: string[]
  verified: boolean
  languages: string[]
  availability: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
  socialLinks: {
    website?: string
    twitter?: string
    discord?: string
  }
  bannerColor: string
}

interface CreatorsContextType {
  creators: Creator[]
  addCreator: (creator: Creator, profileImageBlobId?: string, coverImageBlobId?: string) => Promise<void>
  updateCreator: (id: string, creator: Partial<Creator>, profileImageBlobId?: string, coverImageBlobId?: string) => Promise<void>
  updateChannel: (creatorId: string, channelId: string, updatedChannel: Partial<Channel>) => Promise<void>
  removeCreator: (id: string) => Promise<void>
  deleteChannel: (creatorId: string, channelId: string) => Promise<void>
  refreshCreators: () => Promise<void>
  getUserCreators: (walletAddress: string) => Creator[]
  // New subscriber count functions
  syncSubscriberCounts: () => Promise<void>
  syncCreatorSubscriberCount: (creatorAddress: string) => Promise<number>
  toggleRealTimeSubscriberCounts: (enabled: boolean) => void
  useRealTimeSubscriberCounts: boolean
  isLoading: boolean
  error: string | null
}

const CreatorsContext = createContext<CreatorsContextType | undefined>(undefined)

// Helper function to get creator image URL (handles Supabase storage and legacy Walrus)
function getCreatorImageUrl(blobId: string): string {
  if (!blobId) return "/api/placeholder/64/64"

  // Check if it's a default avatar path
  if (blobId.startsWith('/images/')) {
    return blobId
  }

  // Check if it's already a full URL
  if (blobId.startsWith('http')) {
    return blobId
  }

  // Check if it's a Supabase storage path
  if (blobId.includes('/')) {
    try {
      const { supabaseStorage } = require('@/lib/supabase-storage')
      return supabaseStorage.getPublicUrl(blobId)
    } catch (error) {
      console.warn('Failed to get Supabase URL for creator image:', error)
    }
  }

  // Fallback to Walrus URL for old blob IDs
  return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
}

// Convert DecryptedCreator to Creator interface
function convertDecryptedCreatorToCreator(decryptedCreator: DecryptedCreator): Creator {
  // Generate avatar URL from storage path/blob ID
  const avatar = decryptedCreator.profile_image_blob_id
    ? getCreatorImageUrl(decryptedCreator.profile_image_blob_id)
    : "/api/placeholder/64/64"

  const coverImage = decryptedCreator.cover_image_blob_id
    ? getCreatorImageUrl(decryptedCreator.cover_image_blob_id)
    : undefined





  // Convert channels data
  let channels: Channel[] = []

  if (decryptedCreator.channels_data && Array.isArray(decryptedCreator.channels_data)) {
    channels = decryptedCreator.channels_data.map((channelData: any) => ({
      id: channelData.id || `${decryptedCreator.id}-${Math.random().toString(36).substr(2, 9)}`,
      name: channelData.name || decryptedCreator.channel_name || 'Unnamed Channel',
      type: channelData.type || (decryptedCreator.is_premium ? 'premium' : 'free'),
      price: channelData.price || decryptedCreator.tip_pricing?.thirtyDays || 0,
      description: channelData.description || decryptedCreator.channel_description || '',
      subscribers: channelData.subscribers || decryptedCreator.subscribers_count || 0,

      subscriptionPackages: channelData.subscriptionPackages || decryptedCreator.subscription_packages,
      pricing: channelData.pricing || decryptedCreator.tip_pricing,
      availability: channelData.availability || {
        hasLimit: decryptedCreator.max_subscribers > 0,
        currentSlots: decryptedCreator.max_subscribers > 0
          ? Math.max(0, decryptedCreator.max_subscribers - decryptedCreator.subscribers_count)
          : undefined,
        maxSlots: decryptedCreator.max_subscribers > 0 ? decryptedCreator.max_subscribers : undefined,
        status: decryptedCreator.max_subscribers > 0 ? 'limited' : 'available'
      },
      // Preserve channel-specific data for individual channel cards
      channelCategories: channelData.channelCategories || decryptedCreator.channel_categories,
      channelRole: channelData.channelRole || decryptedCreator.creator_role,
      channelLanguage: channelData.channelLanguage || decryptedCreator.channel_language,
      // Channel-specific images (separate from creator profile images)
      channelAvatar: channelData.channelAvatar,
      channelCover: channelData.channelCover,
      channelAvatarBlobId: channelData.channelAvatarBlobId,
      channelCoverBlobId: channelData.channelCoverBlobId
    }))
  } else if (decryptedCreator.channels_data) {
    // Handle case where channels_data might be a single object instead of array
    const channelData = decryptedCreator.channels_data as any
    channels = [{
      id: channelData.id || `${decryptedCreator.id}-${Math.random().toString(36).substr(2, 9)}`,
      name: channelData.name || decryptedCreator.channel_name || 'Unnamed Channel',
      type: channelData.type || (decryptedCreator.is_premium ? 'premium' : 'free'),
      price: channelData.price || decryptedCreator.tip_pricing?.thirtyDays || 0,
      description: channelData.description || decryptedCreator.channel_description || '',
      subscribers: channelData.subscribers || decryptedCreator.subscribers_count || 0,

      subscriptionPackages: channelData.subscriptionPackages || decryptedCreator.subscription_packages,
      pricing: channelData.pricing || decryptedCreator.tip_pricing,
      availability: channelData.availability || {
        hasLimit: decryptedCreator.max_subscribers > 0,
        currentSlots: decryptedCreator.max_subscribers > 0
          ? Math.max(0, decryptedCreator.max_subscribers - decryptedCreator.subscribers_count)
          : undefined,
        maxSlots: decryptedCreator.max_subscribers > 0 ? decryptedCreator.max_subscribers : undefined,
        status: decryptedCreator.max_subscribers > 0 ? 'limited' : 'available'
      },
      // Preserve channel-specific data for individual channel cards
      channelCategories: channelData.channelCategories || decryptedCreator.channel_categories,
      channelRole: channelData.channelRole || decryptedCreator.creator_role,
      channelLanguage: channelData.channelLanguage || decryptedCreator.channel_language,
      // Channel-specific images (separate from creator profile images)
      channelAvatar: channelData.channelAvatar,
      channelCover: channelData.channelCover,
      channelAvatarBlobId: channelData.channelAvatarBlobId,
      channelCoverBlobId: channelData.channelCoverBlobId
    }]
  } else {
    // Fallback: create a channel from the creator's basic data
    channels = [{
      id: `${decryptedCreator.id}-default`,
      name: decryptedCreator.channel_name || 'Default Channel',
      type: decryptedCreator.is_premium ? 'premium' : 'free',
      price: decryptedCreator.tip_pricing?.thirtyDays || 0,
      description: decryptedCreator.channel_description || '',
      subscribers: decryptedCreator.subscribers_count || 0,

      subscriptionPackages: decryptedCreator.subscription_packages,
      pricing: decryptedCreator.tip_pricing,
      availability: {
        hasLimit: decryptedCreator.max_subscribers > 0,
        currentSlots: decryptedCreator.max_subscribers > 0
          ? Math.max(0, decryptedCreator.max_subscribers - decryptedCreator.subscribers_count)
          : undefined,
        maxSlots: decryptedCreator.max_subscribers > 0 ? decryptedCreator.max_subscribers : undefined,
        status: decryptedCreator.max_subscribers > 0 ? 'limited' : 'available'
      },
      // Use creator's basic data as channel-specific data
      channelCategories: decryptedCreator.channel_categories,
      channelRole: decryptedCreator.creator_role,
      channelLanguage: decryptedCreator.channel_language
    }]
  }

  return {
    id: decryptedCreator.id,
    creatorAddress: decryptedCreator.creator_address, // Map the wallet address for ownership verification
    name: decryptedCreator.channel_name || 'Unnamed Creator',
    username: decryptedCreator.channel_name?.toLowerCase().replace(/\s+/g, '') || decryptedCreator.creator_address?.slice(0, 8) || 'unknown',
    avatar,
    coverImage,
    role: decryptedCreator.creator_role,
    tier: decryptedCreator.tier,
    subscribers: decryptedCreator.subscribers_count,
    category: decryptedCreator.primary_category || decryptedCreator.channel_categories[0] || 'General',
    categories: decryptedCreator.channel_categories,
    channels,
    contentTypes: ["Live Streams", "Analysis", "Tutorials"], // Default content types
    verified: decryptedCreator.verified,
    languages: [decryptedCreator.channel_language],
    availability: {
      hasLimit: decryptedCreator.max_subscribers > 0,
      currentSlots: decryptedCreator.max_subscribers > 0
        ? Math.max(0, decryptedCreator.max_subscribers - decryptedCreator.subscribers_count)
        : undefined,
      maxSlots: decryptedCreator.max_subscribers > 0 ? decryptedCreator.max_subscribers : undefined,
      status: decryptedCreator.max_subscribers > 0 ? 'limited' : 'available'
    },
    socialLinks: decryptedCreator.social_links,
    bannerColor: decryptedCreator.banner_color
  }
}

export function CreatorsDatabaseProvider({ children }: { children: React.ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useRealTimeSubscriberCounts, setUseRealTimeSubscriberCounts] = useState(true) // Enable real-time counts by default
  const { user } = useSuiAuth()
  const currentAccount = useCurrentAccount()

  // Use singleton Supabase client

  // Function to get real-time subscriber count for a creator
  const getRealTimeSubscriberCount = async (creatorAddress: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_creator_subscriber_count', {
          creator_addr: creatorAddress
        })

      if (error) {
        console.warn(`⚠️ Failed to get real-time subscriber count for ${creatorAddress}:`, error)
        return 0
      }

      return data || 0
    } catch (err) {
      console.warn(`⚠️ Error getting real-time subscriber count for ${creatorAddress}:`, err)
      return 0
    }
  }

  // Function to update subscriber counts for all creators
  const updateAllSubscriberCounts = async (creatorList: Creator[]): Promise<Creator[]> => {
    if (!useRealTimeSubscriberCounts) {
      return creatorList
    }



    const updatedCreators = await Promise.all(
      creatorList.map(async (creator) => {
        try {
          const realTimeCount = await getRealTimeSubscriberCount(creator.creatorAddress)

          // Calculate correct available slots
          const updatedAvailability = {
            ...creator.availability,
            currentSlots: creator.availability.hasLimit && creator.availability.maxSlots
              ? Math.max(0, creator.availability.maxSlots - realTimeCount)
              : creator.availability.currentSlots
          }

          // Update the creator's subscriber count and availability
          const updatedCreator = {
            ...creator,
            subscribers: realTimeCount,
            availability: updatedAvailability
          }

          // Also update individual channel subscriber counts and availability
          const updatedChannels = creator.channels.map(channel => ({
            ...channel,
            subscribers: realTimeCount, // For now, use the same count for all channels of a creator
            availability: channel.availability ? {
              ...channel.availability,
              currentSlots: channel.availability.hasLimit && channel.availability.maxSlots
                ? Math.max(0, channel.availability.maxSlots - realTimeCount)
                : channel.availability.currentSlots
            } : channel.availability
          }))

          return {
            ...updatedCreator,
            channels: updatedChannels
          }
        } catch (err) {
          console.warn(`⚠️ Failed to update subscriber count for creator ${creator.name}:`, err)
          return creator // Return original creator if update fails
        }
      })
    )


    return updatedCreators
  }

  // Load creators from database
  const refreshCreators = async () => {
    try {
      setIsLoading(true)
      setError(null)
      

      const decryptedCreators = await getAllCreatorProfiles()

      // Convert to Creator interface
      const convertedCreators = decryptedCreators.map(convertDecryptedCreatorToCreator)

      // Update subscriber counts with real-time data
      const creatorsWithRealTimeCounts = await updateAllSubscriberCounts(convertedCreators)

      setCreators(creatorsWithRealTimeCounts)
    } catch (err) {
      console.error('Failed to load creators:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load creators'

      // Check for specific database errors and fallback to localStorage
      if (errorMessage.includes('table') && errorMessage.includes('does not exist')) {
        console.log('📝 Database not available, falling back to localStorage...')

        // Try to load from localStorage
        try {
          const localCreators = JSON.parse(localStorage.getItem('creators') || '[]')
          setCreators(localCreators)
          setError('Using local storage (database not available)')
          console.log(`✅ Loaded ${localCreators.length} creators from localStorage`)
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError)
          setError('Database not set up and localStorage unavailable')
          setCreators([])
        }
      } else {
        setError(errorMessage)
        setCreators([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load creators on mount
  useEffect(() => {
    refreshCreators()
  }, [])

  const getUserCreators = (walletAddress: string): Creator[] => {
    if (!walletAddress) return []

    return creators.filter(creator =>
      creator.creatorAddress &&
      creator.creatorAddress.toLowerCase() === walletAddress.toLowerCase()
    )
  }

  const addCreator = async (creator: Creator, profileImageBlobId?: string, coverImageBlobId?: string) => {
    console.log('🔄 addCreator called with:', creator)
    console.log('🖼️ Profile image blob ID:', profileImageBlobId)
    console.log('🖼️ Cover image blob ID:', coverImageBlobId)

    if (!user?.address) {
      console.error('❌ No user authenticated in addCreator')
      throw new Error('Authentication required')
    }

    console.log('✅ User address:', user.address)

    try {
      console.log('➕ Adding new creator to database...')

      // Convert Creator to DecryptedCreator format
      const decryptedCreatorData: Partial<DecryptedCreator> = {
        creator_address: user.address,
        channel_name: creator.name,
        channel_description: creator.channels[0]?.description || '',

        creator_role: creator.role,
        channel_language: creator.languages[0] || 'English',
        channel_categories: creator.categories,
        primary_category: creator.category,
        tier: creator.tier,
        max_subscribers: creator.availability.maxSlots || 0,
        is_premium: creator.channels.some(ch => ch.type === 'premium'),
        subscription_packages: creator.channels[0]?.subscriptionPackages || [],
        tip_pricing: creator.channels[0]?.pricing || {},
        subscribers_count: creator.subscribers,
        verified: creator.verified,
        banner_color: creator.bannerColor,
        social_links: creator.socialLinks,
        channels_data: creator.channels,
        // Add blob IDs if provided
        profile_image_blob_id: profileImageBlobId,
        cover_image_blob_id: coverImageBlobId
      }

      console.log('📝 Converted creator data:', decryptedCreatorData)
      console.log('🔄 Calling createOrUpdateCreator with blob IDs...')

      await createOrUpdateCreator(user.address, decryptedCreatorData)

      console.log('✅ createOrUpdateCreator completed successfully')
      console.log('🔄 Refreshing creators list...')

      // Refresh the creators list
      await refreshCreators()

      console.log('✅ Creators list refreshed')
      toast.success('Creator profile created successfully!')
    } catch (err) {
      console.error('Failed to add creator:', err)

      // Fallback to localStorage if database fails
      if (err instanceof Error && err.message.includes('table does not exist')) {
        console.log('📝 Database not available, falling back to localStorage...')

        // Save to localStorage as fallback
        const existingCreators = JSON.parse(localStorage.getItem('creators') || '[]')
        const newCreators = [...existingCreators, creator]
        localStorage.setItem('creators', JSON.stringify(newCreators))

        // Update local state
        setCreators(newCreators)

        toast.success('Creator profile created successfully! (Saved locally - database not available)')
        return
      }

      toast.error('Failed to create creator profile')
      throw err
    }
  }

  const updateCreator = async (id: string, updatedCreator: Partial<Creator>, profileImageBlobId?: string, coverImageBlobId?: string) => {
    console.log('🔄 updateCreator called with:', { id, updatedCreator })
    console.log('🖼️ Profile image blob ID:', profileImageBlobId)
    console.log('🖼️ Cover image blob ID:', coverImageBlobId)

    if (!user?.address) {
      throw new Error('Authentication required')
    }

    try {
      console.log('✏️ Updating creator in database...')

      // Find the creator to update
      const existingCreator = creators.find(c => c.id === id)
      if (!existingCreator) {
        throw new Error('Creator not found')
      }

      // Merge the updates
      const mergedCreator = { ...existingCreator, ...updatedCreator }

      console.log('📝 Merged creator data:', mergedCreator)
      console.log('📊 Total channels after update:', mergedCreator.channels.length)

      // Convert to DecryptedCreator format
      const decryptedCreatorData: Partial<DecryptedCreator> = {
        channel_name: mergedCreator.name,
        channel_description: mergedCreator.channels[0]?.description || '',

        creator_role: mergedCreator.role,
        channel_language: mergedCreator.languages[0] || 'English',
        channel_categories: mergedCreator.categories,
        primary_category: mergedCreator.category,
        tier: mergedCreator.tier,
        max_subscribers: mergedCreator.availability.maxSlots || 0,
        is_premium: mergedCreator.channels.some(ch => ch.type === 'premium'),
        subscription_packages: mergedCreator.channels[0]?.subscriptionPackages || [],
        tip_pricing: mergedCreator.channels[0]?.pricing || {},
        subscribers_count: mergedCreator.subscribers,
        verified: mergedCreator.verified,
        banner_color: mergedCreator.bannerColor,
        social_links: mergedCreator.socialLinks,
        channels_data: mergedCreator.channels,
        // Add blob IDs if provided
        profile_image_blob_id: profileImageBlobId,
        cover_image_blob_id: coverImageBlobId
      }

      console.log('📝 Converted creator data for database:', decryptedCreatorData)

      await createOrUpdateCreator(user.address, decryptedCreatorData)

      console.log('✅ Creator updated in database')

      // Refresh the creators list
      await refreshCreators()

      console.log('✅ Creators list refreshed')
      toast.success('Creator profile updated successfully!')
    } catch (err) {
      console.error('❌ Failed to update creator:', err)
      toast.error('Failed to update creator profile')
      throw err
    }
  }

  const removeCreator = async (id: string) => {
    if (!user?.address) {
      throw new Error('Authentication required')
    }

    try {
      console.log('🗑️ Starting creator removal process...')

      // Find the creator to get their address
      const creator = creators.find(c => c.id === id)
      if (!creator) {
        throw new Error('Creator not found')
      }

      const creatorAddress = creator.creatorAddress || user.address

      // Confirm deletion
      const confirmed = window.confirm(
        `⚠️ DELETE CREATOR CONFIRMATION ⚠️\n\n` +
        `This will permanently delete:\n` +
        `• All channels created by this creator\n` +
        `• All forum posts and topics\n` +
        `• All subscriber data\n` +
        `• All reports and statistics\n\n` +
        `This action cannot be undone!\n\n` +
        `Are you sure you want to continue?`
      )

      if (!confirmed) {
        console.log('Creator deletion cancelled by user')
        return
      }

      // Clean up all related data first
      console.log('🧹 Cleaning up all creator-related data...')
      const { error: cleanupError } = await supabase.rpc('cleanup_creator_data', {
        creator_addr: creatorAddress
      })

      if (cleanupError) {
        console.warn('⚠️ Cleanup function failed, proceeding with creator deletion:', cleanupError)
      } else {
        console.log('✅ Creator data cleanup completed')
      }

      // Delete the creator profile
      console.log('🗑️ Deleting creator profile...')
      const { error: deleteError } = await supabase
        .from('creators')
        .delete()
        .eq('creator_address', creatorAddress)

      if (deleteError) {
        throw deleteError
      }

      console.log('✅ Creator profile deleted')

      // Refresh the creators list
      await refreshCreators()

      console.log('✅ Creator removal completed successfully')
      toast.success('Creator and all related data deleted successfully!')

    } catch (error) {
      console.error('❌ Failed to remove creator:', error)
      toast.error('Failed to remove creator')
      throw error
    }
  }

  const updateChannel = async (creatorId: string, channelId: string, updatedChannel: Partial<Channel>) => {
    console.log('✏️ updateChannel called with:', { creatorId, channelId, updatedChannel })

    if (!user?.address) {
      throw new Error('Authentication required')
    }

    try {
      console.log('🔍 Finding creator and channel to update...')

      // Find the creator using the same smart logic as deleteChannel
      let actualCreator: Creator | undefined
      let actualCreatorId = creatorId

      // First, try to find creator directly
      actualCreator = creators.find(c => c.id === creatorId)

      // If not found and creatorId looks like a channel ID, extract the creator ID
      if (!actualCreator && creatorId.includes('_channel_')) {
        console.log('🔧 CreatorId looks like channel ID, extracting actual creator ID...')
        actualCreatorId = creatorId.split('_channel_')[0]
        actualCreator = creators.find(c => c.id === actualCreatorId)
        console.log('🔍 Extracted creator ID:', actualCreatorId)
      }

      // If still not found, try to find creator by searching through all channels
      if (!actualCreator) {
        console.log('🔍 Creator not found by ID, searching through all channels...')
        for (const creator of creators) {
          if (creator.channels.some(ch => ch.id === channelId)) {
            actualCreator = creator
            actualCreatorId = creator.id
            console.log('✅ Found creator by channel search:', creator.name)
            break
          }
        }
      }

      if (!actualCreator) {
        throw new Error('Creator not found')
      }

      console.log('👤 Found creator:', actualCreator.name)

      // Verify ownership
      if (actualCreator.creatorAddress?.toLowerCase() !== user.address.toLowerCase()) {
        throw new Error('You can only update your own channels')
      }

      // Find the channel to update
      const channelIndex = actualCreator.channels.findIndex(ch => ch.id === channelId)
      if (channelIndex === -1) {
        throw new Error('Channel not found')
      }

      console.log('📺 Found channel to update:', actualCreator.channels[channelIndex].name)

      // Update the channel with new data
      const updatedChannels = [...actualCreator.channels]
      updatedChannels[channelIndex] = {
        ...updatedChannels[channelIndex],
        ...updatedChannel
      }

      console.log('📊 Channel updated with new data')

      // Prepare the updated creator data for database using the same format as deleteChannel
      const decryptedCreatorData: Partial<DecryptedCreator> = {
        creator_address: user.address,
        channel_name: actualCreator.name,
        channel_description: actualCreator.channels[0]?.description || '', // Use first channel description

        creator_role: actualCreator.role,
        channel_language: actualCreator.languages?.[0] || 'English',
        channel_categories: actualCreator.categories,
        primary_category: actualCreator.category,
        tier: actualCreator.tier,
        max_subscribers: actualCreator.availability?.maxSlots || 0,
        is_premium: updatedChannels.some(ch => ch.type === 'premium'),
        subscription_packages: updatedChannels[0]?.subscriptionPackages || [],
        tip_pricing: updatedChannels[0]?.pricing || {},
        subscribers_count: actualCreator.subscribers,
        verified: actualCreator.verified,
        banner_color: actualCreator.bannerColor,
        social_links: actualCreator.socialLinks,
        channels_data: updatedChannels // This is the key update
      }

      console.log('📝 Updating creator in database with updated channel data...')

      await createOrUpdateCreator(user.address, decryptedCreatorData)

      console.log('✅ Channel updated in database')

      // Refresh the creators list
      await refreshCreators()

      console.log('✅ Creators list refreshed after channel update')
      toast.success('Channel updated successfully!')
    } catch (err) {
      console.error('❌ Failed to update channel:', err)
      toast.error('Failed to update channel')
      throw err
    }
  }

  // Helper function to clean up all channel-related data
  const cleanupChannelRelatedData = async (creatorAddress: string, channelId: string) => {
    console.log('🧹 Starting comprehensive channel cleanup...')

    try {
      // Use database function for comprehensive cleanup
      console.log('🗑️ Executing database cleanup function...')
      const { error: cleanupError } = await supabase.rpc('cleanup_channel_data', {
        creator_addr: creatorAddress,
        channel_id_param: channelId
      })

      if (cleanupError) {
        console.error('❌ Database cleanup function failed:', cleanupError)
        // Fallback to manual cleanup if function fails
        await manualChannelCleanup(creatorAddress, channelId)
      } else {
        console.log('✅ Database cleanup function completed successfully')
      }

      console.log('🎉 Channel cleanup completed successfully')

    } catch (error) {
      console.error('❌ Error during channel cleanup:', error)
      // Fallback to manual cleanup
      await manualChannelCleanup(creatorAddress, channelId)
    }
  }

  // Fallback manual cleanup function
  const manualChannelCleanup = async (creatorAddress: string, channelId: string) => {
    console.log('🔧 Performing manual cleanup as fallback...')

    try {
      // Delete channel subscriptions
      await supabase.from('channel_subscriptions').delete()
        .eq('creator_address', creatorAddress).eq('channel_id', channelId)

      // Delete channel reports
      await supabase.from('channel_reports').delete()
        .eq('creator_address', creatorAddress).eq('channel_id', channelId)

      // Delete channel report statistics
      await supabase.from('channel_report_statistics').delete()
        .eq('creator_address', creatorAddress).eq('channel_id', channelId)

      // Delete forum topics
      await supabase.from('forum_topics').delete()
        .eq('creator_id', creatorAddress).eq('channel_id', channelId)

      // Delete forum posts
      await supabase.from('forum_posts').delete()
        .eq('creator_id', creatorAddress).eq('channel_id', channelId)

      // Delete creator channel content
      await supabase.from('creator_channel_content').delete()
        .eq('creator_address', creatorAddress).eq('channel_id', channelId)

      console.log('✅ Manual cleanup completed')
    } catch (error) {
      console.error('❌ Manual cleanup also failed:', error)
    }
  }

  const deleteChannel = async (creatorId: string, channelId: string) => {
    console.log('🗑️ deleteChannel called with:', { creatorId, channelId })
    console.log('🔍 Available creators:', creators.map(c => ({ id: c.id, name: c.name, channelsCount: c.channels.length })))

    // Smart creator finding: handle both correct creator IDs and channel IDs passed as creator IDs
    let actualCreator: Creator | undefined
    let actualCreatorId = creatorId

    // First, try to find creator directly
    actualCreator = creators.find(c => c.id === creatorId)

    // If not found and creatorId looks like a channel ID, extract the creator ID
    if (!actualCreator && creatorId.includes('_channel_')) {
      console.log('🔧 CreatorId looks like channel ID, extracting actual creator ID...')
      actualCreatorId = creatorId.split('_channel_')[0]
      actualCreator = creators.find(c => c.id === actualCreatorId)
      console.log('🔍 Extracted creator ID:', actualCreatorId)
    }

    // If still not found, try to find creator by searching through all channels
    if (!actualCreator) {
      console.log('🔍 Creator not found by ID, searching through all channels...')
      for (const creator of creators) {
        if (creator.channels.some(ch => ch.id === channelId)) {
          actualCreator = creator
          actualCreatorId = creator.id
          console.log('✅ Found creator by channel search:', creator.name)
          break
        }
      }
    }

    if (!user?.address) {
      throw new Error('Authentication required')
    }

    try {
      console.log('🔍 Validating found creator and channel...')

      // Use the creator we found above
      if (!actualCreator) {
        console.error('❌ Creator not found! Available creator IDs:', creators.map(c => c.id))
        console.error('❌ Looking for creator ID:', creatorId)
        console.error('❌ Channel ID:', channelId)
        throw new Error(`Creator not found with ID: ${creatorId}`)
      }

      console.log('✅ Using creator:', { id: actualCreator.id, name: actualCreator.name, channelsCount: actualCreator.channels.length })

      // Find the channel
      const channel = actualCreator.channels.find(ch => ch.id === channelId)
      if (!channel) {
        console.error('❌ Channel not found! Available channel IDs:', actualCreator.channels.map(ch => ch.id))
        console.error('❌ Looking for channel ID:', channelId)
        throw new Error(`Channel not found with ID: ${channelId}`)
      }

      console.log('✅ Found channel:', { id: channel.id, name: channel.name, type: channel.type })
      console.log(`🗑️ Deleting channel "${channel.name}" from creator "${actualCreator.name}"`)

      // Remove the channel from the channels array
      const updatedChannels = actualCreator.channels.filter(ch => ch.id !== channelId)

      console.log(`📊 Channels before deletion: ${actualCreator.channels.length}`)
      console.log(`📊 Channels after deletion: ${updatedChannels.length}`)

      if (updatedChannels.length === 0) {
        console.log('⚠️ This was the last channel for this creator')
      }

      // Prepare the updated channels data for database
      console.log('📝 Preparing updated channels data for database...')
      console.log('🔍 Updated channels:', updatedChannels.map(ch => ({ id: ch.id, name: ch.name, type: ch.type })))

      // Create a complete update that preserves existing data but updates channels
      // Use the actualCreator we found above
      const decryptedCreatorData: Partial<DecryptedCreator> = {
        creator_address: user.address,
        channel_name: actualCreator.name,
        channel_description: actualCreator.channels[0]?.description || '', // Use first channel description

        creator_role: actualCreator.role,
        channel_language: actualCreator.languages?.[0] || 'English',
        channel_categories: actualCreator.categories,
        primary_category: actualCreator.category,
        tier: actualCreator.tier,
        max_subscribers: actualCreator.availability?.maxSlots || 0,
        is_premium: updatedChannels.some(ch => ch.type === 'premium'),
        subscription_packages: updatedChannels[0]?.subscriptionPackages || [],
        tip_pricing: updatedChannels[0]?.pricing || {},
        subscribers_count: actualCreator.subscribers,
        verified: actualCreator.verified,
        banner_color: actualCreator.bannerColor,
        social_links: actualCreator.socialLinks,
        channels_data: updatedChannels // This is the key update
      }

      console.log('📝 Updating creator in database with new channels data...')
      console.log('🔍 Database update payload:', {
        wallet: user.address,
        channelsCount: updatedChannels.length,
        creatorName: actualCreator.name,
        originalChannelsCount: actualCreator.channels.length
      })

      await createOrUpdateCreator(user.address, decryptedCreatorData)

      console.log('✅ Channel deleted from creators table')

      // Clean up all related data for this channel
      await cleanupChannelRelatedData(actualCreator.creatorAddress || user.address, channelId)

      console.log('✅ Channel and all related data deleted')

      // Refresh the creators list to reflect changes
      await refreshCreators()

      console.log('✅ Creators list refreshed')
      toast.success(`Channel "${channel.name}" deleted successfully!`)
    } catch (err) {
      console.error('❌ Failed to delete channel:', err)
      toast.error('Failed to delete channel')
      throw err
    }
  }

  // Function to manually sync all subscriber counts
  const syncSubscriberCounts = async () => {
    try {
      console.log('🔄 Manually syncing all subscriber counts...')
      const response = await fetch('/api/sync-subscriber-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_recalculate: true
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Subscriber counts synced:', result.summary)
        toast.success(`Synced subscriber counts for ${result.summary.total_creators} creators`)
        // Refresh creators to show updated counts
        await refreshCreators()
      } else {
        console.error('❌ Failed to sync subscriber counts:', result.error)
        toast.error('Failed to sync subscriber counts')
      }
    } catch (err) {
      console.error('❌ Error syncing subscriber counts:', err)
      toast.error('Error syncing subscriber counts')
    }
  }

  // Function to sync subscriber count for a specific creator
  const syncCreatorSubscriberCount = async (creatorAddress: string): Promise<number> => {
    try {
      console.log(`🔄 Syncing subscriber count for creator: ${creatorAddress}`)
      const response = await fetch('/api/sync-subscriber-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_address: creatorAddress
        })
      })

      const result = await response.json()

      if (result.success && result.results?.[0]) {
        const newCount = result.results[0].new_count
        console.log(`✅ Updated subscriber count for ${creatorAddress}: ${newCount}`)

        // Update the local state
        setCreators(prevCreators =>
          prevCreators.map(creator =>
            creator.creatorAddress === creatorAddress
              ? { ...creator, subscribers: newCount }
              : creator
          )
        )

        return newCount
      } else {
        console.error('❌ Failed to sync creator subscriber count:', result.error)
        return 0
      }
    } catch (err) {
      console.error('❌ Error syncing creator subscriber count:', err)
      return 0
    }
  }

  // Function to toggle real-time subscriber counts
  const toggleRealTimeSubscriberCounts = (enabled: boolean) => {
    setUseRealTimeSubscriberCounts(enabled)
    console.log(`🔄 Real-time subscriber counts ${enabled ? 'enabled' : 'disabled'}`)

    if (enabled) {
      // Refresh creators to get real-time counts
      refreshCreators()
    }
  }

  const value: CreatorsContextType = {
    creators,
    addCreator,
    updateCreator,
    updateChannel,
    removeCreator,
    deleteChannel,
    refreshCreators,
    getUserCreators,
    // New subscriber count functions
    syncSubscriberCounts,
    syncCreatorSubscriberCount,
    toggleRealTimeSubscriberCounts,
    useRealTimeSubscriberCounts,
    isLoading,
    error
  }

  return (
    <CreatorsContext.Provider value={value}>
      {children}
    </CreatorsContext.Provider>
  )
}

export function useCreatorsDatabase() {
  const context = useContext(CreatorsContext)
  if (context === undefined) {
    throw new Error('useCreatorsDatabase must be used within a CreatorsDatabaseProvider')
  }
  return context
}

// Export types for compatibility
export type { Creator, Channel, CreatorsContextType }
