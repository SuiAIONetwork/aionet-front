"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RoleImage } from "@/components/ui/role-image"
// Import User type from user-search-interface
import type { User } from "./user-search-interface"

import {
  Crown,
  Shield,
  Star,
  MapPin,
  Calendar,
  Clock,
  Award,
  Coins,
  CheckCircle,
  AlertCircle,
  XCircle,

  Trophy,
  ExternalLink,
  UserCheck,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import ReactCountryFlag from 'react-country-flag'
import { getCountryCodeByName } from '@/lib/locations'

// UserCard props interface
interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ROYAL':
        return 'from-purple-600 to-pink-600'
      case 'PRO':
        return 'from-blue-600 to-cyan-600'
      case 'NOMAD':
        return 'from-gray-600 to-gray-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="enhanced-card group hover:border-[#4DA2FF]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4DA2FF]/10">
        <div className="enhanced-card-content">
          {/* Header with Role Badge */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 flex items-center justify-center">
              <RoleImage role={user.role} size="md" />
            </div>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-3">
              <Avatar className="h-20 w-20 bg-blue-100 ring-2 ring-[#4DA2FF]/20">
                <AvatarImage src={user.avatar || undefined} alt={user.username || 'User'} />
                <AvatarFallback className="bg-[#4DA2FF] text-white text-xl font-semibold">
                  {(user.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg mb-1">
                {user.username || 'Anonymous User'}
              </h3>
              <p className="text-[#C0E6FF] text-sm mb-2">
                Level {user.level} • {user.totalPoints} pts
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-[#1a2f51]/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="w-3 h-3 text-[#4DA2FF]" />
                    <span className="text-[#4DA2FF] text-xs font-medium">Level</span>
                  </div>
                  <div className="text-white font-bold">{user.level}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
                <p>User Level: {user.level}/10</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-[#1a2f51]/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Points</span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {user.totalPoints.toLocaleString()}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
                <p>Total Points: {user.totalPoints.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 mb-4 text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-[#C0E6FF]/70">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {formatDate(user.joinDate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Member since: {formatDate(user.joinDate)}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-[#C0E6FF]/70">
                  <Clock className="w-3 h-3" />
                  <span>Active {user.lastActive}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last seen: {user.lastActive}</p>
              </TooltipContent>
            </Tooltip>

            {user.location && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-[#C0E6FF]/70">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
                  <div className="flex items-center gap-2">
                    {getCountryCodeByName(user.location) && (
                      <ReactCountryFlag
                        countryCode={getCountryCodeByName(user.location)!}
                        svg
                        style={{
                          width: '1.2em',
                          height: '1.2em',
                        }}
                        title={user.location}
                      />
                    )}
                    <p>Location: {user.location}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-4">
              <p className="text-[#C0E6FF]/80 text-xs leading-relaxed overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {user.bio}
              </p>
            </div>
          )}



          {/* Achievement Badges */}
          {user.achievements && user.achievements.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-3 h-3 text-[#4DA2FF]" />
                <span className="text-[#C0E6FF] text-xs font-medium">Achievements</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.achievements.slice(0, 6).map((achievement: {
                  name: string;
                  image?: string;
                  icon?: any;
                  color: string;
                  tooltip: string;
                  xp: number;
                  unlocked: boolean;
                  claimed: boolean
                }, index: number) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        {achievement.image ? (
                          <Image
                            src={achievement.image}
                            alt={achievement.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                          />
                        ) : achievement.icon ? (
                          <achievement.icon className="w-8 h-8" />
                        ) : (
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: achievement.color }} />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
                      <div className="text-center">
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-xs text-[#C0E6FF]/70">{achievement.tooltip}</p>
                        <p className="text-xs text-yellow-400">{achievement.xp} XP</p>
                        <p className="text-xs">
                          {achievement.unlocked
                            ? (achievement.claimed ? "✓ Claimed" : "🎁 Available")
                            : "🔒 Locked"
                          }
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {user.achievements.length > 6 && (
                  <div className="w-6 h-6 rounded-full bg-[#1a2f51]/50 border border-[#C0E6FF]/30 flex items-center justify-center text-xs text-[#C0E6FF]">
                    +{user.achievements.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}




        </div>
      </div>
  )
}
