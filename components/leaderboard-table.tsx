"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Trophy,
  Medal,
  Award,
  Crown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  Coins,
  BarChart3,
  LineChart,
  Zap,
  Brain,
  Video,
  Bot
} from 'lucide-react'
import { LeaderboardUser, LeaderboardCategory } from '@/lib/leaderboard-service'
import { getCountryCodeByName } from '@/lib/locations'
import ReactCountryFlag from 'react-country-flag'
import { cn } from '@/lib/utils'

interface LeaderboardTableProps {
  users: LeaderboardUser[]
  category: LeaderboardCategory
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onUserClick?: (user: LeaderboardUser) => void
}

export function LeaderboardTable({
  users,
  category,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onUserClick
}: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-[#C0E6FF] font-bold text-sm">#{rank}</span>
    }
  }

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      NOMAD: { color: 'bg-gray-600 text-white', icon: null },
      PRO: { color: 'bg-blue-600 text-white', icon: <Crown className="w-3 h-3" /> },
      ROYAL: { color: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold', icon: <Crown className="w-3 h-3" /> }
    }
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.NOMAD
    
    return (
      <Badge className={cn("text-xs font-medium", config.color)}>
        {config.icon && <span className="mr-1">{config.icon}</span>}
        {tier}
      </Badge>
    )
  }

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case 'not_verified':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const getTopRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400/25 via-yellow-300/20 to-yellow-400/25 border-yellow-400/40"
      case 2:
        return "bg-[#4da2ff73] border-[#4da2ff]"
      case 3:
        return "bg-[#4da2ff40] border-[#4da2ff]/60"
      default:
        return ""
    }
  }

  const formatMetricValue = (key: string, value: any) => {
    if (typeof value === 'number') {
      if (key.includes('rate') || key.includes('percentage')) {
        return `${value.toFixed(1)}%`
      }
      if (key.includes('commission') || key.includes('volume')) {
        if (key.includes('usd_copy_volume')) {
          return `$${value.toLocaleString()}`
        }
        return `${value.toLocaleString()}`
      }
      if (key.includes('network_users') || key.includes('referrals')) {
        return value.toLocaleString()
      }
      return value.toLocaleString()
    }
    return value?.toString() || '0'
  }

  const getMetricIcon = (key: string) => {
    if (key.includes('referral_count') || key.includes('direct_referrals')) return <Users className="w-3 h-3" />
    if (key.includes('total_commissions') || key.includes('network_commissions')) return <img src="/images/logo-sui.png" alt="SUI" className="w-3 h-3" />
    if (key.includes('conversion_rate')) return <TrendingUp className="w-3 h-3" />
    if (key.includes('total_network_users')) return <Users className="w-3 h-3" />
    if (key.includes('trading_volume') || key.includes('usd_copy_volume')) return <BarChart3 className="w-3 h-3" />
    if (key.includes('trades_count')) return <LineChart className="w-3 h-3" />
    if (key.includes('win_rate')) return <Trophy className="w-3 h-3" />
    if (key.includes('active_bots_following')) return <Bot className="w-3 h-3" />
    if (key.includes('current_xp')) return <Zap className="w-3 h-3" />
    if (key.includes('profile_level')) return <Award className="w-3 h-3" />
    if (key.includes('achievements_count')) return <Medal className="w-3 h-3" />
    if (key.includes('correct_answers')) return <CheckCircle className="w-3 h-3" />
    if (key.includes('quiz_participation')) return <Brain className="w-3 h-3" />
    if (key.includes('tickets_minted')) return <Coins className="w-3 h-3" />
    if (key.includes('total_posts')) return <Video className="w-3 h-3" />
    if (key.includes('subscribers')) return <Users className="w-3 h-3" />
    if (key.includes('engagement_rate')) return <TrendingUp className="w-3 h-3" />
    return <Award className="w-3 h-3" />
  }

  const getMetricLabel = (key: string) => {
    // Special case for old total_commissions only - return SUI logo
    if (key === 'total_commissions') {
      return <img src="/images/logo-sui.png" alt="SUI" className="w-4 h-4 mx-auto" />
    }

    const labels: Record<string, string> = {
      'referral_count': 'Personal Members',
      'direct_referrals': 'Personal Referrals',
      'network_commissions': 'Total Commissions',
      'total_network_users': 'Total Members',
      'conversion_rate': 'Conv. Rate',
      'trading_volume': 'Volume',
      'usd_copy_volume': 'USD Copy Volume',
      'trades_count': 'Trades',
      'win_rate': 'Win Rate',
      'active_bots_following': 'Active Bots',
      'current_xp': 'Current XP',
      'profile_level': 'Level',
      'achievements_count': 'Achievements',
      'correct_answers': 'Correct',
      'quiz_participation': 'Quizzes',
      'tickets_minted': 'Tickets',
      'total_posts': 'Posts',
      'subscribers': 'Subscribers',
      'engagement_rate': 'Engagement',
      'level_rewards': 'Rewards',
      'community_engagement': 'Community'
    }
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (isLoading) {
    return (
      <Card className="bg-transparent border-[#1a2f51]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-[#1a2f51] rounded"></div>
                <div className="w-10 h-10 bg-[#1a2f51] rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1a2f51] rounded w-1/4"></div>
                  <div className="h-3 bg-[#1a2f51] rounded w-1/6"></div>
                </div>
                <div className="w-16 h-6 bg-[#1a2f51] rounded"></div>
                <div className="w-20 h-8 bg-[#1a2f51] rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card className="bg-transparent border-[#1a2f51]">
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Rankings Available</h3>
          <p className="text-[#C0E6FF]">
            No users found for this category. Check back later as more users participate!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="bg-transparent border-[#1a2f51]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {category.name}
          </CardTitle>
          <p className="text-[#C0E6FF] text-sm">{category.description}</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            {/* User View - Always show users now, countries are in sidebar */}
            {users.map((user, index) => (
              <div
                key={user.address}
                className={cn(
                  "flex flex-col sm:flex-row items-center sm:items-center p-4 hover:bg-[#1a2f51]/30 transition-all duration-300 cursor-pointer border-b border-[#1a2f51]/20 last:border-b-0 relative rounded-t-lg gap-2 sm:gap-0",
                  user.rank <= 3 && getTopRankBackground(user.rank)
                )}
                onClick={() => onUserClick?.(user)}
              >
                {/* Desktop: Single Row Layout */}
                <div className="hidden sm:flex items-center w-full">
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-[#1a2f51]">
                      <AvatarImage
                        src={user.profileImageUrl || undefined}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-[#1a2f51] text-white text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-5 h-5 rounded-full bg-[#030f1c] flex items-center justify-center border border-[#1a2f51]">
                            {getKycStatusIcon(user.kycStatus)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>KYC Status: {user.kycStatus.replace('_', ' ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{user.username}</span>
                      {getTierBadge(user.roleTier)}
                      {user.location && getCountryCodeByName(user.location) && (
                        <span className="text-xs text-[#C0E6FF] bg-[#1a2f51]/30 px-2 py-1 rounded flex items-center gap-1">
                          <ReactCountryFlag
                            countryCode={getCountryCodeByName(user.location)!}
                            svg
                            style={{
                              width: '1em',
                              height: '1em',
                            }}
                            title={user.location}
                          />
                          {user.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#C0E6FF]">
                      <span>Level {user.profileLevel}</span>
                      <span>{user.totalXp.toLocaleString()} XP</span>
                      <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-3">
                    {Object.entries(user.metrics).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="bg-transparent rounded-lg px-3 py-2 min-w-[70px] text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {getMetricIcon(key)}
                          <div className="text-xs font-medium text-white">
                            {formatMetricValue(key, value)}
                          </div>
                        </div>
                        <div className="text-[10px] text-[#C0E6FF] opacity-80 flex justify-center items-center">
                          {getMetricLabel(key)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile: Multi-Row Layout */}
                <div className="sm:hidden w-full space-y-3">
                  {/* Row 1: Rank + Avatar + Username */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex justify-center">
                      {getRankIcon(user.rank)}
                    </div>
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-[#1a2f51]">
                        <AvatarImage
                          src={user.profileImageUrl || undefined}
                          alt={user.username}
                        />
                        <AvatarFallback className="bg-[#1a2f51] text-white text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-5 h-5 rounded-full bg-[#030f1c] flex items-center justify-center border border-[#1a2f51]">
                              {getKycStatusIcon(user.kycStatus)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>KYC Status: {user.kycStatus.replace('_', ' ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <span className="text-white font-medium text-lg">{user.username}</span>
                  </div>

                  {/* Row 2: Role Badge + Level + XP */}
                  <div className="flex items-center justify-center gap-3">
                    {getTierBadge(user.roleTier)}
                    <span className="text-sm text-[#C0E6FF]">Level {user.profileLevel}</span>
                    <span className="text-sm text-[#C0E6FF]">{user.totalXp.toLocaleString()} XP</span>
                  </div>

                  {/* Row 3: Metrics */}
                  <div className="flex gap-2 overflow-x-auto justify-center">
                    {Object.entries(user.metrics).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="bg-transparent rounded-lg px-2 py-2 min-w-[60px] text-center flex-shrink-0">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {getMetricIcon(key)}
                          <div className="text-xs font-medium text-white">
                            {formatMetricValue(key, value)}
                          </div>
                        </div>
                        <div className="text-[10px] text-[#C0E6FF] opacity-80 flex justify-center items-center">
                          {getMetricLabel(key)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#1a2f51]/20">
              <div className="text-sm text-[#C0E6FF]">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="bg-[#1a2f51] border-[#1a2f51] text-white hover:bg-[#2a3f61]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="bg-[#1a2f51] border-[#1a2f51] text-white hover:bg-[#2a3f61]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
