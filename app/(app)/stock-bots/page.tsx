"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/contexts/subscription-context"
import { useBotFollowing } from "@/contexts/bot-following-context"
import { Users, TrendingUp, ArrowRight, AlertTriangle, Info, DollarSign, Activity, BarChart, LineChart } from "lucide-react"
import { TradingBotCard } from "@/components/trading-bot-card"
import { useState } from "react"

export default function StockBotsPage() {
  const { tier, canAccessStockBots } = useSubscription()
  const { followBot, unfollowBot, isFollowing } = useBotFollowing()

  // Sample bots data in new format
  const bots = [
    {
      id: "zeus-stocks",
      name: "Zeus Stock Grid",
      type: "futures" as const,
      gridType: "Spot grid",
      longShort: "long" as const,
      leverage: "5.00x",
      performance: 2215.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 22.15,
        timeframe: "30d"
      },
      volume: {
        value: "187.32K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 35,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290],
      badge: "VIP",
      botImage: "/bot-images/zeus.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/zeus-stocks",
      winRate: 91.3,
      maxDrawdown: 15.8,
      sharpeRatio: 2.1,
      totalTrades: 234,
      avgHoldingTime: "12.4h",
      aum: "1,234,567 USDT",
      rating: 5
    },
    {
      id: "athena-swing",
      name: "Athena Swing Trader",
      type: "futures" as const,
      gridType: "Spot grid",
      longShort: "long" as const,
      leverage: "5.00x",
      performance: 1689.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 16.89,
        timeframe: "30d"
      },
      volume: {
        value: "142.78K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 42,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195],
      badge: "VIP",
      botImage: "/bot-images/athena.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/athena-swing",
      winRate: 76.4,
      maxDrawdown: 9.7,
      sharpeRatio: 1.6,
      totalTrades: 345,
      avgHoldingTime: "18.2h",
      aum: "678,901 USDT",
      rating: 4
    },
    {
      id: "hermes-aggressive",
      name: "Hermes Aggressive",
      type: "futures" as const,
      gridType: "Spot grid",
      longShort: "short" as const,
      leverage: "10.00x",
      performance: 875.0,
      performanceColor: "#10b981",
      pnl: "PnL",
      roi: {
        value: 8.75,
        timeframe: "30d"
      },
      volume: {
        value: "78.45K",
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: 28,
      owner: {
        name: "Bybit"
      },
      chartData: [100, 102, 105, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172],
      badge: "VIP",
      botImage: "/bot-images/hermes.svg",
      bybitUrl: "https://www.bybit.com/copy-trading/trade-detail/hermes-aggressive",
      winRate: 82.1,
      maxDrawdown: 6.4,
      sharpeRatio: 1.3,
      totalTrades: 567,
      avgHoldingTime: "5.8h",
      aum: "445,123 USDT",
      rating: 4
    }
  ]

  const handleFollowBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      await followBot(botId, bot.name, "stock")
    }
  }

  const handleUnfollowBot = async (botId: string) => {
    await unfollowBot(botId)
  }

  if (!canAccessStockBots) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center max-w-2xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-[#FFD700] mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-white">ROYAL NFT Required</h1>
          <p className="text-[#C0E6FF] mb-6">
            Stock trading bots are available exclusively for ROYAL NFT holders. Mint your ROYAL NFT to access these advanced
            automated trading strategies for the stock market and unlock VIP features.
          </p>
          <Button className="bg-gradient-to-r from-purple-400 to-purple-600 text-white font-semibold">
            Mint ROYAL NFT - 1500 USDC
          </Button>
        </div>
      </div>
    )
  }

  // Analytics data for stock bots
  const stockAnalytics = {
    totalProfit: "$408,551.40",
    activeBots: "2/3",
    winRate: "95.7%",
    totalTrades: "720",
    profitTrend: 12.5,
    winRateTrend: 1.8,
    tradesToday: 18,
    avgTradeProfit: "$38.75",
    bestPerformer: "Hermes",
    worstPerformer: "Ares"
  }



  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Stock Trading Bots</h1>
          <p className="text-[#C0E6FF] mt-1">Advanced strategies for stock market trading</p>
        </div>
        <Button variant="outline" className="hidden md:flex items-center gap-2 border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10">
          <BarChart className="h-4 w-4" />
          Learn More
        </Button>
      </div>

      {/* Stock Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Total Profit</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{stockAnalytics.totalProfit}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stockAnalytics.profitTrend}%
                </span>
                <span className="text-[#C0E6FF] text-xs ml-2">vs. last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Active Bots</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{stockAnalytics.activeBots}</p>
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
              <p className="text-2xl font-bold text-white">{stockAnalytics.winRate}</p>
              <div className="flex items-center">
                <span className="text-green-400 text-xs flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stockAnalytics.winRateTrend}%
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
              <p className="text-2xl font-bold text-white">{stockAnalytics.totalTrades}</p>
              <div className="flex items-center">
                <span className="text-[#C0E6FF] text-xs">{stockAnalytics.tradesToday} trades today</span>
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
