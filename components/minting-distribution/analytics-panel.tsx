"use client"

import React, { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ExternalLink, Clock, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyticsPanelProps {
  distributionData: {
    affiliate: { percentage: string; amount: number; walletAddress?: string }
    royalties: { percentage: string; amount: number; walletAddress?: string }
    pLevel10: { percentage: string; amount: number; walletAddress?: string }
    treasury: { percentage: string; amount: number; walletAddress?: string }
    team: { percentage: string; amount: number; walletAddress?: string }
  }
  totalDistributed: number
  totalCollected: number
  recentDistributions: Array<{
    date: string
    amount: number
    txHash: string
    type: string
  }>
}

export function AnalyticsPanel({
  distributionData,
  totalDistributed,
  totalCollected,
  recentDistributions
}: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')
  const [sixMonthTimeLeft, setSixMonthTimeLeft] = useState({
    months: 6,
    days: 0,
    hours: 0,
    minutes: 0
  })

  // 6-month countdown timer effect
  useEffect(() => {
    // Calculate time until next 6-month distribution
    const calculateTimeLeft = () => {
      const now = new Date()
      const nextDistribution = new Date()

      // Set next distribution to 6 months from now (for demo purposes)
      // In real implementation, this would be based on actual distribution schedule
      nextDistribution.setMonth(now.getMonth() + 6)
      nextDistribution.setDate(1) // First day of the month
      nextDistribution.setHours(0, 0, 0, 0) // Midnight

      const timeDiff = nextDistribution.getTime() - now.getTime()

      if (timeDiff > 0) {
        const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30))
        const days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

        return { months, days, hours, minutes }
      }

      return { months: 0, days: 0, hours: 0, minutes: 0 }
    }

    // Update immediately
    setSixMonthTimeLeft(calculateTimeLeft())

    // Update every minute
    const timer = setInterval(() => {
      setSixMonthTimeLeft(calculateTimeLeft())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return ''
    return `${value} ${unit}${value !== 1 ? 's' : ''}`
  }

  // Prepare pie chart data
  const pieData = [
    {
      name: 'Affiliate Network',
      value: distributionData.affiliate.amount,
      color: '#4DA2FF',
      percentage: distributionData.affiliate.percentage,
      walletAddress: distributionData.affiliate.walletAddress || '0x2345678901bcdefghijklmnopqrstuvwxyz123456789abcdef'
    },
    {
      name: 'Royalties',
      value: distributionData.royalties.amount,
      color: '#FFD700',
      percentage: distributionData.royalties.percentage,
      walletAddress: distributionData.royalties.walletAddress || '0x3456789012cdefghijklmnopqrstuvwxyz123456789abcdef'
    },
    {
      name: 'P.Level 10',
      value: distributionData.pLevel10.amount,
      color: '#8B5CF6',
      percentage: distributionData.pLevel10.percentage,
      walletAddress: distributionData.pLevel10.walletAddress || '0x4567890123defghijklmnopqrstuvwxyz123456789abcdef'
    },
    {
      name: 'Treasury',
      value: distributionData.treasury.amount,
      color: '#10B981',
      percentage: distributionData.treasury.percentage,
      walletAddress: distributionData.treasury.walletAddress || '0x5678901234efghijklmnopqrstuvwxyz123456789abcdef'
    },
    {
      name: 'Team Wallet',
      value: distributionData.team.amount,
      color: '#FF6B35',
      percentage: distributionData.team.percentage,
      walletAddress: distributionData.team.walletAddress || '0x6789012345fghijklmnopqrstuvwxyz123456789abcdef'
    }
  ]

  // Prepare bar chart data (mock historical data)
  const barData = [
    { month: 'Jan', affiliate: 12000, royalties: 2400, pLevel10: 1200, treasury: 6000, team: 2400 },
    { month: 'Feb', affiliate: 15000, royalties: 3000, pLevel10: 1500, treasury: 7500, team: 3000 },
    { month: 'Mar', affiliate: 18000, royalties: 3600, pLevel10: 1800, treasury: 9000, team: 3600 },
    { month: 'Apr', affiliate: 22000, royalties: 4400, pLevel10: 2200, treasury: 11000, team: 4400 },
    { month: 'May', affiliate: 25000, royalties: 5000, pLevel10: 2500, treasury: 12500, team: 5000 },
    { month: 'Jun', affiliate: 28000, royalties: 5600, pLevel10: 2800, treasury: 14000, team: 5600 }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A1628] border border-[#4DA2FF]/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toLocaleString()} SUI`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0A1628] border border-[#4DA2FF]/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{data.name}</p>
          <p style={{ color: data.color }} className="text-sm">
            {`${data.value.toLocaleString()} SUI (${data.percentage})`}
          </p>
          <p className="text-[#C0E6FF] text-xs mt-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Click to view wallet on SuiScan
          </p>
        </div>
      )
    }
    return null
  }

  const handlePieClick = (data: any) => {
    if (data && data.walletAddress) {
      window.open(`https://suiscan.xyz/mainnet/account/${data.walletAddress}`, '_blank')
    }
  }

  // Add targeted CSS to handle hover effect and remove white background
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .recharts-bar-rectangle {
        transition: fill 0.2s ease !important;
        cursor: pointer !important;
      }

      .recharts-bar-rectangle:hover {
        fill: #2e4269 !important;
      }

      /* Target the specific white background source - tooltip cursor */
      .recharts-tooltip-cursor {
        fill: transparent !important;
        stroke: transparent !important;
        opacity: 0 !important;
        display: none !important;
      }

      /* Hide active shape backgrounds */
      .recharts-active-shape {
        fill: transparent !important;
        stroke: transparent !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        {/* Header */}
        <div className="pb-6 border-b border-[#4DA2FF]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Distribution Analytics</h3>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4DA2FF]">
              {totalCollected.toLocaleString()}
            </div>
            <div className="text-[#C0E6FF] text-sm">Total SUI Platform Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4DA2FF]">
              {distributionData.affiliate.amount.toLocaleString()}
            </div>
            <div className="text-[#C0E6FF] text-sm">Total SUI Distributed (Affiliates)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFD700]">
              {distributionData.royalties.amount.toLocaleString()}
            </div>
            <div className="text-[#C0E6FF] text-sm">Total SUI Distributed (Royalties)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#8B5CF6]">
              {distributionData.pLevel10.amount.toLocaleString()}
            </div>
            <div className="text-[#C0E6FF] text-sm">Total SUI Distributed (P.Level 10)</div>
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="flex border-b border-[#4DA2FF]/20">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'history', label: 'History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#4DA2FF] border-b-2 border-[#4DA2FF]'
                : 'text-[#C0E6FF] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

        {/* Tab Content */}
        <div className="pt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                Distribution Breakdown
                <span className="text-xs text-[#C0E6FF]/70 font-normal">
                  (Click segments to view wallets)
                </span>
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={handlePieClick}
                      className="cursor-pointer"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div>
              <div>
                <h4 className="text-white font-semibold mb-4">Legend</h4>
                <div className="space-y-3">
                  {pieData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#4DA2FF]/20 bg-[#0A1628]/50 hover:bg-[#1A2F51]/30 hover:border-[#4DA2FF]/40 transition-all duration-200 cursor-pointer group"
                      onClick={() => window.open(`https://suiscan.xyz/mainnet/account/${item.walletAddress}`, '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[#C0E6FF] text-sm group-hover:text-white transition-colors font-medium">
                            {item.name}
                          </span>
                          {item.name === 'P.Level 10' && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#8B5CF6]" />
                              <span className="text-xs text-[#8B5CF6] font-mono">
                                Next Distribution: {[
                                  formatTimeUnit(sixMonthTimeLeft.months, 'month'),
                                  formatTimeUnit(sixMonthTimeLeft.days, 'day'),
                                  formatTimeUnit(sixMonthTimeLeft.hours, 'hour'),
                                  formatTimeUnit(sixMonthTimeLeft.minutes, 'min')
                                ].filter(Boolean).slice(0, 2).join(', ') || '0 mins'}
                              </span>
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-3 h-3 text-[#C0E6FF]/50 group-hover:text-[#4DA2FF] transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-white font-semibold text-sm bg-[#4DA2FF]/10 px-2 py-1 rounded-md">
                        {item.percentage}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2 rounded-lg bg-[#4DA2FF]/5 border border-[#4DA2FF]/10">
                  <div className="text-xs text-[#C0E6FF]/70 text-center">
                    💡 Click on any item to view wallet on SuiScan
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h4 className="text-white font-semibold mb-4">Distribution History (6 Months)</h4>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="month" stroke="#C0E6FF" />
                  <YAxis stroke="#C0E6FF" />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                    wrapperStyle={{ backgroundColor: 'transparent' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="affiliate"
                    stackId="a"
                    fill="#4DA2FF"
                    name="Affiliate"
                  />
                  <Bar
                    dataKey="royalties"
                    stackId="a"
                    fill="#FFD700"
                    name="Royalties"
                  />
                  <Bar
                    dataKey="pLevel10"
                    stackId="a"
                    fill="#8B5CF6"
                    name="P.Level 10"
                  />
                  <Bar
                    dataKey="treasury"
                    stackId="a"
                    fill="#10B981"
                    name="Treasury"
                  />
                  <Bar
                    dataKey="team"
                    stackId="a"
                    fill="#FF6B35"
                    name="Team"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Distributions Table */}
            <div>
              <h5 className="text-white font-semibold mb-3">Recent Distributions</h5>
              <div className="space-y-2">
                {recentDistributions.map((dist, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#1A2F51]/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{dist.type}</div>
                      <div className="text-[#C0E6FF] text-xs">{dist.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#4DA2FF] font-bold">{dist.amount.toLocaleString()} SUI</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#C0E6FF] hover:text-white p-0 h-auto"
                        onClick={() => window.open(`https://suiscan.xyz/mainnet/tx/${dist.txHash}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View TX
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
