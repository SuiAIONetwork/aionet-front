"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { encryptedStorage } from "@/lib/encrypted-database-storage"
import { toast } from "sonner"
import { useProfile } from "@/contexts/profile-context"

export type SubscriptionTier = "NOMAD" | "PRO" | "ROYAL"

interface SubscriptionContextType {
  tier: SubscriptionTier
  setTier: (tier: SubscriptionTier) => Promise<void>
  reloadTier: () => Promise<void>
  canAccessCryptoBots: boolean
  canAccessForexBots: boolean
  canAccessStockBots: boolean
  upgradeToPremium: () => Promise<void>
  upgradeToVIP: () => Promise<void>
  isUpdatingTier: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSuiAuth()
  const currentAccount = useCurrentAccount()
  const { profile, isInitialized: profileInitialized } = useProfile()

  // Initialize with NOMAD as default tier
  const [tier, setTierState] = useState<SubscriptionTier>("NOMAD")

  const [isLoaded, setIsLoaded] = useState(false)
  const [isUpdatingTier, setIsUpdatingTier] = useState(false)

  // Prevent infinite re-renders with stable references
  // Get user address from either SuiAuth context or current account
  const stableUserAddress = useMemo(() =>
    user?.address || currentAccount?.address,
    [user?.address, currentAccount?.address]
  )

  // Determine access based on AIONET tier system
  // NOMAD (free tier) can access crypto bots with cycle system
  // PRO can access crypto bots for free
  // ROYAL can access all bots for free (crypto, stock, forex)
  const canAccessCryptoBots = tier === "NOMAD" || tier === "PRO" || tier === "ROYAL"
  const canAccessForexBots = tier === "ROYAL"  // ROYAL-only
  const canAccessStockBots = tier === "ROYAL"  // ROYAL-only

  // Read-only tier management - subscription context only reads from profile, doesn't write
  const setTier = async (newTier: SubscriptionTier) => {
    console.warn('⚠️ setTier called on subscription context - this should use profile context instead')
    // For now, just update local state but don't persist to database
    // Components should use profile context updateTier instead
    setTierState(newTier)
  }

  // Upgrade functions with database persistence
  const upgradeToPremium = async () => {
    await setTier("PRO")
  }

  const upgradeToVIP = async () => {
    await setTier("ROYAL")
  }

  // Sync tier when profile changes (optimized to prevent sidebar blinking)
  useEffect(() => {
    if (profileInitialized) {
      const profileTier = profile?.role_tier || "NOMAD"

      // Only update if tier actually changed
      if (profileTier !== tier) {
        setTierState(profileTier)
      }
      setIsLoaded(true)
    }
  }, [profile?.role_tier, profileInitialized, tier])

  // Reload tier function for external use (read-only)
  const reloadTier = useCallback(async () => {
    console.log('🔄 Manual tier reload requested - syncing from profile')
    // Just sync from current profile state, don't force database reload
    if (profileInitialized) {
      const profileTier = profile?.role_tier || "NOMAD"
      setTierState(profileTier)
    }
  }, [profileInitialized, profile?.role_tier])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    tier,
    setTier,
    reloadTier,
    canAccessCryptoBots,
    canAccessForexBots,
    canAccessStockBots,
    upgradeToPremium,
    upgradeToVIP,
    isUpdatingTier,
  }), [tier, reloadTier, canAccessCryptoBots, canAccessForexBots, canAccessStockBots, isUpdatingTier])

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
