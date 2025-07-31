"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ActiveTradingBots } from "@/components/active-trading-bots"
import { ExternalLink, TrendingUp, DollarSign, Activity, Link as LinkIcon, Info, ChevronDown, ChevronUp, BarChart3 } from "lucide-react"
import Image from "next/image"
import { TradingBotCard } from "@/components/trading-bot-card"

import { useBotFollowing } from "@/contexts/bot-following-context"
import { BotCycleInfo } from "@/components/bot-cycle-info"
import { CycleExplanationModal } from "@/components/cycle-explanation-modal"
import { useSubscription } from "@/contexts/subscription-context"

interface TradingStats {
  totalEarnings: string
  stableCoinProfits: string
  lastMonthPercentage: number
  connectionStatus: 'connected' | 'disconnected'
  isActive: boolean
}

interface FollowedBot {
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
  followers: number
  owner: {
    name: string
    avatar?: string
  }
  chartData: number[]
  status: "active" | "stopped"
}

export function CopyTradingInterface() {
  const { followedBots: storedBots, toggleBotStatus, unfollowBot } = useBotFollowing()
  const { tier } = useSubscription()
  const [tradingStats] = useState<TradingStats>({
    totalEarnings: "$12,450.32",
    stableCoinProfits: "$8,920.15",
    lastMonthPercentage: 20,
    connectionStatus: 'disconnected',
    isActive: false
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState(false)
  const [followedBots, setFollowedBots] = useState<FollowedBot[]>([
    {
      id: "trbusd-perpetual",
      name: "TRBUSD Perpetual",
      type: "futures",
      gridType: "Futures grid",
      longShort: "long",
      leverage: "10.00x",
      performance: 8725.06,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 11.5,
        timeframe: "24h"
      },
      volume: {
        value: "102.30S",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 125,
      owner: {
        name: "e34***@qq.com"
      },
      chartData: [100, 110, 115, 125, 140, 160, 180, 200, 220, 240, 270, 300, 340, 380, 420, 470, 530, 600, 680, 780],
      status: "active"
    },
    {
      id: "perpusdt-perpetual",
      name: "PERPUSDT Perpetual",
      type: "futures",
      gridType: "Futures grid",
      longShort: "short",
      leverage: "10.00x",
      performance: 1458.71,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 11.53,
        timeframe: "24h"
      },
      volume: {
        value: "395.79.30S",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 89,
      owner: {
        name: "Like Jesus"
      },
      chartData: [100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260],
      status: "active"
    },
    {
      id: "starlusdt-perpetual",
      name: "STARLUSDT Perpetual",
      type: "futures",
      gridType: "Futures grid",
      longShort: "short",
      leverage: "10.00x",
      performance: 1960.04,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 21.99,
        timeframe: "24h"
      },
      volume: {
        value: "79.80S",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 65,
      owner: {
        name: "Stone9999"
      },
      chartData: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290],
      status: "stopped"
    }
  ])

  // Convert stored bots to display format
  const convertStoredBotsToDisplay = () => {
    return storedBots.map(bot => {
      // Generate sample chart data based on bot type
      const generateChartData = () => {
        const baseValue = 100
        const volatility = 20

        return Array.from({ length: 20 }, (_, i) => {
          const progress = i / 19
          const trendValue = baseValue + (Math.random() * 50 * progress)
          const noise = (Math.random() - 0.5) * volatility
          return Math.max(0, trendValue + noise)
        })
      }

      return {
        id: bot.id,
        name: bot.name,
        type: "futures" as const,
        gridType: bot.type === "crypto" ? "Futures grid" : bot.type === "forex" ? "Futures grid" : "Spot grid",
        longShort: "long" as const,
        leverage: bot.type === "forex" ? "10.00x" : "5.00x",
        performance: Math.random() * 2000 + 500, // Random performance for demo
        performanceColor: "#10b981",
        pnl: "PnL",
        roi: {
          value: Math.random() * 20 + 5,
          timeframe: "30d"
        },
        volume: {
          value: `${Math.floor(Math.random() * 200 + 50)}.${Math.floor(Math.random() * 100)}K`,
          timeframe: "24h"
        },
        profitSharing: 30,
        followers: Math.floor(Math.random() * 100) + 20,
        owner: {
          name: "AIONET"
        },
        chartData: generateChartData(),
        status: bot.status,
        // Add missing Bybit-style properties
        winRate: Math.min(95, Math.max(50, 70 + Math.random() * 20)), // Random win rate 50-95%
        maxDrawdown: Math.max(1, Math.min(20, Math.random() * 15 + 2)), // Random drawdown 1-20%
        sharpeRatio: Math.max(0.5, Math.min(2.5, 1.0 + Math.random() * 1.0)), // Random Sharpe 0.5-2.5
        totalTrades: Math.floor(Math.random() * 600) + 300, // Random trades 300-900
        avgHoldingTime: bot.type === "forex" ? "3.5h" : bot.type === "crypto" ? "5.2h" : "8.7h",
        aum: `${(Math.random() * 800 + 200).toFixed(0)},${Math.floor(Math.random() * 999).toString().padStart(3, '0')} USDT`,
        rating: Math.floor(Math.random() * 3) + 3, // Random rating 3-5 stars
        badge: bot.type === "crypto" ? "FREE" : "VIP"
      }
    })
  }

  const displayBots = convertStoredBotsToDisplay()

  const handleBybitConnection = () => {
    setIsConnecting(true)
    // Simulate API connection - only when user clicks
    setTimeout(() => {
      setIsConnecting(false)
    }, 2000)
  }

  const handleStopBot = async (botId: string) => {
    await toggleBotStatus(botId)
  }

  const handleUnfollowBot = async (botId: string) => {
    await unfollowBot(botId)
  }

  // Show all bots without filtering
  const filteredBots = displayBots

  const performanceData = [
    { month: "Jan", profit: 1200 },
    { month: "Feb", profit: 1800 },
    { month: "Mar", profit: 2100 },
    { month: "Apr", profit: 1950 },
    { month: "May", profit: 2400 },
    { month: "Jun", profit: 2850 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#FFFFFF]">AIONET Copy Trading</h2>
          <p className="text-[#C0E6FF] mt-1">Automated Bybit trading bots for AIONET NFT holders</p>
        </div>
        {storedBots.length > 0 && (
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            onClick={() => setIsCycleModalOpen(true)}
          >
            <Info className="h-4 w-4" />
            Learn More
          </Button>
        )}
      </div>

      {/* Top Row - Five Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Earnings */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{tradingStats.totalEarnings}</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">From Bybit copy trading</span>
                </div>
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stable Coin Profits */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Stable Coin Profits</p>
                <p className="text-2xl font-bold text-white">{tradingStats.stableCoinProfits}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-[#C0E6FF] text-sm">+{tradingStats.lastMonthPercentage}% from last month</span>
                </div>
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  {(() => {
                    const totalVolume = displayBots.reduce((sum, bot) => {
                      const volumeStr = bot.volume.value.replace(/[KMS]/g, '');
                      const volumeNum = parseFloat(volumeStr);
                      const multiplier = bot.volume.value.includes('K') ? 1000 :
                                       bot.volume.value.includes('M') ? 1000000 :
                                       bot.volume.value.includes('S') ? 1000000 : 1;
                      return sum + (volumeNum * multiplier);
                    }, 0);

                    if (totalVolume >= 1000000) {
                      return `$${(totalVolume / 1000000).toFixed(2)}M`;
                    } else if (totalVolume >= 1000) {
                      return `$${(totalVolume / 1000).toFixed(2)}K`;
                    } else {
                      return `$${totalVolume.toFixed(2)}`;
                    }
                  })()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-[#C0E6FF] text-sm">From {displayBots.length} followed bots</span>
                </div>
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Button */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <p className="text-sm font-medium text-white">Bybit Connection</p>
                <div className="mt-2 space-y-2">
                  <Button
                    onClick={handleBybitConnection}
                    disabled={isConnecting}
                    className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white text-xs py-1 h-8"
                  >
                    {isConnecting ? "Connecting..." : "Connect to Bybit"}
                  </Button>
                  <p className="text-xs text-[#C0E6FF]">
                    No account?{" "}
                    <a
                      href="https://www.bybit.com/register?affiliate_id=AIONET"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4DA2FF] hover:underline inline-flex items-center gap-1"
                    >
                      Sign up <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Connection Status</p>
                <p className="text-2xl font-bold text-white">
                  {tradingStats.connectionStatus === 'connected' ? 'Active' : 'Inactive'}
                </p>
                <div className="flex items-center mt-1">
                  <Activity className={`w-4 h-4 mr-1 ${tradingStats.connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={`text-sm ${tradingStats.connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                    {tradingStats.connectionStatus === 'connected'
                      ? 'Trading bot is running'
                      : 'Connect to start trading'
                    }
                  </span>
                </div>
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Performance Overview */}
      <div className="space-y-4">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <button
              onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
              {isPerformanceExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#C0E6FF]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#C0E6FF]" />
              )}
            </button>

            {isPerformanceExpanded && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Performance Details Table */}
                <div className="border border-[#4DA2FF]/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Monthly Average</td>
                        <td className="px-3 py-2 text-[#FFFFFF] font-semibold text-sm">$2,075</td>
                      </tr>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Best Month</td>
                        <td className="px-3 py-2 text-[#4DA2FF] font-semibold text-sm">$2,850</td>
                      </tr>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Worst Month</td>
                        <td className="px-3 py-2 text-red-400 font-semibold text-sm">$1,200</td>
                      </tr>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Win Rate</td>
                        <td className="px-3 py-2 text-[#4DA2FF] font-semibold text-sm">78.5%</td>
                      </tr>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Loss Rate</td>
                        <td className="px-3 py-2 text-red-400 font-semibold text-sm">21.5%</td>
                      </tr>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Active Bots</td>
                        <td className="px-3 py-2 text-green-400 font-semibold text-sm">3</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">Total Trades</td>
                        <td className="px-3 py-2 text-[#FFFFFF] font-semibold text-sm">1,247</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Column 2: Monthly Profits Table */}
                <div className="border border-[#4DA2FF]/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#4DA2FF]/20">
                        <th className="px-3 py-2 text-white text-sm text-left border-r border-[#4DA2FF]/20">Month</th>
                        <th className="px-3 py-2 text-white text-sm text-left">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((data, index) => (
                        <tr key={data.month} className={index < performanceData.length - 1 ? "border-b border-[#4DA2FF]/20" : ""}>
                          <td className="px-3 py-2 text-white text-sm border-r border-[#4DA2FF]/20">{data.month}</td>
                          <td className="px-3 py-2 text-[#4DA2FF] font-semibold text-sm">${data.profit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cycle Information for all users */}
      {storedBots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Bot Cycles & Performance
            {tier === "NOMAD" && <span className="text-sm text-[#C0E6FF] ml-2">(Payment required after each 10% profit cycle)</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storedBots.map((bot) => (
              <BotCycleInfo key={bot.id} botId={bot.id} botName={bot.name} />
            ))}
          </div>
        </div>
      )}

      {/* My Followed Trading Bots */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">My Followed Trading Bots</h3>
        </div>

        {storedBots.length === 0 ? (
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-[#C0E6FF] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Followed Bots</h3>
                <p className="text-[#C0E6FF] text-sm">
                  Start following trading bots from the crypto, forex, or stock bot pages
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
              <TradingBotCard
                key={bot.id}
                {...bot}
                isFollowed={true}
                showControls={false}
                onUnfollow={() => handleUnfollowBot(bot.id)}
              />
            ))}
          </div>
        )}
      </div>



      {/* Cycle Explanation Modal */}
      <CycleExplanationModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
      />
    </div>
  )
}
