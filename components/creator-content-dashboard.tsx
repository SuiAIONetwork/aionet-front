"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCreatorsDatabase } from "@/contexts/creators-database-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"

import { forumService } from "@/lib/forum-service"
import {
  Plus,
  MessageSquare,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  Settings,
  FileText,
  Reply
} from "lucide-react"
import { toast } from "sonner"

interface CreatorContentDashboardProps {
  className?: string
  tier?: string
  currentChannelCount?: number
  maxChannels?: number
}

interface OverallStats {
  total_channels: number
  total_posts: number
}

export function CreatorContentDashboard({ className, tier = 'PRO', currentChannelCount = 0, maxChannels = 2 }: CreatorContentDashboardProps) {
  const { getUserCreators } = useCreatorsDatabase()
  const { user } = useSuiAuth()
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [overallStats, setOverallStats] = useState<OverallStats>({ total_channels: 0, total_posts: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [channelPostCounts, setChannelPostCounts] = useState<Record<string, number>>({})

  // Get user's creator channels - memoize to prevent infinite re-renders
  const userCreators = user?.address ? getUserCreators(user.address) : []
  const allChannels = useMemo(() =>
    userCreators.flatMap(creator =>
      creator.channels.map(channel => ({
        ...channel,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorAvatar: creator.avatar
      }))
    ), [userCreators]
  )

  useEffect(() => {
    if (allChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(allChannels[0])
    }
  }, [allChannels.length, selectedChannel])

  useEffect(() => {
    if (user?.address) {
      loadOverallStats()
    }
  }, [user?.address]) // Only load once when user is available

  const loadChannelPostCounts = async () => {
    if (!user?.address || allChannels.length === 0) {
      setChannelPostCounts({})
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const postCounts: Record<string, number> = {}

      // Get post count for each channel
      for (const channel of allChannels) {
        const { count } = await supabase
          .from('forum_posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_address', user.address)
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .eq('post_type', 'creator_post')

        postCounts[channel.id] = count || 0
      }

      setChannelPostCounts(postCounts)
    } catch (error) {
      console.error('Failed to load channel post counts:', error)
      setChannelPostCounts({})
    }
  }

  const loadOverallStats = async () => {
    if (!user?.address) {
      setOverallStats({ total_channels: 0, total_posts: 0 })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Get total channels count
      const totalChannels = allChannels.length

      // Get total posts count using a more reliable method
      let totalPosts = 0

      if (totalChannels > 0) {
        // Query the forum_posts table directly for posts by this creator
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { count } = await supabase
          .from('forum_posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_address', user.address)
          .eq('is_deleted', false)
          .eq('post_type', 'creator_post')

        totalPosts = count || 0
      }

      setOverallStats({
        total_channels: totalChannels,
        total_posts: totalPosts
      })

      // Also load individual channel post counts
      await loadChannelPostCounts()
    } catch (error) {
      console.error('Failed to load overall stats:', error)
      // Set fallback values on error
      setOverallStats({
        total_channels: allChannels.length,
        total_posts: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = () => {
    toast.info('Post creation feature is currently disabled')
  }

  if (!user?.address) {
    return (
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-[#C0E6FF]/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
          <p className="text-[#C0E6FF]/70">Please connect your wallet to manage channel content.</p>
        </CardContent>
      </Card>
    )
  }

  if (allChannels.length === 0) {
    return (
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-[#C0E6FF]/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Channels Found</h3>
          <p className="text-[#C0E6FF]/70 mb-4">
            You need to create a channel first before managing content.
          </p>
          <Button 
            onClick={() => window.location.href = '/creator-controls'}
            className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
          >
            Create Your First Channel
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No longer need currentStats since we show overall stats

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Create Post Button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white flex items-center gap-2 text-xl font-semibold">
          <FileText className="w-5 h-5" />
          Manage Your Content
        </h3>
        <Button
          onClick={handleCreatePost}
          className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
          disabled={!selectedChannel}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Channel Selector */}
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Select Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allChannels.map((channel) => (
              <Card
                key={channel.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedChannel?.id === channel.id
                    ? "bg-[#4DA2FF]/20 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : "bg-[#030f1c] border-[#C0E6FF]/10 hover:border-[#4DA2FF]/50"
                }`}
                onClick={() => setSelectedChannel(channel)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage
                        src={(() => {
                          // Use channel-specific avatar if available
                          const channelData = channel as any
                          const channelAvatar = channelData?.channelAvatar
                          return channelAvatar || channel.creatorAvatar
                        })()}
                        alt={channel.creatorName}
                      />
                      <AvatarFallback className="bg-[#4DA2FF] text-white text-lg">
                        {channel.creatorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base">{channel.name}</h3>
                      {/* Post Count */}
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3 text-[#C0E6FF]" />
                        <span className="text-[#C0E6FF] text-xs">
                          {channelPostCounts[channel.id] || 0} posts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge
                      className={
                        channel.type === 'premium'
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : channel.type === 'vip'
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : "bg-green-500/20 text-green-400 border-green-500/30"
                      }
                    >
                      {channel.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>






    </div>
  )
}
