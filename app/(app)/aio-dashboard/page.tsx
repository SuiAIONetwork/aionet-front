"use client"

import { useState } from "react"
import { useSubscription } from "@/contexts/subscription-context"
import { useCommunityAnalytics } from "@/hooks/use-community-analytics"

import { RoleImage } from "@/components/ui/role-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MintingDistributionSection } from "@/components/minting-distribution/minting-distribution-section"
import { Users, Rocket, RefreshCw, Wallet, TrendingUp, Shield, Droplets, PieChart, ExternalLink, Vote, X } from "lucide-react"
import Image from "next/image"






export default function AIODashboard() {
  const { tier } = useSubscription()
  const { analytics, isLoading, error, refreshAnalytics } = useCommunityAnalytics()
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  // DAO operational status - set to true when DAO is fully operational
  const isDaoOperational = false

  // Treasury detailed data
  const treasuryDetails = {
    investable: {
      title: "Investable Assets",
      total: "$125,000",
      description: "Funds allocated for strategic investments and growth opportunities",
      breakdown: [
        { label: "Growth Fund Pool", amount: "$85,000", description: "For high-potential DeFi and Web3 investments" },
        { label: "Strategic Reserves", amount: "$40,000", description: "Reserved for major partnership opportunities" }
      ],
      transactions: [
        { date: "2024-01-15", description: "Allocated to SUI ecosystem projects", amount: "+$25,000" },
        { date: "2024-01-10", description: "Investment in DEX protocol", amount: "-$15,000" },
        { date: "2024-01-05", description: "Quarterly allocation from treasury", amount: "+$50,000" }
      ],
      performance: "+12.5% This Quarter"
    },
    reserve: {
      title: "Reserve Assets",
      total: "$200,000",
      description: "Emergency funds and operational reserves for platform stability",
      breakdown: [
        { label: "SUI Holdings", amount: "$120,000", description: "Native token reserves for operations" },
        { label: "USDC Stablecoins", amount: "$80,000", description: "Stable reserves for predictable expenses" }
      ],
      transactions: [
        { date: "2024-01-20", description: "Monthly operational expenses", amount: "-$8,000" },
        { date: "2024-01-15", description: "SUI token purchase", amount: "+$30,000" },
        { date: "2024-01-01", description: "Emergency fund replenishment", amount: "+$25,000" }
      ],
      performance: "6 Months Runway"
    },
    web3: {
      title: "Web3 Investments",
      total: "$75,000",
      description: "Active investments in DeFi protocols and NFT projects",
      breakdown: [
        { label: "DeFi Protocol Stakes", amount: "$45,000", description: "Staking positions in various protocols" },
        { label: "NFT Project Investments", amount: "$30,000", description: "Strategic NFT collection holdings" }
      ],
      transactions: [
        { date: "2024-01-18", description: "Staking rewards claimed", amount: "+$2,500" },
        { date: "2024-01-12", description: "New DeFi position opened", amount: "-$10,000" },
        { date: "2024-01-08", description: "NFT collection purchase", amount: "-$15,000" }
      ],
      performance: "5 Active Positions"
    },
    liquidity: {
      title: "Liquidity Pool Assets",
      total: "$50,000",
      description: "Liquidity provided to various DEX pools for yield generation",
      breakdown: [
        { label: "SUI/USDC Pool", amount: "$30,000", description: "Primary liquidity position" },
        { label: "Other Trading Pairs", amount: "$20,000", description: "Diversified LP positions" }
      ],
      transactions: [
        { date: "2024-01-22", description: "LP rewards harvested", amount: "+$1,200" },
        { date: "2024-01-16", description: "Added liquidity to SUI/USDC", amount: "+$10,000" },
        { date: "2024-01-09", description: "Removed liquidity from old pool", amount: "-$5,000" }
      ],
      performance: "8.5% APY Average"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AIO Dashboard</h1>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="enhanced-card">
              <div className="enhanced-card-content">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[#4DA2FF] animate-spin" />
                  <span className="ml-2 text-[#C0E6FF]">Loading...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !analytics) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AIO Dashboard</h1>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content text-center py-8">
            <p className="text-red-400 mb-4">Failed to load community analytics</p>
            <button
              onClick={refreshAnalytics}
              className="bg-[#4DA2FF] hover:bg-[#3d8ae6] text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AIO Dashboard</h1>
          <p className="text-[#C0E6FF] text-sm mt-1">
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </p>
        </div>

      {/* AIONET Community Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Total AIONET Users */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total AIONET Users</p>
                <p className="text-2xl font-bold text-white">{analytics.totalHolders}</p>
              </div>
              <Image
                src="/images/logo-icon.png"
                alt="AIONET"
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
        </div>

        {/* NOMAD Users */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">NOMAD Users</p>
                <p className="text-2xl font-bold text-white">{analytics.nomadUsers}</p>
              </div>
              <RoleImage role="NOMAD" size="2xl" />
            </div>
          </div>
        </div>

        {/* PRO NFT Holders */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">PRO NFT Holders</p>
                <p className="text-2xl font-bold text-white">{analytics.proHolders}</p>
              </div>
              <RoleImage role="PRO" size="2xl" />
            </div>
          </div>
        </div>

        {/* ROYAL NFT Holders */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">ROYAL NFT Holders</p>
                <p className="text-2xl font-bold text-white">{analytics.royalHolders}</p>
              </div>
              <RoleImage role="ROYAL" size="2xl" />
            </div>
          </div>
        </div>
      </div>





      {/* NFT Minting Distribution Section */}
      <MintingDistributionSection />

      {/* Progress Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">

        {/* DEWhale Progress */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Rocket className="w-5 h-5 text-[#4DA2FF]" />
              <h3 className="font-semibold">DEWhale Launchpad</h3>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {analytics.proHolders + analytics.royalHolders} / 1000
                </div>
                <div className="text-sm text-[#C0E6FF]">PRO/ROYAL Holders for DEWhale Launch</div>
                <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                  <div
                    className="bg-gradient-to-r from-[#4DA2FF] to-[#007ACC] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((analytics.proHolders + analytics.royalHolders) / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg p-3">
                <div className="text-[#C0E6FF] text-sm">
                  DEWhale will launch when we reach 1000 PRO/ROYAL holders, enabling $100 KeyShares for early-stage investments.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AIO Connect Progress */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Users className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold">AIO Connect Launch</h3>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {analytics.proHolders + analytics.royalHolders} / 1500
                </div>
                <div className="text-sm text-[#C0E6FF]">PRO/ROYAL Holders for AIO Connect Launch</div>
                <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                  <div
                    className="bg-gradient-to-r from-[#10B981] to-[#059669] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((analytics.proHolders + analytics.royalHolders) / 1500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-3">
                <div className="text-[#C0E6FF] text-sm">
                  AIO Connect (Creators & Forum) will launch when we reach 1500 PRO/ROYAL holders, enabling community interaction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury & DAO Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-[#4DA2FF]" />
              Treasury & DAO Overview
              {!isDaoOperational && (
                <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/30">
                  Coming Soon
                </span>
              )}
            </h2>
            <p className="text-[#C0E6FF] text-sm mt-1">
              {isDaoOperational
                ? "Transparent allocation of community funds according to DAO proposals"
                : "Treasury transparency will be available once DAO governance is fully operational"
              }
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#C0E6FF] text-sm">
            <Vote className="w-4 h-4" />
            <span>{isDaoOperational ? "Governed by Community" : "DAO Setup in Progress"}</span>
          </div>
        </div>

        {/* Treasury Assets Grid */}
        <div className="relative">
          {!isDaoOperational && (
            <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-6">
                <div className="bg-[#030F1C]/95 border border-[#4DA2FF]/30 rounded-lg p-6 backdrop-blur-sm shadow-2xl">
                  <Vote className="w-8 h-8 text-[#4DA2FF] mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2 text-lg">DAO Setup in Progress</h3>
                  <p className="text-[#C0E6FF] text-sm max-w-sm">
                    Treasury details will be available once DAO governance is fully operational
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${!isDaoOperational ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Investable Assets */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  <h3 className="font-semibold text-white">Investable Assets</h3>
                </div>
                {isDaoOperational ? (
                  <Dialog open={openDialog === 'investable'} onOpenChange={(open) => setOpenDialog(open ? 'investable' : null)}>
                    <DialogTrigger asChild>
                      <ExternalLink className="w-4 h-4 text-[#C0E6FF] cursor-pointer hover:text-white" />
                    </DialogTrigger>
                    <DialogContent className="bg-[#030F1C] border-[#1a2f51] text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="w-5 h-5 text-[#10B981]" />
                        {treasuryDetails.investable.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">{treasuryDetails.investable.total}</div>
                        <p className="text-[#C0E6FF]">{treasuryDetails.investable.description}</p>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Asset Breakdown</h4>
                        <div className="space-y-3">
                          {treasuryDetails.investable.breakdown.map((item, index) => (
                            <div key={index} className="bg-[#1a2f51]/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-white">{item.label}</span>
                                <span className="text-[#10B981] font-bold">{item.amount}</span>
                              </div>
                              <p className="text-sm text-[#C0E6FF]">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Recent Transactions</h4>
                        <div className="space-y-2">
                          {treasuryDetails.investable.transactions.map((tx, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#1a2f51]/30">
                              <div>
                                <div className="text-sm text-white">{tx.description}</div>
                                <div className="text-xs text-[#C0E6FF]">{tx.date}</div>
                              </div>
                              <div className={`font-medium ${tx.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#FF6B35]'}`}>
                                {tx.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-3 text-center">
                        <div className="text-[#10B981] font-medium">{treasuryDetails.investable.performance}</div>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                ) : (
                  <ExternalLink className="w-4 h-4 text-[#C0E6FF]/50 cursor-not-allowed" />
                )}
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">$125,000</div>
                  <div className="text-xs text-[#C0E6FF]">Available for Investments</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Growth Funds:</span>
                    <span className="text-white">$85,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Strategic Reserves:</span>
                    <span className="text-white">$40,000</span>
                  </div>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-2">
                  <div className="text-[#10B981] text-xs font-medium">+12.5% This Quarter</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reserve Assets */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#4DA2FF]" />
                  <h3 className="font-semibold text-white">Reserve Assets</h3>
                </div>
                {isDaoOperational ? (
                  <Dialog open={openDialog === 'reserve'} onOpenChange={(open) => setOpenDialog(open ? 'reserve' : null)}>
                    <DialogTrigger asChild>
                      <ExternalLink className="w-4 h-4 text-[#C0E6FF] cursor-pointer hover:text-white" />
                    </DialogTrigger>
                    <DialogContent className="bg-[#030F1C] border-[#1a2f51] text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Shield className="w-5 h-5 text-[#4DA2FF]" />
                        {treasuryDetails.reserve.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">{treasuryDetails.reserve.total}</div>
                        <p className="text-[#C0E6FF]">{treasuryDetails.reserve.description}</p>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Asset Breakdown</h4>
                        <div className="space-y-3">
                          {treasuryDetails.reserve.breakdown.map((item, index) => (
                            <div key={index} className="bg-[#1a2f51]/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-white">{item.label}</span>
                                <span className="text-[#4DA2FF] font-bold">{item.amount}</span>
                              </div>
                              <p className="text-sm text-[#C0E6FF]">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Recent Transactions</h4>
                        <div className="space-y-2">
                          {treasuryDetails.reserve.transactions.map((tx, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#1a2f51]/30">
                              <div>
                                <div className="text-sm text-white">{tx.description}</div>
                                <div className="text-xs text-[#C0E6FF]">{tx.date}</div>
                              </div>
                              <div className={`font-medium ${tx.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#FF6B35]'}`}>
                                {tx.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg p-3 text-center">
                        <div className="text-[#4DA2FF] font-medium">{treasuryDetails.reserve.performance}</div>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                ) : (
                  <ExternalLink className="w-4 h-4 text-[#C0E6FF]/50 cursor-not-allowed" />
                )}
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">$200,000</div>
                  <div className="text-xs text-[#C0E6FF]">Emergency & Operations</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">SUI Holdings:</span>
                    <span className="text-white">$120,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Stablecoins:</span>
                    <span className="text-white">$80,000</span>
                  </div>
                </div>
                <div className="bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg p-2">
                  <div className="text-[#4DA2FF] text-xs font-medium">6 Months Runway</div>
                </div>
              </div>
            </div>
          </div>

          {/* Web3 Investments */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="font-semibold text-white">Web3 Investments</h3>
                </div>
                {isDaoOperational ? (
                  <Dialog open={openDialog === 'web3'} onOpenChange={(open) => setOpenDialog(open ? 'web3' : null)}>
                    <DialogTrigger asChild>
                      <ExternalLink className="w-4 h-4 text-[#C0E6FF] cursor-pointer hover:text-white" />
                    </DialogTrigger>
                    <DialogContent className="bg-[#030F1C] border-[#1a2f51] text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <PieChart className="w-5 h-5 text-[#8B5CF6]" />
                        {treasuryDetails.web3.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">{treasuryDetails.web3.total}</div>
                        <p className="text-[#C0E6FF]">{treasuryDetails.web3.description}</p>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Asset Breakdown</h4>
                        <div className="space-y-3">
                          {treasuryDetails.web3.breakdown.map((item, index) => (
                            <div key={index} className="bg-[#1a2f51]/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-white">{item.label}</span>
                                <span className="text-[#8B5CF6] font-bold">{item.amount}</span>
                              </div>
                              <p className="text-sm text-[#C0E6FF]">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Recent Transactions</h4>
                        <div className="space-y-2">
                          {treasuryDetails.web3.transactions.map((tx, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#1a2f51]/30">
                              <div>
                                <div className="text-sm text-white">{tx.description}</div>
                                <div className="text-xs text-[#C0E6FF]">{tx.date}</div>
                              </div>
                              <div className={`font-medium ${tx.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#FF6B35]'}`}>
                                {tx.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg p-3 text-center">
                        <div className="text-[#8B5CF6] font-medium">{treasuryDetails.web3.performance}</div>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                ) : (
                  <ExternalLink className="w-4 h-4 text-[#C0E6FF]/50 cursor-not-allowed" />
                )}
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">$75,000</div>
                  <div className="text-xs text-[#C0E6FF]">Portfolio Value</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">DeFi Protocols:</span>
                    <span className="text-white">$45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">NFT Projects:</span>
                    <span className="text-white">$30,000</span>
                  </div>
                </div>
                <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg p-2">
                  <div className="text-[#8B5CF6] text-xs font-medium">5 Active Positions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidity Pool Assets */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="font-semibold text-white">Liquidity Pools</h3>
                </div>
                {isDaoOperational ? (
                  <Dialog open={openDialog === 'liquidity'} onOpenChange={(open) => setOpenDialog(open ? 'liquidity' : null)}>
                    <DialogTrigger asChild>
                      <ExternalLink className="w-4 h-4 text-[#C0E6FF] cursor-pointer hover:text-white" />
                    </DialogTrigger>
                    <DialogContent className="bg-[#030F1C] border-[#1a2f51] text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Droplets className="w-5 h-5 text-[#FF6B35]" />
                        {treasuryDetails.liquidity.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">{treasuryDetails.liquidity.total}</div>
                        <p className="text-[#C0E6FF]">{treasuryDetails.liquidity.description}</p>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Asset Breakdown</h4>
                        <div className="space-y-3">
                          {treasuryDetails.liquidity.breakdown.map((item, index) => (
                            <div key={index} className="bg-[#1a2f51]/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-white">{item.label}</span>
                                <span className="text-[#FF6B35] font-bold">{item.amount}</span>
                              </div>
                              <p className="text-sm text-[#C0E6FF]">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Recent Transactions</h4>
                        <div className="space-y-2">
                          {treasuryDetails.liquidity.transactions.map((tx, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-[#1a2f51]/30">
                              <div>
                                <div className="text-sm text-white">{tx.description}</div>
                                <div className="text-xs text-[#C0E6FF]">{tx.date}</div>
                              </div>
                              <div className={`font-medium ${tx.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#FF6B35]'}`}>
                                {tx.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-lg p-3 text-center">
                        <div className="text-[#FF6B35] font-medium">{treasuryDetails.liquidity.performance}</div>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                ) : (
                  <ExternalLink className="w-4 h-4 text-[#C0E6FF]/50 cursor-not-allowed" />
                )}
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">$50,000</div>
                  <div className="text-xs text-[#C0E6FF]">Total Liquidity Provided</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">SUI/USDC:</span>
                    <span className="text-white">$30,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Other Pairs:</span>
                    <span className="text-white">$20,000</span>
                  </div>
                </div>
                <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-lg p-2">
                  <div className="text-[#FF6B35] text-xs font-medium">8.5% APY Average</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
    </div>
  )
}
