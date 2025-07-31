"use client"

import { useState, useEffect, useCallback } from 'react'
import { encryptedStorage, type DecryptedProfile } from '@/lib/encrypted-database-storage'
import { User, Achievement } from '@/components/user-search-interface'

interface CommunityUsersState {
  users: User[]
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

interface CommunityUsersActions {
  refreshUsers: () => Promise<void>
  clearError: () => void
}



// Helper function to get avatar URL (handles default avatars, Supabase storage, and legacy Walrus blobs)
const getAvatarUrl = async (blobId: string | null): Promise<string | undefined> => {
  if (!blobId) return undefined

  try {
    // Check if it's a default avatar path (starts with /images/animepfp/)
    if (blobId.startsWith('/images/animepfp/')) {
      return blobId // Return the path directly for default avatars
    }

    // Check if it's already a full URL (Supabase or Walrus)
    if (blobId.startsWith('http')) {
      return blobId
    }

    // Check if it's a Supabase storage path
    if (blobId.includes('/')) {
      // Import and use Supabase storage URL generator
      const { getImageUrl } = await import('@/lib/supabase-storage')
      const supabaseUrl = getImageUrl(blobId)
      if (supabaseUrl) {
        return supabaseUrl
      }
    }

    // Fallback to Walrus URL for old blob IDs
    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
  } catch (error) {
    console.warn('Failed to get avatar URL:', error)
    return undefined
  }
}

// Helper function to determine user status (mock for now, can be enhanced later)
const getUserStatus = (): 'online' | 'idle' | 'dnd' | 'offline' => {
  const statuses: ('online' | 'idle' | 'dnd' | 'offline')[] = ['online', 'idle', 'dnd', 'offline']
  const weights = [0.4, 0.3, 0.2, 0.1] // 40% online, 30% idle, 20% dnd, 10% offline
  
  const random = Math.random()
  let cumulative = 0
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i]
    if (random <= cumulative) {
      return statuses[i]
    }
  }
  
  return 'offline'
}

// Helper function to get last active time
const getLastActiveTime = (lastActive: string): string => {
  const now = new Date()
  const lastActiveDate = new Date(lastActive)
  const diffMs = now.getTime() - lastActiveDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}

// Helper function to convert database achievements to UI format
const convertAchievements = (achievementsData: any[], profile: DecryptedProfile): Achievement[] => {
  // Base achievements that should always be available (updated to match profile page exactly)
  const baseAchievements = [
    // Profile Category - Updated to match profile page
    { name: "Personalize Your Profile", color: "#4DA2FF", xp: 50, tokens: 0, category: "Profile", tooltip: "Upload a profile picture to your account" },
    { name: "Advanced User Status", color: "#FFD700", xp: 200, tokens: 0, category: "Profile", tooltip: "Achieve profile level 5" },

    // Social Connections Category - Updated to match profile page
    { name: "Follow Aionet on X", color: "#1DA1F2", xp: 50, tokens: 0, category: "Social Connections", tooltip: "Link your X (Twitter) account" },

    // Crypto Bot Activities Category - Updated to match profile page
    { name: "Automate Your Trades", color: "#F7931A", xp: 150, tokens: 0, category: "Crypto Bot Activities", tooltip: "Link your Bybit account" },
    { name: "Crypto Copy Trading", color: "#9333EA", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Subscribe at least on 1 Crypto Bot" },
    { name: "Master Trading Cycles (1)", color: "#10B981", xp: 100, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 1 trading cycles with platform bots" },
    { name: "Master Trading Cycles (3)", color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 3 trading cycles with platform bots" },
    { name: "Master Trading Cycles (6)", color: "#10B981", xp: 200, tokens: 0, category: "Crypto Bot Activities", tooltip: "Finish at least 6 trading cycles with platform bots" },

    // User Upgrades Category - Updated to match profile page
    { name: "Mint Royal NFT Status", color: "#8B5CF6", xp: 300, tokens: 0, category: "User Upgrades", tooltip: "Mint a Royal NFT to achieve elite status" },

    // Referral Tiers Category - Updated to match profile page
    { name: "Recruit PRO NFT Holders", color: "#3B82F6", xp: 250, tokens: 0, category: "Referral Tiers", tooltip: "Refer 5 users to become PRO NFT holders" },
    { name: "Royal NFT Ambassadors", color: "#8B5CF6", xp: 300, tokens: 0, category: "Referral Tiers", tooltip: "Refer 3 users to become ROYAL NFT holders" },
    { name: "Build a NOMAD Network", color: "#F59E0B", xp: 500, tokens: 0, category: "Referral Tiers", tooltip: "Add 50 NOMAD users to your network" },
    { name: "Expand Your PRO Network", color: "#3B82F6", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 PRO users to your network" },
    { name: "Elite ROYAL Network", color: "#8B5CF6", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Add 30 ROYAL users to your network" },
    { name: "Mentor Level 5 Users", color: "#10B981", xp: 400, tokens: 0, category: "Referral Tiers", tooltip: "Help 10 network users achieve profile level 5" },
    { name: "Scale Level 5 Mentorship", color: "#10B981", xp: 700, tokens: 0, category: "Referral Tiers", tooltip: "Help 50 network users achieve profile level 5" },
    { name: "Guide to Level 7", color: "#F59E0B", xp: 600, tokens: 0, category: "Referral Tiers", tooltip: "Help 20 network users achieve profile level 7" },
    { name: "Lead to Level 9", color: "#FFD700", xp: 800, tokens: 0, category: "Referral Tiers", tooltip: "Help 5 network users achieve profile level 9" },

    // Coming Soon Category
    { name: "New Achievement Coming Soon", color: "#9CA3AF", xp: 300, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" },
    { name: "New Achievement Coming Soon", color: "#9CA3AF", xp: 500, tokens: 0, category: "Coming Soon", tooltip: "New Achievement Coming Soon" }
  ]

  // Function to check if achievement should be unlocked based on profile data
  const checkAchievementUnlocked = (achievementName: string): boolean => {
    switch (achievementName) {
      case "Personalize Your Profile":
        return !!profile?.profile_image_blob_id
      case "Unlock Full Access":
        return false // KYC disabled
      case "Advanced User Status":
        return (profile?.profile_level || 1) >= 5
      case "Follow Aionet on X":
      case "Follow AIONET on X":
        return profile?.social_links?.some((link: any) => link.platform === 'X' && link.following_aionet) || false
      case "Mint Royal NFT Status":
        return profile?.role_tier === 'ROYAL'
      // For other achievements, assume unlocked if they exist in database
      default:
        return achievementsData?.some((dbAchievement: any) => dbAchievement.name === achievementName && dbAchievement.unlocked) || false
    }
  }

  // Create achievements with proper unlock status and merge with database data
  return baseAchievements.map((baseAchievement: any) => {
    const savedAchievement = Array.isArray(achievementsData) ? achievementsData.find((saved: any) => saved.name === baseAchievement.name) : null
    return {
      ...baseAchievement,
      unlocked: checkAchievementUnlocked(baseAchievement.name),
      claimed: savedAchievement?.claimed || false,
      claimed_at: savedAchievement?.claimed_at
    }
  })
}



// Helper function to convert database profile to User format
const convertProfileToUser = async (profile: DecryptedProfile): Promise<User> => {
  const avatarUrl = profile.profile_image_blob_id 
    ? await getAvatarUrl(profile.profile_image_blob_id)
    : undefined

  return {
    id: profile.address, // Use wallet address as unique ID
    name: profile.username || `User ${profile.address.slice(0, 6)}`,
    username: profile.username ? `@${profile.username.toLowerCase().replace(/\s+/g, '_')}` : `@${profile.address.slice(0, 8)}`,
    email: profile.email || `${profile.address.slice(0, 8)}@example.com`,
    avatar: avatarUrl || '',
    role: profile.role_tier || 'NOMAD',
    joinDate: profile.join_date ? new Date(profile.join_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    lastActive: profile.last_active ? getLastActiveTime(profile.last_active) : 'Unknown',
    totalPoints: profile.points || 0,
    level: profile.profile_level || 1,
    activity: 'AIONET member',
    location: profile.location || 'Unknown',
    bio: 'AIONET community member',
    achievements: convertAchievements(profile.achievements_data || [], profile),

  }
}

export function useCommunityUsers(): CommunityUsersState & CommunityUsersActions {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load users from database using existing working methods
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Loading community users from database...')

      // First, get all user addresses using a simple query
      const { data: addressData, error: addressError } = await encryptedStorage.supabase
        .from('user_profiles')
        .select('address')
        .order('updated_at', { ascending: false })
        .limit(100)

      if (addressError) {
        console.error('❌ Failed to get user addresses:', addressError)
        throw new Error(`Database query failed: ${addressError.message}`)
      }

      console.log(`📊 Found ${addressData?.length || 0} user addresses in database`)

      if (!addressData || addressData.length === 0) {
        console.log('ℹ️ No profiles found in database')
        setUsers([])
        return
      }

      // Now get each profile using the working getDecryptedProfile method
      const convertedUsers: User[] = []
      for (const { address } of addressData) {
        try {
          console.log(`🔍 Loading profile for: ${address}`)
          const profile = await encryptedStorage.getDecryptedProfile(address)

          if (profile) {
            const user = await convertProfileToUser(profile)
            convertedUsers.push(user)
            console.log(`✅ Successfully loaded profile for: ${address}`)
          } else {
            console.warn(`⚠️ No profile data found for: ${address}`)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load profile ${address}:`, error)
          // Continue with other profiles
        }
      }

      console.log(`✅ Successfully converted ${convertedUsers.length} users`)
      setUsers(convertedUsers)

    } catch (error) {
      console.error('❌ Failed to load community users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load community users: ${errorMessage}`)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  // Refresh users
  const refreshUsers = useCallback(async () => {
    await loadUsers()
  }, [loadUsers])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return {
    users,
    isLoading,
    error,
    isInitialized,
    refreshUsers,
    clearError
  }
}
