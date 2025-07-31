"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { encryptedStorage, type DecryptedProfile, type Achievement } from '@/lib/encrypted-database-storage'
import { toast } from 'sonner'

interface ProfileContextType {
  profile: DecryptedProfile | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Actions
  loadProfile: () => Promise<void>
  updateProfile: (data: Partial<DecryptedProfile>) => Promise<boolean>
  updateUsername: (username: string) => Promise<boolean>


  updateTier: (tier: 'NOMAD' | 'PRO' | 'ROYAL') => Promise<boolean>
  updateXP: (currentXP: number, totalXP: number, level: number) => Promise<boolean>
  claimAchievement: (achievementName: string, xpReward: number, tokenReward?: number) => Promise<boolean>
  updateAchievements: (achievements: Achievement[]) => Promise<boolean>
  clearError: () => void
  refreshProfile: () => Promise<void>
  fixLevelCalculation: () => Promise<boolean>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Helper function to calculate level based on total XP
const calculateLevel = (totalXP: number): number => {
  const levelThresholds = [0, 100, 250, 450, 700, 1100, 1700, 2600, 3800, 5200]
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= levelThresholds[i]) {
      return i + 1
    }
  }
  return 1
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSuiAuth()
  const [profile, setProfile] = useState<DecryptedProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Stable reference to user address to prevent unnecessary re-renders
  const userAddress = user?.address
  const lastLoadedAddress = useRef<string | undefined>(undefined)

  // Load profile from database
  const loadProfile = useCallback(async () => {
    if (!user?.address) return

    setIsLoading(true)
    setError(null)

    try {
      const profileData = await encryptedStorage.getDecryptedProfile(user.address)

      if (profileData) {
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error)
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [user?.address])

  // Update profile
  const updateProfile = useCallback(async (data: Partial<DecryptedProfile>): Promise<boolean> => {
    if (!user?.address) return false

    setIsLoading(true)
    setError(null)

    try {
      const updatedProfile = await encryptedStorage.upsertEncryptedProfile(user.address, data)

      if (updatedProfile) {
        setProfile(updatedProfile)
        console.log('✅ Profile updated successfully')
        return true
      }
      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to update profile: ${errorMessage}`)
      toast.error(`Failed to save profile: ${errorMessage}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.address])

  // Other methods (simplified for now)
  const updateUsername = useCallback(async (username: string): Promise<boolean> => {
    return updateProfile({ username })
  }, [updateProfile])





  const updateTier = useCallback(async (tier: 'NOMAD' | 'PRO' | 'ROYAL'): Promise<boolean> => {
    return updateProfile({ role_tier: tier })
  }, [updateProfile])

  const updateXP = useCallback(async (currentXP: number, totalXP: number, level: number): Promise<boolean> => {
    return updateProfile({ current_xp: currentXP, total_xp: totalXP, profile_level: level })
  }, [updateProfile])

  const claimAchievement = useCallback(async (achievementName: string, xpReward: number, tokenReward?: number): Promise<boolean> => {
    if (!profile || !user?.address) return false

    try {
      // Get current achievements
      const currentAchievements = profile.achievements_data || []

      // Find the achievement to claim or create it if it doesn't exist
      const achievementIndex = currentAchievements.findIndex((a: any) => a.name === achievementName)
      let updatedAchievements = [...currentAchievements]

      if (achievementIndex === -1) {
        // Create new achievement and add it
        const newAchievement: Achievement = {
          name: achievementName,
          unlocked: true,
          claimed: true,
          claimed_at: new Date().toISOString(),
          xp: xpReward,
          category: 'General',
          color: '#4DA2FF', // Default blue color
          tooltip: `Achievement: ${achievementName}` // Default tooltip
        }
        updatedAchievements.push(newAchievement)
      } else {
        // Mark existing achievement as claimed
        updatedAchievements[achievementIndex] = {
          ...updatedAchievements[achievementIndex],
          claimed: true,
          claimed_at: new Date().toISOString()
        }
      }

      // Calculate new XP and level
      const newCurrentXP = (profile.current_xp || 0) + xpReward
      const newTotalXP = (profile.total_xp || 0) + xpReward

      // Calculate new level using helper function
      const newLevel = calculateLevel(newTotalXP)

      // Award pAION tokens if specified
      if (tokenReward && tokenReward > 0) {
        const { paionTokenService } = await import('@/lib/paion-token-service')
        await paionTokenService.addTokens(
          user.address,
          tokenReward,
          `Achievement reward: ${achievementName}`,
          'achievement',
          achievementName
        )
      }

      // Update profile with claimed achievement and new XP
      return updateProfile({
        achievements_data: updatedAchievements,
        current_xp: newCurrentXP,
        total_xp: newTotalXP,
        profile_level: newLevel
      })
    } catch (error) {
      console.error('Failed to claim achievement:', error)
      return false
    }
  }, [updateProfile, profile, user?.address])

  const updateAchievements = useCallback(async (achievements: Achievement[]): Promise<boolean> => {
    return updateProfile({ achievements_data: achievements })
  }, [updateProfile])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  // Fix level calculation based on current total XP
  const fixLevelCalculation = useCallback(async (): Promise<boolean> => {
    if (!profile || !user?.address) return false

    const currentTotalXP = profile.total_xp || 0
    const correctLevel = calculateLevel(currentTotalXP)

    // Only update if level is incorrect
    if (profile.profile_level !== correctLevel) {
      console.log(`🔧 Fixing level: ${profile.profile_level} → ${correctLevel} (${currentTotalXP} XP)`)
      return updateProfile({ profile_level: correctLevel })
    }

    return true
  }, [profile, user?.address, updateProfile])

  // Load profile when user changes (with stability check and loading guard)
  useEffect(() => {
    // Only load if address actually changed and not already loading
    if (!userAddress || lastLoadedAddress.current === userAddress || isLoading) {
      return
    }

    lastLoadedAddress.current = userAddress
    let isCancelled = false

    const doLoadProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const profileData = await encryptedStorage.getDecryptedProfile(userAddress)

        if (!isCancelled) {
          if (profileData) {
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ Failed to load profile:', error)
          setError('Failed to load profile')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    doLoadProfile()

    return () => {
      isCancelled = true
    }
  }, [userAddress]) // Only depend on stable userAddress

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    isInitialized,
    loadProfile,
    updateProfile,
    updateUsername,


    updateTier,
    updateXP,
    claimAchievement,
    updateAchievements,
    clearError,
    refreshProfile,
    fixLevelCalculation
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

// Export helper function for level calculation
export { calculateLevel }

// Backward compatibility - export the same interface as usePersistentProfile
export const usePersistentProfile = useProfile
