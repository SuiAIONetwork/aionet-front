import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { nftMintingService } from './nft-minting-service'

// Contract configuration
const CONTRACT_CONFIG = {
  PACKAGE_ID: '0x021d50304ae7402dec2cc761ec66b3dfc68c686e2898c75ea6b12244a3c07817',
  MODULE_NAME: 'MyNFTCollections',
  STRUCT_TYPE: 'DualNFT'
}

// Royalties wallet configuration
const ROYALTIES_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || 
  '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

export interface RoyaltiesMetrics {
  totalRoyalHolders: number
  weeklyRoyaltiesAmount: number
  cumulativeRoyaltiesAmount: number
  totalDistributed: number
}

export interface RoyaltiesDistribution {
  id: string
  amount: number
  recipientCount: number
  distributedAt: string
  transactionHash?: string
  status: 'pending' | 'completed' | 'failed'
}

class RoyaltiesService {
  private suiClient: SuiClient

  constructor() {
    this.suiClient = new SuiClient({
      url: getFullnodeUrl('testnet')
    })
  }

  /**
   * Get total count of ROYAL NFT holders
   */
  async getRoyalHoldersCount(): Promise<number> {
    try {
      console.log('🔍 Fetching ROYAL NFT holders count...')

      // Use multiGetObjects to query NFTs by type
      // For now, return a placeholder count since we need a different approach
      // to query all NFTs of a specific type across all owners

      // TODO: Implement proper NFT counting using events or a different query method
      // This would require either:
      // 1. Querying mint events from the contract
      // 2. Using a different SUI API method
      // 3. Maintaining a separate index of NFT holders

      console.log('⚠️ Using placeholder ROYAL holders count')
      return 120 // Placeholder count

    } catch (error) {
      console.error('❌ Error fetching ROYAL holders count:', error)
      return 0
    }
  }

  /**
   * Get royalties wallet balance
   */
  async getRoyaltiesWalletBalance(): Promise<{ weekly: number; cumulative: number }> {
    try {
      console.log('💰 Fetching royalties wallet balance...')

      // Get wallet balance
      const balance = await this.suiClient.getBalance({
        owner: ROYALTIES_WALLET_ADDRESS,
        coinType: '0x2::sui::SUI'
      })

      // Convert from MIST to SUI
      const suiBalance = parseInt(balance.totalBalance) / 1_000_000_000

      // For now, return the total balance as cumulative
      // Weekly amount would need to be tracked separately
      return {
        weekly: 0, // TODO: Implement weekly tracking
        cumulative: suiBalance
      }

    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error)
      return { weekly: 0, cumulative: 0 }
    }
  }

  /**
   * Get total distributed amount (placeholder implementation)
   */
  async getTotalDistributed(): Promise<number> {
    try {
      // TODO: Implement actual tracking of distributed amounts
      // This would require a database table to track distributions
      console.log('📊 Fetching total distributed amount...')
      
      // Placeholder: Return 85% of cumulative amount as "distributed"
      const { cumulative } = await this.getRoyaltiesWalletBalance()
      return cumulative * 0.85

    } catch (error) {
      console.error('❌ Error fetching total distributed:', error)
      return 0
    }
  }

  /**
   * Get comprehensive royalties metrics
   */
  async getRoyaltiesMetrics(): Promise<RoyaltiesMetrics> {
    try {
      console.log('📈 Fetching comprehensive royalties metrics...')

      const [
        totalRoyalHolders,
        walletBalance,
        totalDistributed
      ] = await Promise.all([
        this.getRoyalHoldersCount(),
        this.getRoyaltiesWalletBalance(),
        this.getTotalDistributed()
      ])

      const metrics: RoyaltiesMetrics = {
        totalRoyalHolders,
        weeklyRoyaltiesAmount: walletBalance.weekly,
        cumulativeRoyaltiesAmount: walletBalance.cumulative,
        totalDistributed
      }

      console.log('✅ Royalties metrics fetched:', metrics)
      return metrics

    } catch (error) {
      console.error('❌ Error fetching royalties metrics:', error)
      return {
        totalRoyalHolders: 0,
        weeklyRoyaltiesAmount: 0,
        cumulativeRoyaltiesAmount: 0,
        totalDistributed: 0
      }
    }
  }

  /**
   * Check if user is a ROYAL NFT holder
   */
  async isRoyalHolder(userAddress: string): Promise<boolean> {
    try {
      return await nftMintingService.hasNFTTier(userAddress, 'ROYAL')
    } catch (error) {
      console.error('❌ Error checking ROYAL holder status:', error)
      return false
    }
  }

  /**
   * Get user's ROYAL NFT count
   */
  async getUserRoyalNFTCount(userAddress: string): Promise<number> {
    try {
      // Use the existing NFT minting service which handles the API correctly
      const nfts = await nftMintingService.getUserNFTs(userAddress)

      return nfts.filter(nft => {
        const content = nft.data?.content
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as any
          return fields?.collection === 'ROYAL'
        }
        return false
      }).length

    } catch (error) {
      console.error('❌ Error getting user ROYAL NFT count:', error)
      return 0
    }
  }

  /**
   * Calculate user's share of royalties based on NFT holdings
   */
  async calculateUserRoyaltyShare(userAddress: string): Promise<number> {
    try {
      const [userNFTCount, totalHolders] = await Promise.all([
        this.getUserRoyalNFTCount(userAddress),
        this.getRoyalHoldersCount()
      ])

      if (totalHolders === 0 || userNFTCount === 0) {
        return 0
      }

      // Simple equal distribution for now
      // In a more complex system, this could be weighted by NFT count
      return userNFTCount / totalHolders

    } catch (error) {
      console.error('❌ Error calculating user royalty share:', error)
      return 0
    }
  }
}

export const royaltiesService = new RoyaltiesService()
