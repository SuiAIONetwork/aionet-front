"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  Clock,
  PlayCircle,
  StopCircle,
  Trash2,
  ExternalLink
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface TradingBotCardProps {
  id: string
  name: string
  type: "futures" | "spot" | "infinity" | "recurring" | "smart"
  gridType: string
  longShort: "long" | "short" | null
  leverage: string
  performance: number
  performanceColor: string
  pnl: string
  roi: {
    value: number
    timeframe: string
  }
  volume: {
    value: string
    timeframe: string
  }
  profitSharing: number
  followers?: number
  owner: {
    name: string
    avatar?: string
  }
  chartData: number[]
  // Bybit-style metrics
  winRate: number
  maxDrawdown: number
  sharpeRatio: number
  totalTrades: number
  avgHoldingTime: string
  aum: string
  rating: number // 1-5 stars
  isFollowed?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onStop?: () => void
  onRestart?: () => void
  showControls?: boolean
  botImage?: string
  bybitUrl?: string
}

export function TradingBotCard({
  id,
  name,
  type,
  gridType,
  longShort,
  leverage,
  performance,
  performanceColor,
  pnl,
  roi,
  volume,
  profitSharing,
  followers,
  owner,
  chartData,
  isFollowed = false,
  onFollow,
  onUnfollow,
  onStop,
  onRestart,
  showControls = false,
  botImage,
  bybitUrl,
  winRate = 0,
  maxDrawdown = 0,
  sharpeRatio = 0,
  totalTrades = 0,
  avgHoldingTime = "0h",
  aum = "0 USDT",
  rating = 0
}: TradingBotCardProps) {
  const [status, setStatus] = useState<"active" | "stopped">(isFollowed ? "active" : "stopped")
  const [isLoading, setIsLoading] = useState(false)
  
  const handleFollow = async () => {
    if (onFollow) {
      setIsLoading(true)
      try {
        await onFollow()
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleUnfollow = async () => {
    if (onUnfollow) {
      setIsLoading(true)
      try {
        await onUnfollow()
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleStop = async () => {
    if (onStop) {
      setIsLoading(true)
      try {
        setStatus("stopped")
        await onStop()
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRestart = async () => {
    if (onRestart) {
      setIsLoading(true)
      try {
        setStatus("active")
        await onRestart()
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  // Generate SVG path for the chart
  const generateChartPath = () => {
    if (!chartData || chartData.length === 0) return ""
    
    const max = Math.max(...chartData)
    const min = Math.min(...chartData)
    const range = max - min || 1
    
    // Normalize data to fit in the SVG viewBox
    const normalizedData = chartData.map(value => 
      100 - ((value - min) / range) * 100
    )
    
    // Create SVG path
    const width = 100 / (normalizedData.length - 1)
    let path = `M 0,${normalizedData[0]}`
    
    for (let i = 1; i < normalizedData.length; i++) {
      path += ` L ${i * width},${normalizedData[i]}`
    }
    
    return path
  }
  


  // Get background image path
  const backgroundImagePath = `/bot-images/${name.toLowerCase()}.png`

  return (
    <div className="enhanced-card relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: `url(${backgroundImagePath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-900/85" />

      <div className="enhanced-card-content relative z-10">
        {/* Header: Name + Stars + ROI */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-bold text-white text-base">{name}</span>
              {bybitUrl && (
                <button
                  onClick={() => window.open(bybitUrl, '_blank')}
                  className="text-[#C0E6FF] hover:text-white transition-colors"
                  title="View on Bybit"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* ROI in top right corner */}
          <div className="text-right">
            <div
              className={cn(
                "text-2xl font-bold mb-1",
                performance >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {performance >= 0 ? "+" : ""}{performance.toFixed(2)}%
            </div>
            <div className="text-xs text-[#C0E6FF] uppercase tracking-wide">ROI (30D)</div>
          </div>
        </div>

        {/* Top Separator */}
        <div className="border-t border-gray-700/50 mb-4"></div>

        {/* Bybit-style Stats Grid with rounded borders */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">Win Rate</div>
            <div className="text-white font-bold text-sm">{winRate.toFixed(1)}%</div>
          </div>
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">Max Drawdown</div>
            <div className="text-white font-bold text-sm">{maxDrawdown.toFixed(2)}%</div>
          </div>
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">Sharpe Ratio</div>
            <div className="text-white font-bold text-sm">{sharpeRatio.toFixed(2)}</div>
          </div>
        </div>

        {/* Additional Stats Row with rounded borders */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">Total Trades</div>
            <div className="text-white font-bold text-sm">{totalTrades}</div>
          </div>
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">Avg Hold Time</div>
            <div className="text-white font-bold text-sm">{avgHoldingTime}</div>
          </div>
          <div className="text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-[#C0E6FF] mb-1">AUM</div>
            <div className="text-white font-bold text-sm">{aum}</div>
          </div>
        </div>

        {/* Bottom Separator */}
        <div className="border-t border-gray-700/50 mb-4"></div>

        {/* Bybit-style Copy Button */}
        <div className="w-full">
          {showControls ? (
            <div className="flex space-x-2">
              {status === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-sm border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleStop}
                  disabled={isLoading}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "..." : "Stop"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-sm border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={handleRestart}
                  disabled={isLoading}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "..." : "Start"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 text-sm border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                onClick={handleUnfollow}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className={cn(
                "w-full h-9 text-sm font-semibold rounded-md transition-colors",
                isFollowed
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
              onClick={isFollowed ? handleUnfollow : handleFollow}
              disabled={isLoading}
            >
              {isLoading ? "..." : (isFollowed ? "Unfollow" : "Follow in Bybit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
