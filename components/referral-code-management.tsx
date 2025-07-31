"use client"

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReferralCodes } from '@/hooks/use-referral-codes'
import { toast } from 'sonner'
import {
  Copy,
  CheckCircle,
  Users,
  TrendingUp,
  Eye,
  Share2,
  Star,
  BarChart3,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

export function ReferralCodeManagement() {
  const { codes, isLoading, getReferralLink, refreshCodes } = useReferralCodes()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('Referral code copied!')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleCopyLink = async (code: string) => {
    try {
      const link = getReferralLink(code)
      await navigator.clipboard.writeText(link)
      setCopiedLink(code)
      toast.success('Referral link copied!')
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (code: string) => {
    const link = getReferralLink(code)

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AIONET',
          text: 'Join the AIONET community and start your Web3 journey!',
          url: link
        })
      } catch (error) {
        // User cancelled sharing or share failed
        handleCopyLink(code)
      }
    } else {
      handleCopyLink(code)
    }
  }

  const handleRefreshStatistics = async () => {
    setIsRefreshing(true)
    try {
      await refreshCodes()
      toast.success('📊 Statistics refreshed successfully!')
    } catch (error) {
      toast.error('❌ Failed to refresh statistics')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatConversionRate = (rate: number) => {
    return rate > 0 ? `${rate.toFixed(1)}%` : '0%'
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 10) return 'text-green-400'
    if (rate >= 5) return 'text-yellow-400'
    return 'text-gray-400'
  }

  if (isLoading) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-[#4DA2FF] animate-spin" />
            <span className="ml-2 text-[#C0E6FF]">Loading referral codes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (codes.length === 0) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-2 text-white mb-4">
            <Users className="w-5 h-5 text-[#4DA2FF]" />
            <h3 className="font-semibold">My Referral Codes</h3>
          </div>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Referral Codes Yet</h3>
            <p className="text-[#C0E6FF] mb-4">
              Your referral codes will appear here once your profile is set up.
            </p>
            <Button
              onClick={refreshCodes}
              variant="outline"
              className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-[#4DA2FF]" />
            <h3 className="font-semibold">My Referral Codes</h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshStatistics}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Refresh Stats'}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
        {/* Statistics Info */}
        <div className="bg-[#1a2f51]/30 rounded-lg p-3 border border-[#C0E6FF]/10">
          <p className="text-[#C0E6FF]/70 text-sm">
            📊 Statistics are synced with your actual affiliate relationships and commissions.
            Click "Refresh Stats" to update with the latest data from the database.
          </p>
        </div>
        {codes.map((code) => (
          <div
            key={code.id}
            className="bg-[#1a2f51]/30 rounded-lg p-4 border border-[#C0E6FF]/10"
          >
            {/* Code Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold text-white">
                  {code.code}
                </span>
                {code.isDefault && (
                  <Badge className="bg-[#4DA2FF]/20 text-[#4DA2FF] border-[#4DA2FF]/30 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                {!code.isActive && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleCopyCode(code.code)}
                        size="sm"
                        variant="outline"
                        className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 h-8 w-8 p-0"
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleShare(code.code)}
                        size="sm"
                        variant="outline"
                        className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 h-8 w-8 p-0"
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share referral link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{code.usageCount}</div>
                <div className="text-xs text-[#C0E6FF] flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" />
                  Signups
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">{code.usageCount || 0}</div>
                <div className="text-xs text-[#C0E6FF] flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">0</div>
                <div className="text-xs text-[#C0E6FF] flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Link Clicks
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getPerformanceColor(0)}`}>
                  {formatConversionRate(0)}
                </div>
                <div className="text-xs text-[#C0E6FF] flex items-center justify-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Conv. Rate
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C0E6FF]">Referral Link:</label>
              <div className="flex gap-2">
                <Input
                  value={getReferralLink(code.code)}
                  readOnly
                  className="bg-[#22c55e45] border-[#C0E6FF]/20 text-[#C0E6FF] text-sm font-mono"
                />
                <Button
                  onClick={() => handleCopyLink(code.code)}
                  size="sm"
                  className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white px-3"
                >
                  {copiedLink === code.code ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Description - not available in current interface */}
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
