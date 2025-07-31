"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TipPaymentModal } from "./tip-payment-modal"
import { featuredChannelsService, FeaturedChannelsResponse } from "@/lib/featured-channels-service"
import { FeaturedChannel } from "@/app/api/creators/featured/route"
import { useSubscription } from "@/contexts/subscription-context"
import { usePremiumAccess } from "@/contexts/premium-access-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { getUserJoinedChannels, addUserChannelSubscription } from "@/lib/channel-subscriptions-storage"
import { getUserChannelAccess, type UserChannelAccess } from "@/lib/channel-access-storage"
import { 
  Star, 
  Users, 
  MessageSquare, 
  FileText, 
  Crown, 
  Shield, 
  TrendingUp,
  Loader2,
  Trophy
} from "lucide-react"
import { toast } from "sonner"

interface FeaturedChannelsProps {
  className?: string
  refreshTrigger?: number // Add a prop to trigger refresh from parent
}

export function FeaturedChannels({ className, refreshTrigger }: FeaturedChannelsProps) {
  const [featuredChannels, setFeaturedChannels] = useState<FeaturedChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<FeaturedChannel | null>(null)
  const [showTipModal, setShowTipModal] = useState(false)

  const { user } = useSuiAuth()
  const currentAccount = useCurrentAccount()
  const { canAccessPremiumForFree, premiumAccessRecords } = usePremiumAccess()
  const { tier } = useSubscription()

  // Local state for user access data
  const [userChannelSubscriptions, setUserChannelSubscriptions] = useState<Record<string, boolean>>({})
  const [userChannelAccess, setUserChannelAccess] = useState<UserChannelAccess[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Check if user has access to a channel
  const hasAccess = (creatorId: string, channelId: string): boolean => {
    const userAddress = user?.address || currentAccount?.address
    if (!userAddress) return false

    // Check premium access first (fastest lookup)
    const hasPremiumAccess = premiumAccessRecords.some(record =>
      record.creatorId === creatorId && record.channelId === channelId
    )
    if (hasPremiumAccess) return true

    // Check subscriptions (fast object lookup)
    const subscriptionKey = `${creatorId}_${channelId}`
    if (userChannelSubscriptions[subscriptionKey]) {
      return true
    }

    // Check database access
    const hasDbAccess = userChannelAccess.some(
      access => access.creatorId === creatorId && access.channelId === channelId && access.isActive
    )
    if (hasDbAccess) return true

    // Check if user can access premium for free (PRO/ROYAL tier)
    return canAccessPremiumForFree(creatorId, channelId)
  }

  // Load user access data
  useEffect(() => {
    const loadUserAccessData = async () => {
      const userAddress = user?.address || currentAccount?.address
      if (!userAddress) {
        setUserChannelAccess([])
        setUserChannelSubscriptions({})
        setIsDataLoaded(true)
        return
      }

      try {
        // Load user channel subscriptions and access data
        const [userChannels, channelAccess] = await Promise.all([
          getUserJoinedChannels(userAddress),
          getUserChannelAccess(userAddress)
        ])

        // Convert subscriptions to lookup object
        const subscriptions: Record<string, boolean> = {}
        userChannels.forEach(channel => {
          const key = `${channel.creatorAddress}_${channel.id}`
          subscriptions[key] = channel.isActive
        })

        setUserChannelSubscriptions(subscriptions)
        setUserChannelAccess(channelAccess)
        setIsDataLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load user access data:', error)
        setUserChannelAccess([])
        setUserChannelSubscriptions({})
        setIsDataLoaded(true)
      }
    }

    loadUserAccessData()
  }, [user?.address, currentAccount?.address])

  // Refresh user access data when featured channels are loaded
  const refreshUserAccess = async () => {
    const userAddress = user?.address || currentAccount?.address
    if (!userAddress) return

    try {
      const [userChannels, channelAccess] = await Promise.all([
        getUserJoinedChannels(userAddress),
        getUserChannelAccess(userAddress)
      ])

      const subscriptions: Record<string, boolean> = {}
      userChannels.forEach(channel => {
        const key = `${channel.creatorAddress}_${channel.id}`
        subscriptions[key] = channel.isActive
      })

      setUserChannelSubscriptions(subscriptions)
      setUserChannelAccess(channelAccess)
    } catch (error) {
      console.error('❌ Failed to refresh user access data:', error)
    }
  }

  // Load featured channels
  useEffect(() => {
    loadFeaturedChannels()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refreshUserAccess()
    }
  }, [refreshTrigger])

  const loadFeaturedChannels = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response: FeaturedChannelsResponse = await featuredChannelsService.getFeaturedChannels()

      if (response.success) {
        setFeaturedChannels(response.data)
        // Refresh user access data when featured channels are loaded
        await refreshUserAccess()
      } else {
        setError(response.error || 'Failed to load featured channels')
      }
    } catch (err) {
      console.error('Error loading featured channels:', err)
      setError('Failed to load featured channels')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChannelAccess = async (channel: FeaturedChannel) => {
    if (!user?.address) {
      toast.error('Please connect your wallet first')
      return
    }

    const channelData = channel.channels[0]
    if (!channelData) return

    // Check if user already has access
    const userHasAccess = hasAccess(channel.id, channelData.id)
    
    if (userHasAccess) {
      toast.success('You already have access to this channel')
      return
    }

    // Handle free channels
    if (channelData.type === 'free') {
      try {
        await addUserChannelSubscription(user.address, {
          creatorAddress: channel.creatorAddress,
          channelId: channelData.id,
          channelName: channelData.name,
          channelType: 'free',
          channelDescription: channelData.description,
          pricePaid: 0,
          subscriptionTier: 'free'
        })

        // Update local state
        const newSubscriptions = { ...userChannelSubscriptions }
        newSubscriptions[`${channel.creatorAddress}_${channelData.id}`] = true
        setUserChannelSubscriptions(newSubscriptions)

        // Refresh user access data to ensure consistency
        await refreshUserAccess()

        toast.success(`Successfully joined ${channelData.name}!`)
      } catch (error) {
        console.error('Failed to join free channel:', error)
        toast.error('Failed to join channel')
      }
      return
    }

    // Handle premium channels - show tip modal
    setSelectedChannel(channel)
    setShowTipModal(true)
  }



  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-green-400" />
      case 2:
        return <Trophy className="w-6 h-6 text-green-400" />
      case 3:
        return <Trophy className="w-6 h-6 text-green-400" />
      default:
        return <Star className="w-6 h-6 text-green-400" />
    }
  }

  const getPositionColor = (position: number) => {
    return 'text-green-400'
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-[#4DA2FF]" />
          <h2 className="text-xl font-semibold text-white">Featured Channels</h2>
        </div>
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF]" />
              <span className="ml-2 text-[#C0E6FF]">Loading featured channels...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-[#4DA2FF]" />
          <h2 className="text-xl font-semibold text-white">Featured Channels</h2>
        </div>
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">Failed to load featured channels</p>
              <Button 
                onClick={loadFeaturedChannels}
                variant="outline"
                size="sm"
                className="border-[#4DA2FF]/20 text-[#4DA2FF] hover:bg-[#4DA2FF]/10"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (featuredChannels.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-[#4DA2FF]" />
          <h2 className="text-xl font-semibold text-white">Featured Channels</h2>
        </div>
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-8">
              <Star className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No featured channels yet
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto">
                Featured channels will appear here based on subscriber count, posts, and engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-[#4DA2FF]/20 to-[#4DA2FF]/10 border border-[#4DA2FF]/30">
            <TrendingUp className="w-6 h-6 text-[#4DA2FF]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Channels</h2>
            <p className="text-[#C0E6FF]/80 text-sm">Top performing channels based on engagement</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-[#4DA2FF]/20 to-[#4DA2FF]/10 text-[#4DA2FF] border-[#4DA2FF]/30 px-3 py-1">
          Top {featuredChannels.length}
        </Badge>
      </div>

      {/* Featured Channels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {featuredChannels.map((channel) => {
          const channelData = channel.channels[0]
          if (!channelData) return null

          const userHasAccess = user?.address ? hasAccess(channel.id, channelData.id) : false

          return (
            <div key={channel.id} className="enhanced-card overflow-hidden relative border-t-4 border-t-[#4DA2FF]/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-t-[#4DA2FF]">
              {/* Position Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className={`flex items-center gap-1 ${getPositionColor(channel.position)}`}>
                  {getPositionIcon(channel.position)}
                  <span className="text-xs font-bold">#{channel.position}</span>
                </div>
              </div>

              {/* Avatar in top-right position */}
              <div className="absolute top-2 right-2 z-10">
                <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                  <AvatarImage src={channel.avatar} alt={channel.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1a2f51] to-[#4DA2FF]/20 text-white font-bold text-sm">
                    {channel.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Banner */}
              <div
                className="relative h-20 flex items-center justify-center p-3 rounded-t-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, #4DA2FF40, #4DA2FF20)`,
                  borderBottom: `2px solid #4DA2FF60`
                }}
              >
                {/* Channel title in center */}
                <div className="text-center">
                  <h3 className="text-white font-bold text-sm truncate max-w-[120px]">{channel.name}</h3>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4 space-y-3">
                {/* Performance Metrics */}
                <div className="bg-gradient-to-r from-[#1a2f51]/50 to-[#4DA2FF]/5 rounded-lg p-3 border border-[#4DA2FF]/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#4DA2FF]" />
                        <span className="text-[#C0E6FF] text-xs">Subs</span>
                      </div>
                      <span className="text-white font-bold text-sm">{channel.subscriberCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-green-400" />
                        <span className="text-[#C0E6FF] text-xs">Posts</span>
                      </div>
                      <span className="text-white font-bold text-sm">{channel.postCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-purple-400" />
                        <span className="text-[#C0E6FF] text-xs">Replies</span>
                      </div>
                      <span className="text-white font-bold text-sm">{channel.replyCount}</span>
                    </div>
                  </div>
                </div>


              </CardContent>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {selectedChannel && (
        <TipPaymentModal
          isOpen={showTipModal}
          onClose={() => {
            setShowTipModal(false)
            setSelectedChannel(null)
          }}
          onPaymentSuccess={async () => {
            // Refresh user access data after successful payment
            await refreshUserAccess()
            setShowTipModal(false)
            setSelectedChannel(null)
            toast.success('Payment successful! You now have access to the channel.')
          }}
          creator={{
            id: selectedChannel.id,
            name: selectedChannel.name,
            username: selectedChannel.username,
            avatar: selectedChannel.avatar,
            role: selectedChannel.role,
            creatorAddress: selectedChannel.creatorAddress,
            subscribers: selectedChannel.subscriberCount,
            category: selectedChannel.category,
            contentTypes: [],
            verified: selectedChannel.verified,
            languages: [],
            availability: {
              hasLimit: false,
              status: 'available' as const
            },
            socialLinks: {},
            bannerColor: selectedChannel.bannerColor,
            channels: selectedChannel.channels.map(ch => ({
              ...ch,
              type: ch.type as 'free' | 'premium' | 'vip'
            }))
          }}
          channel={{
            ...selectedChannel.channels[0],
            type: selectedChannel.channels[0].type as 'free' | 'premium' | 'vip'
          }}
        />
      )}
    </div>
  )
}
