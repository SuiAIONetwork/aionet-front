"use client"

import { useState } from "react"
import { useTokens } from "@/contexts/points-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, ShoppingCart, Check, Loader2 } from "lucide-react"
import Image from "next/image"

interface MarketplaceItem {
  id: string
  name: string
  description: string
  image: string
  tokenCost: number // Changed from pointsCost to tokenCost
  category: "token-bundles" | "merchandise" | "nfts"
  rarity?: "common" | "rare" | "epic" | "legendary"
  inStock: boolean
  featured?: boolean
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem
}

export function MarketplaceItemCard({ item }: MarketplaceItemCardProps) {
  const { balance, spendTokens } = useTokens()
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isRedeemed, setIsRedeemed] = useState(false)

  const canAfford = balance >= item.tokenCost
  const isAvailable = item.inStock && !isRedeemed

  const handleRedeem = async () => {
    if (!canAfford || !isAvailable || isRedeeming) return

    setIsRedeeming(true)
    try {
      const success = await spendTokens(item.tokenCost, item.name, 'marketplace', item.id)
      if (success) {
        setIsRedeemed(true)
      }
    } catch (error) {
      console.error("Redemption failed:", error)
    } finally {
      setIsRedeeming(false)
    }
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400 text-gray-400"
      case "rare":
        return "border-blue-400 text-blue-400"
      case "epic":
        return "border-purple-400 text-purple-400"
      case "legendary":
        return "border-yellow-400 text-yellow-400"
      default:
        return "border-[#4DA2FF] text-[#4DA2FF]"
    }
  }

  const getCategoryIcon = () => {
    switch (item.category) {
      case "token-bundles":
        return <Coins className="w-4 h-4" />
      case "merchandise":
        return <ShoppingCart className="w-4 h-4" />
      case "nfts":
        return <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded" />
      default:
        return <Coins className="w-4 h-4" />
    }
  }

  return (
    <div className={`enhanced-card group hover:border-[#4DA2FF]/50 transition-all duration-300 ${
      item.featured ? 'ring-2 ring-[#4DA2FF] ring-opacity-50' : ''
    } ${!isAvailable ? 'opacity-75' : ''}`}>
      <div className="enhanced-card-content">
        {/* Image Section */}
        <div className="relative mb-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-[#1a2f51]">
            <Image
              src={item.image}
              alt={item.name}
              width={300}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            {item.featured && (
              <Badge className="bg-gradient-to-r from-[#4DA2FF] to-purple-500 text-white text-xs">
                Featured
              </Badge>
            )}
            {item.rarity && (
              <Badge variant="outline" className={`text-xs ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </Badge>
            )}
          </div>

          {/* Category Icon */}
          <div className="absolute top-2 right-2">
            <div className="p-2 bg-[#1a2f51]/80 backdrop-blur-sm rounded-full">
              {getCategoryIcon()}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-white text-lg font-semibold">{item.name}</h3>
            <p className="text-[#C0E6FF] text-sm mt-1">{item.description}</p>
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#4DA2FF]" />
              <span className="text-white font-bold text-lg">
                {item.tokenCost.toLocaleString()}
              </span>
              <span className="text-[#C0E6FF] text-sm">pAION</span>
            </div>
            <Badge
              variant={item.inStock ? "default" : "destructive"}
              className="text-xs"
            >
              {item.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleRedeem}
            disabled={!canAfford || !isAvailable || isRedeeming}
            className={`w-full ${
              isRedeemed
                ? "bg-green-600 hover:bg-green-700"
                : canAfford && isAvailable
                ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80"
                : "bg-gray-600 hover:bg-gray-600"
            }`}
          >
            {isRedeeming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : isRedeemed ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Redeemed
              </>
            ) : !canAfford ? (
              "Insufficient pAION"
            ) : !item.inStock ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Redeem
              </>
            )}
          </Button>

          {/* Insufficient pAION Warning */}
          {!canAfford && isAvailable && (
            <p className="text-red-400 text-xs text-center">
              Need {(item.tokenCost - balance).toLocaleString()} more pAION
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
