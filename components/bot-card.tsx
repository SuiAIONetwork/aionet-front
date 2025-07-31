"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Lock, TrendingUp, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useSubscription } from "@/contexts/subscription-context"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BotCardProps {
  id: string
  name: string
  description: string
  performance: number
  winRate: number
  type: "crypto" | "forex" | "free" | "premium" | "vip"
  investment: string
  minInvestment?: boolean
  followers?: number
  restricted?: boolean
  days?: number
  maxDrawdown?: number
  tradesWon?: number
  tradesLost?: number
  aum?: string
}

export function BotCard({
  id,
  name,
  description,
  performance,
  winRate,
  type,
  investment,
  minInvestment = true,
  followers = 0,
  restricted = false,
  days = 90,
  maxDrawdown = 0,
  tradesWon = 0,
  tradesLost = 0,
  aum = "",
}: BotCardProps) {
  const [isActive, setIsActive] = useState(false)
  const { tier, upgradeToPremium, upgradeToVIP } = useSubscription()
  const { theme } = useTheme()

  const handleToggle = () => {
    if (restricted) return
    setIsActive(!isActive)
  }

  const handleUpgrade = () => {
    if (type === "crypto") {
      upgradeToPremium()  // Upgrade to PRO NFT
    } else {
      upgradeToVIP()      // Upgrade to ROYAL NFT
    }
  }

  // Determine header background color based on theme, type and restriction
  const getHeaderBgColor = () => {
    if (restricted) {
      return "bg-gray-500 opacity-75"
    }

    if (type === "premium" || type === "vip") {
      return theme === "dark" ? "bg-[#1e3a8a]" : "bg-[#1e3a8a]"
    }

    return theme === "dark" ? "bg-[#1e3a8a]" : "bg-[#5a7ab8]"
  }

  // Determine button style based on restriction, type and active state
  const getButtonStyle = () => {
    if (restricted) {
      return "bg-gray-500 hover:bg-gray-600 text-white"
    }

    if (type === "premium") {
      return "bg-yellow-500 hover:bg-yellow-600 text-white"
    }

    if (type === "vip") {
      return "bg-amber-500 hover:bg-amber-600 text-white"
    }

    if (isActive) {
      return "bg-red-600 hover:bg-red-700 text-white"
    }

    return "bg-[#0f2b5a] hover:bg-[#0a1f3f] text-white"
  }

  // Determine badge style based on type
  const getBadgeStyle = () => {
    if (type === "premium") {
      return "bg-yellow-500 text-white"
    }

    if (type === "vip") {
      return "bg-amber-500 text-white"
    }

    if (type === "forex") {
      return "bg-amber-500 text-white"
    }

    return "bg-blue-600 text-white"
  }

  // Get badge text
  const getBadgeText = () => {
    if (type === "crypto" || type === "forex") {
      return type.toUpperCase()
    }
    return type.toUpperCase()
  }

  return (
    <div className={cn("enhanced-card", restricted ? "opacity-75" : "")}>
      <div className="enhanced-card-content">
        {/* Header */}
        <div className={cn("p-4 text-white mb-4 rounded-lg", getHeaderBgColor())}>
          <h3 className="text-lg font-medium">{name}</h3>
        </div>

      {/* Investment amount */}
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <p className="text-lg font-bold">{investment}</p>
          <p className="text-xs text-muted-foreground">{minInvestment ? "Min. Investment" : "Investment"}</p>
        </div>
        <div className={cn("px-3 py-1 rounded-md text-xs font-medium", getBadgeStyle())}>{getBadgeText()}</div>
      </div>

      {/* Card content */}
      <div className="p-4 space-y-4">
        {followers > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{followers} followers</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <TrendingUp className={cn("h-4 w-4", performance >= 0 ? "text-green-500" : "text-red-500")} />
          <span className={cn("text-sm font-medium", performance >= 0 ? "text-green-500" : "text-red-500")}>
            {performance >= 0 ? "+" : ""}
            {performance}%
          </span>
          {days > 0 && <span className="text-xs text-muted-foreground">{days} days</span>}
        </div>

        {/* Exchange symbol - using BYB'T as shown in the image */}
        <div className="flex items-center gap-2">
          <div className="border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-xs">BYB'T</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium">{winRate}%</p>
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MDD</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium">{maxDrawdown}%</p>
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Trades Won</p>
            <p className="text-sm font-medium">{tradesWon}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trades Lost</p>
            <p className="text-sm font-medium">{tradesLost}</p>
          </div>
        </div>

        {aum && (
          <div>
            <p className="text-xs text-muted-foreground">AUM</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium">{aum}</p>
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Button */}
      <div className="p-4 pt-0">
        {restricted ? (
          <Button onClick={handleUpgrade} className={cn("w-full", getButtonStyle())}>
            <Lock className="h-4 w-4 mr-2" />
            Upgrade to {type === "crypto" ? "Premium" : "VIP"}
          </Button>
        ) : (
          <Button onClick={handleToggle} className={cn("w-full", getButtonStyle())}>
            {isActive ? (
              <>Stop Following</>
            ) : (
              <>
                Start Following Now <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}
