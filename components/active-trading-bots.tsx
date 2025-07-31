"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  DollarSign,
  Activity,
  StopCircle,
  Trash2,
  AlertTriangle,
  Bitcoin,
  TrendingDown,
  RotateCcw,
  Clock
} from "lucide-react"
import Image from "next/image"
import { TradingBotCard } from "@/components/trading-bot-card"

interface ActiveBot {
  id: string
  name: string
  type: "crypto" | "forex" | "stock"
  status: "active" | "paused" | "stopped"
  profit: number
  totalTrades: number
  winRate: number
  investment: string
  dailyProfit: number
  isPositive: boolean
  lastUpdate: string
  completedCycles: number
  currentCycleProgress: number
  todaysProfit: number
}

export function ActiveTradingBots() {
  const [activeBots, setActiveBots] = useState<ActiveBot[]>([
    {
      id: "1",
      name: "BTC Scalping Pro",
      type: "crypto",
      status: "active",
      profit: 12.5,
      totalTrades: 45,
      winRate: 78,
      investment: "$2,500",
      dailyProfit: 2.3,
      isPositive: true,
      lastUpdate: new Date().toLocaleTimeString(),
      completedCycles: 3,
      currentCycleProgress: 7.2,
      todaysProfit: 2.3
    },
    {
      id: "2",
      name: "ETH Swing Trader",
      type: "crypto",
      status: "active",
      profit: 8.7,
      totalTrades: 23,
      winRate: 65,
      investment: "$1,800",
      dailyProfit: 1.2,
      isPositive: true,
      lastUpdate: new Date().toLocaleTimeString(),
      completedCycles: 2,
      currentCycleProgress: 4.8,
      todaysProfit: 1.2
    },
    {
      id: "3",
      name: "EUR/USD Grid Bot",
      type: "forex",
      status: "paused",
      profit: -2.1,
      totalTrades: 67,
      winRate: 45,
      investment: "$3,200",
      dailyProfit: -0.8,
      isPositive: false,
      lastUpdate: new Date().toLocaleTimeString(),
      completedCycles: 1,
      currentCycleProgress: 2.1,
      todaysProfit: -0.8
    }
  ])

  const handleStopBot = (botId: string) => {
    setActiveBots(prev =>
      prev.map(bot =>
        bot.id === botId
          ? { ...bot, status: bot.status === "active" ? "stopped" : "active" }
          : bot
      )
    )
  }

  const handleDeleteBot = (botId: string) => {
    setActiveBots(prev => prev.filter(bot => bot.id !== botId))
  }

  // Convert bot data to TradingBotCard format
  const convertBotToCardData = (bot: ActiveBot) => {
    // Generate sample chart data based on bot performance
    const generateChartData = (performance: number) => {
      const baseValue = 100
      const trend = performance > 0 ? 1 : -1
      const volatility = Math.abs(performance) / 10

      return Array.from({ length: 20 }, (_, i) => {
        const progress = i / 19
        const trendValue = baseValue + (performance * progress)
        const noise = (Math.random() - 0.5) * volatility * 2
        return Math.max(0, trendValue + noise)
      })
    }

    return {
      id: bot.id,
      name: bot.name,
      type: "futures" as const,
      gridType: bot.type === "crypto" ? "Spot grid" : bot.type === "forex" ? "Futures grid" : "Stock grid",
      longShort: bot.profit >= 0 ? "long" as const : "short" as const,
      leverage: bot.type === "forex" ? "10x" : "5x",
      performance: bot.profit,
      performanceColor: bot.profit >= 0 ? "#10b981" : "#ef4444",
      pnl: `${bot.profit >= 0 ? '+' : ''}${bot.profit.toFixed(2)}%`,
      roi: {
        value: bot.profit,
        timeframe: "30d"
      },
      volume: {
        value: bot.investment.replace('$', '').replace(',', '') + 'K',
        timeframe: "24h"
      },
      profitSharing: 30,
      followers: Math.floor(Math.random() * 100) + 10,
      owner: {
        name: "AIONET",
        avatar: undefined
      },
      chartData: generateChartData(bot.profit),
      isFollowed: true,
      showControls: true,
      // Add missing Bybit-style properties
      winRate: Math.min(95, Math.max(45, 70 + (bot.profit / 10))), // Dynamic win rate based on profit
      maxDrawdown: Math.max(0.5, Math.min(25, Math.abs(bot.profit / 5))), // Dynamic drawdown
      sharpeRatio: Math.max(0.1, Math.min(3.0, 1.0 + (bot.profit / 100))), // Dynamic Sharpe ratio
      totalTrades: Math.floor(Math.random() * 800) + 200, // Random trades between 200-1000
      avgHoldingTime: bot.type === "forex" ? "4.2h" : bot.type === "crypto" ? "6.8h" : "12.5h",
      aum: `${(Math.random() * 900 + 100).toFixed(0)},${Math.floor(Math.random() * 999).toString().padStart(3, '0')} USDT`,
      rating: Math.min(5, Math.max(3, Math.floor(4 + (bot.profit / 50)))), // Rating based on performance
      badge: bot.type === "crypto" ? (bot.profit > 50 ? "PREMIUM" : "FREE") : "VIP"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "crypto":
        return "from-[#4DA2FF] to-[#011829]"
      case "forex":
        return "from-yellow-400 to-yellow-600"
      case "stock":
        return "from-purple-400 to-purple-600"
      default:
        return "from-[#4DA2FF] to-[#011829]"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crypto":
        return <Bitcoin className="w-4 h-4" />
      case "forex":
        return <DollarSign className="w-4 h-4" />
      case "stock":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Bitcoin className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-500 text-white">Paused</Badge>
      case "stopped":
        return <Badge className="bg-red-500 text-white">Stopped</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>
    }
  }

  if (activeBots.length === 0) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-[#C0E6FF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Bots</h3>
            <p className="text-[#C0E6FF] text-sm">
              Start following trading bots to see them here
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeBots.map((bot) => {
        const cardData = convertBotToCardData(bot)
        return (
          <TradingBotCard
            key={bot.id}
            {...cardData}
            onStop={() => handleStopBot(bot.id)}
            onRestart={() => handleStopBot(bot.id)}
            onUnfollow={() => handleDeleteBot(bot.id)}
          />
        )
      })}
    </div>
  )
}
