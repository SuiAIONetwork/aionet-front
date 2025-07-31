"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/contexts/subscription-context"
import { useBotFollowing } from "@/contexts/bot-following-context"
import { Users, TrendingUp, ArrowRight, AlertTriangle, Info, DollarSign, Activity, BarChart, LineChart, Bitcoin } from "lucide-react"
import { TradingBotCard } from "@/components/trading-bot-card"
import { BybitInfoModal } from "@/components/bybit-info-modal"
import { BotCycleInfo } from "@/components/bot-cycle-info"
import { useState } from "react"

export default function CryptoBotsPage() {
  const { tier } = useSubscription()
  const { followBot, unfollowBot, isFollowing } = useBotFollowing()
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

  // Sample bots data in new format
  const bots = [
    {
      id: "zeus-perpetual",
      name: "Zeus",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "long" as const,
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
        name: "Bybit"
      },
      chartData: [100, 110, 115, 125, 140, 160, 180, 200, 220, 240, 270, 300, 340, 380, 420, 470, 530, 600, 680, 780],
      badge: "FREE",
      botImage: "/bot-images/zeus.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/zeus-perpetual",
      winRate: 99.94,
      maxDrawdown: 7.00,
      sharpeRatio: 1.43,
      totalTrades: 968,
      avgHoldingTime: "3.8h",
      aum: "742,227 USDT",
      rating: 5
    },
    {
      id: "hermes-perpetual",
      name: "Hermes",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "short" as const,
      leverage: "10.00x",
      performance: 1458.71,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 11.53,
        timeframe: "24h"
      },
      volume: {
        value: "395.79S",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 89,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260],
      badge: "FREE",
      botImage: "/bot-images/hermes.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/hermes-perpetual",
      winRate: 66.98,
      maxDrawdown: 0.00,
      sharpeRatio: 1.61,
      totalTrades: 967,
      avgHoldingTime: "4.0h",
      aum: "1,465.41 USDT",
      rating: 4
    },
    {
      id: "athena-perpetual",
      name: "Athena",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "short" as const,
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
        name: "Bybit"
      },
      chartData: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290],
      badge: "PREMIUM",
      botImage: "/bot-images/athena.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/athena-perpetual",
      winRate: 73.42,
      maxDrawdown: 11.42,
      sharpeRatio: 0.99,
      totalTrades: 1200,
      avgHoldingTime: "2.1h",
      aum: "326.35 USDT",
      rating: 4
    }
  ]

  const handleFollowBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      await followBot(botId, bot.name, "crypto")
    }
  }

  const handleUnfollowBot = async (botId: string) => {
    await unfollowBot(botId)
  }

  // Check if user has access (NOMAD free tier, or PRO/ROYAL NFT holders)
  const hasAccess = tier === 'NOMAD' || tier === 'PRO' || tier === 'ROYAL'

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center max-w-2xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-[#4DA2FF] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-white">Access Required</h1>
          <p className="text-[#C0E6FF] mb-6">
            Crypto trading bots are available for all users.
            NOMADS (free tier) use the cycle system ($10/month per bot), while PRO and ROYAL NFT holders get unlimited access.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white">
              Join as NOMAD - Free
            </Button>
            <Button className="bg-gradient-to-r from-[#4DA2FF] to-[#011829] text-white">
              Mint PRO NFT - 400 USDC
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Analytics data for crypto bots
  const cryptoAnalytics = {
    totalProfit: "$407,846.32",
    activeBots: "2/3",
    winRate: "95.6%",
    totalTrades: "516",
    profitTrend: 14.8,
    winRateTrend: 2.3,
    tradesToday: 12,
    avgTradeProfit: "$42.35",
    bestPerformer: "Zeus",
    worstPerformer: "Athena"
  }



  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Crypto Trading Bots</h1>
          <p className="text-[#C0E6FF] mt-1">Automated trading strategies for cryptocurrency markets</p>
        </div>
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
          onClick={() => setIsInfoModalOpen(true)}
        >
          <Bitcoin className="h-4 w-4" />
          Learn More
        </Button>
      </div>

      {/* Access Level Notice */}
      {tier === 'NOMAD' && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">NOMAD (Free Tier) - Cycle System</h3>
              <p className="text-blue-100 text-sm">
                As a NOMAD (free user), you can access crypto bots with our cycle system. Each bot costs $10 per month.
                Mint a PRO or ROYAL NFT for unlimited access without monthly payments.
              </p>
            </div>
          </div>
        </div>
      )}

      {(tier === 'PRO' || tier === 'ROYAL') && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400 mb-1">
                {tier === 'PRO' ? 'PRO' : 'ROYAL'} NFT Holder - Unlimited Access
              </h3>
              <p className="text-green-100 text-sm">
                As an NFT holder, you have unlimited access to all crypto trading bots without monthly cycle payments.
                Follow as many bots as you want!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Total Profit</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{cryptoAnalytics.totalProfit}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{cryptoAnalytics.profitTrend}%
                </span>
                <span className="text-[#C0E6FF] text-xs ml-2">vs. last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Activity className="w-5 h-5 text-[#4DA2FF]" />
              <h3 className="font-semibold">Active Bots</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{cryptoAnalytics.activeBots}</p>
              <div className="flex items-center">
                <span className="text-[#C0E6FF] text-xs">Currently running</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <BarChart className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Win Rate</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{cryptoAnalytics.winRate}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{cryptoAnalytics.winRateTrend}%
                </span>
                <span className="text-[#C0E6FF] text-xs ml-2">vs. last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <LineChart className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold">Total Trades</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{cryptoAnalytics.totalTrades}</p>
              <div className="flex items-center">
                <span className="text-[#C0E6FF] text-xs">{cryptoAnalytics.tradesToday} trades today</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <div key={bot.id} className="space-y-4">
            <TradingBotCard
              {...bot}
              isFollowed={isFollowing(bot.id)}
              onFollow={() => handleFollowBot(bot.id)}
              onUnfollow={() => handleUnfollowBot(bot.id)}
            />
            {/* Show cycle info for NOMAD users */}
            {tier === 'NOMAD' && isFollowing(bot.id) && (
              <BotCycleInfo
                botId={bot.id}
                botName={bot.name}
                botType="crypto"
              />
            )}
          </div>
        ))}
      </div>

      {/* Bybit Info Modal */}
      <BybitInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  )
}
