"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RoleImage } from "@/components/ui/role-image"
import { User } from "./user-search-interface"
import {
  MapPin,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trophy
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import ReactCountryFlag from 'react-country-flag'
import { getCountryCodeByName } from '@/lib/locations'

interface UserListItemProps {
  user: User
}

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

export function UserListItem({ user }: UserListItemProps) {


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4 p-4 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10 hover:border-[#4DA2FF]/30 hover:bg-[#1a2f51]/50 transition-all duration-200">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 bg-blue-100">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-[#4DA2FF] text-white font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate">{user.name}</h3>
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
            <div className="w-6 h-6 flex items-center justify-center">
              <RoleImage role={user.role} size="md" />
            </div>

          </div>
          
          <div className="flex items-center gap-4 text-sm text-[#C0E6FF]/70">
            <span>{user.username}</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {formatDate(user.joinDate)}</span>
            </div>
          </div>

          {user.activity && (
            <p className="text-[#C0E6FF]/60 text-xs mt-1 italic">{user.activity}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="flex items-center gap-1 text-[#4DA2FF] mb-1">
                  <Award className="w-3 h-3" />
                  <span className="font-medium">Level</span>
                </div>
                <div className="text-white font-bold">{user.level}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>User Level: {user.level}/10</p>
            </TooltipContent>
          </Tooltip>



          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="flex items-center gap-1 text-[#C0E6FF] mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Active</span>
                </div>
                <div className="text-white font-bold text-xs">
                  {user.lastActive}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
              <p>Last seen: {user.lastActive}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Achievement Icons */}
        {user.achievements && user.achievements.length > 0 && (
          <div className="hidden lg:block text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Trophy className="w-3 h-3" />
              <span className="font-medium text-xs">Achievements</span>
            </div>
            <div className="flex items-center justify-center gap-1 flex-wrap">
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
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          ) : achievement.image ? (
                            <Image
                              src={achievement.image}
                              alt={achievement.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: achievement.color }} />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white text-xs">
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-[#C0E6FF]/70">{achievement.tooltip}</div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
            </div>
          </div>
        )}


      </div>
    </TooltipProvider>
  )
}
