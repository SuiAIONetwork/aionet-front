"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTokens } from "@/contexts/points-context"
import { ArrowUpDown, ChevronDown, Coins, Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Token {
  symbol: string
  name: string
  icon: string
  balance: number
  decimals: number
  color: string
}

interface SwapInterfaceProps {
  className?: string
  onSwapComplete?: (fromToken: string, toAmount: number) => void
}

const supportedTokens: Token[] = [
  {
    symbol: "SUI",
    name: "Sui",
    icon: "🔷",
    balance: 1250.75,
    decimals: 9,
    color: "#4DA2FF"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "💵",
    balance: 2500.00,
    decimals: 6,
    color: "#2775CA"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "💰",
    balance: 1800.50,
    decimals: 6,
    color: "#26A17B"
  }
]

// Exchange rates to pAION tokens (1 token = X pAION)
const exchangeRates = {
  SUI: 100,    // 1 SUI = 100 pAION
  USDC: 50,    // 1 USDC = 50 pAION
  USDT: 50     // 1 USDT = 50 pAION
}

export function SwapInterface({ className, onSwapComplete }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState<Token>(supportedTokens[0])
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { addTokens } = useTokens()

  // Calculate pAION tokens when amount changes
  useEffect(() => {
    if (fromAmount && !isNaN(Number(fromAmount))) {
      const tokens = Number(fromAmount) * exchangeRates[fromToken.symbol as keyof typeof exchangeRates]
      setToAmount(tokens.toString())
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken])

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value)
    }
  }

  const handleMaxClick = () => {
    setFromAmount(fromToken.balance.toString())
  }

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || Number(fromAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (Number(fromAmount) > fromToken.balance) {
      toast.error("Insufficient balance")
      return
    }

    setIsSwapping(true)

    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Add pAION tokens to user's balance
      const success = await addTokens(
        Number(toAmount),
        `Swapped ${fromAmount} ${fromToken.symbol} for pAION`,
        'swap',
        `${fromToken.symbol}-${Date.now()}`
      )

      if (success) {
        // Update token balance (simulate spending)
        fromToken.balance -= Number(fromAmount)

        // Call completion callback
        onSwapComplete?.(fromToken.symbol, Number(toAmount))

        // Reset form
        setFromAmount("")
        setToAmount("")

        toast.success(`Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} pAION!`)
      } else {
        throw new Error('Failed to add tokens to balance')
      }
    } catch (error) {
      toast.error("Swap failed. Please try again.")
    } finally {
      setIsSwapping(false)
    }
  }

  const connectWallet = () => {
    // Simulate wallet connection
    setIsConnected(true)
    toast.success("Wallet connected successfully!")
  }

  const canSwap = fromAmount && toAmount && Number(fromAmount) > 0 && Number(fromAmount) <= fromToken.balance && isConnected

  return (
    <div className={`w-full ${className?.includes('max-w-none') ? '' : 'max-w-md mx-auto'} ${className}`}>
      <div className={className?.includes('max-w-none') ? 'space-y-4' : 'enhanced-card'}>
        <div className={className?.includes('max-w-none') ? 'space-y-4' : 'enhanced-card-content space-y-4'}>
          {/* Header - Only show when not inline */}
          {!className?.includes('max-w-none') && (
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">Swap to pAION</h3>
              <Badge variant="outline" className="border-[#4DA2FF] text-[#4DA2FF]">
                <Coins className="w-3 h-3 mr-1" />
                Earn pAION
              </Badge>
            </div>
          )}

          {/* From Token Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[#C0E6FF] text-sm font-medium">Sell</label>
              <span className="text-[#C0E6FF] text-xs">
                Balance: {fromToken.balance.toFixed(2)} {fromToken.symbol}
              </span>
            </div>

            <div className="bg-[#030F1C] rounded-xl p-4 border border-[#4DA2FF]/20">
              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  placeholder="0"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-transparent border-none text-2xl font-semibold text-white placeholder:text-gray-500 p-0 h-auto focus-visible:ring-0"
                />

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMaxClick}
                    className="text-[#4DA2FF] border-[#4DA2FF] hover:bg-[#4DA2FF]/10 h-6 px-2 text-xs"
                  >
                    MAX
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-[#4DA2FF]/10 border-[#4DA2FF] text-white hover:bg-[#4DA2FF]/20 gap-2"
                      >
                        <span className="text-lg">{fromToken.icon}</span>
                        <span className="font-semibold">{fromToken.symbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#030F1C] border-[#4DA2FF]/20">
                      {supportedTokens.map((token) => (
                        <DropdownMenuItem
                          key={token.symbol}
                          onClick={() => setFromToken(token)}
                          className="text-white hover:bg-[#4DA2FF]/10 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{token.icon}</span>
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-[#C0E6FF]">{token.name}</div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {fromAmount && (
                <div className="text-[#C0E6FF] text-sm mt-2">
                  ≈ ${(Number(fromAmount) * (fromToken.symbol === 'SUI' ? 2.1 : 1)).toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="bg-[#030F1C] border border-[#4DA2FF]/20 rounded-full p-2">
              <ArrowUpDown className="w-4 h-4 text-[#4DA2FF]" />
            </div>
          </div>

          {/* To pAION Section */}
          <div className="space-y-2">
            <label className="text-[#C0E6FF] text-sm font-medium">Buy</label>

            <div className="bg-[#030F1C] rounded-xl p-4 border border-[#4DA2FF]/20">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-semibold text-white">
                  {toAmount || "0"}
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-r from-[#4DA2FF] to-purple-500 text-white px-3 py-2 rounded-lg">
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">pAION</span>
                </div>
              </div>

              {toAmount && (
                <div className="text-[#C0E6FF] text-sm mt-2">
                  Rate: 1 {fromToken.symbol} = {exchangeRates[fromToken.symbol as keyof typeof exchangeRates]} pAION
                </div>
              )}
            </div>
          </div>

          {/* Wallet Connection / Swap Button */}
          {!isConnected ? (
            <Button
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-[#4DA2FF] to-purple-500 hover:from-[#4DA2FF]/80 hover:to-purple-500/80 text-white font-semibold py-3 h-12"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <Button
              onClick={handleSwap}
              disabled={!canSwap || isSwapping}
              className={`w-full font-semibold py-3 h-12 ${
                canSwap
                  ? "bg-gradient-to-r from-[#4DA2FF] to-purple-500 hover:from-[#4DA2FF]/80 hover:to-purple-500/80 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSwapping ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Swapping...
                </>
              ) : !fromAmount ? (
                "Enter amount"
              ) : Number(fromAmount) > fromToken.balance ? (
                "Insufficient balance"
              ) : (
                `Swap for ${toAmount} pAION`
              )}
            </Button>
          )}

          {/* Connection Status */}
          {isConnected && (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Wallet Connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
