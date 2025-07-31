"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleImage } from "@/components/ui/role-image"
import { TipPaymentModal } from "./tip-payment-modal"
import { ChannelReportModal } from "./channel-report-modal"
import { useSubscription } from "@/contexts/subscription-context"
import { usePremiumAccess } from "@/contexts/premium-access-context"
import { useCreatorsDatabase } from "@/contexts/creators-database-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { getCategoryIcon as getStandardCategoryIcon } from "@/lib/channel-categories"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useChannelReports } from "@/hooks/use-channel-reports"
import { useChannelCounts } from "@/hooks/use-channel-counts"
import { Filter, FilterX } from "lucide-react"
import { toast } from "sonner"
import { addUserChannelSubscription, channelSubscriptionsStorage, getUserJoinedChannels } from "@/lib/channel-subscriptions-storage"
import { channelAccessStorage, getUserChannelAccess, grantChannelAccess, hasChannelAccess, type UserChannelAccess } from "@/lib/channel-access-storage"
import { createClient } from '@supabase/supabase-js'
import {
  Users,
  Coins,
  Play,
  FileText,
  BookOpen,
  TrendingUp,
  CheckCircle,
  MessageCircle,
  Clock,
  UserCheck,
  UserX,
  Send,
  LogOut,
  Trash2,
  Flag,
  AlertTriangle,
  Shield
} from "lucide-react"
import Image from "next/image"
import {
  shouldShowWarning,
  getWarningLevelColor,
  getWarningLevelBgColor,
  getReportCountText,
  type ChannelWarningLevel
} from "@/types/channel-reports"

interface Channel {
  id: string
  name: string
  type: 'free' | 'premium' | 'vip'
  price: number // in SUI (default price, usually for 30 days)
  description: string
  subscribers: number
  subscriptionPackages?: string[] // Available durations: ["30", "60", "90"]
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
}

interface Creator {
  id: string
  creatorAddress: string // Wallet address of the creator (for ownership verification)
  name: string
  username: string
  avatar: string
  coverImage?: string // Optional cover image for banner background
  role: string
  tier: 'PRO' | 'ROYAL' // Status tier (NOMADS not allowed as creators)
  subscribers: number
  category: string // Primary category (for backward compatibility)
  categories: string[] // All selected categories
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

interface CreatorCardsProps {
  creators: Creator[]
}

// Helper function to extract blob ID from creator avatar URL
function extractBlobIdFromCreatorAvatar(avatarUrl: string): string | undefined {
  console.log('🔍 Extracting blob ID from avatar URL:', avatarUrl)

  if (!avatarUrl) {
    console.log('❌ No avatar URL provided')
    return undefined
  }

  // Check if it's a Supabase storage URL
  if (avatarUrl.includes('supabase.co')) {
    // Extract path from Supabase URL: https://project.supabase.co/storage/v1/object/public/aionetmedia/path
    const match = avatarUrl.match(/\/aionetmedia\/(.+)$/)
    const path = match ? match[1] : undefined
    console.log('🔍 Extracted Supabase path:', path)
    return path
  }

  // Match legacy Walrus URL pattern: https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}
  const match = avatarUrl.match(/\/blobs\/([a-zA-Z0-9_-]+)/)
  const blobId = match ? match[1] : undefined

  console.log('🔍 Extracted blob ID:', blobId)
  return blobId
}

// Helper function to get creator's profile image blob ID directly from database
async function getCreatorProfileImageBlobIdDirect(creatorAddress: string): Promise<string | undefined> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Fetching creator profile image blob ID directly for:', creatorAddress)

    const { data, error } = await supabase
      .from('creators')
      .select('profile_image_blob_id')
      .eq('creator_address', creatorAddress)
      .single()

    if (error) {
      console.warn('⚠️ Failed to fetch creator profile image blob ID:', error)
      return undefined
    }

    console.log('✅ Found creator profile image blob ID:', data?.profile_image_blob_id)
    return data?.profile_image_blob_id || undefined

  } catch (error) {
    console.error('❌ Error fetching creator profile image blob ID:', error)
    return undefined
  }
}

// Background function to add free channel to database
async function addFreeChannelToDatabase(creator: Creator, channel: Channel, userAddress: string) {
  try {
    console.log('💾 Adding free channel subscription to database...')
    console.log('🔍 Creator data:', {
      id: creator.id,
      name: creator.name,
      avatar: creator.avatar,
      creatorAddress: creator.creatorAddress
    })

    // Get the actual profile image blob ID from the creator's database record
    const avatarBlobId = await getCreatorProfileImageBlobIdDirect(creator.creatorAddress || creator.id)
    console.log('🖼️ Retrieved creator profile image blob ID:', avatarBlobId)

    // If no blob ID found, try extracting from avatar URL as fallback
    const fallbackBlobId = avatarBlobId || extractBlobIdFromCreatorAvatar(creator.avatar)
    console.log('🔄 Final blob ID (with fallback):', fallbackBlobId)

    await addUserChannelSubscription(userAddress, {
      creatorAddress: creator.creatorAddress || creator.id,
      channelId: channel.id,
      channelName: channel.name,
      channelType: channel.type,
      channelDescription: channel.description,
      pricePaid: 0,
      subscriptionTier: channel.type,
      expiryDate: undefined, // Free channels don't expire
      // Use the actual blob ID from database (with fallback)
      channelAvatarBlobId: fallbackBlobId
    })

    console.log('✅ Free channel subscription added to database')
    toast.success(`Joined ${channel.name}! Check your profile to see all joined channels.`)

    // Trigger a custom event to notify profile page to refresh
    window.dispatchEvent(new CustomEvent('channelAdded', {
      detail: { channelId: channel.id, userAddress }
    }))

  } catch (error) {
    console.error('❌ Failed to add free channel subscription to database:', error)
    // Don't show error to user since they already got access
  }
}

export function CreatorCards({ creators }: CreatorCardsProps) {
  // Early return for empty creators to avoid unnecessary processing
  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#C0E6FF]">No creators available</p>
      </div>
    )
  }

  const { user, isSignedIn } = useSuiAuth()
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFreeAccessModal, setShowFreeAccessModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportChannelId, setReportChannelId] = useState<string>('')
  const [reportChannelName, setReportChannelName] = useState<string>('')
  const [reportCreatorAddress, setReportCreatorAddress] = useState<string>('')
  const [reportCreatorName, setReportCreatorName] = useState<string>('')
  const [userAccess, setUserAccess] = useState<Record<string, string>>({})
  const [userChannelAccess, setUserChannelAccess] = useState<UserChannelAccess[]>([])
  const [userChannelSubscriptions, setUserChannelSubscriptions] = useState<Record<string, boolean>>({})
  const [showOnlyJoined, setShowOnlyJoined] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { tier } = useSubscription()
  const { canAccessPremiumForFree, recordPremiumAccess, removePremiumAccess, getRemainingFreeAccess, premiumAccessRecords, refreshPremiumAccess } = usePremiumAccess()
  const { deleteChannel } = useCreatorsDatabase()
  const { joinedChannels } = useChannelCounts()
  const currentAccount = useCurrentAccount()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const CHANNELS_PER_PAGE = 8

  // Memoize channel IDs for report statistics to prevent recalculation
  const channelIds = useMemo(() =>
    creators.flatMap(creator =>
      creator.channels.map(channel => `${creator.id}_${channel.id}`)
    ), [creators]
  )

  // Use channel reports hook to get warning indicators
  const {
    statistics,
    isLoading: isLoadingReports,
    hasWarning,
    getWarningLevel,
    getReportCount,
    refreshStats
  } = useChannelReports(channelIds)

  // Combined data loader for better performance - loads all user data in parallel
  useEffect(() => {
    const loadAllUserData = async () => {
      const userAddress = user?.address || currentAccount?.address
      if (!userAddress) {
        setUserChannelAccess([])
        setUserAccess({})
        setUserChannelSubscriptions({})
        return
      }

      try {
        // Load all data in parallel for better performance
        const [channelAccess, userChannels] = await Promise.all([
          getUserChannelAccess(userAddress),
          getUserJoinedChannels(userAddress)
        ])

        // Process channel access
        setUserChannelAccess(channelAccess)
        const access: Record<string, string> = {}
        channelAccess.forEach(accessRecord => {
          const accessKey = `${accessRecord.creatorId}_${accessRecord.channelId}`
          access[accessKey] = accessRecord.expiryDate.toISOString()
        })
        setUserAccess(access)

        // Process channel subscriptions
        const subscriptions: Record<string, boolean> = {}
        userChannels.forEach(channel => {
          const key = `${channel.creatorAddress}_${channel.id}`
          subscriptions[key] = channel.isActive
        })
        setUserChannelSubscriptions(subscriptions)
        setIsDataLoaded(true)

      } catch (error) {
        console.error('❌ Failed to load user data:', error)
        setUserChannelAccess([])
        setUserAccess({})
        setUserChannelSubscriptions({})
        setIsDataLoaded(true) // Still set to true to show buttons even if data loading fails
      }
    }

    loadAllUserData()
  }, [user?.address, currentAccount?.address])

  const handleFreeAccessConfirm = async () => {
    if (!selectedCreator || !selectedChannel) return

    const creator = selectedCreator
    const channel = selectedChannel
    const creatorIdentifier = creator.creatorAddress || creator.id

    try {
      // Record premium access using creator address for consistency
      const creatorIdentifierForDb = creator.creatorAddress || creator.id
      console.log(`[CreatorCards] Recording premium access for ${tier} user: ${creatorIdentifierForDb}_${channel.id}`)
      await recordPremiumAccess(creatorIdentifierForDb, channel.id)

      // Add free premium access to database for profile tracking
      const userAddress = user?.address || currentAccount?.address
      if (userAddress) {
        console.log('💾 Adding free premium channel subscription to database...')

        // Get the actual profile image blob ID from the creator's database record
        const avatarBlobId = await getCreatorProfileImageBlobIdDirect(creator.creatorAddress || creator.id)
        const fallbackBlobId = avatarBlobId || extractBlobIdFromCreatorAvatar(creator.avatar)

        // Check if subscription already exists to avoid duplicate key error
        try {
          await addUserChannelSubscription(userAddress, {
            creatorAddress: creator.creatorAddress || creator.id,
            channelId: channel.id,
            channelName: channel.name,
            channelType: channel.type,
            channelDescription: channel.description,
            pricePaid: 0, // Free for PRO/ROYAL users
            subscriptionTier: channel.type,
            expiryDate: undefined, // Free access doesn't expire
            channelAvatarBlobId: fallbackBlobId
          })
        } catch (subscriptionError: any) {
          if (subscriptionError.code === '23505') {
            // Subscription already exists - this is actually good!
            console.log('✅ Subscription already exists - user already has access')
          } else {
            throw subscriptionError // Re-throw if it's a different error
          }
        }

        console.log('✅ Free premium channel subscription added to database')
        toast.success(`Joined ${channel.name} using your ${tier} free access!`)

        // Update local state to reflect the new subscription
        const newSubscriptions = { ...userChannelSubscriptions }
        newSubscriptions[`${creator.creatorAddress || creator.id}_${channel.id}`] = true
        setUserChannelSubscriptions(newSubscriptions)

        // Refresh premium access records to update the counter
        await refreshPremiumAccess()
      }

      // Close modal and redirect
      setShowFreeAccessModal(false)
      const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creatorIdentifier)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}`
      window.location.href = forumUrl

    } catch (error) {
      console.error('❌ Failed to process free premium access:', error)
      toast.error('Failed to access channel. Please try again.')
    }
  }

  const handleChannelAccess = async (creator: Creator, channel: Channel) => {
    // Check authentication first
    if (!isSignedIn) {
      toast.error('Please connect your wallet to continue')
      return
    }

    // Use creator address for consistency (wallet address is more reliable than ID)
    const creatorIdentifier = creator.creatorAddress || creator.id

    // For free channels, record subscription and then redirect
    if (channel.type === 'free') {
      // Record free channel subscription in database for profile page integration
      const userAddress = user?.address || currentAccount?.address
      if (userAddress && !hasAccess(creator.id, channel.id)) {
        try {
          console.log('💾 Adding free channel subscription to database...')

          // Get the actual profile image blob ID from the creator's database record
          const avatarBlobId = await getCreatorProfileImageBlobIdDirect(creator.creatorAddress || creator.id)
          const fallbackBlobId = avatarBlobId || extractBlobIdFromCreatorAvatar(creator.avatar)

          await addUserChannelSubscription(userAddress, {
            creatorAddress: creator.creatorAddress || creator.id,
            channelId: channel.id,
            channelName: channel.name,
            channelType: channel.type,
            channelDescription: channel.description,
            pricePaid: 0,
            subscriptionTier: channel.type,
            expiryDate: undefined, // Free channels don't expire
            channelAvatarBlobId: fallbackBlobId
          })

          console.log('✅ Free channel subscription added to database')
          toast.success(`Joined ${channel.name}! Check your profile to see all joined channels.`)

          // Update local state to show leave button immediately
          const newSubscriptions = { ...userChannelSubscriptions }
          newSubscriptions[`${creator.creatorAddress || creator.id}_${channel.id}`] = true
          setUserChannelSubscriptions(newSubscriptions)

        } catch (error) {
          console.error('❌ Failed to add free channel subscription:', error)
        }
      }

      const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creatorIdentifier)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}`
      window.location.href = forumUrl
      return // Stop here for free channels
    }

    // For premium channels, handle database recording BEFORE redirect
    // PRO and ROYAL users have limited free access to premium channels
    if (tier === 'PRO' || tier === 'ROYAL') {
      const creatorIdentifierForAccess = creator.creatorAddress || creator.id

      // First check if user already has access to this channel
      if (hasAccess(creator.id, channel.id)) {
        // User already has access - redirect directly without showing modal

        const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creatorIdentifier)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}`
        window.location.href = forumUrl
        return
      }

      // User doesn't have access yet - check if they can get free access AND have remaining slots
      const hasRemainingSlots = (tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0) - joinedChannels > 0
      if (canAccessPremiumForFree(creatorIdentifierForAccess, channel.id) && hasRemainingSlots) {
        // User can access this premium channel for free - show modal

        setSelectedCreator(creator)
        setSelectedChannel(channel)
        setShowFreeAccessModal(true)
        return
      } else {
        // User has exceeded their free premium channel limit, show payment modal

        setSelectedCreator(creator)
        setSelectedChannel(channel)
        setShowPaymentModal(true)
        return
      }
    }

    // Check if user has paid access to this premium channel
    const accessKey = `${creator.id}_${channel.id}`
    if (userAccess[accessKey]) {
      // User has paid access, redirect to forum
    } else {
      // Show payment modal for premium/vip channels (NOMAD users or users without access)
      setSelectedCreator(creator)
      setSelectedChannel(channel)
      setShowPaymentModal(true)
      return
    }

    // Redirect to forum (for both free tier access and paid access)
    const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creatorIdentifier)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}`
    window.location.href = forumUrl
  }

  const handleLeaveChannel = async (creator: Creator, channel: Channel, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the access button

    const channelName = channel.name
    const creatorName = creator.name

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to leave "${channelName}" by ${creatorName}?\n\nThis will remove your access to this premium channel. You'll need to purchase access again if you want to rejoin.`
    )

    if (!confirmed) return

    // Remove from database
    const userAddress = user?.address || currentAccount?.address
    if (userAddress) {
      try {
        console.log('🗑️ Removing channel subscription from database...')

        await channelSubscriptionsStorage.removeChannelSubscription(userAddress, channel.id)

        console.log('✅ Channel subscription removed from database')

        // Trigger a custom event to notify profile page to refresh
        window.dispatchEvent(new CustomEvent('channelRemoved', {
          detail: { channelId: channel.id, userAddress }
        }))

      } catch (error) {
        console.error('❌ Failed to remove channel subscription from database:', error)
        // Continue with local cleanup even if database removal fails
      }
    }

    // Remove from database (paid access)
    if (currentAccount?.address) {
      try {
        await channelAccessStorage.removeChannelAccess(currentAccount.address, creator.id, channel.id)
        console.log(`✅ Removed channel access from database for: ${creator.id}_${channel.id}`)
      } catch (error) {
        console.error('❌ Failed to remove channel access from database:', error)
      }
    }

    // Remove from premium access records (free access for PRO/ROYAL users)
    const creatorIdentifierForRemoval = creator.creatorAddress || creator.id
    removePremiumAccess(creatorIdentifierForRemoval, channel.id)

    // Remove from database subscriptions (free channels and other subscriptions)
    if (currentAccount?.address) {
      try {
        await channelSubscriptionsStorage.removeChannelSubscription(currentAccount.address, channel.id)
        console.log(`[CreatorCards] Removed database subscription for channel: ${channel.id}`)
      } catch (error) {
        console.error('❌ Failed to remove database subscription:', error)
      }
    }

    // Update local state
    const newUserAccess = { ...userAccess }
    delete newUserAccess[`${creator.id}_${channel.id}`]
    setUserAccess(newUserAccess)

    const newSubscriptions = { ...userChannelSubscriptions }
    delete newSubscriptions[`${creator.id}_${channel.id}`]
    delete newSubscriptions[`${creator.creatorAddress || creator.id}_${channel.id}`]
    setUserChannelSubscriptions(newSubscriptions)

    // Show success message
    console.log(`[CreatorCards] User left channel: ${channelName} by ${creatorName}`)
    const channelType = channel.type === 'free' ? 'free channel' : 'premium channel'
    toast.success(`Successfully left "${channelName}". You no longer have access to this ${channelType}.`)

    // Refresh page to update all counters and UI
    setTimeout(() => {
      window.location.reload()
    }, 1000) // Small delay to show the toast message
  }

  const handleDeleteChannel = async (creator: Creator, channel: Channel, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the access button

    const channelName = channel.name
    const creatorName = creator.name

    // First confirmation dialog
    const confirmed = window.confirm(
      `⚠️ DELETE CHANNEL CONFIRMATION ⚠️\n\n` +
      `Channel: "${channelName}"\n` +
      `Creator: ${creatorName}\n\n` +
      `This action will:\n` +
      `• Permanently remove the channel from your profile\n` +
      `• Remove all subscriber access to this channel\n` +
      `• Cannot be undone\n\n` +
      `Are you sure you want to continue?`
    )

    if (!confirmed) {
      console.log(`[CreatorCards] Channel deletion cancelled by user: ${channelName}`)
      return
    }

    // Second confirmation - type channel name
    const typedName = window.prompt(
      `FINAL CONFIRMATION\n\n` +
      `To permanently delete this channel, please type the exact channel name:\n\n` +
      `"${channelName}"\n\n` +
      `Type here:`
    )

    if (typedName === null) {
      // User clicked cancel
      console.log(`[CreatorCards] Channel deletion cancelled by user: ${channelName}`)
      return
    }

    if (typedName.trim() !== channelName) {
      toast.error(`Channel name does not match. Expected "${channelName}" but got "${typedName}". Deletion cancelled.`)
      return
    }

    try {
      console.log(`[CreatorCards] Starting channel deletion: ${channelName} by ${creatorName}`)

      // Show loading toast
      const loadingToast = toast.loading(`Deleting channel "${channelName}"...`)

      await deleteChannel(creator.id, channel.id)

      // Clean up database access records for this channel
      if (currentAccount?.address) {
        try {
          await channelAccessStorage.removeChannelAccess(currentAccount.address, creator.id, channel.id)
          console.log('✅ Removed channel access from database during deletion')
        } catch (error) {
          console.error('❌ Failed to remove channel access from database during deletion:', error)
        }
      }

      // Clean up premium access records
      const creatorIdentifierForCleanup = creator.creatorAddress || creator.id
      removePremiumAccess(creatorIdentifierForCleanup, channel.id)

      // Update local state
      const newUserAccess = { ...userAccess }
      delete newUserAccess[`${creator.id}_${channel.id}`]
      setUserAccess(newUserAccess)

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      console.log(`[CreatorCards] Channel deleted successfully: ${channelName}`)
    } catch (error) {
      console.error(`[CreatorCards] Failed to delete channel: ${channelName}`, error)

      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to delete channel "${channelName}": ${errorMessage}`)
    }
  }

  const handleReportChannel = (creator: Creator, channel: Channel, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the access button

    if (!isSignedIn) {
      toast.error('Please connect your wallet to report a channel')
      return
    }

    // Set report modal data
    const channelId = `${creator.id}_${channel.id}`
    setReportChannelId(channelId)
    setReportChannelName(channel.name)
    setReportCreatorAddress(creator.creatorAddress || creator.id)
    setReportCreatorName(creator.name)
    setShowReportModal(true)

    console.log(`[CreatorCards] Opening report modal for channel: ${channel.name} by ${creator.name}`)
    console.log('🔍 Report channel ID being set:', {
      channelId,
      creatorId: creator.id,
      channelIdRaw: channel.id,
      channelName: channel.name
    })
  }

  const handleReportSubmitted = () => {
    // Refresh report statistics after a report is submitted
    refreshStats(channelIds)
    setShowReportModal(false)

    // Reset report modal data
    setReportChannelId('')
    setReportChannelName('')
    setReportCreatorAddress('')
    setReportCreatorName('')
  }

  // Check if the current user owns a specific creator profile
  const isOwner = (creator: Creator): boolean => {
    if (!currentAccount?.address && !user?.address) {
      console.log(`[CreatorCards] Ownership check: No user connected`)
      return false
    }

    const userAddress = currentAccount?.address || user?.address

    // Check if creator has a creatorAddress field (proper ownership verification)
    if (creator.creatorAddress) {
      const isOwner = creator.creatorAddress.toLowerCase() === userAddress?.toLowerCase()
      return isOwner
    }

    // If no creatorAddress field, user doesn't own this creator
    return false
  }

  const handlePaymentSuccess = async (creatorId: string, channelId: string) => {
    const accessKey = `${creatorId}_${channelId}`
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 1)

    // Update local state for immediate UI feedback
    setUserAccess(prev => ({
      ...prev,
      [accessKey]: expiry.toISOString()
    }))

    // Find the channel and creator details
    const creator = creators.find(c => c.id === creatorId)
    const channel = creator?.channels.find(ch => ch.id === channelId)

    // Grant access in database and add subscription if user is connected and channel exists
    const userAddress = user?.address || currentAccount?.address
    if (userAddress && creator && channel) {
      try {
        // Grant channel access in database
        await grantChannelAccess(userAddress, creatorId, channelId, 'paid', expiry, channel.price || 0)
        console.log('✅ Channel access granted in database')

        console.log('💾 Adding channel subscription to database...')

        // Get the actual profile image blob ID from the creator's database record
        const avatarBlobId = await getCreatorProfileImageBlobIdDirect(creator.creatorAddress || creator.id)
        console.log('🖼️ Retrieved creator profile image blob ID for payment success:', avatarBlobId)

        // If no blob ID found, try extracting from avatar URL as fallback
        const fallbackBlobId = avatarBlobId || extractBlobIdFromCreatorAvatar(creator.avatar)
        console.log('🔄 Final blob ID for payment success (with fallback):', fallbackBlobId)

        await addUserChannelSubscription(userAddress, {
          creatorAddress: creator.creatorAddress || creator.id, // Use creatorAddress if available, fallback to id
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.type,
          channelDescription: channel.description,
          pricePaid: channel.price || 0,
          subscriptionTier: channel.type,
          expiryDate: expiry.toISOString(),
          // Use the actual blob ID from database (with fallback)
          channelAvatarBlobId: fallbackBlobId
        })

        console.log('✅ Channel subscription added to database successfully')
        toast.success(`Joined ${channel.name}! Check your profile to see all joined channels.`)

        // Trigger a custom event to notify profile page to refresh
        window.dispatchEvent(new CustomEvent('channelAdded', {
          detail: { channelId: channel.id, userAddress }
        }))

      } catch (error) {
        console.error('❌ Failed to add channel subscription to database:', error)
        // Don't show error to user as the payment was successful, just log it
        console.warn('Channel access granted but not recorded in profile. Manual sync may be needed.')
      }
    }

    // Redirect to forum using the creator and channel already found above
    if (creator && channel) {
      // Get channel-specific images with proper fallbacks
      const channelAvatar = (channel as any).channelAvatar || creator.avatar || ''
      const channelCover = (channel as any).channelCover || creator.coverImage || ''

      // Redirect to Forum Creators category with creator context including channel images
      const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creator.id)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}&channelAvatar=${encodeURIComponent(channelAvatar)}&channelCover=${encodeURIComponent(channelCover)}`

      window.location.href = forumUrl
    }
  }

  const getCategoryIcon = (category: string) => {
    // Use the standardized category icon function
    return getStandardCategoryIcon(category)
  }

  const getCategoryColor = (category: string) => {
    // Consistent gray style for all categories (no hover, no different colors)
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getChannelTypeColor = (type: string) => {
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

  // Memoize creator address lookup for performance
  const creatorAddressMap = useMemo(() => {
    const map = new Map()
    creators.forEach(creator => {
      map.set(creator.id, creator.creatorAddress || creator.id)
    })
    return map
  }, [creators])

  // Memoize premium access lookup for performance
  const premiumAccessMap = useMemo(() => {
    const map = new Set()
    premiumAccessRecords.forEach(record => {
      map.add(`${record.creatorId}_${record.channelId}`)
    })
    return map
  }, [premiumAccessRecords])

  const hasAccess = useCallback((creatorId: string, channelId: string) => {
    const creatorAddress = creatorAddressMap.get(creatorId) || creatorId

    // Check premium access (fastest lookup)
    if (premiumAccessMap.has(`${creatorAddress}_${channelId}`)) {
      return true
    }

    // Check subscriptions (fast object lookup)
    const subscriptionKey = `${creatorAddress}_${channelId}`
    if (userChannelSubscriptions[subscriptionKey]) {
      return true
    }

    // Fallback with creator ID
    const fallbackKey = `${creatorId}_${channelId}`
    if (userChannelSubscriptions[fallbackKey]) {
      return true
    }

    // Check database access (slower but necessary)
    const hasDbAccess = userChannelAccess.some(
      access => access.creatorId === creatorAddress && access.channelId === channelId && access.isActive
    )
    if (hasDbAccess) {
      return true
    }

    // Legacy localStorage check
    const accessKey = `${creatorId}_${channelId}`
    if (userAccess[accessKey]) {
      return true
    }

    return false
  }, [creatorAddressMap, premiumAccessMap, userChannelSubscriptions, userChannelAccess, userAccess])

  const getAccessExpiry = (creatorId: string, channelId: string) => {
    // Find the creator to get the wallet address
    const creator = creators.find(c => c.id === creatorId)
    const creatorAddress = creator?.creatorAddress || creatorId

    // Check database access first (using creator address)
    const dbAccess = userChannelAccess.find(
      access => access.creatorId === creatorAddress && access.channelId === channelId && access.isActive
    )
    if (dbAccess) {
      return dbAccess.expiryDate
    }

    // Fallback to legacy localStorage access
    const accessKey = `${creatorId}_${channelId}`
    const expiry = userAccess[accessKey]
    return expiry ? new Date(expiry) : null
  }

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <UserCheck className="w-3 h-3 text-green-400" />
      case 'limited':
        return <Clock className="w-3 h-3 text-orange-400" />
      case 'full':
        return <UserX className="w-3 h-3 text-red-400" />
      default:
        return <UserCheck className="w-3 h-3 text-green-400" />
    }
  }

  const getAvailabilityText = (availability: Creator['availability']) => {
    if (!availability.hasLimit) return 'Open'

    switch (availability.status) {
      case 'available':
        return `${availability.currentSlots} out of ${availability.maxSlots} slots`
      case 'limited':
        return `${availability.currentSlots} out of ${availability.maxSlots} slots`
      case 'full':
        return 'Full'
      default:
        return 'Open'
    }
  }

  // Memoize access checks to avoid recalculating on every render
  const accessMap = useMemo(() => {
    const map = new Map<string, boolean>()
    if (isDataLoaded) {
      creators.forEach(creator => {
        creator.channels.forEach(channel => {
          const key = `${creator.id}_${channel.id}`
          map.set(key, hasAccess(creator.id, channel.id))
        })
      })
    }
    return map
  }, [creators, hasAccess, userChannelSubscriptions, premiumAccessRecords, userChannelAccess, isDataLoaded])

  // Filter creators based on whether user has access to their channels
  const filteredCreators = useMemo(() => {
    return showOnlyJoined
      ? creators.filter(creator =>
          creator.channels.some(channel =>
            channel.type === 'free' || accessMap.get(`${creator.id}_${channel.id}`)
          )
        )
      : creators
  }, [creators, showOnlyJoined, accessMap])

  // Pagination logic
  const totalPages = Math.ceil(filteredCreators.length / CHANNELS_PER_PAGE)
  const startIndex = (currentPage - 1) * CHANNELS_PER_PAGE
  const endIndex = startIndex + CHANNELS_PER_PAGE
  const paginatedCreators = useMemo(() => {
    return filteredCreators.slice(startIndex, endIndex)
  }, [filteredCreators, startIndex, endIndex])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [showOnlyJoined, filteredCreators.length])

  const joinedChannelsCount = useMemo(() => {
    return creators.reduce((count, creator) => {
      return count + creator.channels.filter(channel =>
        channel.type === 'free' || accessMap.get(`${creator.id}_${channel.id}`)
      ).length
    }, 0)
  }, [creators, accessMap])



  return (
    <>
      {/* Filter Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowOnlyJoined(!showOnlyJoined)}
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 ${
              showOnlyJoined
                ? "bg-[#4DA2FF] text-white border-[#4DA2FF]"
                : "bg-[#1a2f51] text-[#C0E6FF] border-[#C0E6FF]/20 hover:border-[#4DA2FF]/50"
            }`}
          >
            {showOnlyJoined ? <FilterX className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            {showOnlyJoined ? "Show All" : "Show Joined Only"}
          </Button>

          {showOnlyJoined && (
            <span className="text-[#C0E6FF] text-sm">
              {joinedChannelsCount} joined channel{joinedChannelsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="text-[#C0E6FF] text-sm">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredCreators.length)} of {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedCreators.map((creator) => {
          const CategoryIcon = getCategoryIcon(creator.category)

          return (
            <div key={creator.id} id={`creator-${creator.id}`} className="enhanced-card overflow-hidden">
              {/* Banner with Avatar and Channel Icons */}
              <div
                className="relative h-20 flex items-center p-3 rounded-t-lg overflow-hidden"
                style={{
                  background: (() => {
                    // Use first channel's cover image only (no creator profile cover)
                    const firstChannel = creator.channels[0] as any
                    const channelCover = firstChannel?.channelCover

                    return channelCover
                      ? `url(${channelCover})`
                      : `linear-gradient(135deg, ${creator.bannerColor}40, ${creator.bannerColor}20)`
                  })(),
                  backgroundSize: (() => {
                    const firstChannel = creator.channels[0] as any
                    const channelCover = firstChannel?.channelCover
                    return channelCover ? 'cover' : 'auto'
                  })(),
                  backgroundPosition: (() => {
                    const firstChannel = creator.channels[0] as any
                    const channelCover = firstChannel?.channelCover
                    return channelCover ? 'center' : 'auto'
                  })(),
                  borderBottom: `2px solid ${creator.bannerColor}60`
                }}
              >
                {/* Cover Image Overlay for better text readability */}
                {(() => {
                  const firstChannel = creator.channels[0] as any
                  const channelCover = firstChannel?.channelCover
                  return channelCover && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg"></div>
                  )
                })()}
                {/* Main Banner Content */}
                <div className="banner-main-content flex items-center gap-2 w-full relative z-10">
                  <Avatar className="h-16 w-16 border-4 border-black shadow-lg ring-2 ring-black/50">
                    <AvatarImage
                      src={(() => {
                        // Use first channel's avatar only (no creator profile avatar)
                        const firstChannel = creator.channels[0] as any
                        const channelAvatar = firstChannel?.channelAvatar
                        return channelAvatar
                      })()}
                      alt={creator.name}
                    />
                    <AvatarFallback className="bg-[#4DA2FF] text-white text-xl">
                      {creator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {/* Dark background overlay for better text readability */}
                    <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-white font-semibold text-sm truncate">{creator.name}</h3>
                        {creator.verified && (
                          <CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-white/90 text-xs">@{creator.username}</p>
                    </div>
                  </div>

                  {/* Role Badge - Right Corner */}
                  <div className="flex items-center">
                    <Badge className="bg-black/60 backdrop-blur-sm border border-[#4DA2FF]/50 text-[#4DA2FF] text-xs px-2 py-1">
                      {creator.role}
                    </Badge>
                  </div>
                </div>


              </div>

              <div className="p-3 space-y-2">
                {/* Categories - Top line */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {(creator.categories || [creator.category]).slice(0, 3).map((category, index) => {
                    const CategoryIcon = getCategoryIcon(category)
                    return (
                      <Badge key={index} className={`text-xs px-1.5 py-0.5 ${getCategoryColor(category)} flex items-center`}>
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        <span className="truncate">{category}</span>
                      </Badge>
                    )
                  })}
                  {creator.categories && creator.categories.length > 3 && (
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs px-1.5 py-0.5">
                      +{creator.categories.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Subscribers, Slots, Language - Bottom line */}
                <div className="flex items-center justify-center gap-3 text-xs text-[#C0E6FF]">
                  {/* Subscribers */}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{creator.subscribers > 1000 ? `${(creator.subscribers/1000).toFixed(1)}k` : creator.subscribers} subscribers</span>
                  </div>

                  {/* Slots/Availability */}
                  <div className="flex items-center gap-1">
                    {getAvailabilityIcon(creator.availability.status)}
                    <span>{getAvailabilityText(creator.availability)}</span>
                  </div>

                  {/* Language */}
                  <div className="flex items-center gap-1">
                    {creator.languages.slice(0, 1).map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="text-xs border-[#C0E6FF]/30 text-[#C0E6FF] px-1.5 py-0.5"
                      >
                        {lang}
                      </Badge>
                    ))}
                    {creator.languages.length > 1 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-[#C0E6FF]/30 text-[#C0E6FF] px-1.5 py-0.5"
                      >
                        +{creator.languages.length - 1}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Channel Details - Full Width at Bottom */}
                <div className="space-y-1.5">
                  {creator.channels.slice(0, 1).map((channel) => {
                    const hasChannelAccess = accessMap.get(`${creator.id}_${channel.id}`) || false
                    const creatorIdentifierForAccess = creator.creatorAddress || creator.id
                    const canAccessForFree = (tier === 'PRO' || tier === 'ROYAL') && canAccessPremiumForFree(creatorIdentifierForAccess, channel.id)



                    return (
                      <div
                        key={channel.id}
                        className="bg-[#1a2f51] rounded p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-white text-xs font-medium">{channel.name}</span>
                            <Badge className={`text-xs ${getChannelTypeColor(channel.type)} px-1 py-0`}>
                              {channel.type[0].toUpperCase()}
                            </Badge>
                          </div>

                          {/* Warning indicator and report button */}
                          <div className="flex items-center gap-1">
                            {/* Warning indicator for reported channels */}
                            {(() => {
                              const channelKey = `${creator.id}_${channel.id}`
                              const channelHasWarning = hasWarning(channelKey)
                              const warningLevel = getWarningLevel(channelKey) as ChannelWarningLevel
                              const reportCount = getReportCount(channelKey)



                              if (channelHasWarning) {
                                return (
                                  <div
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${getWarningLevelBgColor(warningLevel)}`}
                                    title={`${getReportCountText(reportCount)} - Warning: ${warningLevel}`}
                                  >
                                    <AlertTriangle className={`w-3 h-3 ${getWarningLevelColor(warningLevel)}`} />
                                    <span className={getWarningLevelColor(warningLevel)}>{reportCount}</span>
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Report button - only show for non-owners */}
                            {!isOwner(creator) && (
                              <Button
                                onClick={(e) => handleReportChannel(creator, channel, e)}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                title={`Report "${channel.name}"`}
                              >
                                <Flag className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Channel Description */}
                        {channel.description && (
                          <div className="text-[#C0E6FF]/80 text-xs leading-relaxed">
                            {channel.description}
                          </div>
                        )}

                        {/* Show buttons based on user access and ownership */}
                        {isOwner(creator) ? (
                          // Owner view: Show delete button prominently
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleChannelAccess(creator, channel)}
                              size="sm"
                              className="flex-1 h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Preview
                            </Button>
                            <Button
                              onClick={(e) => handleDeleteChannel(creator, channel, e)}
                              size="sm"
                              className="h-6 text-xs bg-red-600 hover:bg-red-700 text-white px-2"
                              title={`Delete "${channel.name}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : hasChannelAccess && isDataLoaded ? (
                          // User has access: Show Access and Leave buttons (for both free and premium)
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleChannelAccess(creator, channel)}
                              size="sm"
                              className="flex-1 h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              Access
                            </Button>
                            <Button
                              onClick={(e) => handleLeaveChannel(creator, channel, e)}
                              size="sm"
                              className="h-6 text-xs bg-red-600 hover:bg-red-700 text-white px-2"
                              title="Leave Channel"
                            >
                              <LogOut className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          // Regular user view: Show access/payment button
                          <Button
                            onClick={() => handleChannelAccess(creator, channel)}
                            size="sm"
                            disabled={channel.availability?.status === 'full' || !isDataLoaded}
                            className={`w-full h-6 text-xs ${
                              !isDataLoaded
                                ? "bg-gray-500 text-gray-300 cursor-wait"
                                : channel.availability?.status === 'full'
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : channel.type === 'free' || (canAccessForFree && (tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0) - joinedChannels > 0)
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                            }`}
                          >
                            {!isDataLoaded ? (
                              'Loading...'
                            ) : channel.availability?.status === 'full' ? (
                              'Full'
                            ) : channel.type === 'free' ? (
                              'Access Free'
                            ) : canAccessForFree && (tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0) - joinedChannels > 0 ? (
                              `Access Free (${Math.max(0, (tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0) - joinedChannels)} left)`
                            ) : (() => {
                              // Get the pricing information
                              const getChannelPricing = () => {
                                if (!channel.subscriptionPackages || channel.subscriptionPackages.length === 0) {
                                  return `Tip ${channel.price} SUI`
                                }

                                if (channel.subscriptionPackages.length === 1) {
                                  const duration = channel.subscriptionPackages[0]
                                  let price = channel.price

                                  if (channel.pricing) {
                                    switch (duration) {
                                      case "30":
                                        price = channel.pricing.thirtyDays || channel.price
                                        break
                                      case "60":
                                        price = channel.pricing.sixtyDays || channel.price
                                        break
                                      case "90":
                                        price = channel.pricing.ninetyDays || channel.price
                                        break
                                    }
                                  }

                                  return `Tip ${price} SUI`
                                }

                                // Multiple subscription packages - show range or "from" price
                                const prices = channel.subscriptionPackages.map(duration => {
                                  let price = channel.price
                                  if (channel.pricing) {
                                    switch (duration) {
                                      case "30":
                                        price = channel.pricing.thirtyDays || channel.price
                                        break
                                      case "60":
                                        price = channel.pricing.sixtyDays || channel.price
                                        break
                                      case "90":
                                        price = channel.pricing.ninetyDays || channel.price
                                        break
                                    }
                                  }
                                  return price
                                }).filter(price => price > 0)

                                if (prices.length === 0) return 'Tip SUI'

                                const minPrice = Math.min(...prices)
                                const maxPrice = Math.max(...prices)

                                if (minPrice === maxPrice) {
                                  return `Tip ${minPrice} SUI`
                                } else {
                                  return `From ${minPrice} SUI`
                                }
                              }

                              return getChannelPricing()
                            })()}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1)
                    }
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current page
                const showPage = page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 1

                if (!showPage && page === 2 && currentPage > 4) {
                  return (
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                  return (
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                if (!showPage) return null

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1)
                    }
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <TipPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        creator={selectedCreator}
        channel={selectedChannel}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ChannelReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        channelId={reportChannelId}
        channelName={reportChannelName}
        creatorAddress={reportCreatorAddress}
        creatorName={reportCreatorName}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Free Access Modal for PRO/ROYAL users */}
      {showFreeAccessModal && selectedCreator && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0A1628] border border-[#1E3A8A] rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              🎉 Free Premium Access!
            </h3>
            <p className="text-[#C0E6FF] mb-4">
              As a <span className="text-yellow-400 font-semibold">{tier}</span> member, you get free access to this premium channel!
            </p>
            <div className="bg-[#1a2f51] rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold">{selectedChannel.name}</h4>
              <p className="text-[#C0E6FF] text-sm">by {selectedCreator.name}</p>
              <p className="text-green-400 text-sm mt-2">
                ✅ Free access ({Math.max(0, (tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0) - joinedChannels - 1)} remaining after this)
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFreeAccessModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFreeAccessConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Access Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
