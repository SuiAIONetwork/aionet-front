"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubscription } from "@/contexts/subscription-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import {
  Crown,
  TrendingUp,
  Users,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Calendar,
  Clock,
  Zap,
  Target,
  Activity,
  ExternalLink
} from "lucide-react"
import Image from "next/image"
import { RoleImage } from "@/components/ui/role-image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Types for royalties data
interface RoyaltiesData {
  totalRoyalHolders: number
  weeklyRoyaltiesAmount: number
  cumulativeRoyaltiesAmount: number
  totalDistributed: number
  loading: boolean
  error?: string
}

export default function RoyaltiesPage() {
  const { tier } = useSubscription()
  const { user } = useSuiAuth()
  const account = useCurrentAccount()
  const router = useRouter()
  
  const [royaltiesData, setRoyaltiesData] = useState<RoyaltiesData>({
    totalRoyalHolders: 0,
    weeklyRoyaltiesAmount: 0,
    cumulativeRoyaltiesAmount: 0,
    totalDistributed: 0,
    loading: true
  })

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Check if user has ROYAL access
  const hasRoyalAccess = tier === 'ROYAL'
  const userAddress = user?.address || account?.address

  // Calculate next Friday at 12:00 UTC
  const getNextFriday = () => {
    const now = new Date()
    const nextFriday = new Date()

    // Get current day (0 = Sunday, 5 = Friday)
    const currentDay = now.getUTCDay()
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7 // If today is Friday, get next Friday

    nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday)
    nextFriday.setUTCHours(12, 0, 0, 0) // Set to 12:00 UTC

    // If it's Friday but past 12:00 UTC, get next Friday
    if (currentDay === 5 && now.getUTCHours() >= 12) {
      nextFriday.setUTCDate(nextFriday.getUTCDate() + 7)
    }

    return nextFriday
  }

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const nextFriday = getNextFriday().getTime()
      const distance = nextFriday - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setCountdown({ days, hours, minutes, seconds })
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  // Load royalties data on component mount
  useEffect(() => {
    if (hasRoyalAccess && userAddress) {
      loadRoyaltiesData()
    } else {
      setRoyaltiesData(prev => ({ ...prev, loading: false }))
    }
  }, [hasRoyalAccess, userAddress])

  const loadRoyaltiesData = async () => {
    try {
      setRoyaltiesData(prev => ({ ...prev, loading: true, error: undefined }))

      // Fetch real data from API
      const response = await fetch('/api/royalties/metrics')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch royalties data')
      }

      setRoyaltiesData({
        totalRoyalHolders: result.data.totalRoyalHolders,
        weeklyRoyaltiesAmount: result.data.weeklyRoyaltiesAmount,
        cumulativeRoyaltiesAmount: result.data.cumulativeRoyaltiesAmount,
        totalDistributed: result.data.totalDistributed,
        loading: false
      })
    } catch (error) {
      console.error('Failed to load royalties data:', error)
      setRoyaltiesData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load royalties data'
      }))
    }
  }

  // Redirect non-ROYAL users
  if (!hasRoyalAccess) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Royalties</h1>
            <p className="text-gray-400 mt-1">Passive income analytics for ROYAL tier members</p>
          </div>
        </div>

        {/* Access Denied Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full">
                <RoleImage role="ROYAL" size="2xl" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">ROYAL Tier Required</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              This page is exclusively for ROYAL NFT holders. Upgrade to ROYAL tier to access passive income analytics and royalties tracking.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/subscriptions')}
                className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
              >
                <RoleImage role="ROYAL" size="md" className="mr-2" />
                Upgrade to ROYAL
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/aio-dashboard')}
                className="border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Royalties</h1>
          <p className="text-gray-400 mt-1">Passive income analytics for ROYAL tier members</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={() => window.open(`https://suiscan.xyz/testnet/account/0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4`, '_blank')}
              className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Royalties Wallet
            </Button>
            <Button
              onClick={() => window.open(`https://suiscan.xyz/testnet/account/${userAddress}`, '_blank')}
              className="bg-green-600 hover:bg-green-600/80 text-white flex items-center justify-center gap-2"
              disabled={!userAddress}
            >
              <ExternalLink className="w-4 h-4" />
              My Wallet
            </Button>
          </div>

        </div>
      </div>

      {/* Error State */}
      {royaltiesData.error && (
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Error Loading Data</span>
            </div>
            <p className="text-gray-400 mb-4">{royaltiesData.error}</p>
            <Button 
              onClick={loadRoyaltiesData}
              className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Total ROYAL NFT Holders */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total ROYAL Holders</p>
                {royaltiesData.loading ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4da2ff]" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-white">{royaltiesData.totalRoyalHolders}</p>
                )}
              </div>
              <div className="p-3 rounded-full">
                <RoleImage role="ROYAL" size="2xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Users className="w-4 h-4 text-[#C0E6FF] mr-1" />
              <span className="text-[#C0E6FF]">Active NFT holders</span>
            </div>
          </div>
        </div>

        {/* Royalties Wallet Assets */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Royalties Wallet</p>
                {royaltiesData.loading ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4da2ff]" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white">{royaltiesData.cumulativeRoyaltiesAmount.toFixed(2)} SUI</p>
                    <p className="text-sm text-[#C0E6FF]">+{royaltiesData.weeklyRoyaltiesAmount.toFixed(2)} SUI this week</p>
                  </>
                )}
              </div>
              <Image
                src="/images/logo-sui.png"
                alt="SUI"
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">Available for distribution</span>
            </div>
          </div>
        </div>

        {/* Total Distributed */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Distributed</p>
                {royaltiesData.loading ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4da2ff]" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-white">{royaltiesData.totalDistributed.toFixed(2)} SUI</p>
                )}
              </div>
              <Image
                src="/images/logo-sui.png"
                alt="SUI"
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-blue-400">Since inception</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced ROYAL Member Benefits Card */}
      <div className="enhanced-card relative overflow-hidden">
        <div className="enhanced-card-content relative">
          {/* Header with royal image */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full">
              <RoleImage role="ROYAL" size="2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ROYAL Member Benefits</h3>
              <p className="text-[#C0E6FF] text-sm">Exclusive passive income opportunities</p>
            </div>
          </div>

          {/* Income Sources with Circular Gauges */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {/* Passive Income Sources - Column 1 */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Royalties
              </h4>

              {/* Centered PRO NFT Royalties Card */}
              <div className="bg-gradient-to-br from-[#1a2f51]/80 to-[#2a4f71]/60 rounded-xl p-4 border border-yellow-400/30 text-center shadow-lg h-[280px] flex flex-col justify-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {/* Background circle */}
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#yellowGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${10 * 2.26} ${100 * 2.26}`}
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <defs>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-2xl">10%</span>
                  </div>
                </div>
                <h5 className="text-white text-base font-semibold mb-1">ROYAL NFT Royalties</h5>
                <p className="text-[#C0E6FF]/80 text-sm">Earn Royalties from New PRO & ROYAL NFTs</p>
              </div>
            </div>

            {/* Distribution Schedule - Previous Distribution - Column 2 */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Previous Distribution
              </h4>

              <div className="bg-[#1a2f51]/50 rounded-xl p-4 border border-gray-400/20 h-[280px] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#C0E6FF] text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Previous
                  </span>
                  <span className="text-gray-400 font-semibold text-xs">Completed</span>
                </div>

                <div className="space-y-4 flex-grow flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {(royaltiesData.weeklyRoyaltiesAmount || 125.5).toFixed(2)} SUI
                    </div>
                    <div className="text-sm text-[#C0E6FF]">Total Distributed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {royaltiesData.totalRoyalHolders || 120} Recipients
                    </div>
                    <div className="text-sm text-[#C0E6FF]">ROYAL holders paid</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-600/30">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-[#C0E6FF]">Last Friday, 12:00 UTC</span>
                </div>
              </div>
            </div>

            {/* Distribution Schedule - Next Distribution - Column 3 */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Next Distribution
              </h4>

              <div className="bg-[#1a2f51]/50 rounded-xl p-4 border border-green-400/20 h-[280px] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#C0E6FF] text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Next
                  </span>
                  <span className="text-green-400 font-semibold text-xs">Scheduled</span>
                </div>

                {/* Minimal Countdown Timer */}
                <div className="text-center flex-grow flex flex-col justify-center">
                  <div className="text-sm text-[#C0E6FF] mb-3">Countdown:</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{countdown.days}</div>
                      <div className="text-xs text-[#C0E6FF]">Days</div>
                    </div>
                    <div className="text-green-400 text-lg">:</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{countdown.hours}</div>
                      <div className="text-xs text-[#C0E6FF]">Hrs</div>
                    </div>
                    <div className="text-green-400 text-lg">:</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{countdown.minutes}</div>
                      <div className="text-xs text-[#C0E6FF]">Min</div>
                    </div>
                    <div className="text-green-400 text-lg">:</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{countdown.seconds}</div>
                      <div className="text-xs text-[#C0E6FF]">Sec</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-3 border-t border-green-600/30">
                  <Clock className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-[#C0E6FF]">Every Friday at 12:00 UTC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Distribution Countdown */}
          <div className="bg-gradient-to-r from-[#1a2f51] to-[#2a4f71] rounded-lg p-4 border border-[#4da2ff]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#4da2ff]/20 p-2 rounded-full">
                  <Target className="w-5 h-5 text-[#4da2ff]" />
                </div>
                <div>
                  <h5 className="text-white font-semibold">Next Distribution</h5>
                  <p className="text-[#C0E6FF] text-sm">Estimated payout per ROYAL NFT</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#4da2ff]">
                  {(royaltiesData.cumulativeRoyaltiesAmount / Math.max(royaltiesData.totalRoyalHolders, 1)).toFixed(3)} SUI
                </div>
                <div className="text-xs text-[#C0E6FF]">Per NFT holder</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
