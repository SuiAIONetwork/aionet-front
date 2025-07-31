"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/contexts/subscription-context"
import { useBotFollowing } from "@/contexts/bot-following-context"

interface BotCycleInfoProps {
  botId: string
  botName: string
  botType?: string
}

export function BotCycleInfo({ botId, botName, botType }: BotCycleInfoProps) {
  const { tier } = useSubscription()
  const { getBotCycleInfo, payForBotCycle } = useBotFollowing()
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  const cycleInfo = getBotCycleInfo(botId)
  const isNomad = tier === "NOMAD"

  if (!cycleInfo) return null

  const {
    profitPercentage = 0,
    cycleNumber = 1,
    isPaid = false,
    isCompleted = false,
    currentProfit = 0,
    targetProfit = 0,
    startProfit = 0
  } = cycleInfo || {}

  const isNearCompletion = profitPercentage >= 90 // 90% or more progress
  const profitGain = currentProfit - startProfit
  const targetGain = targetProfit - startProfit
  
  const handlePayment = async () => {
    setIsPaymentLoading(true)
    try {
      await payForBotCycle(botId)
      // Here you would integrate with your payment system
      // For now, we'll just simulate the payment
    } finally {
      setIsPaymentLoading(false)
    }
  }
  
  return (
    <Card className="enhanced-card">
      <div className="enhanced-card-content p-4">
        {/* Bot Name Header */}
        <div className="mb-3">
          <h4 className="text-base font-semibold text-white mb-1">{botName}</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#4DA2FF]" />
              <span className="text-sm font-medium text-[#C0E6FF]">Cycle {cycleNumber}</span>
            </div>
            <Badge
              className={cn(
                "text-xs",
                isPaid && !isCompleted
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : isCompleted && isNomad && !isPaid
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : isCompleted
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              )}
            >
              {isCompleted && isNomad && !isPaid ? "Payment Required" :
               isCompleted ? "Cycle Complete" :
               isPaid ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#C0E6FF]">Profit Progress:</span>
            <span className={cn(
              "text-sm font-medium",
              profitPercentage >= 90 ? "text-green-400" :
              profitPercentage >= 70 ? "text-yellow-400" : "text-blue-400"
            )}>
              {profitPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-black/80 rounded-full h-4 shadow-inner border border-gray-800/50 relative overflow-hidden">
            {/* Full rainbow gradient background (always present) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 to-green-400 opacity-100" />

            {/* Dark overlay that reveals the rainbow as progress increases */}
            <div
              className="absolute inset-0 bg-black/90 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(0, 100 - Math.min(100, Math.max(0, profitPercentage)))}%`,
                right: 0,
                left: 'auto'
              }}
            />

            {/* Subtle inner glow effect */}
            <div className="absolute inset-0 rounded-full shadow-inner" />

            {/* Animated shine effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse"
              style={{ width: `${Math.min(100, Math.max(0, profitPercentage))}%` }}
            />
          </div>

          <div className="text-xs text-[#C0E6FF]">
            Current: <span className="text-white font-medium">${currentProfit.toFixed(2)}</span>
          </div>

          <div className="text-xs text-[#C0E6FF]">
            Profit Gain: <span className="text-green-400 font-medium">+${profitGain.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {isCompleted && isNomad && (
            <div className="space-y-3">
              <div className="flex items-start space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-200">
                  🎉 Cycle completed! Your bot achieved 10% profit. Pay 25 USDC to start the next cycle.
                </div>
              </div>

              {!isPaid && (
                <Button
                  onClick={handlePayment}
                  disabled={isPaymentLoading}
                  className="w-full bg-[#4DA2FF] text-white hover:bg-[#4DA2FF]/80 text-sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isPaymentLoading ? "Processing..." : "Pay 25 USDC for Next Cycle"}
                </Button>
              )}
            </div>
          )}

          {isCompleted && !isNomad && (
            <div className="space-y-3">
              <div className="flex items-start space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-200">
                  🎉 Cycle completed! Your bot achieved 10% profit. Next cycle will start automatically.
                </div>
              </div>
            </div>
          )}
          
          {isPaid && !isCompleted && (
            <div className="flex items-center space-x-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-200">Bot is active and generating profits</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Cycle explanation component
export function CycleExplanation() {
  return (
    <Card className="enhanced-card">
      <div className="enhanced-card-content p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-5 h-5 text-[#4DA2FF]" />
          <h3 className="text-lg font-semibold text-white">How Bot Cycles Work</h3>
        </div>
        
        <div className="space-y-3 text-sm text-[#C0E6FF]">
          <div>
            <h4 className="font-medium text-white mb-1">For NOMAD Users:</h4>
            <ul className="space-y-1 ml-4">
              <li>• First cycle is FREE when you follow a bot</li>
              <li>• Each cycle completes when bot achieves 10% profit</li>
              <li>• Pay 25 USDC after each completed cycle to continue</li>
              <li>• Bot continues working until profit target is reached</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-1">For PRO & ROYAL Users:</h4>
            <ul className="space-y-1 ml-4">
              <li>• Unlimited access to all bots</li>
              <li>• No cycle payments required</li>
              <li>• Automatic cycle continuation after 10% profit</li>
              <li>• View cycle progress and profit information</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg">
            <p className="text-xs">
              <strong>Payment Methods:</strong> USDC, SUI, or credit card.
              Payments are processed securely and new cycles start immediately.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
