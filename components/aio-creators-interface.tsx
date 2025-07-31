"use client"

import { useState, useEffect, useMemo } from "react"
import { CreatorCards } from "./creator-cards"
import { FeaturedChannels } from "./featured-channels"
import { useCreatorsDatabase } from "@/contexts/creators-database-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Search, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Creator, Channel } from "@/contexts/creators-context"
import { CHANNEL_CATEGORIES_WITH_ICONS } from "@/lib/channel-categories"



export function AIOCreatorsInterface() {
  const { creators, isLoading, error, refreshCreators } = useCreatorsDatabase()
  const { user } = useSuiAuth()
  const currentAccount = useCurrentAccount()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<'subscribers' | 'newest' | 'oldest'>('newest')

  // Get current user's wallet address for filtering
  const userAddress = currentAccount?.address || user?.address

  const categories = CHANNEL_CATEGORIES_WITH_ICONS

  // Convert creators to individual channel cards (flatten channels into separate creator cards)
  // Filter out user's own channels from display - memoized for performance
  const channelCards = useMemo(() => {
    return creators.flatMap(creator => {
      // Skip creators owned by current user
      if (userAddress && creator.creatorAddress &&
          creator.creatorAddress.toLowerCase() === userAddress.toLowerCase()) {
        return []
      }

      return creator.channels.map((channel, index) => {
        const channelCard = {
          ...creator,
          id: `${creator.id}_${channel.id}`, // Unique ID for each channel card
          name: channel.name, // Use channel name instead of creator name
          username: creator.username, // Use creator username
          subscribers: channel.subscribers, // Use channel subscribers instead of creator subscribers
          channels: [channel], // Each card shows only one channel
          originalCreatorId: creator.id, // Keep reference to original creator
          channelId: channel.id, // Keep reference to channel

          // Make each channel card visually distinct
          bannerColor: index === 0 ? creator.bannerColor : (index === 1 ? '#FF6B6B' : '#4ECDC4'), // Different colors for different channels
          avatar: (channel as any).channelAvatar, // Use channel-specific avatar only
          coverImage: (channel as any).channelCover, // Use channel-specific cover only

          // Use channel-specific data if available, fallback to creator data
          availability: channel.availability || creator.availability,

          // Use channel-specific categories, role, and language if available
          category: (channel as any).channelCategories?.[0] || creator.category,
          categories: (channel as any).channelCategories || creator.categories,
          role: (channel as any).channelRole || creator.role,
          languages: (channel as any).channelLanguage ? [(channel as any).channelLanguage] : creator.languages
        }

        // Debug: Log channel-specific data
        return channelCard
      })
    })
  }, [creators, userAddress])

  // Memoize filtering and sorting for performance
  const filteredCreators = useMemo(() => {
    return channelCards.filter(creator => {
      const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           creator.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" ||
                             creator.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCategory
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Sort by creator creation date (newest first)
          // Use the creator's created_at field from the original creator data
          const aCreator = creators.find(c => c.id === a.originalCreatorId)
          const bCreator = creators.find(c => c.id === b.originalCreatorId)
          const aDate = new Date((aCreator as any)?.created_at || Date.now()).getTime()
          const bDate = new Date((bCreator as any)?.created_at || Date.now()).getTime()
          return bDate - aDate
        case 'oldest':
          // Sort by creator creation date (oldest first)
          const aCreatorOld = creators.find(c => c.id === a.originalCreatorId)
          const bCreatorOld = creators.find(c => c.id === b.originalCreatorId)
          const aDateOld = new Date((aCreatorOld as any)?.created_at || Date.now()).getTime()
          const bDateOld = new Date((bCreatorOld as any)?.created_at || Date.now()).getTime()
          return aDateOld - bDateOld
        case 'subscribers':
        default:
          return b.subscribers - a.subscribers
      }
    })
  }, [channelCards, searchTerm, selectedCategory, sortBy])



  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4DA2FF] mx-auto mb-4"></div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Loading Creators...
              </h3>
              <p className="text-[#C0E6FF]">
                Fetching creator profiles from the database
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Failed to Load Creators
              </h3>
              <p className="text-[#C0E6FF] mb-4">
                {error}
              </p>
              <Button
                onClick={refreshCreators}
                className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getTotalStats = () => {
    // Calculate stats from filtered creators (excluding user's own channels)
    const totalCreators = filteredCreators.length

    // Calculate total channels from filtered creators
    const totalChannels = filteredCreators.reduce((sum, creator) =>
      sum + creator.channels.length, 0)

    // Calculate free channels from filtered creators
    const freeChannels = filteredCreators.reduce((sum, creator) =>
      sum + creator.channels.filter(ch => ch.type === 'free').length, 0)

    // Calculate total subscribers from filtered creators
    const totalSubscribers = filteredCreators.reduce((sum, creator) =>
      sum + creator.subscribers, 0)



    return { totalCreators, totalSubscribers, totalChannels, freeChannels }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C0E6FF]" />
              <Input
                placeholder="Search creators, categories, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF] placeholder:text-[#C0E6FF]/60"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <SelectItem key={category.value} value={category.value} className="text-[#FFFFFF]">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-40 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                <SelectItem value="subscribers" className="text-[#FFFFFF]">Subscribers</SelectItem>
                <SelectItem value="newest" className="text-[#FFFFFF]">New Channels</SelectItem>
                <SelectItem value="oldest" className="text-[#FFFFFF]">Old Channels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          <div className="pt-4 border-t border-[#C0E6FF]/20 mt-4">
            {/* Mobile: Stack vertically */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4DA2FF]" />
                <span className="text-[#C0E6FF] text-sm">
                  {stats.totalCreators} creator{stats.totalCreators !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
                  {stats.freeChannels} Free Channels
                </Badge>
                <Badge variant="outline" className="border-[#4DA2FF] text-[#4DA2FF] text-xs">
                  {stats.totalChannels} Total Channels
                </Badge>
                <Badge variant="outline" className="border-orange-400 text-orange-400 text-xs">
                  {stats.totalSubscribers.toLocaleString()} Subscribers
                </Badge>
              </div>
            </div>

            {/* Desktop: Side by side */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4DA2FF]" />
                <span className="text-[#C0E6FF] text-sm">
                  {stats.totalCreators} creator{stats.totalCreators !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-green-400 text-green-400">
                  {stats.freeChannels} Free Channels
                </Badge>
                <Badge variant="outline" className="border-[#4DA2FF] text-[#4DA2FF]">
                  {stats.totalChannels} Total Channels
                </Badge>
                <Badge variant="outline" className="border-orange-400 text-orange-400">
                  {stats.totalSubscribers.toLocaleString()} Subscribers
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Channels Section */}
      <FeaturedChannels />

      {/* Creators Grid */}
      {filteredCreators.length === 0 ? (
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No creators found
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto">
                {userAddress
                  ? "No other creators match your search criteria. Your own channels are managed in Creator Controls."
                  : "Try adjusting your search criteria or filters to find more creators."
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <CreatorCards
          creators={filteredCreators}
        />
      )}
    </div>
  )
}
