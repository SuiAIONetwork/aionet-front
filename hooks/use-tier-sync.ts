"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useSubscription } from '@/contexts/subscription-context'
import { useProfile } from '@/contexts/profile-context'
import { nftMintingService, NFTTier } from '@/lib/nft-minting-service'
import { encryptedStorage } from '@/lib/encrypted-database-storage'
// Note: tier-debug module removed as it was unused
import { toast } from 'sonner'

/**
 * Hook to automatically sync user tier based on NFTs in wallet
 */
export function useTierSync() {
  const account = useCurrentAccount()
  const { user } = useSuiAuth()
  const { tier: currentTier, reloadTier } = useSubscription()
  const { refreshProfile, updateTier } = useProfile()

  // Prevent multiple simultaneous updates
  const isUpdating = useRef(false)
  const lastUpdateTime = useRef(0)

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address

  /**
   * Ensure user profile exists in database
   */
  const ensureUserProfile = useCallback(async (address: string) => {
    try {
      console.log('🔍 Checking if user profile exists...')
      const profile = await encryptedStorage.getDecryptedProfile(address)

      if (!profile) {
        console.log('➕ Creating user profile...')
        // Profile doesn't exist, create a basic one
        await encryptedStorage.updateUserTier(address, 'NOMAD')
        console.log('✅ User profile created')
      } else {
        console.log('✅ User profile exists')
      }
    } catch (error) {
      console.error('❌ Error ensuring user profile:', error)
      // Try to create profile anyway
      try {
        await encryptedStorage.updateUserTier(address, 'NOMAD')
        console.log('✅ User profile created as fallback')
      } catch (createError) {
        console.error('❌ Failed to create user profile:', createError)
        throw createError
      }
    }
  }, [])

  /**
   * Check NFTs and update tier if needed
   */
  const syncTierFromNFTs = useCallback(async () => {
    if (!userAddress) {
      console.log('🔍 No wallet connected, skipping tier sync')
      return
    }

    // Skip if tier already matches NFT tier to prevent loops
    const nftTierPreCheck = await nftMintingService.getUserTier(userAddress)
    if (nftTierPreCheck === currentTier && currentTier !== 'NOMAD') {
      console.log(`✅ Tier already matches NFT tier: ${currentTier}`)
      return
    }

    // Prevent multiple simultaneous updates
    if (isUpdating.current) {
      console.log('🔄 Tier sync already in progress, skipping...')
      return
    }

    // Prevent too frequent updates (minimum 5 seconds between updates)
    const now = Date.now()
    if (now - lastUpdateTime.current < 5000) {
      console.log('🔄 Tier sync too frequent, skipping...')
      return
    }

    isUpdating.current = true
    lastUpdateTime.current = now

    try {
      console.log('🔄 Syncing tier from NFTs...')

      // Ensure user profile exists first
      await ensureUserProfile(userAddress)

      // Get user's highest tier based on NFTs
      const nftTier = await nftMintingService.getUserTier(userAddress)
      console.log(`🎯 NFT tier detected: ${nftTier}, Current tier: ${currentTier}`)

      // Update tier if it's different and higher priority
      if (nftTier !== currentTier) {
        const tierPriority = { 'NOMAD': 0, 'PRO': 1, 'ROYAL': 2 }
        const currentPriority = tierPriority[currentTier as keyof typeof tierPriority] || 0
        const nftPriority = tierPriority[nftTier as keyof typeof tierPriority] || 0

        // Only update if NFT tier is higher or if current tier is not set properly
        if (nftPriority >= currentPriority || currentTier === 'NOMAD') {
          console.log(`⬆️ Updating tier from ${currentTier} to ${nftTier}`)

          try {
            // Update tier through profile context (not subscription context)
            const success = await updateTier(nftTier)
            if (success) {
              console.log(`✅ Tier successfully updated to ${nftTier}`)

              // Wait for database update to complete
              await new Promise(resolve => setTimeout(resolve, 1000))

              // Reload subscription tier from profile
              await reloadTier()
              console.log(`🔄 Subscription tier synced from profile`)
            } else {
              throw new Error('Failed to update tier in profile')
            }

            // Show success message
            if (nftTier !== 'NOMAD') {
              toast.success(`🎉 Tier Updated!`, {
                description: `Your tier has been updated to ${nftTier} based on your NFTs`,
                duration: 4000
              })
            }

          } catch (error) {
            console.error(`❌ Failed to update tier to ${nftTier}:`, error)
            toast.error(`Failed to update tier`, {
              description: `Could not update your tier to ${nftTier}. Please try again.`,
              duration: 4000
            })
          }
        } else {
          console.log(`✅ Current tier ${currentTier} is higher than NFT tier ${nftTier}, keeping current`)
        }
      } else {
        console.log(`✅ Tier already synced: ${nftTier}`)
      }

    } catch (error) {
      console.error('❌ Error syncing tier from NFTs:', error)
      toast.error('Failed to sync tier', {
        description: 'Could not sync your tier from NFTs. Please try refreshing.',
        duration: 4000
      })
    } finally {
      isUpdating.current = false
    }
  }, [userAddress, currentTier, updateTier, reloadTier, ensureUserProfile])

  /**
   * Auto-sync only on wallet connection (not on every render)
   * Only sync if we haven't synced recently
   */
  useEffect(() => {
    if (userAddress && !isUpdating.current) {
      const now = Date.now()
      // Only sync if it's been more than 30 seconds since last sync
      if (now - lastUpdateTime.current > 30000) {
        console.log('👛 Wallet connected, syncing tier...')
        syncTierFromNFTs()
      }
    }
  }, [userAddress]) // Only depend on userAddress, not the function

  return {
    syncTierFromNFTs,
    userAddress,
    currentTier
  }
}

/**
 * Hook for manual tier refresh
 */
export function useTierRefresh() {
  const { syncTierFromNFTs } = useTierSync()

  const refreshTier = useCallback(async () => {
    console.log('🔄 Manual tier refresh requested')
    await syncTierFromNFTs()
  }, [syncTierFromNFTs])

  return { refreshTier }
}
