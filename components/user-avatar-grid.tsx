"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RoleImage } from "@/components/ui/role-image"
import { UserCard } from "./user-card"

import { User } from "./user-search-interface"
import { X, Trophy, ExternalLink, MessageSquare, Send, Eye } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useRouter } from "next/navigation"
import ReactCountryFlag from 'react-country-flag'
import { getCountryCodeByName } from '@/lib/locations'



// Achievement image mapping function - Updated with new hexagonal achievement icons
const getAchievementImage = (achievementName: string): string | null => {
  const imageMap: { [key: string]: string } = {
    // Profile/KYC Category
    "Personalize Your Profile": "/images/achievements/Personalize Your Profile.png",
    "Unlock Full Access": "/images/achievements/Unlock Full Access.png",
    "Advanced User Status": "/images/achievements/Advanced User Status.png",

    // Social Connections Category
    "Follow AIONET on X": "/images/achievements/Follow the Conversation.png", // Using Follow the Conversation icon
    "Follow Aionet on X": "/images/achievements/Follow the Conversation.png", // Alternative name variant

    // Crypto Bot Activities Category
    "Automate Your Trades": "/images/achievements/Automate Your Trades.png",
    "APLN Trading Signals": "/images/achievements/APLN Trading Signals.png",
    "HRMS Trading Insights": "/images/achievements/HRMS Trading Insights.png",
    "ATHN Trading Edge": "/images/achievements/ATHN Trading Edge.png",
    "Master Trading Cycles": "/images/achievements/Master Trading Cycles.png",

    // User Upgrades Category
    "Mint Royal NFT Status": "/images/achievements/Elite ROYAL Network.png", // Using Elite ROYAL Network icon
    "Upgrade to PRO": "/images/achievements/Expand Your PRO Network.png",
    "Upgrade to ROYAL": "/images/achievements/Elite ROYAL Network.png",

    // Referral Tiers Category
    "Recruit PRO NFT Holders": "/images/achievements/Recruit PRO NFT Holders.png",
    "Royal NFT Ambassadors": "/images/achievements/Royal NFT Ambassadors.png",
    "Build a NOMAD Network": "/images/achievements/Build a NOMAD Network.png",
    "Expand Your PRO Network": "/images/achievements/Expand Your PRO Network.png",
    "Elite ROYAL Network": "/images/achievements/Elite ROYAL Network.png",
    "Mentor Level 5 Users": "/images/achievements/Mentor Level 5 Users.png",
    "Scale Level 5 Mentorship": "/images/achievements/Scale Level 5 Mentorship.png",
    "Guide to Level 7": "/images/achievements/Guide to Level 7.png",
    "Lead to Level 9": "/images/achievements/Lead to Level 9.png"
  }
  return imageMap[achievementName] || null
}

// Helper functions



interface UserAvatarGridProps {
  users: User[]
}

interface UserAvatarProps {
  user: User
  onCardToggle: (user: User | null) => void
  isCardOpen: boolean
}

function UserAvatar({ user, onCardToggle, isCardOpen }: UserAvatarProps) {
  const isMobile = useIsMobile()
  const [showCard, setShowCard] = useState(false)
  const router = useRouter()

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Prioritize username over address for better URLs
    let identifier = user.username || user.id
    if (identifier) {
      // Remove @ prefix from username if present (it gets added in community display)
      if (identifier.startsWith('@')) {
        identifier = identifier.slice(1)
      }
      router.push(`/profile/${encodeURIComponent(identifier)}`)
    }
  }







  const handleClick = () => {
    if (isMobile) {
      onCardToggle(isCardOpen ? null : user)
    }
  }

  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowCard(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowCard(false)
    }
  }

  return (
    <div className="relative group">
      {/* Stacked Avatar Container */}
      <div
        className="relative cursor-pointer transform transition-all duration-300 hover:scale-110 hover:z-10"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
          {/* Main Avatar */}
          <div className="relative">
            <Avatar className="h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 bg-blue-100 ring-2 ring-[#4DA2FF]/30 hover:ring-[#4DA2FF] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#4DA2FF]/20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-[#4DA2FF] text-white text-sm sm:text-lg lg:text-xl font-semibold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>




          </div>

          {/* Hover/Active Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-[#4DA2FF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
        </div>





        {/* Floating User Card - Positioned Above Avatar */}
        {!isMobile && showCard && (
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30 animate-in fade-in-0 zoom-in-95 duration-200"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-64 max-h-80">
              {/* Card Shadow/Glow Effect */}
              <div className="absolute inset-0 bg-[#4DA2FF]/20 rounded-lg blur-xl scale-110 pointer-events-none" />
              <div className="relative bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg p-3 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10 bg-blue-100">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-[#4DA2FF] text-white font-semibold text-sm">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{user.name}</h3>
                      {user.location && getCountryCodeByName(user.location) && (
                        <ReactCountryFlag
                          countryCode={getCountryCodeByName(user.location)!}
                          svg
                          style={{
                            width: '1em',
                            height: '1em',
                          }}
                          title={user.location}
                        />
                      )}
                    </div>
                    <p className="text-[#C0E6FF] text-xs mb-1">{user.username}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <div className="text-center p-1 bg-[#1a2f51]/50 rounded">
                    <div className="text-[#4DA2FF] text-xs">Level</div>
                    <div className="text-white font-bold text-sm">{user.level}</div>
                  </div>
                </div>

                {/* Achievements Section - All achievements in 5 columns */}
                {user.achievements && user.achievements.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[#C0E6FF] text-xs font-medium">Achievements</span>
                    </div>
                    <div className="grid grid-cols-5 justify-items-center max-h-32 overflow-y-auto">
                      {user.achievements
                        .filter((achievement: { unlocked: boolean }) => achievement.unlocked)
                        .map((achievement: { name: string; unlocked: boolean; image?: string; color: string; tooltip: string }, index: number) => {
                          const customImage = getAchievementImage(achievement.name)
                          return (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                  {customImage ? (
                                    <Image
                                      src={customImage}
                                      alt={achievement.name}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-contain"
                                    />
                                  ) : achievement.image ? (
                                    <Image
                                      src={achievement.image}
                                      alt={achievement.name}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-contain"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: achievement.color }} />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                <div className="font-medium">{achievement.name}</div>
                                <div className="text-[#C0E6FF]/70">{achievement.tooltip}</div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* View Profile Button - At bottom */}
                <div className="mt-3 pt-2 border-t border-[#C0E6FF]/20">
                  <Button
                    onClick={handleViewProfile}
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#4DA2FF]/10 hover:border-[#4DA2FF]/50 bg-transparent"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Profile
                  </Button>
                </div>

              </div>
              {/* Arrow pointing to avatar */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#030f1c]"></div>
              </div>
            </div>
          </div>
        )}


    </div>
  )
}

export function UserAvatarGrid({ users }: UserAvatarGridProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [hoveredUser, setHoveredUser] = useState<User | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  const isMobile = useIsMobile()
  const router = useRouter()

  // Fixed 10x2 grid layout: always show 20 users initially
  const getInitialCount = () => {
    return 20 // 10x2 grid: 20 users
  }

  const [displayCount, setDisplayCount] = useState(getInitialCount())

  // Get users to display based on current count
  const displayedUsers = users.slice(0, displayCount)
  const hasMoreUsers = users.length > displayCount

  const handleShowMore = () => {
    const increment = 10 // Always increment by 10 (1 more row of 10)
    setDisplayCount(prev => Math.min(prev + increment, users.length))
  }

  const handleViewProfile = (user: User) => {
    let identifier = user.id || user.username
    if (identifier) {
      // Remove @ prefix from username if present (it gets added in community display)
      if (identifier.startsWith('@')) {
        identifier = identifier.slice(1)
      }
      router.push(`/profile/${encodeURIComponent(identifier)}`)
    }
  }

  const handleCardToggle = (user: User | null) => {
    if (isMobile) {
      setSelectedUser(user)
    } else {
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
        setHoverTimeout(null)
      }

      if (user) {
        setHoveredUser(user)
      } else {
        // Add a small delay before hiding to allow moving to the card
        const timeout = setTimeout(() => {
          setHoveredUser(null)
        }, 100)
        setHoverTimeout(timeout)
      }
    }
  }

  const handleCardHover = (isEntering: boolean) => {
    if (!isMobile) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
        setHoverTimeout(null)
      }

      if (!isEntering) {
        // Add delay when leaving the card
        const timeout = setTimeout(() => {
          setHoveredUser(null)
        }, 100)
        setHoverTimeout(timeout)
      }
    }
  }

  const closeCard = () => {
    setSelectedUser(null)
    setHoveredUser(null)
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  const displayedUser = isMobile ? selectedUser : hoveredUser

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <div className="relative">
        {/* Avatar Grid */}
        <div className="enhanced-card">
        <div className="enhanced-card-content">
          {/* Grid Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#4DA2FF] rounded-full animate-pulse" />
              <span className="text-[#C0E6FF] text-sm font-medium">
                Showing {displayedUsers.length} of {users.length} AIO Connect Member{users.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-[#C0E6FF]/60">
              {isMobile ? 'Tap avatars for details' : 'Hover avatars for details'}
            </div>
          </div>

          {/* 10x2 Avatar Grid */}
          <div className="grid grid-cols-10 gap-2 justify-items-center mb-6">
            {displayedUsers.map((user, index) => (
              <div
                key={user.id}
                className="animate-in fade-in-0 zoom-in-95"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <UserAvatar
                  user={user}
                  onCardToggle={handleCardToggle}
                  isCardOpen={displayedUser?.id === user.id}
                />
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreUsers && (
            <div className="flex justify-center">
              <Button
                onClick={handleShowMore}
                variant="outline"
                className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 hover:border-[#4DA2FF] transition-all duration-200"
              >
                Show More ({Math.min(10, users.length - displayCount)} more)
              </Button>
            </div>
          )}


        </div>
      </div>

      {/* Floating User Card - Desktop Hover */}
      {!isMobile && hoveredUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto max-w-sm animate-in fade-in-0 zoom-in-95 duration-200"
            data-floating-card="true"
            onMouseEnter={() => handleCardHover(true)}
            onMouseLeave={() => handleCardHover(false)}
          >
            <div className="relative">
              {/* Card Shadow/Glow Effect */}
              <div className="absolute inset-0 bg-[#4DA2FF]/20 rounded-lg blur-xl scale-110 pointer-events-none" />
              <div className="relative">
                <UserCard user={hoveredUser} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal User Card - Mobile Click */}
      {isMobile && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
          onClick={closeCard}
        >
          <div
            className="relative w-72 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeCard}
              className="absolute top-2 right-2 z-10 bg-[#1a2f51] hover:bg-[#4DA2FF] text-white rounded-full p-2 transition-colors duration-200 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Card Shadow/Glow Effect */}
            <div className="absolute inset-0 bg-[#4DA2FF]/20 rounded-lg blur-xl scale-110 pointer-events-none" />
            <div className="relative bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 bg-blue-100">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback className="bg-[#4DA2FF] text-white font-semibold">
                    {selectedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm">{selectedUser.name}</h3>
                    {selectedUser.location && getCountryCodeByName(selectedUser.location) && (
                      <ReactCountryFlag
                        countryCode={getCountryCodeByName(selectedUser.location)!}
                        svg
                        style={{
                          width: '1em',
                          height: '1em',
                        }}
                        title={selectedUser.location}
                      />
                    )}
                  </div>
                  <p className="text-[#C0E6FF] text-xs mb-1">{selectedUser.username}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-2 mb-3">
                <div className="text-center p-1 bg-[#1a2f51]/50 rounded">
                  <div className="text-[#4DA2FF] text-xs">Level</div>
                  <div className="text-white font-bold text-sm">{selectedUser.level}</div>
                </div>
              </div>



              {/* Achievements Section */}
              {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[#C0E6FF] text-xs font-medium">Achievements</span>
                  </div>
                  <div className="grid grid-cols-5 justify-items-center max-h-32 overflow-y-auto">
                    {selectedUser.achievements
                      .filter((achievement: { unlocked: boolean }) => achievement.unlocked)
                      .map((achievement: { name: string; unlocked: boolean; image?: string; color: string; tooltip: string }, index: number) => {
                        const customImage = getAchievementImage(achievement.name)
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                {customImage ? (
                                  <Image
                                    src={customImage}
                                    alt={achievement.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                  />
                                ) : achievement.image ? (
                                  <Image
                                    src={achievement.image}
                                    alt={achievement.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full" style={{ backgroundColor: achievement.color }} />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              <div className="font-medium">{achievement.name}</div>
                              <div className="text-[#C0E6FF]/70">{achievement.tooltip}</div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* View Profile Button - At bottom */}
              <div className="mt-3 pt-2 border-t border-[#C0E6FF]/20">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    let identifier = selectedUser.id || selectedUser.username
                    if (identifier) {
                      // Remove @ prefix from username if present (it gets added in community display)
                      if (identifier.startsWith('@')) {
                        identifier = identifier.slice(1)
                      }
                      router.push(`/profile/${encodeURIComponent(identifier)}`)
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#4DA2FF]/10 hover:border-[#4DA2FF]/50 bg-transparent"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Profile
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}





      </div>
    </TooltipProvider>
  )
}
