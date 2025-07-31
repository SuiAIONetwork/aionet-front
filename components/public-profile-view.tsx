"use client"

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  User,
  Calendar,
  Trophy,
  Star,
  Lock,
  Users,
  Link,
  Activity,
  Shield,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RoleImage } from '@/components/ui/role-image'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getCountryCodeByName } from '@/lib/locations'
import ReactCountryFlag from 'react-country-flag'



// Achievement image mapping function - Same as your profile
const getAchievementImage = (achievementName: string): string | null => {
  const imageMap: { [key: string]: string } = {
    // Profile/KYC Category
    "Personalize Your Profile": "/images/achievements/Personalize Your Profile.png",
    "Unlock Full Access": "/images/achievements/Unlock Full Access.png",
    "Advanced User Status": "/images/achievements/Advanced User Status.png",

    // Social Connections Category
    "Follow AIONET on X": "/images/achievements/Follow the Conversation.png", // Using Follow the Conversation icon
    "Follow Aionet on X": "/images/achievements/Follow the Conversation.png", // Alternative name variant

    // Crypto Bot Activities Category
    "Automate Your Trades": "/images/achievements/Automate Your Trades.png",
    "APLN Trading Signals": "/images/achievements/APLN Trading Signals.png",
    "HRMS Trading Insights": "/images/achievements/HRMS Trading Insights.png",
    "ATHN Trading Edge": "/images/achievements/ATHN Trading Edge.png",
    "Master Trading Cycles": "/images/achievements/Master Trading Cycles.png",

    // User Upgrades Category
    "Mint Royal NFT Status": "/images/achievements/Elite ROYAL Network.png",
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
    "Lead to Level 9": "/images/achievements/Lead to Level 9.png"
  }

  return imageMap[achievementName] || null
}

interface PublicProfileData {
  address: string
  username: string
  location?: string | null
  profileImageUrl: string | null
  bannerImageUrl: string | null
  roleTier: 'NOMAD' | 'PRO' | 'ROYAL'
  profileLevel: number
  currentXp: number
  totalXp: number
  kycStatus: string
  joinDate: string
  lastActive: string
  achievementsData: any[]
  memberSince: string
  xpProgress: {
    current: number
    required: number
    percentage: number
  } | null
}

interface PublicProfileViewProps {
  profileData: PublicProfileData
}

export function PublicProfileView({ profileData }: PublicProfileViewProps) {
  const [imageError, setImageError] = useState(false);

  // Helper function for XP requirements
  function getXpRequiredForLevel(level: number): number {
    const xpRequirements = [0, 100, 250, 450, 700, 1100, 1700, 2600, 3800, 5200];
    return xpRequirements[level] || 5200;
  }

  // Profile display data - memoized for performance
  const profileDisplayData = useMemo(() => ({
    name: profileData.username,
    levelInfo: {
      currentLevel: profileData.profileLevel || 1,
      nextLevel: (profileData.profileLevel || 1) + 1,
      currentXP: profileData.currentXp || 0,
      nextLevelXP: getXpRequiredForLevel((profileData.profileLevel || 1) + 1),
      totalXP: profileData.totalXp || 0
    }
  }), [profileData.username, profileData.profileLevel, profileData.currentXp, profileData.totalXp]);

  // Base achievements definition (same as in persistent profile)
  const baseAchievements = useMemo(() => [
    // Profile Category
    { name: "Personalize Your Profile", icon: User, color: "#4DA2FF", xp: 50, tokens: 0, category: "Profile", tooltip: "Upload a profile picture to your account" },
    { name: "Advanced User Status", icon: Star, color: "#FFD700", xp: 200, tokens: 0, category: "Profile", tooltip: "Achieve profile level 5" },

    // Social Connections Category
    { name: "Follow Aionet on X", icon: X, color: "#1DA1F2", xp: 50, tokens: 0, category: "Social Connections", tooltip: "Link your X (Twitter) account" },

    // Crypto Bot Activities Category
    { name: "Automate Your Trades", icon: Link, color: "#F7931A", xp: 150, tokens: 0, category: "Crypto Bot Activities", tooltip: "Link your Bybit account" },
    { name: "Crypto Copy Trading", icon: Activity, color: "#9333EA", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Subscribe at least on 1 Crypto Bot" },
    { name: "Master Trading Cycles (1)", icon: Activity, color: "#10B981", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 1 trading cycles with platform bots" },
    { name: "Master Trading Cycles (3)", icon: Activity, color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 3 trading cycles with platform bots" },
    { name: "Master Trading Cycles (6)", icon: Activity, color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 6 trading cycles with platform bots" },

    // User Upgrades Category
    { name: "Mint Royal NFT Status", icon: Shield, color: "#8B5CF6", xp: 300, tokens: 0, category: "User Upgrades", tooltip: "Mint a Royal NFT to achieve elite status" },

    // Referral Tiers Category
    { name: "Recruit PRO NFT Holders", icon: Users, color: "#3B82F6", xp: 250, tokens: 0, category: "Referral Tiers", tooltip: "Refer 5 users to become PRO NFT holders" },
    { name: "Royal NFT Ambassadors", icon: Users, color: "#8B5CF6", xp: 300, tokens: 0, category: "Referral Tiers", tooltip: "Refer 3 users to become ROYAL NFT holders" },
    { name: "Build a NOMAD Network", icon: Users, color: "#F59E0B", xp: 500, tokens: 0, category: "Referral Tiers", tooltip: "Add 50 NOMAD users to your network" },
    { name: "Expand Your PRO Network", icon: Users, color: "#3B82F6", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 PRO users to your network" },
    { name: "Elite ROYAL Network", icon: Users, color: "#8B5CF6", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 ROYAL users to your network" },
    { name: "Mentor Level 5 Users", icon: Users, color: "#10B981", xp: 400, tokens: 0, category: "Referral Tiers", tooltip: "Help 10 network users achieve profile level 5" },
    { name: "Scale Level 5 Mentorship", icon: Users, color: "#F59E0B", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Help 50 network users achieve profile level 5" },
    { name: "Guide to Level 7", icon: Users, color: "#8B5CF6", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Help 20 network users achieve profile level 7" },
    { name: "Lead to Level 9", icon: Users, color: "#FFD700", xp: 800, tokens: 0, category: "Referral Tiers", tooltip: "Help 5 network users achieve profile level 9" },

    // Coming Soon Category
    { name: "New Achievement Coming Soon", icon: Star, color: "#9CA3AF", xp: 300, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" },
    { name: "New Achievement Coming Soon", icon: Star, color: "#9CA3AF", xp: 500, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" }
  ], []);

  // Merge database achievements with base achievements - memoized
  const achievements = useMemo(() => {
    const dbAchievements = profileData.achievementsData || [];

    // Create merged achievements with full display properties
    const mergedAchievements = baseAchievements.map(baseAchievement => {
      const dbAchievement = dbAchievements.find((db: any) => db.name === baseAchievement.name);
      return {
        ...baseAchievement,
        unlocked: dbAchievement?.unlocked || false,
        claimed: dbAchievement?.claimed || false,
        claimed_at: dbAchievement?.claimed_at
      };
    });

    // Only return achievements that are unlocked or claimed, limited to 18
    return mergedAchievements
      .filter(achievement => achievement.unlocked || achievement.claimed)
      .slice(0, 18);
  }, [profileData.achievementsData, baseAchievements]);

  return (
    <div className="space-y-6">
      {/* User Profile Section - Exact same as your profile */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Profile Info - Takes 2/3 width */}
            <div className="lg:col-span-2 enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20 m-2 overflow-hidden">
              {/* Banner Image Section */}
              <div className="relative rounded-t-lg overflow-hidden">
                <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  {profileData.bannerImageUrl ? (
                    <Image
                      src={profileData.bannerImageUrl}
                      alt="Profile banner"
                      width={800}
                      height={192}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      priority={false}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">No banner image</div>
                  )}
                </div>

                {/* Avatar positioned on left side of banner - Optimized size */}
                <div className="absolute bottom-4 left-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#C0E6FF]/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    {profileData.profileImageUrl && !imageError ? (
                      <Image
                        src={profileData.profileImageUrl}
                        alt={`${profileData.username}'s profile`}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>



                {/* Status - Positioned at bottom right of banner (removed level) */}
                <div className="absolute bottom-4 right-4 flex flex-wrap items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Badge className="bg-[#3b82f6] text-white text-xs px-2 py-1 h-8 flex items-center">
                    <div className="flex items-center gap-1">
                      <RoleImage role={profileData.roleTier as "NOMAD" | "PRO" | "ROYAL"} size="md" />
                      {profileData.roleTier}
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Username below banner */}
              <div className="px-4 md:px-8 py-4 bg-[#1a2f51] border border-[#C0E6FF]/20 rounded-b-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex flex-col justify-center">
                    {/* Username and Profile Details - Same Line */}
                    <div className="flex flex-wrap items-center gap-4 border border-[#C0E6FF]/10 rounded-lg px-3 py-2">
                      {/* Username */}
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/logo-icon.png"
                          alt="AIONET"
                          className="w-6 h-6 object-contain"
                        />
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg md:text-xl font-bold text-white">{profileDisplayData.name}</h2>
                          {profileData.location && getCountryCodeByName(profileData.location) && (
                            <ReactCountryFlag
                              countryCode={getCountryCodeByName(profileData.location)!}
                              svg
                              style={{
                                width: '1.5em',
                                height: '1.5em',
                              }}
                              title={profileData.location}
                            />
                          )}
                        </div>
                      </div>

                      {/* Profile Details - Same Line */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">


                        {/* Join Date */}
                        {profileData.memberSince && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-400">Joined {profileData.memberSince}</span>
                          </div>
                        )}

                        {/* Profile Level */}
                        {profileData.profileLevel && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-400">Profile Level {profileData.profileLevel}</span>
                          </div>
                        )}

                        {/* Affiliate Level */}
                        {profileData.profileLevel && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-400">
                              Affiliate Level {Math.min(profileData.profileLevel, 5)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Achievements */}
            <div className="lg:col-span-1 enhanced-card bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg m-2">
              <div className="flex flex-col h-full">
                {/* Achievements Section */}
                <div className="w-full flex-1 p-6">
                  <h4 className="text-white font-semibold mb-6 text-center">Achievements</h4>

                  {/* Achievements Grid - 6x3 grid */}
                  {achievements.length > 0 ? (
                    <>
                      <div className="grid grid-cols-6 gap-0">
                        {achievements.map((achievement: any, index: number) => {
                          const isLocked = !achievement.unlocked && !achievement.claimed;
                          const canClaim = achievement.unlocked && !achievement.claimed;
                          const isClaimed = achievement.claimed;

                          return (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <div className="relative p-1 cursor-pointer w-20 h-20"
                                style={{
                                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                                }}>
                                  {/* Achievement Icon/Image - Doubled size for public profile */}
                                  <div className="flex items-center justify-center h-full">
                                    {isLocked ? (
                                      <Lock className="w-12 h-12 text-gray-500" />
                                    ) : achievement.image ? (
                                      <Image
                                        src={achievement.image}
                                        alt={achievement.name}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 object-contain"
                                        loading="lazy"
                                      />
                                    ) : (() => {
                                      const customImage = getAchievementImage(achievement.name);
                                      if (customImage) {
                                        return (
                                          <Image
                                            src={customImage}
                                            alt={achievement.name}
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 object-contain"
                                            loading="lazy"
                                          />
                                        );
                                      }
                                      const Icon = achievement.icon;
                                      return Icon ? (
                                        <Icon className="w-12 h-12" style={{ color: achievement.color }} />
                                      ) : (
                                        <Star className="w-12 h-12 text-gray-400" />
                                      );
                                    })()}
                                  </div>


                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1a2f51] border border-[#C0E6FF]/20 text-white p-2 max-w-xs">
                                <div className="text-sm font-medium">{achievement.name}</div>
                                {achievement.tooltip && (
                                  <div className="text-xs text-[#C0E6FF]/80 mt-1">{achievement.tooltip}</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* Show more indicator if there are more achievements */}
                      {achievements.length > 18 && (
                        <div className="text-center mt-3">
                          <div className="text-[#C0E6FF]/70 text-xs">
                            +{achievements.length - 18} more achievements
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-[#C0E6FF]/70 text-sm">
                      No achievements to display
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
