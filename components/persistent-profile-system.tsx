"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoleImage } from "@/components/ui/role-image"
import { EnhancedAvatar } from "@/components/enhanced-avatar"
import { EnhancedBanner } from "@/components/enhanced-banner"
import { XFollowPopup } from "@/components/x-follow-popup"

import { useProfile } from '@/contexts/profile-context'

import { useReferralCodes } from '@/hooks/use-referral-codes'
import { encryptedStorage } from '@/lib/encrypted-database-storage'
import { getCountryCodeByName } from '@/lib/locations'
import ReactCountryFlag from 'react-country-flag'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useTierRefresh } from '@/hooks/use-tier-sync'

import { toast } from 'sonner'
import Image from "next/image"
import {

  History,
  Copy,
  ExternalLink,
  Users,
  Settings,

  Hash,
  Star,
  Lock,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trophy,
  Shield,
  Zap,
  User,
  Link,
  Repeat,
  Crown,
  X,
  TrendingUp,
  Target,
  Unlock,
  Gift,
  Coins,
  Activity
} from 'lucide-react'



// Achievement image mapping function - Updated with new hexagonal achievement icons
const getAchievementImage = (achievementName: string): string | null => {
  const imageMap: { [key: string]: string } = {
    // Profile/KYC Category
    "Personalize Your Profile": "/images/achievements/Personalize Your Profile.png",
    "Unlock Full Access": "/images/achievements/Unlock Full Access.png",
    "Advanced User Status": "/images/achievements/Advanced User Status.png",

    // Social Connections Category
    "Follow Aionet on X": "/images/achievements/Follow the Conversation.png", // Using Follow the Conversation icon
    "Follow AIONET on X": "/images/achievements/Follow the Conversation.png", // Alternative name variant

    // Crypto Bot Activities Category
    "Automate Your Trades": "/images/achievements/Automate Your Trades.png",
    "Crypto Copy Trading": "/images/achievements/APLN Trading Signals.png", // Using APLN Trading Signals icon
    "Master Trading Cycles (1)": "/images/achievements/Master Trading Cycles.png",
    "Master Trading Cycles (3)": "/images/achievements/Master Trading Cycles.png",
    "Master Trading Cycles (6)": "/images/achievements/Master Trading Cycles.png",

    // User Upgrades Category
    "Mint Royal NFT Status": "/images/achievements/Elite ROYAL Network.png", // Using Elite ROYAL Network icon
    "Upgrade to PRO": "/images/achievements/Expand Your PRO Network.png",
    "Upgrade to ROYAL": "/images/achievements/Elite ROYAL Network.png",

    // Referral Tiers Category
    "Recruit PRO NFT Holders": "/images/achievements/Recruit PRO NFT Holders.png",
    "Royal NFT Ambassadors": "/images/achievements/Royal NFT Ambassadors.png",
    "Build a NOMAD Network": "/images/achievements/Build a NOMAD Network.png",
    "Expand Your PRO Network": "/images/achievements/Expand Your PRO Network.png",
    "Elite ROYAL Network": "/images/achievements/Elite ROYAL Network.png",
    "Mentor Level 5 Users": "/images/achievements/Mentor Level 5 Users.png",
    "Scale Level 5 Mentorship": "/images/achievements/Scale Level 5 Mentorship.png",
    "Guide to Level 7": "/images/achievements/Guide to Level 7.png",
    "Lead to Level 9": "/images/achievements/Lead to Level 9.png",

    // Coming Soon Category
    "New Achievement Coming Soon": "/images/achievements/coming-soon.png" // Generic coming soon icon
  }

  return imageMap[achievementName] || null
}

export function PersistentProfileSystem() {
  const router = useRouter()
  const { user } = useSuiAuth()
  const { getDefaultCode, getReferralLink } = useReferralCodes()
  const { refreshTier } = useTierRefresh()
  const {
    profile,
    isLoading,
    error,
    isInitialized,
    updateProfile,
    updateTier,
    claimAchievement,
    updateAchievements,
    clearError,
    refreshProfile,
    fixLevelCalculation
  } = useProfile()

  // Get tier from profile context only (not subscription context)
  const tier = profile?.role_tier || 'NOMAD'

  // Function to refresh tier after NFT minting (can be called externally)
  const handleTierRefresh = useCallback(async () => {
    console.log('🔄 Refreshing tier after NFT mint...')
    await refreshTier()
    await refreshProfile()
  }, [refreshTier, refreshProfile])

  // State for UI interactions
  const [copied, setCopied] = useState(false)
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [claimingAchievement, setClaimingAchievement] = useState<any>(null)
  const [isClaimingTokens, setIsClaimingTokens] = useState(false)
  const [mobileTooltipOpen, setMobileTooltipOpen] = useState<number | null>(null)
  const [showLevelClaimDialog, setShowLevelClaimDialog] = useState(false)
  const [claimingLevel, setClaimingLevel] = useState<any>(null)
  const [isClaimingLevelTokens, setIsClaimingLevelTokens] = useState(false)
  const [showProgressionModal, setShowProgressionModal] = useState(false)
  const [showXFollowPopup, setShowXFollowPopup] = useState(false)

  // Level rewards state - Updated according to new progression system
  const [levelRewards, setLevelRewards] = useState([
    { level: 2, tokens: 0, available: false, claimed: false, description: "Unlock the 2nd Affiliate Level" },
    { level: 3, tokens: 0, available: false, claimed: false, description: "Unlock the 3rd Affiliate Level" },
    { level: 4, tokens: 0, available: false, claimed: false, description: "Unlock the 4th Affiliate Level" },
    { level: 5, tokens: 0, available: false, claimed: false, description: "Unlock the 5th Affiliate Level" },
    { level: 6, tokens: 500, available: false, claimed: false, description: "Earn 500 pAION" },
    { level: 7, tokens: 2000, available: false, claimed: false, description: "Earn 2,000 pAION" },
    { level: 8, tokens: 6000, available: false, claimed: false, description: "Earn 6,000 pAION" },
    { level: 9, tokens: 15000, available: false, claimed: false, description: "Earn 15,000 pAION" },
    { level: 10, tokens: 35000, available: false, claimed: false, description: "Earn 35,000 pAION" }
  ])

  // Affiliate link - use referral code if available, fallback to wallet address
  const defaultCode = getDefaultCode()
  const affiliateLink = defaultCode
    ? getReferralLink(defaultCode.code)
    : `https://aionet.com/ref/${user?.address?.slice(0, 8) || 'user'}`

  // Check if X follow achievement is unlocked
  const isXFollowAchievementUnlocked = (): boolean => {
    return profileData?.social_links?.some((link: any) =>
      link.platform === 'X' && link.following_aionet
    ) || false
  }

  // Function to determine if achievement should be unlocked based on user activity
  const checkAchievementUnlocked = (achievementName: string): boolean => {
    // Debug social links for achievement unlocking
    if (achievementName.includes("AIONET on X")) {
      console.log(`🔍 Checking achievement "${achievementName}":`, {
        social_links: profile?.social_links,
        platforms: profile?.social_links?.map((link: any) => link.platform),
        xLink: profile?.social_links?.find((link: any) => link.platform === 'X'),
        following_aionet: profile?.social_links?.find((link: any) => link.platform === 'X')?.following_aionet
      })
    }

    switch (achievementName) {
      case "Personalize Your Profile":
        // Unlocked if user has uploaded a profile image
        return !!profile?.profile_image_blob_id



      case "Advanced User Status":
        // Unlocked if user has reached level 5
        return (profile?.profile_level || 1) >= 5

      case "Follow Aionet on X":
      case "Follow AIONET on X":
        // Honor system: Unlocked when user claims they followed AIONET
        return profile?.social_links?.some((link: any) =>
          link.platform === 'X' && link.following_aionet
        ) || false

      case "Mint Royal NFT Status":
        // Unlocked if user has ROYAL tier
        return profile?.role_tier === 'ROYAL'

      // For now, other achievements are locked until we have more user activity data
      default:
        return false
    }
  }

  // Create achievements with proper unlock status
  const createAchievements = () => {
    const baseAchievements = [
      // Profile Category - Updated with new XP values according to specifications
      { name: "Personalize Your Profile", icon: User, color: "#4DA2FF", xp: 50, tokens: 0, category: "Profile", tooltip: "Upload a profile picture to your account" },
      { name: "Advanced User Status", icon: Star, color: "#FFD700", xp: 200, tokens: 0, category: "Profile", tooltip: "Achieve profile level 5" },

      // Social Connections Category
      { name: "Follow Aionet on X", icon: X, color: "#1DA1F2", xp: 50, tokens: 0, category: "Social Connections", tooltip: "Link your X (Twitter) account" },

      // Crypto Bot Activities Category - Updated with new names and XP values
      { name: "Automate Your Trades", icon: Link, color: "#F7931A", xp: 150, tokens: 0, category: "Crypto Bot Activities", tooltip: "Link your Bybit account" },
      { name: "Crypto Copy Trading", icon: Activity, color: "#9333EA", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Subscribe at least on 1 Crypto Bot" },
      { name: "Master Trading Cycles (1)", icon: Repeat, color: "#10B981", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 1 trading cycles with platform bots" },
      { name: "Master Trading Cycles (3)", icon: Repeat, color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 3 trading cycles with platform bots" },
      { name: "Master Trading Cycles (6)", icon: Repeat, color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 6 trading cycles with platform bots" },

      // User Upgrades Category
      { name: "Mint Royal NFT Status", icon: Crown, color: "#8B5CF6", xp: 300, tokens: 0, category: "User Upgrades", tooltip: "Mint a Royal NFT to achieve elite status" },

      // Referral Tiers Category - Updated with new XP values
      { name: "Recruit PRO NFT Holders", icon: Users, color: "#3B82F6", xp: 250, tokens: 0, category: "Referral Tiers", tooltip: "Refer 5 users to become PRO NFT holders" },
      { name: "Royal NFT Ambassadors", icon: Users, color: "#8B5CF6", xp: 300, tokens: 0, category: "Referral Tiers", tooltip: "Refer 3 users to become ROYAL NFT holders" },
      { name: "Build a NOMAD Network", icon: Users, color: "#F59E0B", xp: 500, tokens: 0, category: "Referral Tiers", tooltip: "Add 50 NOMAD users to your network" },
      { name: "Expand Your PRO Network", icon: Users, color: "#3B82F6", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 PRO users to your network" },
      { name: "Elite ROYAL Network", icon: Users, color: "#8B5CF6", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 ROYAL users to your network" },
      { name: "Mentor Level 5 Users", icon: Users, color: "#10B981", xp: 400, tokens: 0, category: "Referral Tiers", tooltip: "Help 10 network users achieve profile level 5" },
      { name: "Scale Level 5 Mentorship", icon: Users, color: "#10B981", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Help 50 network users achieve profile level 5" },
      { name: "Guide to Level 7", icon: Users, color: "#F59E0B", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Help 20 network users achieve profile level 7" },
      { name: "Lead to Level 9", icon: Users, color: "#FFD700", xp: 800, tokens: 0, category: "Referral Tiers", tooltip: "Help 5 network users achieve profile level 9" },

      // Coming Soon Category
      { name: "New Achievement Coming Soon", icon: Star, color: "#9CA3AF", xp: 300, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" },
      { name: "New Achievement Coming Soon", icon: Star, color: "#9CA3AF", xp: 500, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" }
    ]

    // If we have saved achievements, merge them with base achievements
    if (profile?.achievements_data && Array.isArray(profile.achievements_data) && profile.achievements_data.length > 0) {
      return baseAchievements.map((baseAchievement: any) => {
        const savedAchievement = profile.achievements_data.find((saved: any) => saved.name === baseAchievement.name)
        return {
          ...baseAchievement,
          unlocked: checkAchievementUnlocked(baseAchievement.name),
          claimed: savedAchievement?.claimed || false,
          claimed_at: savedAchievement?.claimed_at
        }
      })
    }

    // Otherwise, create fresh achievements with proper unlock status
    return baseAchievements.map((achievement: any) => ({
      ...achievement,
      unlocked: checkAchievementUnlocked(achievement.name),
      claimed: false
    }))
  }



  // Memoized profile data to prevent recreation on every render
  const profileData = useMemo(() => ({
    name: profile?.username || user?.username || "Affiliate User",
    username: profile?.username || user?.username || "@affiliate_user",
    social_links: profile?.social_links || [],

    levelInfo: {
      currentLevel: profile?.profile_level || 1,
      nextLevel: (profile?.profile_level || 1) >= 10 ? 10 : (profile?.profile_level || 1) + 1,
      currentXP: profile?.current_xp || 0,
      nextLevelXP: profile?.profile_level === 1 ? 100 :
                   profile?.profile_level === 2 ? 250 :
                   profile?.profile_level === 3 ? 450 :
                   profile?.profile_level === 4 ? 700 :
                   profile?.profile_level === 5 ? 1100 :
                   profile?.profile_level === 6 ? 1700 :
                   profile?.profile_level === 7 ? 2600 :
                   profile?.profile_level === 8 ? 3800 :
                   profile?.profile_level === 9 ? 5200 : 5200,
      totalXP: profile?.total_xp || 0
    },
    achievements: createAchievements()
  }), [
    profile?.username,
    profile?.profile_level,
    profile?.current_xp,
    profile?.total_xp,
    profile?.achievements_data,
    profile?.social_links
  ])

  // Update level rewards availability based on current level (optimized dependencies)
  useEffect(() => {
    if (profile) {
      const currentLevel = profile.profile_level || 1
      // Use referral_data.level_rewards as temporary storage until we add proper column
      const claimedLevels = profile.referral_data?.level_rewards || []

      setLevelRewards(prev => prev.map((reward: any) => {
        const isExplicitlyClaimed = claimedLevels.some((claimed: any) => claimed.level === reward.level)
        const isAvailable = currentLevel >= reward.level

        // Auto-unlock affiliate levels (levels 1-5 with 0 tokens) when reached
        const isAutoUnlocked = isAvailable && reward.tokens === 0 && reward.level <= currentLevel

        return {
          ...reward,
          available: isAvailable,
          claimed: isExplicitlyClaimed || isAutoUnlocked
        }
      }))
    }
  }, [profile?.profile_level, profile?.referral_data?.level_rewards]) // Only depend on specific fields

  // Removed tier synchronization to prevent sidebar re-renders
  // The profile page will use profile?.role_tier directly instead of the subscription context tier

  // Helper functions
  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join AIONET',
        text: 'Join the AIONET community and start your Web3 journey!',
        url: affiliateLink
      })
    } else {
      handleCopyLink()
    }
  }



  // Check if device is mobile
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const handleMobileTooltipClick = (index: number, e: React.MouseEvent) => {
    if (isMobile()) {
      e.stopPropagation()
      setMobileTooltipOpen(mobileTooltipOpen === index ? null : index)
    }
  }

  const getRoleStatusColor = (tier: string) => {
    switch (tier) {
      case 'ROYAL': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
      case 'PRO': return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
      case 'NOMAD': return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const handleClaimAchievement = async (achievement: any) => {
    setClaimingAchievement(achievement)
    setShowClaimDialog(true)
  }

  const confirmClaimAchievement = async () => {
    if (!claimingAchievement || !profile) {
      console.error('Missing claimingAchievement or profile:', { claimingAchievement, profile })
      return
    }

    setIsClaimingTokens(true)

    try {
      console.log('🎯 Starting achievement claim process for:', claimingAchievement.name)

      // Simulate claim process delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      // First, ensure the achievement exists in the database
      let currentAchievements = Array.isArray(profile.achievements_data) ? profile.achievements_data : []
      console.log('📋 Current achievements in database:', currentAchievements.length)

      // Check if achievement already exists in database
      const existingAchievement = currentAchievements.find((a: any) => a.name === claimingAchievement.name)
      console.log('🔍 Existing achievement found:', !!existingAchievement)

      if (!existingAchievement) {
        console.log('➕ Adding new achievement to database...')
        // Add the achievement to the database first
        const newAchievement = {
          name: claimingAchievement.name,
          icon: claimingAchievement.icon,
          color: claimingAchievement.color,
          unlocked: true,
          claimed: false,
          xp: claimingAchievement.xp,
          tooltip: claimingAchievement.tooltip,
          category: claimingAchievement.category || 'General'
        }

        currentAchievements = [...currentAchievements, newAchievement]

        // Update achievements in database using updateAchievements
        console.log('💾 Updating achievements in database...')
        const achievementUpdateSuccess = await updateAchievements(currentAchievements)
        if (!achievementUpdateSuccess) {
          throw new Error('Failed to add achievement to database')
        }
        console.log('✅ Achievement added to database successfully')
      }

      // Now claim the achievement and add XP
      console.log('🏆 Claiming achievement and adding XP...')
      console.log('📋 Profile before claim:', {
        achievements_count: Array.isArray(profile?.achievements_data) ? profile.achievements_data.length : 0,
        current_xp: profile?.current_xp,
        total_xp: profile?.total_xp
      })

      const success = await claimAchievement(claimingAchievement.name, claimingAchievement.xp, claimingAchievement.tokens || 0)

      if (success) {
        console.log('🎉 Achievement claimed successfully!')

        // Reload profile to get updated data
        console.log('🔄 Refreshing profile...')
        await refreshProfile()

        console.log('📋 Profile after refresh:', {
          achievements_count: Array.isArray(profile?.achievements_data) ? profile.achievements_data.length : 0,
          current_xp: profile?.current_xp,
          total_xp: profile?.total_xp,
          claimed_achievements: Array.isArray(profile?.achievements_data) ? profile.achievements_data.filter((a: any) => a.claimed).map((a: any) => a.name) : []
        })

        const tokensText = claimingAchievement.tokens ? `, +${claimingAchievement.tokens} pAION` : ''
        toast.success(`🎉 Achievement claimed! +${claimingAchievement.xp} XP${tokensText} added to your account`)
        setShowClaimDialog(false)
        setClaimingAchievement(null)
      } else {
        console.error('❌ Failed to claim achievement')
        toast.error('Failed to claim achievement. Please try again.')
      }
    } catch (error) {
      console.error('💥 Error claiming achievement:', error)
      toast.error(`Failed to claim achievement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsClaimingTokens(false)
  }

  const handleLevelClaim = (reward: any) => {
    setClaimingLevel(reward)
    setShowLevelClaimDialog(true)
  }

  const confirmClaimLevel = async () => {
    if (!claimingLevel || !profile || !user) {
      console.error('Missing claimingLevel, profile, or user:', { claimingLevel, profile, user })
      return
    }

    setIsClaimingLevelTokens(true)

    try {
      console.log('🎯 Starting level reward claim process for level:', claimingLevel.level)

      // Simulate claim process delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get current level rewards from database (stored in referral_data temporarily)
      let currentLevelRewards = profile.referral_data?.level_rewards || []
      console.log('📋 Current level rewards in database:', currentLevelRewards.length)

      // Check if level reward already claimed
      const existingClaim = currentLevelRewards.find((claim: any) => claim.level === claimingLevel.level)
      if (existingClaim) {
        console.log('⚠️ Level reward already claimed')
        toast.error('Level reward already claimed!')
        return
      }

      // Add new level reward claim
      const newLevelReward = {
        level: claimingLevel.level,
        tokens: claimingLevel.tokens,
        claimed_at: new Date().toISOString()
      }

      currentLevelRewards = [...currentLevelRewards, newLevelReward]

      // Update level rewards and tokens in database
      console.log('💾 Updating level rewards and tokens in database...')

      // Award pAION tokens if this level has token rewards
      if (claimingLevel.tokens > 0) {
        const { paionTokenService } = await import('@/lib/paion-token-service')
        await paionTokenService.addTokens(
          user.address,
          claimingLevel.tokens,
          `Level ${claimingLevel.level} reward`,
          'level_reward',
          claimingLevel.level.toString()
        )
      }

      // Update level rewards in database (no need to update points as pAION tokens are handled separately)
      const { data, error } = await encryptedStorage.supabase
        .from('user_profiles')
        .update({
          referral_data: {
            ...profile.referral_data,
            level_rewards: currentLevelRewards
          },
          updated_at: new Date().toISOString()
        })
        .eq('address', user?.address)
        .select()

      if (error) {
        console.error('❌ Database update failed:', error)
        throw new Error(`Database update failed: ${error.message}`)
      }

      console.log(`✅ Level reward claimed successfully!`)

      // Update local state
      setLevelRewards(prev => prev.map((reward: any) =>
        reward.level === claimingLevel.level
          ? { ...reward, claimed: true }
          : reward
      ))

      // Refresh profile to get updated data
      console.log('🔄 Refreshing profile...')
      await refreshProfile()

      const tokensText = claimingLevel.tokens > 0 ? ` +${claimingLevel.tokens} pAION` : ''
      toast.success(`🎉 Level ${claimingLevel.level} reward claimed!${tokensText}`)
      setShowLevelClaimDialog(false)
      setClaimingLevel(null)

    } catch (error) {
      console.error('💥 Error claiming level reward:', error)
      toast.error(`Failed to claim level reward: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsClaimingLevelTokens(false)
  }

  // Close mobile tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle clicks if mobile tooltip is actually open
      if (mobileTooltipOpen === null) return

      // Check if click is outside the tooltip area
      const target = event.target as Element
      if (target && !target.closest('[data-mobile-tooltip]')) {
        setMobileTooltipOpen(null)
      }
    }

    // Only add listener if mobile tooltip is open
    if (mobileTooltipOpen !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [mobileTooltipOpen])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#4DA2FF]" />
          <span className="text-white">Loading persistent profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-red-500 font-medium">Database Connection Error</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <Button
                onClick={clearError}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Profile Section - Original Design */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Profile Info - Takes 2/3 width */}
            <div className="lg:col-span-2 enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20 m-2 overflow-hidden">
              {/* Banner Image Section */}
              <div className="relative rounded-t-lg overflow-hidden">
                <EnhancedBanner
                  editable={true}
                  showStorageInfo={false}
                  showDeleteButton={false}
                  className="w-full h-64 rounded-none"
                />



                {/* Avatar - Left on desktop, centered on mobile */}
                <div className="absolute bottom-16 left-6 md:bottom-4 md:left-6 max-md:left-1/2 max-md:transform max-md:-translate-x-1/2">
                  <EnhancedAvatar
                    size="2xl"
                    editable={true}
                    showStorageInfo={false}
                    showDeleteButton={false}
                    showStatusIndicator={false}
                  />
                </div>



                {/* Status and Level - Bottom right on desktop, bottom center on mobile */}
                <div className="absolute bottom-4 right-4 md:right-4 max-md:left-1/2 max-md:transform max-md:-translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Badge className="bg-[#3b82f6] text-white text-xs px-2 py-1 h-8 flex items-center">
                    <div className="flex items-center gap-1">
                      <RoleImage role={(profile?.role_tier || "NOMAD") as "NOMAD" | "PRO" | "ROYAL"} size="md" />
                      {profile?.role_tier || "NOMAD"}
                    </div>
                  </Badge>
                  <Badge className="bg-[#3b82f6] text-white text-xs px-2 py-1 h-8 flex items-center">
                    Level {profileData.levelInfo.currentLevel}
                  </Badge>
                </div>
              </div>

              {/* Username and Referral Link below banner */}
              <div className="px-4 md:px-8 py-4 bg-[#1a2f51] border border-[#C0E6FF]/20">
                {/* Username with Referral Link */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 border border-[#C0E6FF]/10 rounded-lg px-3 py-2">
                      <img
                        src="/images/logo-icon.png"
                        alt="AIONET"
                        className="w-6 h-6 object-contain"
                      />
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-xl font-bold text-white">{profileData.name}</h2>
                        {profile?.location && getCountryCodeByName(profile.location) && (
                          <ReactCountryFlag
                            countryCode={getCountryCodeByName(profile.location)!}
                            svg
                            style={{
                              width: '1.5em',
                              height: '1.5em',
                            }}
                            title={profile.location}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Referral Link - positioned next to username */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    <span className="text-[#C0E6FF] text-sm font-medium">Referral:</span>
                    <div className="flex items-center gap-1 md:gap-2 bg-[#1a2f51]/50 border border-[#C0E6FF]/10 rounded-lg px-2 md:px-3 py-2">
                      <Input
                        value={affiliateLink}
                        readOnly
                        className="bg-transparent border-none text-[#FFFFFF] text-xs md:text-sm p-0 h-auto w-40 md:w-52 focus:ring-0"
                      />
                      <Button
                        onClick={handleCopyLink}
                        size="sm"
                        className="bg-transparent hover:bg-[#4DA2FF]/20 text-[#4DA2FF] p-1 md:p-2 h-auto"
                      >
                        {copied ? (
                          <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
                        ) : (
                          <Copy className="w-3 md:w-4 h-3 md:h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={handleShare}
                        size="sm"
                        className="bg-transparent hover:bg-[#C0E6FF]/20 text-[#C0E6FF] p-1 md:p-2 h-auto"
                      >
                        <ExternalLink className="w-3 md:w-4 h-3 md:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>









            </div>

            {/* Column 3: Action Buttons - Takes 1/3 width */}
            <div className="lg:col-span-1 enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg m-2">
              <div className="flex flex-col h-full p-6 gap-4">
                <h4 className="text-white font-semibold text-center">Quick Actions</h4>

                {/* Affiliate Controls Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => router.push('/affiliate-controls')}
                      className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>Affiliate Controls</span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-black/90 text-white border border-[#C0E6FF]/20">
                    <p className="text-sm">Manage your affiliates and view metrics</p>
                  </TooltipContent>
                </Tooltip>

                {/* Transaction History Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => router.push('/transaction-history')}
                      className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/80 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <History className="w-5 h-5" />
                        <span>Transaction History</span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-black/90 text-white border border-[#C0E6FF]/20">
                    <p className="text-sm">View your transaction history</p>
                  </TooltipContent>
                </Tooltip>

                {/* X Achievement Section - Only show if not unlocked */}
                {!isXFollowAchievementUnlocked() && (
                  <>
                    {/* Separator */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-[#C0E6FF]/20"></div>
                      <span className="text-[#C0E6FF] text-xs font-medium">X Achievement Unlock</span>
                      <div className="flex-1 h-px bg-[#C0E6FF]/20"></div>
                    </div>

                    {/* X Follow Achievement Button - Official X Style */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowXFollowPopup(true)}
                          className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-full border border-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <Image
                              src="/images/social/x.png"
                              alt="X (Twitter) icon"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-bold tracking-wide">Follow AIONET on X</span>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-black/90 text-white border border-[#C0E6FF]/20">
                        <p className="text-sm">Follow @AIONET_Official and earn 100 XP + 75 pAION</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>



      {/* Profile Progress & Rewards Section - Two Column Layout */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left Column: Profile Level Progress */}
            <div className="enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20">
              <div className="enhanced-card-content">
                <h3 className="text-white font-semibold mb-6 text-center">Profile Level Progress</h3>

                {/* Circular Level Progress Gauge */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-40 h-40 mb-4">
                    {/* Calculate progress once */}
                    {(() => {
                      const currentXP = profileData.levelInfo.currentXP;
                      const nextLevelXP = profileData.levelInfo.nextLevelXP;
                      const currentLevel = profileData.levelInfo.currentLevel;

                      const levelThresholds = [0, 100, 250, 450, 700, 1100, 1700, 2600, 3800, 5200];
                      const currentLevelStartXP = levelThresholds[currentLevel - 1] || 0;

                      const xpInCurrentLevel = currentXP - currentLevelStartXP;
                      const xpNeededForLevel = nextLevelXP - currentLevelStartXP;
                      const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));

                      const circumference = 2 * Math.PI * 45; // radius = 45
                      const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

                      return (
                        <>
                          {/* Background Circle */}
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="#1a2f51"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            {/* Progress Circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="url(#levelGradient)"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                            {/* Gradient Definition */}
                            <defs>
                              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4DA2FF" />
                                <stop offset="100%" stopColor="#00D4AA" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Center Content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-center bg-[#0a1628]/80 backdrop-blur-sm rounded-full w-24 h-24 flex flex-col items-center justify-center border border-[#C0E6FF]/20 shadow-lg">
                              <div className="text-2xl font-bold text-white mb-1">
                                {profileData.levelInfo.currentLevel}
                              </div>
                              <div className="text-sm text-[#C0E6FF]">Level</div>
                            </div>
                          </div>

                          {/* Progress Percentage Badge */}
                          <div className="absolute -top-1 right-1 bg-[#1a2f51] border border-[#C0E6FF]/30 text-[#C0E6FF] text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                            {progressPercent.toFixed(0)}%
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Level Info Below Gauge - Compact */}
                  <div className="flex justify-between items-center w-full text-center">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {profileData.levelInfo.currentLevel >= 10 ? "Status" : "Next"}
                      </div>
                      <div className="text-lg font-bold text-[#4DA2FF]">
                        {profileData.levelInfo.currentLevel >= 10 ? "MAX" : profileData.levelInfo.nextLevel}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {profileData.levelInfo.currentLevel >= 10 ? "Total XP" : "XP Needed"}
                      </div>
                      <div className="text-lg font-bold text-[#00D4AA]">
                        {profileData.levelInfo.currentLevel >= 10
                          ? profileData.levelInfo.totalXP.toLocaleString()
                          : (profileData.levelInfo.nextLevelXP - profileData.levelInfo.currentXP).toLocaleString()
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP Level Progression & Rewards Button - Compact */}
                <div>
                  <Button
                    onClick={() => setShowProgressionModal(true)}
                    className="w-full bg-gradient-to-r from-[#4DA2FF] to-[#00D4AA] hover:from-[#4DA2FF]/80 hover:to-[#00D4AA]/80 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>View Progression</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Profile Level Rewards */}
            <div className="enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20">
              <div className="enhanced-card-content">
                <h3 className="text-white font-semibold mb-4 text-center">Profile Level Rewards</h3>
                <div className="grid grid-cols-3 gap-2">
                  {levelRewards.map((reward: any) => (
                    <div key={reward.level} className="bg-[#1a2f51] rounded-lg p-2 border border-[#C0E6FF]/20 text-center">
                      <div className="text-white font-bold text-xs mb-1">Level {reward.level}</div>
                      <div className="text-[#C0E6FF] text-xs mb-2 min-h-[1.5rem] flex items-center justify-center leading-tight">
                        {reward.level <= 5 ? `Level ${reward.level}` : `${reward.tokens} pAION`}
                      </div>
                      {(() => {
                        // If already claimed, show checkmark
                        if (reward.claimed) {
                          return (
                            <div className="flex items-center justify-center py-1">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 text-xs ml-1">
                                {reward.tokens > 0 ? 'Claimed' : 'Unlocked'}
                              </span>
                            </div>
                          )
                        }

                        // If available and has tokens to claim, show claim button
                        if (reward.available && reward.tokens > 0) {
                          return (
                            <Button
                              size="sm"
                              onClick={() => handleLevelClaim(reward)}
                              className="w-full text-white text-xs py-1 px-1 bg-green-600 hover:bg-green-700 h-6"
                            >
                              Claim
                            </Button>
                          )
                        }

                        // If available but no tokens (affiliate levels), show unlocked
                        if (reward.available && reward.tokens === 0) {
                          return (
                            <div className="flex items-center justify-center py-1">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 text-xs ml-1">Unlocked</span>
                            </div>
                          )
                        }

                        // If not available, show locked
                        return (
                          <div className="text-[#6B7280] text-xs py-1 flex items-center justify-center">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Achievements Card - Complete with all achievements */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <h3 className="text-white font-semibold mb-4 text-center">Achievements</h3>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2 md:gap-3">
              {profileData.achievements.map((achievement: any, index: number) => {
                // Check if this achievement is claimed in the persistent profile
                // Ensure achievements_data is an array before using find()
                const achievementsData = Array.isArray(profile?.achievements_data) ? profile.achievements_data : []
                const persistentAchievement = achievementsData.find(
                  (a: any) => a.name === achievement.name
                )
                const isClaimedInDB = persistentAchievement?.claimed || false

                // Achievement state determined

                // Override the achievement claimed status with database data
                const updatedAchievement = {
                  ...achievement,
                  claimed: isClaimedInDB
                }

                const isLocked = !updatedAchievement.unlocked
                const canClaim = updatedAchievement.unlocked && !updatedAchievement.claimed

                const achievementCard = (
                  <div
                    key={index}
                    className={`flex flex-col items-center ${updatedAchievement.claimed ? 'justify-center' : 'justify-between'} gap-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer group relative min-h-[120px] ${
                      isLocked
                        ? 'bg-[#030f1c] border-[#C0E6FF]/10 opacity-60'
                        : updatedAchievement.claimed
                        ? 'bg-[#1a2f51] border-green-500/30 opacity-80'
                        : 'bg-[#1a2f51] border-[#C0E6FF]/20 hover:border-[#C0E6FF]/40'
                    }`}
                    onClick={(e) => handleMobileTooltipClick(index, e)}
                  >
                    {/* Claimed badge */}
                    {updatedAchievement.claimed && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}

                    {/* Mobile tooltip for achievement name */}
                    {mobileTooltipOpen === index && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded z-50 whitespace-nowrap md:hidden">
                        {achievement.name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </div>
                    )}

                    {/* Icon - centered for claimed, at top for others */}
                    <div className={`flex items-center justify-center transition-transform duration-200 ${
                      !isLocked ? 'group-hover:scale-110' : ''
                    } ${updatedAchievement.claimed ? 'flex-1' : ''}`}>
                      {isLocked ? (
                        <div
                          className="p-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${updatedAchievement.color}20` }}
                        >
                          <Lock
                            className="w-8 h-8"
                            style={{ color: '#6B7280' }}
                          />
                        </div>
                      ) : (() => {
                        // Check if achievement has a custom image path (for social media achievements)
                        if (updatedAchievement.image) {
                          return (
                            <Image
                              src={updatedAchievement.image}
                              alt={updatedAchievement.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-contain"
                            />
                          )
                        }

                        // Check for custom achievement images
                        const customImage = getAchievementImage(updatedAchievement.name)
                        if (customImage) {
                          return (
                            <Image
                              src={customImage}
                              alt={updatedAchievement.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-contain"
                            />
                          )
                        } else if (updatedAchievement.icon && typeof updatedAchievement.icon === 'function') {
                          const Icon = updatedAchievement.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>
                          return (
                            <div
                              className="p-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${updatedAchievement.color}20` }}
                            >
                              <Icon
                                className="w-8 h-8"
                                style={{ color: updatedAchievement.color }}
                              />
                            </div>
                          )
                        } else {
                          // Fallback for achievements without icons
                          return (
                            <div
                              className="p-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${updatedAchievement.color}20` }}
                            >
                              <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: updatedAchievement.color }}
                              />
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {/* Text below icon - only show if not claimed */}
                    {!updatedAchievement.claimed && (
                      <div className="text-center flex-1 flex items-center justify-center">
                        <span className={`text-xs font-medium leading-tight ${
                          isLocked ? 'text-[#6B7280]' : 'text-[#C0E6FF]'
                        }`}>
                          {updatedAchievement.name}
                        </span>
                      </div>
                    )}

                    {/* Claim button at bottom */}
                    {canClaim && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClaimAchievement(updatedAchievement)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 w-full"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                )

                // Always show tooltip if available
                if (updatedAchievement.tooltip) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        {achievementCard}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{updatedAchievement.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return achievementCard
              })}
            </div>
        </div>
      </div>

      {/* Achievement Claim Dialog */}
      {showClaimDialog && claimingAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-[#C0E6FF]/20 rounded-xl p-6 max-w-md w-full mx-4 relative overflow-hidden">
            <div className="relative z-10 text-center">
              {!isClaimingTokens ? (
                <>
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">🎉 Achievement Ready!</h3>
                    <p className="text-[#C0E6FF] mb-4">
                      Congratulations! You've unlocked the <span className="text-yellow-400 font-semibold">"{claimingAchievement.name}"</span> achievement!
                    </p>
                    <div className="bg-[#1a2f51] rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-bold text-xl">+{claimingAchievement.xp} XP</span>
                        {claimingAchievement.tokens > 0 && (
                          <>
                            <span className="text-[#C0E6FF]">•</span>
                            <Coins className="w-5 h-5 text-[#4da2ff]" />
                            <span className="text-white font-bold text-xl">+{claimingAchievement.tokens} pAION</span>
                          </>
                        )}
                      </div>
                      <p className="text-[#C0E6FF] text-sm">Will be added to your account</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowClaimDialog(false)}
                      variant="outline"
                      className="flex-1 border-[#C0E6FF]/50 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                    >
                      Later
                    </Button>
                    <Button
                      onClick={confirmClaimAchievement}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      🎁 Claim Now!
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">✨ Claiming Rewards...</h3>
                  <p className="text-[#C0E6FF] mb-4">
                    Adding {claimingAchievement.xp} XP{claimingAchievement.tokens > 0 ? ` and ${claimingAchievement.tokens} pAION` : ''} to your account!
                  </p>
                  <div className="w-full bg-[#1a2f51] rounded-full h-2 mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level Claim Dialog */}
      {showLevelClaimDialog && claimingLevel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-[#C0E6FF]/20 rounded-xl p-6 max-w-md w-full mx-4 relative overflow-hidden">
            <div className="relative z-10 text-center">
              {!isClaimingLevelTokens ? (
                <>
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">🎉 Level Reward Ready!</h3>
                    <p className="text-[#C0E6FF] mb-4">
                      Congratulations! You've reached <span className="text-yellow-400 font-semibold">Level {claimingLevel.level}</span> and unlocked your reward!
                    </p>
                    <div className="bg-[#1a2f51] rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        {claimingLevel.tokens > 0 ? (
                          <span className="text-white font-bold text-xl">+{claimingLevel.tokens} pAION</span>
                        ) : (
                          <span className="text-white font-bold text-lg">{claimingLevel.description}</span>
                        )}
                      </div>
                      <p className="text-[#C0E6FF] text-sm">
                        {claimingLevel.tokens > 0 ? "Will be added to your account" : "Feature unlocked!"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowLevelClaimDialog(false)}
                      variant="outline"
                      className="flex-1 border-[#C0E6FF]/50 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                    >
                      Later
                    </Button>
                    <Button
                      onClick={confirmClaimLevel}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      🎁 Claim Now!
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">✨ Claiming Reward...</h3>
                  <p className="text-[#C0E6FF] mb-4">
                    {claimingLevel.tokens > 0
                      ? `Adding ${claimingLevel.tokens} pAION to your account!`
                      : `Unlocking: ${claimingLevel.description}`
                    }
                  </p>
                  <div className="w-full bg-[#1a2f51] rounded-full h-2 mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* XP Level Progression & Rewards Modal */}
      {showProgressionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A1628] border border-[#C0E6FF]/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#C0E6FF]/20">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">XP Level Progression & Rewards</h2>
              </div>
              <button
                onClick={() => setShowProgressionModal(false)}
                className="text-[#C0E6FF] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#C0E6FF]/20">
                      <th className="text-left py-3 px-4 text-[#C0E6FF] font-semibold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        Level
                      </th>
                      <th className="text-left py-3 px-4 text-[#C0E6FF] font-semibold">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          XP Required
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-[#C0E6FF] font-semibold">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          XP from Previous
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-[#C0E6FF] font-semibold">
                        <div className="flex items-center gap-2">
                          <Unlock className="w-4 h-4 text-yellow-400" />
                          pAION Unlocked
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-[#C0E6FF] font-semibold">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-red-400" />
                          Total pAION
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { level: 1, xpRequired: 0, xpFromPrevious: 0, tokensUnlocked: 0, totalTokens: 0, description: "Starting level" },
                      { level: 2, xpRequired: 100, xpFromPrevious: 100, tokensUnlocked: 0, totalTokens: 0, description: "Unlock the 2nd Affiliate Level" },
                      { level: 3, xpRequired: 250, xpFromPrevious: 150, tokensUnlocked: 0, totalTokens: 0, description: "Unlock the 3rd Affiliate Level" },
                      { level: 4, xpRequired: 450, xpFromPrevious: 200, tokensUnlocked: 0, totalTokens: 0, description: "Unlock the 4th Affiliate Level" },
                      { level: 5, xpRequired: 700, xpFromPrevious: 250, tokensUnlocked: 0, totalTokens: 0, description: "Unlock the 5th Affiliate Level" },
                      { level: 6, xpRequired: 1100, xpFromPrevious: 400, tokensUnlocked: 500, totalTokens: 500, description: "Earn 500 pAION" },
                      { level: 7, xpRequired: 1700, xpFromPrevious: 600, tokensUnlocked: 2000, totalTokens: 2500, description: "Earn 2,000 pAION" },
                      { level: 8, xpRequired: 2600, xpFromPrevious: 900, tokensUnlocked: 6000, totalTokens: 8500, description: "Earn 6,000 pAION" },
                      { level: 9, xpRequired: 3800, xpFromPrevious: 1200, tokensUnlocked: 15000, totalTokens: 23500, description: "Earn 15,000 pAION" },
                      { level: 10, xpRequired: 5200, xpFromPrevious: 1400, tokensUnlocked: 35000, totalTokens: 58500, description: "Earn 35,000 pAION" }
                    ].map((row: any, index: number) => (
                      <tr key={row.level} className="border-b border-[#C0E6FF]/10 hover:bg-[#1a2f51]/30 transition-colors">
                        <td className="py-3 px-4 text-white font-semibold">{row.level}</td>
                        <td className="py-3 px-4 text-[#C0E6FF]">{row.xpRequired}</td>
                        <td className="py-3 px-4">
                          {row.xpFromPrevious > 0 ? (
                            <span className="text-green-400">+{row.xpFromPrevious}</span>
                          ) : (
                            <span className="text-[#C0E6FF]">{row.xpFromPrevious}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-yellow-400 font-semibold">{row.tokensUnlocked}</td>
                        <td className="py-3 px-4 text-white font-semibold">{row.totalTokens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Message */}
              <div className="mt-6 p-4 bg-[#1a2f51] rounded-lg border border-[#C0E6FF]/20">
                <div className="flex items-center gap-2 text-[#C0E6FF]">
                  <Gift className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">Earn XP by completing achievements. Each new level unlocks bigger rewards!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* X Follow Popup */}
      <XFollowPopup
        isOpen={showXFollowPopup}
        onClose={() => setShowXFollowPopup(false)}
      />
    </div>
  )
}





