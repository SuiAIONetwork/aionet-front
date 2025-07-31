"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RoleImage } from "@/components/ui/role-image"
import {
  Crown,
  Star,
  Wallet,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Coins
} from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"

interface NFTTier {
  id: 'PRO' | 'ROYAL'
  name: string
  price: string
  priceEur: number
  description: string
  features: string[]
  icon: React.ReactNode
  color: string
  gradient: string
  totalSupply: number
  minted: number
  benefits: string[]
}

const nftTiers: NFTTier[] = [
  {
    id: 'PRO',
    name: 'PRO NFT',
    price: '400 USDC',
    priceEur: 400,
    description: 'Access to crypto trading bots and premium features',
    features: [
      'Crypto Trading Bots Access',
      'No Cycle Payments',
      'Discord PRO Role',
      'AIO Creators Access',
      'Affiliate Program',
      'MetaGo Academy Premium'
    ],
    icon: <RoleImage role="PRO" size="lg" />,
    color: '#4DA2FF',
    gradient: 'from-[#4DA2FF] to-[#011829]',
    totalSupply: 1100,
    minted: 283,
    benefits: [
      'Eliminate $25 cycle payments',
      'Exclusive Discord access',
      'Premium trading strategies'
    ]
  },
  {
    id: 'ROYAL',
    name: 'ROYAL NFT',
    price: '1500 USDC',
    priceEur: 1500,
    description: 'VIP access to all features including forex and stock bots',
    features: [
      'All PRO Features',
      'Stock Trading Bots (VIP)',
      'Forex Trading Bots (VIP)',
      'Discord ROYAL Role',
      'Royalty Distribution (25%)',
      'DEWhale Early Access',
      'NodeMe Pool Priority'
    ],
    icon: <RoleImage role="ROYAL" size="lg" />,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    totalSupply: 500,
    minted: 120,
    benefits: [
      'All trading bot access',
      '25% royalty from new PRO mints',
      'VIP features and priority support'
    ]
  }
]

export function NFTMintingInterface() {
  const { tier, setTier } = useSubscription()
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)

  const handleConnectWallet = () => {
    setWalletConnected(true)
    // In a real implementation, this would connect to Sui wallet
  }

  const handleMint = async (nftTier: NFTTier) => {
    if (!walletConnected) {
      handleConnectWallet()
      return
    }

    setIsMinting(true)
    setSelectedTier(nftTier)

    // Simulate minting process
    setTimeout(() => {
      setTier(nftTier.id)
      setIsMinting(false)
      setSelectedTier(null)
    }, 3000)
  }

  const getMintProgress = (tier: NFTTier) => {
    return (tier.minted / tier.totalSupply) * 100
  }

  const canUpgrade = (tierToMint: NFTTier) => {
    if (tierToMint.id === 'PRO') return tier === 'NOMAD'
    if (tierToMint.id === 'ROYAL') return tier === 'NOMAD' || tier === 'PRO'
    return false
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">AIONET NFT Collection</h2>
        <p className="text-[#C0E6FF] max-w-2xl mx-auto">
          Mint your AIONET NFT to unlock exclusive features, trading bots, and community access.
          Built on Sui Network for fast, low-cost transactions.
        </p>

        {!walletConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-yellow-400">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Connect your Sui wallet to mint NFTs</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Tier Status */}
      {tier !== 'NOMAD' && (
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${tier === 'PRO' ? 'bg-[#4DA2FF]/20' : 'bg-yellow-400/20'}`}>
                  <RoleImage role={tier as "PRO" | "ROYAL"} size="md" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">You own a {tier} NFT</h3>
                  <p className="text-[#C0E6FF]">Enjoy all the exclusive benefits of your tier</p>
                </div>
              </div>
              <Badge className={tier === 'PRO' ? 'bg-[#4DA2FF] text-white' : 'bg-yellow-400 text-black'}>
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NFT Tiers */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {nftTiers.map((nftTier) => {
          const progress = getMintProgress(nftTier)
          const canMint = canUpgrade(nftTier)
          const isOwned = tier === nftTier.id

          return (
            <Card key={nftTier.id} className="dashboard-card relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${nftTier.gradient}`} />

              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${nftTier.color}20` }}>
                      <div style={{ color: nftTier.color }}>
                        {nftTier.icon}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-white">{nftTier.name}</CardTitle>
                      <p className="text-[#C0E6FF] text-sm">{nftTier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{nftTier.price}</div>
                    <div className="text-sm text-[#C0E6FF]">One-time payment</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Minting Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#C0E6FF]">Minted</span>
                    <span className="text-white">{nftTier.minted} / {nftTier.totalSupply}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-[#C0E6FF]">
                    {(100 - progress).toFixed(1)}% remaining
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Features Included:</h4>
                  <div className="grid gap-2">
                    {nftTier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[#C0E6FF] text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Key Benefits:</h4>
                  <div className="space-y-2">
                    {nftTier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-[#C0E6FF] text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {isOwned ? (
                    <Button disabled className="w-full bg-green-500/20 text-green-400 border border-green-500/30">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Owned
                    </Button>
                  ) : canMint ? (
                    <Button
                      onClick={() => handleMint(nftTier)}
                      disabled={isMinting}
                      className={`w-full bg-gradient-to-r ${nftTier.gradient} text-white hover:opacity-90`}
                    >
                      {isMinting && selectedTier?.id === nftTier.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          {walletConnected ? `Mint ${nftTier.name}` : 'Connect Wallet to Mint'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      {tier === nftTier.id ? 'Already Owned' : 'Upgrade Required'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sui Network Info */}
      <Card className="dashboard-card">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-[#4DA2FF]" />
              <h3 className="text-lg font-semibold text-white">Built on Sui Network</h3>
            </div>
            <p className="text-[#C0E6FF] max-w-2xl mx-auto">
              MetadudesX NFTs are minted on Sui Network, providing fast transactions, low fees, and secure ownership.
              Your NFT automatically grants access to all platform features.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-[#C0E6FF]">Fast Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-green-400" />
                <span className="text-[#C0E6FF]">Low Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-[#C0E6FF]">Secure</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
