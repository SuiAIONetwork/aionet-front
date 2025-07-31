"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Loader2,
  Lock
} from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { RoleImage } from "@/components/ui/role-image"
import { useNFTMinting, useNFTTierStatus } from "@/hooks/use-nft-minting"
import { useTierSync } from "@/hooks/use-tier-sync"

import { NFT_PRICING } from "@/lib/nft-minting-service"

interface NFTTier {
  id: 'NOMAD' | 'PRO' | 'ROYAL'
  name: string
  price: number
  currency: string
  features: string[]
  icon: React.ReactNode
  color: string
  gradient: string
  maxSupply: number
  currentSupply: number
  benefits: string[]
}

const nftTiers: NFTTier[] = [
  {
    id: 'NOMAD',
    name: 'NOMAD',
    price: 0,
    currency: 'FREE',
    features: [
      'Bybit Copy Trading (Crypto) Access',
      '$25 per 10% profit cycle',
      'Entry to the Official Discord Community',
      'Affiliate Dashboard & Control Access',
      'AIO Creators Channels Access',
      'E-Learning Crypto Basic Level'
    ],
    icon: <RoleImage role="NOMAD" size="2xl" />,
    color: '#6B7280',
    gradient: 'from-gray-500 to-gray-700',
    maxSupply: 0,
    currentSupply: 0,
    benefits: [
      'Access to crypto copy trading platform',
      'Basic community features',
      'Standard affiliate access'
    ]
  },
  {
    id: 'PRO',
    name: 'PRO NFT',
    price: NFT_PRICING.PRO.costSui,
    currency: 'SUI',
    features: [
      'Bybit Copy Trading (Crypto) Access',
      'No Cycle Payments',
      'PRO Role within the Discord Community',
      'Affiliate Dashboard & Control Access',
      'E-Learning Premium',
      'Access to rafflequiz Decentralized Application',
      'Access to DEWhale Decentralized Application',
      'Comprehensive access to AIO Creator tools',
      'Free Access to 3 Premium AIO Creators channels'
    ],
    icon: <RoleImage role="PRO" size="2xl" />,
    color: '#4DA2FF',
    gradient: 'from-[#4DA2FF] to-[#011829]',
    maxSupply: 0,
    currentSupply: 0,
    benefits: [
      'Exempt from $25 cycle payments',
      'Access to premium educational content',
      'Priority customer support',
      'Exclusive community channels',
      'Advanced creator tools access'
    ]
  },
  {
    id: 'ROYAL',
    name: 'ROYAL NFT',
    price: NFT_PRICING.ROYAL.costSui,
    currency: 'SUI',
    features: [
      'All PRO Features',
      'Bybit Copy Trading (FOREX) Access',
      'Bybit Copy Trading (STOCKS) Access',
      'Exclusive ROYAL Role in the Discord Community',
      'Priority early access to DEWhale DApp updates and features',
      'Free Access to 9 Premium AIO Creators channels',
      'Participation in Royalty Distribution: 10% from all new NFT mints'
    ],
    icon: <RoleImage role="ROYAL" size="2xl" />,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    maxSupply: 0,
    currentSupply: 0,
    benefits: [
      'All PRO tier benefits included',
      'Access to FOREX and STOCKS trading',
      'Personal trading consultation',
      'Early access to new DApps',
      'Highest tier community status'
    ]
  }
]

export function DashboardSubscriptions() {
  const { tier, setTier, isUpdatingTier } = useSubscription()
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // NFT minting hooks
  const { isMinting, mintNFT, hasNFTTier } = useNFTMinting()
  const { currentTier: nftTier, refreshTierStatus } = useNFTTierStatus()

  // Tier synchronization
  const { syncTierFromNFTs } = useTierSync()

  // Check NFT ownership on component mount
  useEffect(() => {
    refreshTierStatus()
    syncTierFromNFTs() // Also sync tier from NFTs
  }, [])

  const currentTierData = nftTiers.find(t => t.id === tier) || nftTiers[0]

  const handleMintNFT = async (targetTier: NFTTier) => {
    if (targetTier.id === 'NOMAD') return // Can't mint NOMAD

    setIsUpgrading(true)
    setSelectedTier(targetTier)

    try {
      console.log(`🎨 Minting ${targetTier.id} NFT...`)

      const result = await mintNFT(targetTier.id as 'PRO' | 'ROYAL')

      if (result.success) {
        console.log(`✅ Successfully minted ${targetTier.id} NFT`)

        // Update tier status after successful mint
        await refreshTierStatus()

        // Sync tier from NFTs (this will automatically update the subscription context)
        setTimeout(async () => {
          await syncTierFromNFTs()
        }, 2000) // Wait 2 seconds for blockchain to update

      } else {
        console.error(`❌ Failed to mint ${targetTier.id} NFT:`, result.error)
      }
    } catch (error) {
      console.error(`❌ NFT minting error for ${targetTier.id}:`, error)
    } finally {
      setIsUpgrading(false)
      setSelectedTier(null)
    }
  }



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AIONET NFT Tiers</h2>
        <p className="text-[#C0E6FF] mt-1">Mint your NFT on Sui Network to unlock exclusive features. PRO and ROYAL are unlimited NFT-based roles.</p>
      </div>

      {/* NFT Tiers */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {nftTiers.map((tierData) => {
          const isCurrentTier = tierData.id === tier
          const canUpgrade = tierData.id !== 'NOMAD' && tierData.id !== tier

          return (
            <div
              key={tierData.id}
              className={`enhanced-card transition-all duration-300 ${
                isCurrentTier
                  ? 'relative'
                  : 'hover:border-[#4DA2FF]/50'
              }`}
              style={isCurrentTier ? {
                border: '2px solid #22c55e',
                boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.1)'
              } : {}}
            >
              <div className="enhanced-card-content flex flex-col h-full">
                <div className="mb-6">
                <div className="flex items-center justify-between">
                  {tierData.icon}
                  {isCurrentTier ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : tier === 'ROYAL' && tierData.id === 'PRO' ? (
                    <Badge className="bg-gray-500 text-gray-300">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  ) : null}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{tierData.name}</h3>
                <div className="text-2xl font-bold text-[#4DA2FF]">
                  {tierData.price === 0 ? 'FREE' : `€${tierData.price}`}
                  {tierData.price > 0 && (
                    <span className="text-sm text-[#C0E6FF] font-normal ml-2">one-time</span>
                  )}
                </div>
                </div>

                <div className="flex-1 flex flex-col">
                {/* Features */}
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-medium text-[#C0E6FF]">Features:</h4>
                  <ul className="space-y-1">
                    {tierData.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-white">
                        <CheckCircle className="w-3 h-3 text-[#4DA2FF]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-auto">
                  {isCurrentTier ? (
                    <div className="flex gap-2">
                      {/* Current Tier Button */}
                      <Button
                        disabled
                        className="w-full bg-green-500 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Current Tier
                      </Button>
                    </div>
                  ) : tierData.id === 'NOMAD' ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full border-[#C0E6FF]/30 text-[#C0E6FF]"
                    >
                      Default Tier
                    </Button>
                  ) : tier === 'ROYAL' && tierData.id === 'PRO' ? (
                    // Disable PRO button if user is ROYAL (no downgrading)
                    <Button
                      disabled
                      variant="outline"
                      className="w-full border-[#C0E6FF]/30 text-[#C0E6FF]/50 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Cannot Downgrade
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleMintNFT(tierData)}
                      disabled={isMinting || isUpdatingTier}
                      className={`w-full text-white ${
                        tierData.id === 'PRO'
                          ? 'bg-[#4da2ff] hover:bg-[#3d8bff] transition-colors duration-200'
                          : `bg-gradient-to-r ${tierData.gradient} hover:opacity-90`
                      }`}
                    >
                      {(isMinting && selectedTier?.id === tierData.id) || isUpdatingTier ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Mint {tierData.name} ({tierData.price} {tierData.currency})
                        </>
                      )}
                    </Button>
                  )}
                </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Benefits Comparison */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-2 text-white mb-6">
            <h3 className="text-xl font-semibold">Tier Benefits Comparison</h3>
          </div>
          <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#C0E6FF]/20">
                  <th className="text-left py-3 text-[#C0E6FF] font-medium">Benefit</th>
                  <th className="text-center py-3 text-[#C0E6FF] font-medium">NOMAD</th>
                  <th className="text-center py-3 text-[#C0E6FF] font-medium">PRO</th>
                  <th className="text-center py-3 text-[#C0E6FF] font-medium">ROYAL</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">Crypto Copy Trading</td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">Cycle Payment Exemption</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">E-Learning</td>
                  <td className="py-3 text-center text-white">Basic Course</td>
                  <td className="py-3 text-center text-green-400">Full Access</td>
                  <td className="py-3 text-center text-green-400">Full Access</td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">RaffleQuiz (DApp)</td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">DEWhale (DApp)</td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">Premium Creator Free Channels</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center text-green-400">3</td>
                  <td className="py-3 text-center text-green-400">9</td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">FOREX & STOCKS Trading</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center"><CheckCircle className="w-4 h-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-[#C0E6FF]/10">
                  <td className="py-3 text-white">Royalty Distribution</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center text-red-400">✗</td>
                  <td className="py-3 text-center text-green-400">10%</td>
                </tr>

              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
