"use client"

import React, { useState, useEffect } from "react"
import { Coins, Activity } from "lucide-react"
import { AnalyticsPanel } from "./analytics-panel"

export function MintingDistributionSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Mock data - in real implementation, this would come from API/blockchain
  const mockData = {
    totalMinted: 125000,
    totalCollected: 125000,
    totalDistributed: 118750,

    distributionData: {
      affiliate: {
        percentage: "up to 50%",
        amount: 62500,
        description: "Affiliate commissions and referral rewards distributed to network partners",
        walletAddress: "0x2345678901bcdefghijklmnopqrstuvwxyz123456789abcdef"
      },
      royalties: {
        percentage: "10%",
        amount: 12500,
        description: "Creator royalties and rewards for content creators and contributors",
        walletAddress: "0x3456789012cdefghijklmnopqrstuvwxyz123456789abcdef"
      },
      pLevel10: {
        percentage: "5%",
        amount: 6250,
        description: "Community rewards and incentives for P.Level 10 achievement holders",
        walletAddress: "0x4567890123defghijklmnopqrstuvwxyz123456789abcdef"
      },
      treasury: {
        percentage: "25%",
        amount: 31250,
        description: "DAO treasury funds for future development and community initiatives",
        walletAddress: "0x5678901234efghijklmnopqrstuvwxyz123456789abcdef"
      },
      team: {
        percentage: "10%",
        amount: 12500,
        description: "Team wallet for development, operations, and project maintenance",
        walletAddress: "0x6789012345fghijklmnopqrstuvwxyz123456789abcdef"
      }
    },
    recentDistributions: [
      {
        date: "2024-01-15 14:30",
        amount: 15000,
        txHash: "0x1234567890abcdef",
        type: "Affiliate Distribution"
      },
      {
        date: "2024-01-15 14:30", 
        amount: 3000,
        txHash: "0x2345678901bcdefg",
        type: "Royalties Distribution"
      },
      {
        date: "2024-01-15 14:30",
        amount: 1500,
        txHash: "0x3456789012cdefgh",
        type: "P.Level 10 Distribution"
      },
      {
        date: "2024-01-15 14:30",
        amount: 7500,
        txHash: "0x456789013defghi",
        type: "Treasury Distribution"
      },
      {
        date: "2024-01-15 14:30",
        amount: 3000,
        txHash: "0x56789014efghijk",
        type: "Team Distribution"
      }
    ]
  }

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4DA2FF]/20 rounded animate-pulse" />
            <div className="h-6 w-48 bg-[#4DA2FF]/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6">
          <div className="h-96 bg-[#0A1628]/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-[#0A1628]/50 rounded-lg animate-pulse" />
            <div className="h-32 bg-[#0A1628]/50 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#4DA2FF]" />
            NFT Minting Revenue Distribution
          </h2>
          <p className="text-[#C0E6FF] text-sm mt-1">
            Transparent allocation of SUI tokens collected from NFT mints across the ecosystem
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#C0E6FF] text-sm">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <span>Live Tracking</span>
        </div>
      </div>

      {/* Analytics Panel */}
      <div>
        <AnalyticsPanel
          distributionData={mockData.distributionData}
          totalDistributed={mockData.totalDistributed}
          totalCollected={mockData.totalCollected}
          recentDistributions={mockData.recentDistributions}
        />
      </div>


    </div>
  )
}
