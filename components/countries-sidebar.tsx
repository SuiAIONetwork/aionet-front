'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Medal,
  Award,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

interface CountryStats {
  code: string
  name: string
  flag: string
  rank: number
  members: number
  totalVolume: number
  totalActivity: number
  avgLevel: number
  topTier: 'NOMAD' | 'PRO' | 'ROYAL'
  metrics: {
    members: number
    volume: number
    activity: number
    avg_level: number
    top_tier: string
  }
}

interface CountriesSidebarProps {
  countries: CountryStats[]
  isLoading: boolean
  onCountryClick: (countryCode: string) => void
  selectedCountry?: string
  category: {
    id: string
    name: string
  }
}

export function CountriesSidebar({
  countries,
  isLoading,
  onCountryClick,
  selectedCountry,
  category
}: CountriesSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />
    return <span className="text-sm font-medium text-[#C0E6FF] w-4 text-center">{rank}</span>
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

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      NOMAD: { color: 'bg-gray-600 text-white', icon: null },
      PRO: { color: 'bg-blue-600 text-white', icon: <Trophy className="w-3 h-3" /> },
      ROYAL: { color: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold', icon: <Trophy className="w-3 h-3" /> }
    }

    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.NOMAD

    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.color)}>
        {config.icon}
        {tier}
      </span>
    )
  }

  const getCountryMetric = (country: CountryStats) => {
    // Always show member count regardless of category
    return { value: country.members.toLocaleString(), label: 'Members', icon: <Users className="w-3 h-3" /> }
  }

  if (isLoading) {
    return (
      <Card className="bg-transparent border-[#1a2f51] h-full">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top 10 Countries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#1a2f51] rounded"></div>
                  <div className="w-8 h-8 bg-[#1a2f51] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#1a2f51] rounded mb-1"></div>
                    <div className="h-3 bg-[#1a2f51] rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-[#1a2f51] h-full">
      <CardHeader className="text-center">
        <CardTitle
          className="text-white flex items-center justify-center gap-2 text-lg cursor-pointer lg:cursor-default"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top 10 Countries
          {/* Mobile expand/collapse button */}
          <div className="lg:hidden ml-2">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#C0E6FF]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#C0E6FF]" />
            )}
          </div>
        </CardTitle>
        <p className="text-[#C0E6FF] text-sm">
          <span className="lg:hidden">Tap to {isExpanded ? 'collapse' : 'expand'} • </span>
          Click countries to filter users
        </p>
        {selectedCountry && (
          <div className="flex justify-center">
            <button
              onClick={() => onCountryClick('all')}
              className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors duration-200 flex items-center gap-1"
            >
              ← Back to All Users
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("p-0 transition-all duration-300", !isExpanded && "lg:block hidden")}>
        <div className="space-y-1">
          {countries.slice(0, 10).map((country) => {
            const metric = getCountryMetric(country)
            return (
              <div
                key={country.code}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center p-3 hover:bg-[#1a2f51]/30 transition-all duration-300 cursor-pointer border-b border-[#1a2f51]/20 last:border-b-0 relative rounded-lg gap-2 sm:gap-0",
                  country.rank <= 3 && getTopRankBackground(country.rank),
                  selectedCountry === country.code && "bg-green-500/10 border-green-400/60 shadow-lg shadow-green-400/30 ring-2 ring-green-400/50"
                )}
                onClick={() => onCountryClick(country.code)}
              >
                {/* Mobile: Top Row */}
                <div className="flex items-center w-full sm:contents">
                  {/* Rank */}
                  <div className="w-6 flex justify-center mr-2">
                    {getRankIcon(country.rank)}
                  </div>

                  {/* Flag */}
                  <div className="mr-3">
                    <ReactCountryFlag
                      countryCode={country.code}
                      svg
                      style={{
                        width: '1.5em',
                        height: '1.5em',
                      }}
                      title={country.name}
                    />
                  </div>

                  {/* Country Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className={cn(
                        "font-medium text-sm truncate",
                        selectedCountry === country.code ? "text-green-300" : "text-white"
                      )}>
                        {country.name}
                      </span>
                      {selectedCountry === country.code && (
                        <span className="text-green-400 text-xs font-semibold">ACTIVE</span>
                      )}
                    </div>

                  </div>

                  {/* Metric */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {metric.icon}
                      <span className="text-sm font-medium text-white">
                        {metric.value}
                      </span>
                    </div>
                    <div className="text-xs text-[#C0E6FF]">
                      {metric.label}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
