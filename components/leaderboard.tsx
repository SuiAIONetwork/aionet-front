"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { CountriesSidebar } from '@/components/countries-sidebar'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import {
  LEADERBOARD_CATEGORIES,
  LeaderboardUser
} from '@/lib/leaderboard-service'
import {
  Trophy,
  Users,
  TrendingUp,
  Award,
  Brain,
  Video,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  Zap,
  MapPin
} from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'


// Icon mapping for categories
const CATEGORY_ICONS = {
  Users,
  TrendingUp,
  Award,
  Brain,
  Video,
  Trophy,
  Zap
}

interface LeaderboardStats {
  totalUsers: number
  tierDistribution: {
    NOMAD: number
    PRO: number
    ROYAL: number
  }
  averageLevel: number
  totalXP: number
  totalReferrals: number
}

export function Leaderboard() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  const {
    data: leaderboardData,
    stats,
    availableLocations,
    isLoading,
    currentPage,
    totalPages,
    refresh,
    setPage,
    preloadNext
  } = useLeaderboard({
    category: activeCategory,
    timePeriod,
    locationFilter
  })

  const currentCategory = useMemo(() =>
    LEADERBOARD_CATEGORIES.find(cat => cat.id === activeCategory) || LEADERBOARD_CATEGORIES[0],
    [activeCategory]
  )

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period as 'weekly' | 'monthly' | 'all-time')
  }

  const handleLocationFilterChange = (location: string) => {
    setLocationFilter(location)
  }

  const handlePageChange = (page: number) => {
    setPage(page)
    // Preload next page for better UX
    setTimeout(() => preloadNext(), 100)
  }

  const handleRefresh = async () => {
    await refresh()
    toast.success('Leaderboard refreshed!')
  }

  const handleUserClick = (user: LeaderboardUser) => {
    // Navigate to user profile in the same window - prioritize username over address
    const identifier = user.username || user.address
    router.push(`/profile/${encodeURIComponent(identifier)}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Leaderboard
            {locationFilter !== 'all' && (
              <span className="text-sm font-normal text-[#C0E6FF] ml-2">
                - {availableLocations.find(l => l.code === locationFilter)?.name || locationFilter}
              </span>
            )}
          </h1>
          <p className="text-[#C0E6FF] mt-1">
            {locationFilter === 'all'
              ? 'Top performers across all locations. Click a country on the right to filter by location.'
              : `Showing top users from ${availableLocations.find(l => l.code === locationFilter)?.name || locationFilter}. Click "Back to All Users" to see global rankings.`
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Category Filter */}
          <Select value={activeCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-64 bg-[#1a2f51] border-[#1a2f51] text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
              {LEADERBOARD_CATEGORIES.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] || Trophy
                return (
                  <SelectItem key={category.id} value={category.id} className="text-white hover:bg-[#2a3f61]">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {category.name}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Location/Language Filter */}
          <Select value={locationFilter} onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="w-full sm:w-64 bg-[#1a2f51] border-[#1a2f51] text-white">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f51] border-[#1a2f51] max-h-60 overflow-y-auto">
              <SelectItem value="all" className="text-white hover:bg-[#2a3f61]">
                🌍 All Locations
              </SelectItem>

              {/* Dynamic locations from database */}
              {availableLocations.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-[#C0E6FF] font-semibold">Available Locations</div>
                  {availableLocations.map((location) => (
                    <SelectItem key={location.code} value={location.code} className="text-white hover:bg-[#2a3f61]">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={location.code}
                            svg
                            style={{
                              width: '1.2em',
                              height: '1.2em',
                            }}
                            title={location.name}
                          />
                          <span>{location.name}</span>
                        </div>
                        <span className="text-xs text-[#C0E6FF] ml-2">({location.count})</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Show message if no locations available */}
              {availableLocations.length === 0 && (
                <div className="px-2 py-2 text-xs text-[#C0E6FF] text-center">
                  No user locations found
                </div>
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-3">
            {/* Time Period Filter */}
            <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
              <SelectTrigger className="w-full sm:w-32 bg-[#1a2f51] border-[#1a2f51] text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                <SelectItem value="weekly" className="text-white hover:bg-[#2a3f61]">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-white hover:bg-[#2a3f61]">Monthly</SelectItem>
                <SelectItem value="all-time" className="text-white hover:bg-[#2a3f61]">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="bg-[#1a2f51] border-[#1a2f51] text-white hover:bg-[#2a3f61] px-3"
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>



      {/* Leaderboard Content */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Countries Sidebar - Full width on mobile (first), 1/4 on desktop (second) */}
        <div className="w-full lg:w-1/4 lg:min-w-[300px] order-1 lg:order-2">
          <CountriesSidebar
            countries={leaderboardData?.countries || []}
            isLoading={isLoading}
            onCountryClick={(countryCode) => setLocationFilter(countryCode)}
            selectedCountry={locationFilter !== 'all' ? locationFilter : undefined}
            category={currentCategory}
          />
        </div>

        {/* Main Table - Full width on mobile (second), 3/4 on desktop (first) */}
        <div className="flex-1 lg:w-3/4 order-2 lg:order-1">
          <LeaderboardTable
            users={leaderboardData?.users || []}
            category={currentCategory}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onUserClick={handleUserClick}
          />
        </div>
      </div>

      {/* Last Updated */}
      {leaderboardData?.lastUpdated && (
        <div className="text-center text-xs text-[#C0E6FF]">
          Last updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}
