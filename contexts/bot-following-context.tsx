"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
// Using localStorage for bot following data (non-sensitive)
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSubscription } from "@/contexts/subscription-context"

interface FollowedBot {
  id: string
  name: string
  type: "crypto" | "forex" | "stock"
  status: "active" | "stopped"
  followedAt: string
  lastUpdate: string
  cycleStartDate: string
  cyclesPaid: number
  isPaid: boolean
  // Profit-based cycle fields
  cycleStartProfit: number // Profit amount when cycle started
  currentProfit: number // Current profit amount
  cycleTargetProfit: number // Target profit for cycle completion (10% above start)
  profitPercentage: number // Current profit percentage for this cycle
}

interface BotFollowingContextType {
  followedBots: FollowedBot[]
  followBot: (botId: string, botName: string, botType: "crypto" | "forex" | "stock") => Promise<void>
  unfollowBot: (botId: string) => Promise<void>
  toggleBotStatus: (botId: string) => Promise<void>
  isFollowing: (botId: string) => boolean
  getBotStatus: (botId: string) => "active" | "stopped" | null
  getBotCycleInfo: (botId: string) => {
    profitPercentage: number;
    cycleNumber: number;
    isPaid: boolean;
    isCompleted: boolean;
    currentProfit: number;
    targetProfit: number;
    startProfit: number;
  } | null
  payForBotCycle: (botId: string) => Promise<void>
  isLoading: boolean
}

const BotFollowingContext = createContext<BotFollowingContextType | undefined>(undefined)

export function BotFollowingProvider({ children }: { children: ReactNode }) {
  const { user } = useSuiAuth()
  const currentAccount = useCurrentAccount()
  const { tier } = useSubscription()
  const [followedBots, setFollowedBots] = useState<FollowedBot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastUpdateRef = useRef<number>(0)

  // Get user address from either SuiAuth context or current account
  const userAddress = user?.address || currentAccount?.address

  // Migrate old bot data to new profit-based structure
  const migrateBotData = (bot: any): FollowedBot => {
    // If bot already has profit fields, return as is
    if (bot.cycleStartProfit !== undefined) {
      return bot as FollowedBot
    }

    // Migrate old bot to new structure
    const startProfit = 1000 // Default starting profit
    return {
      ...bot,
      cycleStartProfit: startProfit,
      currentProfit: startProfit,
      cycleTargetProfit: startProfit * 1.1, // 10% above start
      profitPercentage: 0
    }
  }

  // Load followed bots from storage
  useEffect(() => {
    const loadFollowedBots = async () => {
      if (!userAddress) {
        setIsLoading(false)
        return
      }

      try {
        const stored = localStorage.getItem(`followed_bots_${userAddress}`)
        if (stored) {
          const parsedBots = JSON.parse(stored)
          // Migrate old bots to new structure
          const migratedBots = parsedBots.map(migrateBotData)
          setFollowedBots(migratedBots)

          // Save migrated data back to storage
          if (JSON.stringify(migratedBots) !== stored) {
            saveFollowedBots(migratedBots)
          }
        }
      } catch (error) {
        console.error("Error loading followed bots:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowedBots()
  }, [userAddress])

  // Save followed bots to storage
  const saveFollowedBots = (bots: FollowedBot[]) => {
    if (!userAddress) return

    try {
      localStorage.setItem(`followed_bots_${userAddress}`, JSON.stringify(bots))
    } catch (error) {
      console.error("Error saving followed bots:", error)
    }
  }

  // Simulate profit growth for bots (in real implementation, this would come from Bybit API)
  const simulateProfitGrowth = (bot: FollowedBot): FollowedBot => {
    // Ensure bot has required profit fields
    if (!bot.cycleStartProfit || !bot.cycleTargetProfit) {
      return migrateBotData(bot)
    }

    const now = new Date()
    const followedTime = new Date(bot.followedAt)
    const hoursElapsed = (now.getTime() - followedTime.getTime()) / (1000 * 60 * 60)

    // Simulate different profit growth rates based on bot type
    const growthRates = {
      crypto: 0.008, // 0.8% per hour average
      forex: 0.006, // 0.6% per hour average
      stock: 0.004 // 0.4% per hour average
    }

    const baseGrowthRate = growthRates[bot.type] || 0.005
    // Add some randomness to make it more realistic
    const randomFactor = 0.8 + (Math.random() * 0.4) // 0.8 to 1.2 multiplier
    const actualGrowthRate = baseGrowthRate * randomFactor

    // Calculate new profit with compound growth from cycle start
    const totalGrowth = Math.pow(1 + actualGrowthRate, hoursElapsed) - 1
    const newProfit = bot.cycleStartProfit + (bot.cycleStartProfit * totalGrowth)

    const profitGain = newProfit - bot.cycleStartProfit
    const targetGain = bot.cycleTargetProfit - bot.cycleStartProfit
    const profitPercentage = targetGain > 0 ? (profitGain / targetGain) * 100 : 0

    return {
      ...bot,
      currentProfit: newProfit,
      profitPercentage: Math.min(100, Math.max(0, profitPercentage)), // Clamp between 0-100%
      lastUpdate: now.toISOString()
    }
  }

  const followBot = async (botId: string, botName: string, botType: "crypto" | "forex" | "stock") => {
    const now = new Date()
    const startProfit = 1000 // Starting with $1000 base profit for simulation

    const newBot: FollowedBot = {
      id: botId,
      name: botName,
      type: botType,
      status: "active",
      followedAt: now.toISOString(),
      lastUpdate: now.toISOString(),
      cycleStartDate: now.toISOString(),
      cyclesPaid: 1, // First cycle is free
      isPaid: true,
      // Profit-based cycle initialization
      cycleStartProfit: startProfit,
      currentProfit: startProfit, // Start at base profit, growth will be simulated
      cycleTargetProfit: startProfit * 1.1, // 10% above start profit
      profitPercentage: 0 // 0% progress initially
    }

    const updatedBots = [...followedBots, newBot]
    setFollowedBots(updatedBots)
    saveFollowedBots(updatedBots)
  }

  const unfollowBot = async (botId: string) => {
    const updatedBots = followedBots.filter(bot => bot.id !== botId)
    setFollowedBots(updatedBots)
    saveFollowedBots(updatedBots)
  }

  const toggleBotStatus = async (botId: string) => {
    const updatedBots = followedBots.map(bot =>
      bot.id === botId
        ? {
            ...bot,
            status: (bot.status === "active" ? "stopped" : "active") as "active" | "stopped",
            lastUpdate: new Date().toISOString()
          }
        : bot
    )
    setFollowedBots(updatedBots)
    saveFollowedBots(updatedBots)
  }

  const isFollowing = (botId: string): boolean => {
    return followedBots.some(bot => bot.id === botId)
  }

  const getBotStatus = (botId: string): "active" | "stopped" | null => {
    const bot = followedBots.find(bot => bot.id === botId)
    return bot ? bot.status : null
  }



  // Load initial data only on mount - no automatic intervals
  useEffect(() => {
    if (followedBots.length === 0 || isLoading) return

    // Only run initial data load, no intervals
    console.log('Bot following context loaded with', followedBots.length, 'bots')
  }, [followedBots.length, isLoading]) // Only depend on length and loading state

  const getBotCycleInfo = (botId: string) => {
    const bot = followedBots.find(bot => bot.id === botId)
    if (!bot) return null

    // Just return current bot data without updating state
    const isCompleted = (bot.profitPercentage || 0) >= 100

    return {
      profitPercentage: bot.profitPercentage || 0,
      cycleNumber: bot.cyclesPaid || 1,
      isPaid: bot.isPaid || false,
      isCompleted,
      currentProfit: bot.currentProfit || 0,
      targetProfit: bot.cycleTargetProfit || 0,
      startProfit: bot.cycleStartProfit || 0
    }
  }

  const payForBotCycle = async (botId: string) => {
    const updatedBots = followedBots.map(bot => {
      if (bot.id === botId) {
        const now = new Date()
        // Start new cycle with current profit as the new baseline
        const newStartProfit = bot.currentProfit
        const newTargetProfit = newStartProfit * 1.1 // 10% above new start

        return {
          ...bot,
          cycleStartDate: now.toISOString(),
          cyclesPaid: bot.cyclesPaid + 1,
          isPaid: true,
          lastUpdate: now.toISOString(),
          // Reset profit cycle
          cycleStartProfit: newStartProfit,
          cycleTargetProfit: newTargetProfit,
          profitPercentage: 0 // Reset to 0% for new cycle
        }
      }
      return bot
    })

    setFollowedBots(updatedBots)
    saveFollowedBots(updatedBots)
  }

  const contextValue: BotFollowingContextType = {
    followedBots,
    followBot,
    unfollowBot,
    toggleBotStatus,
    isFollowing,
    getBotStatus,
    getBotCycleInfo,
    payForBotCycle,
    isLoading
  }

  return (
    <BotFollowingContext.Provider value={contextValue}>
      {children}
    </BotFollowingContext.Provider>
  )
}

export function useBotFollowing() {
  const context = useContext(BotFollowingContext)
  if (context === undefined) {
    throw new Error("useBotFollowing must be used within a BotFollowingProvider")
  }
  return context
}
