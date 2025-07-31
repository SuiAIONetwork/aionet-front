"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RoleImage } from "@/components/ui/role-image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api-client"
import { AffiliateUser, AffiliateMetrics, CommissionData, NetworkMetrics, UserProfileLevel, AffiliateStatsResponse } from "@/types/affiliate"
import { affiliateSubscriptionService, SubscriptionStatus } from "@/lib/affiliate-subscription-service"
import { AffiliateSubscriptionPayment } from "@/components/affiliate-subscription-payment"
import { SubscriptionGuard } from "@/components/subscription-guard"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useRaffleCraftIntegration } from "@/hooks/use-rafflecraft-integration"
import { useBackendIntegration } from "@/hooks/useBackendIntegration"
import { CommissionTracking } from "@/components/commission-tracking"
import { ContactSponsorModal } from "@/components/contact-sponsor-modal"
import { useAffiliateQueryRateLimit, useCommissionQueryRateLimit } from "@/hooks/use-rate-limit"
import { UsernameDisplay } from "@/components/profile-link"
import Image from "next/image"
import {
  Users,
  Search,
  Filter,
  Award,
  Trophy,
  Calendar,
  Mail,
  MessageCircle,
  Bell,
  MoreHorizontal,
  DollarSign,
  Gift,
  Loader2,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Ban,
  Edit,
  ExternalLink,
  Settings,
  Menu,
  Wrench,
  Target,
  ChevronDown
} from "lucide-react"

// Helper function to get avatar URL from blob ID
const getAvatarUrl = (blobId: string | null | undefined): string | undefined => {
  if (!blobId) {
    return undefined
  }

  try {
    // Check if it's a default avatar path (starts with /images/animepfp/)
    if (blobId.startsWith('/images/animepfp/')) {
      return blobId // Return the path directly for default avatars
    }

    // Check if it's already a full URL
    if (blobId.startsWith('http')) {
      return blobId
    }

    // Check if it's a Supabase storage path
    if (blobId.includes('/')) {
      // Try to get Supabase storage URL (synchronous version)
      try {
        const { supabaseStorage } = require('@/lib/supabase-storage')
        return supabaseStorage.getPublicUrl(blobId)
      } catch (error) {
        console.warn('Failed to get Supabase URL:', error)
      }
    }

    // No fallback - return undefined for invalid blob IDs
    return undefined
  } catch (error) {
    console.error('Error generating avatar URL:', error)
    return undefined
  }
}

export function AffiliateControls() {
  const account = useCurrentAccount()
  const { user, isSignedIn } = useSuiAuth()
  const { isListening, startListening, stopListening } = useRaffleCraftIntegration()
  const backendIntegration = useBackendIntegration()

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'NOMAD' | 'PRO' | 'ROYAL'>('ALL')
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 'Lv. 1' | 'Lv. 2' | 'Lv. 3' | 'Lv. 4' | 'Lv. 5'>('ALL')
  const [selectedProfileLevelFilter, setSelectedProfileLevelFilter] = useState<'ALL' | 'PL. 1' | 'PL. 2' | 'PL. 3' | 'PL. 4' | 'PL. 5' | 'PL. 6' | 'PL. 7' | 'PL. 8' | 'PL. 9' | 'PL. 10'>('ALL')
  const [showLatestOnly, setShowLatestOnly] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(5)

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // State for data
  const [userProfileLevel, setUserProfileLevel] = useState<UserProfileLevel | null>(null)
  const [userAffiliateLevel, setUserAffiliateLevel] = useState<number>(1)
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>({
    totalNetworkSize: 0,
    directReferrals: 0,
    indirectReferrals: 0,
    networkDepth: 0,
    monthlyGrowth: 0,
    networkValue: 0,
    levelBreakdown: {},
    personalNomadUsers: 0,
    personalProUsers: 0,
    personalRoyalUsers: 0,
    networkNomadUsers: 0,
    networkProUsers: 0,
    networkRoyalUsers: 0,
    networkLevel5Users: 0,
    networkLevel6Users: 0,
    networkLevel7Users: 0,
    networkLevel8Users: 0,
    networkLevel9Users: 0,
    networkLevel10Users: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [totalAllUsers, setTotalAllUsers] = useState(0)

  // State for affiliate users list
  const [affiliateUsers, setAffiliateUsers] = useState<AffiliateUser[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [hoveredUsers, setHoveredUsers] = useState<Set<string>>(new Set())

  // Commission tracking state
  const [commissionData, setCommissionData] = useState<CommissionData>({
    totalEarned: 0,
    monthlyEarned: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    commissionRate: 0,
    recentTransactions: [],
    performanceMetrics: {
      clickThroughRate: 0,
      conversionRate: 0,
      averageOrderValue: 0
    },
    totalCommissions: 0,
    tierBreakdown: {
      nomadCommissions: 0,
      proCommissions: 0,
      royalCommissions: 0
    }
  })

  // Get the current user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address

  // Rate limiting hooks
  const affiliateRateLimit = useAffiliateQueryRateLimit()
  const commissionRateLimit = useCommissionQueryRateLimit()

  // Load affiliate data from database
  const loadAffiliateData = useCallback(async () => {
    if (!userAddress) {
      setError('No wallet address found. Please connect your wallet.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading affiliate data for address:', userAddress)

      // Load subscription status with error handling
      setSubscriptionLoading(true)
      try {
        const subStatus = await affiliateSubscriptionService.getSubscriptionStatus(userAddress)
        setSubscriptionStatus(subStatus)
      } catch (subError) {
        console.error('Failed to load subscription status:', subError)
        setError('Failed to load subscription status. Some features may be limited.')
      } finally {
        setSubscriptionLoading(false)
      }

      // Load user's own profile level with error handling
      let profileLevel = null
      try {
        // Profile level will be loaded from the main API call below
        // Set a default for now
        profileLevel = {
          level: 1,
          name: 'Starter',
          requirements: {
            minReferrals: 0,
            minCommissions: 0,
            minNetworkSize: 0
          },
          benefits: ['Basic access'],
          commissionRate: 0.05,
          bonuses: {}
        }
        // Don't set it here, it will be updated from API data
      } catch (profileError) {
        console.error('Failed to load profile level:', profileError)
        // Don't set error for this as it's not critical
      }

      // Calculate user's affiliate level based on profile level
      const affiliateLevel = profileLevel ? calculateAffiliateLevel(profileLevel.level) : 1
      setUserAffiliateLevel(affiliateLevel)

      // Load network metrics from API
      let networkData = null
      try {
        console.log('🔄 Calling affiliate API...')
        console.log('🔐 Backend auth status:', {
          isAuthenticated: backendIntegration.backend.isAuthenticated,
          isLoading: backendIntegration.backend.isLoading,
          userAddress: backendIntegration.backend.userAddress,
          isFullyAuthenticated: backendIntegration.isFullyAuthenticated
        })

        const apiResult = await api.affiliate.getStats()

        console.log('📊 Network result:', apiResult)

        // Handle both direct response and wrapped response structures
        let statsData: any = null
        if (apiResult && typeof apiResult === 'object') {
          // Check if it's wrapped in a success/data structure (mock response)
          if ('success' in apiResult && 'data' in apiResult && apiResult.success) {
            statsData = (apiResult as any).data
          } else {
            // Direct response from edge function
            statsData = apiResult
          }
        }

        if (statsData) {
          networkData = {
            totalNetworkSize: statsData.totalNetworkSize || 0,
            directReferrals: statsData.directReferrals || 0,
            indirectReferrals: statsData.indirectReferrals || 0,
            networkDepth: statsData.networkDepth || 0,
            monthlyGrowth: statsData.monthlyGrowth || 0,
            networkValue: statsData.networkValue || 0,
            levelBreakdown: statsData.levelBreakdown || {},
            personalNomadUsers: statsData.personalNomadUsers || 0,
            personalProUsers: statsData.personalProUsers || 0,
            personalRoyalUsers: statsData.personalRoyalUsers || 0,
            networkNomadUsers: statsData.networkNomadUsers || 0,
            networkProUsers: statsData.networkProUsers || 0,
            networkRoyalUsers: statsData.networkRoyalUsers || 0,
            networkLevel5Users: statsData.networkLevel5Users || 0,
            networkLevel6Users: statsData.networkLevel6Users || 0,
            networkLevel7Users: statsData.networkLevel7Users || 0,
            networkLevel8Users: statsData.networkLevel8Users || 0,
            networkLevel9Users: statsData.networkLevel9Users || 0,
            networkLevel10Users: statsData.networkLevel10Users || 0
          }

          // Set commission data from the same API result
          const commissionData = {
            totalEarned: statsData.totalEarned || 0,
            monthlyEarned: statsData.monthlyEarned || 0,
            pendingCommissions: statsData.pendingCommissions || 0,
            paidCommissions: statsData.paidCommissions || 0,
            commissionRate: statsData.commissionRate || 0.05,
            recentTransactions: statsData.recentTransactions || [],
            performanceMetrics: statsData.performanceMetrics || {
              clickThroughRate: 0,
              conversionRate: 0,
              averageOrderValue: 0
            },
            totalCommissions: statsData.totalCommissions || 0,
            tierBreakdown: statsData.tierBreakdown || {
              nomadCommissions: 0,
              proCommissions: 0,
              royalCommissions: 0
            }
          }
          setCommissionData(commissionData)

          // Set affiliate users data if available
          if (statsData.affiliateUsers) {
            setAffiliateUsers(statsData.affiliateUsers)
            setTotalCount(statsData.totalCount || 0)
          } else {
            setAffiliateUsers([])
            setTotalCount(0)
          }

          // Set user profile level if available
          if (statsData.userProfileLevel) {
            setUserProfileLevel(statsData.userProfileLevel)
          }
        } else {
          // Fallback to default values if API fails
          networkData = {
            totalNetworkSize: 0,
            directReferrals: 0,
            indirectReferrals: 0,
            networkDepth: 0,
            monthlyGrowth: 0,
            networkValue: 0,
            levelBreakdown: {},
            personalNomadUsers: 0,
            personalProUsers: 0,
            personalRoyalUsers: 0,
            networkNomadUsers: 0,
            networkProUsers: 0,
            networkRoyalUsers: 0,
            networkLevel5Users: 0,
            networkLevel6Users: 0,
            networkLevel7Users: 0,
            networkLevel8Users: 0,
            networkLevel9Users: 0,
            networkLevel10Users: 0
          }
        }

        setNetworkMetrics(networkData)

        // Calculate total users from network metrics
        const totalUsers = networkData.personalNomadUsers + networkData.personalProUsers + networkData.personalRoyalUsers +
                          networkData.networkNomadUsers + networkData.networkProUsers + networkData.networkRoyalUsers
        setTotalAllUsers(totalUsers)
      } catch (networkError) {
        console.error('Failed to load network metrics:', networkError)

        // Provide more specific error messages
        let errorMessage = 'Failed to load network metrics. '
        if (networkError instanceof Error) {
          if (networkError.message.includes('User address required')) {
            errorMessage += 'Authentication issue - please reconnect your wallet.'
          } else if (networkError.message.includes('Failed to fetch')) {
            errorMessage += 'Backend service unavailable - please try again later.'
          } else {
            errorMessage += `Error: ${networkError.message}`
          }
        } else {
          errorMessage += 'Please try refreshing the page.'
        }

        setError(errorMessage)
        return
      }

      // Commission data is already set above from the same API result

      setCommissionLoading(false)

      console.log('✅ Affiliate data loaded successfully')

    } catch (error) {
      console.error('❌ Failed to load affiliate data:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while loading affiliate data')
      setCommissionLoading(false)
    } finally {
      setLoading(false)
    }
  }, [userAddress])

  // Load data on component mount and when user changes
  useEffect(() => {
    if (userAddress) {
      loadAffiliateData()
    }
  }, [userAddress]) // Remove filters and loadAffiliateData from dependencies to prevent infinite loops

  // Helper function to calculate affiliate level from profile level
  const calculateAffiliateLevel = (profileLevel: number): number => {
    if (profileLevel >= 5) return 5  // Profile Level 5-10 → Affiliate Level 5 (capped)
    if (profileLevel >= 4) return 4  // Profile Level 4 → Affiliate Level 4
    if (profileLevel >= 3) return 3  // Profile Level 3 → Affiliate Level 3
    if (profileLevel >= 2) return 2  // Profile Level 2 → Affiliate Level 2
    if (profileLevel >= 1) return 1  // Profile Level 1 → Affiliate Level 1
    return 1  // Default/fallback
  }

  // Helper function to get tier image based on user's tier
  const getTierImage = (tier: string): string => {
    switch (tier) {
      case 'ROYAL':
        return '/images/royal.png'
      case 'PRO':
        return '/images/pro.png'
      case 'NOMAD':
      default:
        return '/images/nomad.png'
    }
  }

  // Helper function to format SUI amounts with USD conversion
  const formatSuiAmount = (amount: number) => {
    const suiPrice = 3.45 // Mock SUI price in USD - in production, fetch from API
    const usdValue = amount * suiPrice
    return {
      sui: amount.toLocaleString(),
      usd: usdValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    }
  }

  // Show authentication requirement
  if (!isSignedIn || !userAddress) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content text-center py-12">
            <Users className="w-16 h-16 text-[#4DA2FF] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-[#C0E6FF] mb-4">
              Please connect your wallet or sign in to view your affiliate dashboard and manage your affiliates.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content text-center py-12">
            <Loader2 className="w-16 h-16 text-[#4DA2FF] mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-white mb-2">Loading Affiliate Data</h3>
            <p className="text-[#C0E6FF] mb-4">
              Fetching your affiliate metrics and user data...
            </p>

            {/* Backend Status Indicator */}
            <div className="text-sm text-gray-400">
              Backend Status: {backendIntegration.backend.isAuthenticated ? (
                <span className="text-green-400">✅ Connected</span>
              ) : backendIntegration.backend.isLoading ? (
                <span className="text-yellow-400">🔄 Connecting...</span>
              ) : (
                <span className="text-red-400">❌ Disconnected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content text-center py-12">
            <Users className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
            <p className="text-[#C0E6FF] mb-4">{error}</p>
            <Button
              onClick={loadAffiliateData}
              className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rate Limit Warning */}
      {(!affiliateRateLimit.state.isAllowed || !commissionRateLimit.state.isAllowed) && (
        <div className="enhanced-card border-yellow-500/20 bg-yellow-500/5">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-yellow-400 font-medium">Rate Limit Warning</p>
                <p className="text-sm text-gray-300">
                  {!affiliateRateLimit.state.isAllowed && 'Affiliate queries limited. '}
                  {!commissionRateLimit.state.isAllowed && 'Commission queries limited. '}
                  Please wait before making more requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Section - Summary Cards (4 cards in a row) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#C0E6FF]">TOTAL USERS</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-[#FFFFFF]">{totalAllUsers}</p>
                )}
              </div>
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* My Affiliate Level Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#C0E6FF]">MY AFFILIATE LEVEL</p>
                <p className="text-2xl font-bold text-[#FFFFFF]">Level {userAffiliateLevel}</p>
              </div>
              <div className="bg-purple-600/20 p-3 rounded-full">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Commissions Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#C0E6FF]">TOTAL COMMISSIONS</p>
                {commissionLoading ? (
                  <div className="h-8 w-24 bg-gray-600 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-[#FFFFFF]">{formatSuiAmount(commissionData.totalCommissions).sui}</p>
                )}
              </div>
              <img src="/images/logo-sui.png" alt="SUI" className="w-12 h-12 object-contain" />
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#4DA2FF]" />
              </div>
            ) : subscriptionStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#C0E6FF]">SUBSCRIPTION</p>
                    <div className="flex items-center gap-2">
                      {subscriptionStatus.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      )}
                      <p className="text-lg font-bold text-[#FFFFFF] capitalize">
                        {subscriptionStatus.status}
                      </p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${
                    subscriptionStatus.isActive 
                      ? 'bg-green-600/20' 
                      : subscriptionStatus.status === 'trial' 
                        ? 'bg-orange-600/20' 
                        : 'bg-red-600/20'
                  }`}>
                    {subscriptionStatus.isActive ? (
                      <Zap className={`w-6 h-6 ${
                        subscriptionStatus.status === 'trial' ? 'text-orange-400' : 'text-green-400'
                      }`} />
                    ) : (
                      <Clock className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#C0E6FF]">
                    {subscriptionStatus.isActive ? 'Days Remaining:' : 'Expired'}
                  </span>
                  <span className={`font-semibold ${
                    subscriptionStatus.daysRemaining > 7 
                      ? 'text-green-400' 
                      : subscriptionStatus.daysRemaining > 0 
                        ? 'text-orange-400' 
                        : 'text-red-400'
                  }`}>
                    {subscriptionStatus.isActive ? `${subscriptionStatus.daysRemaining} days` : '0 days'}
                  </span>
                </div>

                {!subscriptionStatus.isActive && (
                  <AffiliateSubscriptionPayment
                    userAddress={userAddress}
                    onPaymentSuccess={() => loadAffiliateData()}
                    trigger={
                      <Button className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white text-xs py-2">
                        <Zap className="w-3 h-3 mr-1" />
                        Renew Now
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#C0E6FF] text-sm">Unable to load subscription status</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section - Two-Column Table Layout */}
      <SubscriptionGuard feature="affiliate overview and network metrics" showUpgrade={false}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Left Column - Affiliate Overview Table */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4DA2FF]" />
                Affiliate Overview
              </h3>
              <div className="space-y-4">
                {/* Personal Members */}
                <div className="border-b border-[#C0E6FF]/10 pb-4">
                  <h4 className="text-sm font-medium text-[#C0E6FF] mb-3">Personal Members</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/nomad.png"
                          alt="NOMAD tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">NOMAD</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.personalNomadUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/pro.png"
                          alt="PRO tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">PRO</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.personalProUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/royal.png"
                          alt="ROYAL tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">ROYAL</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.personalRoyalUsers}</span>
                    </div>
                  </div>
                </div>

                {/* Network Members */}
                <div>
                  <h4 className="text-sm font-medium text-[#C0E6FF] mb-3">Network Members</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/nomad.png"
                          alt="NOMAD tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">NOMAD</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.networkNomadUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/pro.png"
                          alt="PRO tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">PRO</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.networkProUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/royal.png"
                          alt="ROYAL tier"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-white text-sm">ROYAL</span>
                      </div>
                      <span className="text-white font-semibold">{networkMetrics.networkRoyalUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Network Overview Table */}
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Network Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 5</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel5Users}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 6</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel6Users}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 7</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel7Users}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 8</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel8Users}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 9</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel9Users}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600/20 p-3 rounded-full">
                      <Award className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-white text-base">Profile Level 10</span>
                  </div>
                  <span className="text-white font-semibold text-lg">{networkMetrics.networkLevel10Users}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubscriptionGuard>

      {/* Commission Tracking */}
      <SubscriptionGuard feature="commission tracking" showUpgrade={false}>
        <CommissionTracking
          commissionData={commissionData}
          loading={commissionLoading}
        />
      </SubscriptionGuard>

      {/* Enhanced Affiliate Users Table */}
      <SubscriptionGuard feature="affiliate users management">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            {/* Header with Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
              {/* Title and View Toggle */}
              <div className="flex items-center gap-4 text-[#FFFFFF]">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4DA2FF]" />
                  <h3 className="text-xl font-semibold">Affiliates</h3>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowLatestOnly(false)}
                    variant={!showLatestOnly ? "default" : "outline"}
                    size="sm"
                    className={!showLatestOnly
                      ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                      : "border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                    }
                  >
                    All Affiliates
                  </Button>
                  <Button
                    onClick={() => setShowLatestOnly(true)}
                    variant={showLatestOnly ? "default" : "outline"}
                    size="sm"
                    className={showLatestOnly
                      ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                      : "border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                    }
                  >
                    Latest 5
                  </Button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C0E6FF]" />
                  <Input
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF] placeholder:text-[#C0E6FF]/60"
                  />
                </div>

                {/* Role Filter */}
                <Select value={selectedRoleFilter} onValueChange={(value: 'ALL' | 'NOMAD' | 'PRO' | 'ROYAL') => setSelectedRoleFilter(value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                    <SelectItem value="ALL" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">All Roles</SelectItem>
                    <SelectItem value="NOMAD" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">NOMAD</SelectItem>
                    <SelectItem value="PRO" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">PRO</SelectItem>
                    <SelectItem value="ROYAL" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">ROYAL</SelectItem>
                  </SelectContent>
                </Select>

                {/* Level Filter */}
                <Select value={selectedLevelFilter} onValueChange={(value: 'ALL' | 'Lv. 1' | 'Lv. 2' | 'Lv. 3' | 'Lv. 4' | 'Lv. 5') => setSelectedLevelFilter(value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                    <SelectItem value="ALL" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">All Affiliates</SelectItem>
                    <SelectItem value="Lv. 1" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Level 1</SelectItem>
                    <SelectItem value="Lv. 2" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Level 2</SelectItem>
                    <SelectItem value="Lv. 3" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Level 3</SelectItem>
                    <SelectItem value="Lv. 4" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Level 4</SelectItem>
                    <SelectItem value="Lv. 5" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Level 5</SelectItem>
                  </SelectContent>
                </Select>

                {/* Profile Level Filter */}
                <Select value={selectedProfileLevelFilter} onValueChange={(value: 'ALL' | 'PL. 1' | 'PL. 2' | 'PL. 3' | 'PL. 4' | 'PL. 5' | 'PL. 6' | 'PL. 7' | 'PL. 8' | 'PL. 9' | 'PL. 10') => setSelectedProfileLevelFilter(value)}>
                  <SelectTrigger className="w-full sm:w-36 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
                    <SelectValue placeholder="Profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                    <SelectItem value="ALL" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">All Profiles</SelectItem>
                    <SelectItem value="PL. 1" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 1</SelectItem>
                    <SelectItem value="PL. 2" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 2</SelectItem>
                    <SelectItem value="PL. 3" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 3</SelectItem>
                    <SelectItem value="PL. 4" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 4</SelectItem>
                    <SelectItem value="PL. 5" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 5</SelectItem>
                    <SelectItem value="PL. 6" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 6</SelectItem>
                    <SelectItem value="PL. 7" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 7</SelectItem>
                    <SelectItem value="PL. 8" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 8</SelectItem>
                    <SelectItem value="PL. 9" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 9</SelectItem>
                    <SelectItem value="PL. 10" className="text-[#FFFFFF] hover:bg-[#C0E6FF]/10">Profile 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            {affiliateUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Affiliate Users Found</h3>
                <p className="text-[#C0E6FF] mb-4">
                  {searchTerm || selectedRoleFilter !== 'ALL' || selectedLevelFilter !== 'ALL' || selectedProfileLevelFilter !== 'ALL'
                    ? 'Try adjusting your search filters to find users.'
                    : 'Start referring users to see them appear here.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#C0E6FF]/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-[#C0E6FF]/20 hover:bg-transparent">
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[200px]">User</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[100px]">Role</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[120px] text-center">Profile Level</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[130px] text-center">Affiliate Level</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[140px]">Commission</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[120px]">Join Date</TableHead>
                          <TableHead className="text-[#C0E6FF] font-semibold min-w-[100px] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {(() => {
                        // Apply filters
                        const filteredUsers = affiliateUsers.filter(user => {
                          // Search filter
                          if (searchTerm) {
                            const searchLower = searchTerm.toLowerCase()
                            const matchesSearch = user.username?.toLowerCase().includes(searchLower) ||
                                                 user.email?.toLowerCase().includes(searchLower)
                            if (!matchesSearch) return false
                          }

                          // Role filter
                          if (selectedRoleFilter !== 'ALL') {
                            // TODO: Update when backend provides proper role/tier information
                            // For now, skip role filtering
                          }

                          // Affiliate level filter
                          if (selectedLevelFilter !== 'ALL') {
                            const targetLevel = parseInt(selectedLevelFilter.replace('Lv. ', ''))
                            if (user.level !== targetLevel) return false
                          }

                          // Profile level filter
                          if (selectedProfileLevelFilter !== 'ALL') {
                            const targetProfileLevel = parseInt(selectedProfileLevelFilter.replace('PL. ', ''))
                            if (user.profileLevel.level !== targetProfileLevel) return false
                          }

                          return true
                        })

                        // Sort by join date (newest first)
                        const sortedUsers = [...filteredUsers].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

                        // Get displayed users based on view toggle
                        const displayedUsers = showLatestOnly ? sortedUsers.slice(0, 5) : sortedUsers.slice(0, displayedCount)

                        return displayedUsers.map((user) => (
                          <TableRow key={user.id} className="border-b border-[#C0E6FF]/10 hover:bg-[#1a2f51]/20">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-blue-100">
                                  <AvatarImage src={""} alt={user.username || 'User'} />
                                  <AvatarFallback className="bg-[#4DA2FF] text-white text-sm font-semibold">
                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <UsernameDisplay username={user.username} address={user.address} />
                                  <p className="text-[#C0E6FF]/70 text-xs">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <RoleImage role="NOMAD" size="sm" />
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  {user.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <span className="text-white font-medium">{user.profileLevel.level}</span>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <span className="text-white font-medium">{user.level}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="text-white font-semibold">{formatSuiAmount(0).sui} SUI</p>
                                <p className="text-[#C0E6FF] text-sm">{formatSuiAmount(0).usd}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="text-[#C0E6FF] text-sm">
                                {new Date(user.joinedAt).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex justify-center">
                                {/* Actions Dropdown Menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                                      title="User Actions"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-[#1a2f51] border-[#C0E6FF]/30">
                                    {/* Primary Actions */}
                                    <DropdownMenuItem
                                      className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 cursor-pointer"
                                      onClick={() => console.log('View profile:', user.username)}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 cursor-pointer"
                                      onClick={() => console.log('Contact user:', user.username)}
                                    >
                                      <Mail className="w-4 h-4 mr-2" />
                                      Contact User
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#C0E6FF]/20" />

                                    {/* Communication Actions */}
                                    <DropdownMenuItem
                                      className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 cursor-pointer"
                                      onClick={() => console.log('Send message to:', user.username)}
                                    >
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 cursor-pointer"
                                      onClick={() => console.log('View external profile:', user.username)}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      External Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#C0E6FF]/20" />

                                    {/* Management Actions */}
                                    <DropdownMenuItem
                                      className="text-green-400 hover:bg-green-400/10 cursor-pointer"
                                      onClick={() => console.log('Promote user:', user.username)}
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Promotion
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      })()}
                    </TableBody>
                  </Table>
                  </div>
                </div>

                {/* Show More Button */}
                {!showLatestOnly && affiliateUsers.length > displayedCount && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setDisplayedCount(prev => prev + 5)}
                      variant="outline"
                      className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                    >
                      Show More ({affiliateUsers.length - displayedCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SubscriptionGuard>
    </div>
  )
}
