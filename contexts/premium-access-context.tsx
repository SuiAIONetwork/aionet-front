"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSubscription } from "./subscription-context"
import { useSuiAuth } from "./sui-auth-context"
import { getUserPremiumAccess, recordPremiumAccess as dbRecordPremiumAccess, channelAccessStorage, type UserPremiumAccess } from "@/lib/channel-access-storage"

interface PremiumAccessRecord {
  creatorId: string
  channelId: string
  accessedAt: Date
  tier: 'PRO' | 'ROYAL'
}

interface PremiumAccessContextType {
  premiumAccessCount: number
  premiumAccessLimit: number
  premiumAccessRecords: PremiumAccessRecord[]
  canAccessPremiumForFree: (creatorId: string, channelId: string) => boolean
  recordPremiumAccess: (creatorId: string, channelId: string) => Promise<void>
  removePremiumAccess: (creatorId: string, channelId: string) => Promise<void>
  getRemainingFreeAccess: () => number
  resetPremiumAccess: () => Promise<void>
  refreshPremiumAccess: () => Promise<void>
}

const PremiumAccessContext = createContext<PremiumAccessContextType | undefined>(undefined)

export function PremiumAccessProvider({ children }: { children: React.ReactNode }) {
  const subscriptionContext = useSubscription()
  const { tier } = subscriptionContext
  const { user } = useSuiAuth()
  const [premiumAccessRecords, setPremiumAccessRecords] = useState<PremiumAccessRecord[]>([])
  const [isLoaded, setIsLoaded] = useState(false)



  // Define limits based on tier
  const premiumAccessLimit = tier === 'ROYAL' ? 9 : tier === 'PRO' ? 3 : 0

  // Load premium access records from database
  useEffect(() => {
    const loadPremiumAccessRecords = async () => {
      if (!user?.address) {
        setPremiumAccessRecords([])
        setIsLoaded(true)
        return
      }

      try {
        const dbRecords = await getUserPremiumAccess(user.address)
        const records: PremiumAccessRecord[] = dbRecords.map((record: UserPremiumAccess) => ({
          creatorId: record.creatorId,
          channelId: record.channelId,
          accessedAt: record.accessedDate,
          tier: record.tier
        }))

        setPremiumAccessRecords(records)
      } catch (error) {
        console.error('[PremiumAccess] Failed to load premium access records from database:', error)
        setPremiumAccessRecords([])
      }

      setIsLoaded(true)
    }

    loadPremiumAccessRecords()
  }, [user?.address])

  // Filter records for current tier (in case user upgraded/downgraded)
  const currentTierRecords = premiumAccessRecords.filter(record => record.tier === tier)
  const premiumAccessCount = currentTierRecords.length

  const canAccessPremiumForFree = (creatorId: string, channelId: string) => {
    // NOMAD users never get free premium access
    if (tier === 'NOMAD') {
      return false
    }

    // Check if already accessed this specific channel
    const alreadyAccessed = currentTierRecords.some(
      record => record.creatorId === creatorId && record.channelId === channelId
    )

    if (alreadyAccessed) {
      return true // Already used a slot for this channel
    }

    // Check if user has remaining free access slots
    const hasRemainingSlots = premiumAccessCount < premiumAccessLimit
    return hasRemainingSlots
  }

  const recordPremiumAccess = async (creatorId: string, channelId: string) => {
    // Only record if it's a new access and user has a premium tier
    if (tier === 'NOMAD' || !user?.address) return

    const alreadyAccessed = currentTierRecords.some(
      record => record.creatorId === creatorId && record.channelId === channelId
    )

    if (!alreadyAccessed && premiumAccessCount < premiumAccessLimit) {
      const newRecord: PremiumAccessRecord = {
        creatorId,
        channelId,
        accessedAt: new Date(),
        tier: tier as 'PRO' | 'ROYAL'
      }

      // Update local state immediately for UI feedback
      setPremiumAccessRecords(prev => [...prev, newRecord])
      console.log(`[PremiumAccess] Used free slot: ${premiumAccessCount + 1}/${premiumAccessLimit} for ${tier} user`)

      // Save to database
      try {
        await dbRecordPremiumAccess(user.address, creatorId, channelId, tier as 'PRO' | 'ROYAL')
        console.log(`[PremiumAccess] Saved premium access record to database`)
      } catch (error) {
        console.error('[PremiumAccess] Failed to save premium access record to database:', error)
        // Revert local state on database error
        setPremiumAccessRecords(prev =>
          prev.filter(record =>
            !(record.creatorId === creatorId && record.channelId === channelId)
          )
        )
      }
    }
  }

  const removePremiumAccess = async (creatorId: string, channelId: string) => {
    if (!user?.address) return

    // Update local state immediately
    setPremiumAccessRecords(prev =>
      prev.filter(record =>
        !(record.creatorId === creatorId && record.channelId === channelId)
      )
    )
    console.log(`[PremiumAccess] Removed premium access for ${creatorId}_${channelId}`)

    // Remove from database
    try {
      await channelAccessStorage.removePremiumAccess(user.address, creatorId, channelId)
      console.log(`[PremiumAccess] Removed premium access record from database`)
    } catch (error) {
      console.error('[PremiumAccess] Failed to remove premium access record from database:', error)
    }
  }

  const getRemainingFreeAccess = () => {
    return Math.max(0, premiumAccessLimit - premiumAccessCount)
  }

  const resetPremiumAccess = async () => {
    setPremiumAccessRecords([])
    console.log(`[PremiumAccess] Reset premium access records`)

    // Note: We don't clear database records here as they should persist
    // This function is mainly for tier downgrades and testing
  }

  const refreshPremiumAccess = async () => {
    if (!user?.address) return

    try {
      const dbRecords = await getUserPremiumAccess(user.address)
      const records: PremiumAccessRecord[] = dbRecords.map((record: UserPremiumAccess) => ({
        creatorId: record.creatorId,
        channelId: record.channelId,
        accessedAt: record.accessedDate,
        tier: record.tier
      }))

      setPremiumAccessRecords(records)
      console.log(`[PremiumAccess] Refreshed ${records.length} premium access records from database`)
    } catch (error) {
      console.error('[PremiumAccess] Failed to refresh premium access records:', error)
    }
  }

  // Reset records when tier changes to NOMAD (downgrade)
  useEffect(() => {
    if (tier === 'NOMAD' && premiumAccessRecords.length > 0) {
      setPremiumAccessRecords([])
      console.log(`[PremiumAccess] Reset premium access records for NOMAD tier`)
    }
  }, [tier, premiumAccessRecords.length])

  // Add global debug function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPremiumAccess = () => {
        console.log('Premium Access Debug:')
        console.log('- Tier:', tier)
        console.log('- Limit:', premiumAccessLimit)
        console.log('- Used:', premiumAccessCount)
        console.log('- Remaining:', getRemainingFreeAccess())
        console.log('- Records:', currentTierRecords)
      }
    }
  }, [])

  return (
    <PremiumAccessContext.Provider
      value={{
        premiumAccessCount,
        premiumAccessLimit,
        premiumAccessRecords: currentTierRecords,
        canAccessPremiumForFree,
        recordPremiumAccess,
        removePremiumAccess,
        getRemainingFreeAccess,
        resetPremiumAccess,
        refreshPremiumAccess,
      }}
    >
      {children}
    </PremiumAccessContext.Provider>
  )
}

export function usePremiumAccess() {
  const context = useContext(PremiumAccessContext)
  if (context === undefined) {
    throw new Error("usePremiumAccess must be used within a PremiumAccessProvider")
  }
  return context
}

export type { PremiumAccessRecord }
