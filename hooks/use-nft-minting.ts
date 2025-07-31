"use client"

import { useState, useCallback } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useZkLoginWallet } from '@/hooks/use-zklogin-wallet'
import { nftMintingService, NFTTier, MintResult, NFT_PRICING } from '@/lib/nft-minting-service'
import { toast } from 'sonner'

interface UseMintingReturn {
  isMinting: boolean
  mintNFT: (tier: NFTTier) => Promise<MintResult>
  checkUserTier: () => Promise<NFTTier | 'NOMAD'>
  getUserNFTs: () => Promise<any[]>
  hasNFTTier: (tier: NFTTier) => Promise<boolean>
  validateMinting: (tier: NFTTier, balance: number) => Promise<{ valid: boolean; error?: string }>
}

/**
 * Hook for NFT minting functionality
 */
export function useNFTMinting(): UseMintingReturn {
  const [isMinting, setIsMinting] = useState(false)
  const account = useCurrentAccount()
  const { user } = useSuiAuth()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { wallet: zkWallet, signAndExecuteTransaction: zkSignAndExecute, isConnected: isZkConnected } = useZkLoginWallet()

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address

  // Determine connection type
  const isZkLogin = user?.connectionType === 'zklogin'

  /**
   * Mint NFT directly with user's wallet
   */
  const mintNFT = useCallback(async (tier: NFTTier): Promise<MintResult> => {
    if (!userAddress) {
      const error = 'Please connect your wallet first'
      toast.error(error)
      return { success: false, error }
    }

    setIsMinting(true)

    try {
      console.log(`🎨 Starting ${tier} NFT mint for:`, userAddress)
      console.log(`💰 Minting cost: ${NFT_PRICING[tier].costSui} SUI`)
      console.log(`🔗 Connection type: ${isZkLogin ? 'zkLogin' : 'traditional wallet'}`)

      // Show loading toast
      const loadingToast = toast.loading(`Minting ${tier} NFT...`, {
        description: isZkLogin
          ? 'Please confirm the transaction with your Google account'
          : 'Please confirm the transaction in your wallet'
      })

      // Create transaction
      const transaction = nftMintingService.createMintTransaction(tier, userAddress)
      console.log('📝 Transaction created:', transaction)

      let result: any

      if (isZkLogin && zkWallet && isZkConnected) {
        // Fallback to legacy zkLogin (will likely fail due to deprecated proving service)
        console.log('🔐 Using legacy zkLogin wallet for transaction signing...')
        try {
          result = await zkSignAndExecute(transaction, {
            showToast: false, // We handle our own toasts
            onSuccess: (txResult) => {
              console.log('✅ zkLogin transaction successful:', txResult)
            },
            onError: (error) => {
              console.error('❌ zkLogin transaction failed:', error)
              throw error
            }
          })
        } catch (zkError) {
          console.error('❌ zkLogin transaction error:', zkError)

          // Check if this is a proving service deprecation error
          if (zkError instanceof Error &&
              (zkError.message.includes('proving service') ||
               zkError.message.includes('deprecated') ||
               zkError.message.includes('Missing required parameters for proof generation'))) {
            throw new Error(
              'zkLogin proving service is deprecated. Please reconnect using Enoki social login for better experience. ' +
              'Alternatively, you can connect a traditional wallet.'
            )
          }

          throw zkError
        }
      } else {
        // Traditional wallet transaction
        console.log('🔗 Using traditional wallet for transaction signing...')
        result = await new Promise<any>((resolve, reject) => {
          signAndExecute(
            {
              transaction: transaction as any, // Type cast to resolve version conflicts
            },
            {
              onSuccess: (result) => {
                console.log('✅ Traditional wallet transaction successful:', result)
                console.log('📊 Transaction effects:', result.effects)
                console.log('🎉 Events:', (result as any).events) // Safe access to events
                resolve(result)
              },
              onError: (error) => {
                console.error('❌ Traditional wallet transaction failed:', error)
                console.error('❌ Error details:', JSON.stringify(error, null, 2))
                reject(error)
              }
            }
          )
        })
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Parse mint event to get NFT ID
      let nftId: string | undefined
      let mintEvent: any = null

      // Check transaction status - try different status paths
      console.log('🔍 Full result structure:', result)
      console.log('🔍 Effects structure:', result.effects)
      console.log('🔍 Transaction status (path 1):', result.effects?.status?.status)
      console.log('🔍 Transaction status (path 2):', result.effects?.status)
      console.log('🔍 Transaction error:', result.effects?.status?.error)

      // Check if transaction was successful (try different status formats)
      const isSuccess = result.effects?.status?.status === 'success' ||
                       result.effects?.status === 'success' ||
                       (result.digest && !result.effects?.status?.error)

      console.log('🔍 Is transaction successful?', isSuccess)

      if (isSuccess && (result as any).events) {
        mintEvent = nftMintingService.parseMintEvent((result as any).events)
        nftId = mintEvent?.nft_id
        console.log('🎨 Mint event found:', mintEvent)
      } else if (isSuccess) {
        console.log('⚠️ No events in successful transaction')
      }

      if (isSuccess) {
        // Success notification
        toast.success(`🎉 ${tier} NFT Minted Successfully!`, {
          description: `Your ${tier} tier NFT has been minted to your wallet`,
          duration: 5000
        })

        console.log('✅ NFT minted successfully:', {
          tier,
          transactionHash: result.digest,
          nftId
        })

        return {
          success: true,
          transactionHash: result.digest,
          nftId
        }
      } else {
        // Transaction failed - get detailed error
        const errorMsg = result.effects?.status?.error ||
                        result.effects?.status ||
                        'Transaction may have failed - check Sui Explorer'
        console.error('❌ Transaction failed with error:', errorMsg)
        console.error('❌ Full transaction result for debugging:', result)
        throw new Error(`Transaction failed: ${errorMsg}`)
      }

    } catch (error) {
      console.error('❌ NFT minting failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`❌ ${tier} NFT Minting Failed`, {
        description: errorMessage,
        duration: 5000
      })

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsMinting(false)
    }
  }, [userAddress, isZkLogin, zkWallet, isZkConnected, zkSignAndExecute, signAndExecute])

  /**
   * Check user's current tier based on owned NFTs
   */
  const checkUserTier = useCallback(async (): Promise<NFTTier | 'NOMAD'> => {
    if (!userAddress) return 'NOMAD'
    
    try {
      return await nftMintingService.getUserTier(userAddress)
    } catch (error) {
      console.error('Error checking user tier:', error)
      return 'NOMAD'
    }
  }, [userAddress])

  /**
   * Get all NFTs owned by user
   */
  const getUserNFTs = useCallback(async (): Promise<any[]> => {
    if (!userAddress) return []
    
    try {
      return await nftMintingService.getUserNFTs(userAddress)
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
      return []
    }
  }, [userAddress])

  /**
   * Check if user has specific tier NFT
   */
  const hasNFTTier = useCallback(async (tier: NFTTier): Promise<boolean> => {
    if (!userAddress) return false
    
    try {
      return await nftMintingService.hasNFTTier(userAddress, tier)
    } catch (error) {
      console.error(`Error checking ${tier} tier:`, error)
      return false
    }
  }, [userAddress])

  /**
   * Validate if user can mint specific tier
   */
  const validateMinting = useCallback(async (
    tier: NFTTier, 
    balance: number
  ): Promise<{ valid: boolean; error?: string }> => {
    if (!userAddress) {
      return { valid: false, error: 'Wallet not connected' }
    }
    
    try {
      return await nftMintingService.validateMinting(userAddress, tier, balance)
    } catch (error) {
      console.error('Error validating minting:', error)
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      }
    }
  }, [userAddress])

  return {
    isMinting,
    mintNFT,
    checkUserTier,
    getUserNFTs,
    hasNFTTier,
    validateMinting
  }
}

/**
 * Hook for checking NFT tier status
 */
export function useNFTTierStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTier, setCurrentTier] = useState<NFTTier | 'NOMAD'>('NOMAD')
  const { checkUserTier } = useNFTMinting()

  const refreshTierStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const tier = await checkUserTier()
      setCurrentTier(tier)
    } catch (error) {
      console.error('Error refreshing tier status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [checkUserTier])

  return {
    currentTier,
    isLoading,
    refreshTierStatus
  }
}
