"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/contexts/subscription-context"
import { useBotFollowing } from "@/contexts/bot-following-context"
import { Users, TrendingUp, ArrowRight, AlertTriangle, Info, DollarSign, Activity, BarChart, LineChart } from "lucide-react"
import { TradingBotCard } from "@/components/trading-bot-card"
import { useState } from "react"

export default function ForexBotsPage() {
  const { tier, canAccessForexBots } = useSubscription()
  const { followBot, unfollowBot, isFollowing } = useBotFollowing()

  // Sample bots data in new format
  const bots = [
    {
      id: "hades-grid",
      name: "Hades Grid Bot",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "long" as const,
      leverage: "20.00x",
      performance: 1875.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 18.75,
        timeframe: "30d"
      },
      volume: {
        value: "168.45K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 32,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 105, 110, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275],
      badge: "VIP",
      botImage: "/bot-images/hades.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/hades-grid",
      winRate: 85.2,
      maxDrawdown: 12.5,
      sharpeRatio: 1.8,
      totalTrades: 456,
      avgHoldingTime: "6.2h",
      aum: "892,150 USDT",
      rating: 5
    },
    {
      id: "hermes-scalper",
      name: "Hermes Scalper",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "short" as const,
      leverage: "15.00x",
      performance: 1235.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 12.35,
        timeframe: "30d"
      },
      volume: {
        value: "124.68K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 45,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 102, 105, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172],
      badge: "VIP",
      botImage: "/bot-images/hermes.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/hermes-scalper",
      winRate: 72.8,
      maxDrawdown: 8.3,
      sharpeRatio: 1.4,
      totalTrades: 623,
      avgHoldingTime: "4.1h",
      aum: "567,890 USDT",
      rating: 4
    },
    {
      id: "apollo-conservative",
      name: "Apollo Conservative",
      type: "futures" as const,
      gridType: "Futures grid",
      longShort: "long" as const,
      leverage: "10.00x",
      performance: 945.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 9.45,
        timeframe: "30d"
      },
      volume: {
        value: "82.34K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 38,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135, 137],
      badge: "VIP",
      botImage: "/bot-images/apollo.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/apollo-conservative",
      winRate: 68.5,
      maxDrawdown: 5.2,
      sharpeRatio: 1.1,
      totalTrades: 389,
      avgHoldingTime: "8.7h",
      aum: "234,567 USDT",
      rating: 4
    }
  ]

  const handleFollowBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      await followBot(botId, bot.name, "forex")
    }
  }

  const handleUnfollowBot = async (botId: string) => {
    await unfollowBot(botId)
  }

  if (!canAccessForexBots) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center max-w-2xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-[#FFD700] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-white">ROYAL NFT Required</h1>
          <p className="text-[#C0E6FF] mb-6">
            Forex trading bots are available exclusively for ROYAL NFT holders. Mint your ROYAL NFT to access these advanced
            automated trading strategies for foreign exchange markets.
          </p>
          <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold">
            Mint ROYAL NFT - 1500 USDC
          </Button>
        </div>
      </div>
    )
  }

  // Analytics data for forex bots
  const forexAnalytics = {
    totalProfit: "$375,471.30",
    activeBots: "2/3",
    winRate: "95.3%",
    totalTrades: "650",
    profitTrend: 13.5,
    winRateTrend: 2.1,
    tradesToday: 15,
    avgTradeProfit: "$40.25",
    bestPerformer: "Hades",
    worstPerformer: "Artemis"
  }



  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Forex Trading Bots</h1>
          <p className="text-[#C0E6FF] mt-1">Advanced strategies for foreign exchange markets</p>
        </div>
        <Button variant="outline" className="hidden md:flex items-center gap-2 border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10">
          <BarChart className="h-4 w-4" />
          Learn More
        </Button>
      </div>

      {/* Forex Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Total Profit</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{forexAnalytics.totalProfit}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{forexAnalytics.profitTrend}%
                </span>
                <span className="text-[#C0E6FF] text-xs ml-2">vs. last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Activity className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">Active Bots</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{forexAnalytics.activeBots}</p>
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
              <p className="text-2xl font-bold text-white">{forexAnalytics.winRate}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{forexAnalytics.winRateTrend}%
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
              <p className="text-2xl font-bold text-white">{forexAnalytics.totalTrades}</p>
              <div className="flex items-center">
                <span className="text-[#C0E6FF] text-xs">{forexAnalytics.tradesToday} trades today</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <TradingBotCard
            key={bot.id}
            {...bot}
            isFollowed={isFollowing(bot.id)}
            onFollow={() => handleFollowBot(bot.id)}
            onUnfollow={() => handleUnfollowBot(bot.id)}
          />
        ))}
      </div>
    </div>
  )
}
