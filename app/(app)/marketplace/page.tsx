"use client"

import { useState } from "react"
import { TokenBalance } from "@/components/points-balance"
import { TransactionHistory } from "@/components/transaction-history"
import { MarketplaceItemCard } from "@/components/marketplace-item-card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, Gift, Shirt, Palette, Star, Filter } from "lucide-react"

// Mock marketplace data
const marketplaceItems = {
  "token-bundles": [
    {
      id: "bundle-1",
      name: "Starter Token Bundle",
      description: "Perfect for beginners - includes 100 SUI tokens and trading guide",
      image: "/images/aibot.png",
      tokenCost: 1500,
      category: "token-bundles" as const,
      rarity: "common" as const,
      inStock: true,
      featured: false
    },
    {
      id: "bundle-2",
      name: "Premium Crypto Pack",
      description: "Advanced bundle with ETH, BTC, and exclusive trading signals",
      image: "/images/aibot.png",
      tokenCost: 3500,
      category: "token-bundles" as const,
      rarity: "rare" as const,
      inStock: true,
      featured: true
    },
    {
      id: "bundle-3",
      name: "Legendary Whale Package",
      description: "Ultimate package with rare tokens and VIP trading access",
      image: "/images/aibot.png",
      tokenCost: 7500,
      category: "token-bundles" as const,
      rarity: "legendary" as const,
      inStock: true,
      featured: true
    }
  ],
  merchandise: [
    {
      id: "merch-1",
      name: "AIONET Hoodie",
      description: "Premium quality hoodie with AIONET logo",
      image: "/images/aibot.png",
      tokenCost: 2000,
      category: "merchandise" as const,
      inStock: true,
      featured: false
    },
    {
      id: "merch-2",
      name: "Crypto Trading Mug",
      description: "Perfect for your morning coffee while checking charts",
      image: "/images/aibot.png",
      tokenCost: 800,
      category: "merchandise" as const,
      inStock: true,
      featured: false
    },
    {
      id: "merch-3",
      name: "Limited Edition T-Shirt",
      description: "Exclusive design available only through pAION redemption",
      image: "/images/aibot.png",
      tokenCost: 1200,
      category: "merchandise" as const,
      rarity: "rare" as const,
      inStock: false,
      featured: false
    }
  ],
  nfts: [
    {
      id: "nft-1",
      name: "Genesis Trader NFT",
      description: "Exclusive NFT granting special trading privileges",
      image: "/images/aibot.png",
      tokenCost: 5000,
      category: "nfts" as const,
      rarity: "epic" as const,
      inStock: true,
      featured: true
    },
    {
      id: "nft-2",
      name: "Diamond Hands Collection",
      description: "Rare NFT for long-term holders and diamond hands",
      image: "/images/aibot.png",
      tokenCost: 8000,
      category: "nfts" as const,
      rarity: "legendary" as const,
      inStock: true,
      featured: true
    },
    {
      id: "nft-3",
      name: "Community Builder Badge",
      description: "Special recognition for active community members",
      image: "/images/aibot.png",
      tokenCost: 3000,
      category: "nfts" as const,
      rarity: "rare" as const,
      inStock: true,
      featured: false
    }
  ]
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState("token-bundles")
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "token-bundles":
        return <Gift className="w-4 h-4" />
      case "merchandise":
        return <Shirt className="w-4 h-4" />
      case "nfts":
        return <Palette className="w-4 h-4" />
      default:
        return <ShoppingBag className="w-4 h-4" />
    }
  }

  const getFilteredItems = (category: keyof typeof marketplaceItems) => {
    const items = marketplaceItems[category]
    return showFeaturedOnly ? items.filter(item => item.featured) : items
  }

  const getTotalItems = () => {
    return Object.values(marketplaceItems).flat().length
  }

  const getFeaturedItems = () => {
    return Object.values(marketplaceItems).flat().filter(item => item.featured).length
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-[#C0E6FF] mt-1">
            Redeem your pAION tokens for exclusive items and rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#4DA2FF] text-[#4DA2FF]">
            {getTotalItems()} Items Available
          </Badge>
          <Badge variant="outline" className="border-yellow-400 text-yellow-400">
            <Star className="w-3 h-3 mr-1" />
            {getFeaturedItems()} Featured
          </Badge>

        </div>
      </div>

      {/* pAION Balance and Marketplace Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <TokenBalance />
          <TransactionHistory />
        </div>

        {/* Marketplace Content */}
        <div className="lg:col-span-2">
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              {/* Filter Controls */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Browse Items</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className={`border-[#4DA2FF] ${
                    showFeaturedOnly
                      ? "bg-[#4DA2FF] text-white"
                      : "text-[#4DA2FF] hover:bg-[#4DA2FF]/10"
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFeaturedOnly ? "Show All" : "Featured Only"}
                </Button>
              </div>

              {/* Category Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-[#1a2f51]">
                  <TabsTrigger
                    value="token-bundles"
                    className="flex items-center gap-2 data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white"
                  >
                    {getTabIcon("token-bundles")}
                    Token Bundles
                  </TabsTrigger>
                  <TabsTrigger
                    value="merchandise"
                    className="flex items-center gap-2 data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white"
                  >
                    {getTabIcon("merchandise")}
                    Merchandise
                  </TabsTrigger>
                  <TabsTrigger
                    value="nfts"
                    className="flex items-center gap-2 data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white"
                  >
                    {getTabIcon("nfts")}
                    NFTs
                  </TabsTrigger>
                </TabsList>

                {/* Tab Content */}
                {Object.entries(marketplaceItems).map(([category, items]) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                      {getFilteredItems(category as keyof typeof marketplaceItems).map((item) => (
                        <MarketplaceItemCard key={item.id} item={item} />
                      ))}
                    </div>

                    {getFilteredItems(category as keyof typeof marketplaceItems).length === 0 && (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 text-[#C0E6FF] mx-auto mb-4" />
                        <h3 className="text-white text-lg font-semibold mb-2">
                          No {showFeaturedOnly ? "featured " : ""}items found
                        </h3>
                        <p className="text-[#C0E6FF]">
                          {showFeaturedOnly
                            ? "Try removing the featured filter to see all items."
                            : "Check back later for new items in this category."
                          }
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
