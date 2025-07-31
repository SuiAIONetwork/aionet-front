"use client"

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import { toast } from 'sonner'

// Contract configuration
const CONTRACT_CONFIG = {
  PACKAGE_ID: '0x021d50304ae7402dec2cc761ec66b3dfc68c686e2898c75ea6b12244a3c07817',
  MODULE_NAME: 'DualNFT',
  TREASURY_ADDRESS: '0xf32ddff49379234664931ddee1ccfe1c7b73f2d5064c5837f8bc306c2c6bf5f4',
  NETWORK: 'testnet'
}

// NFT pricing from contract (in MIST)
export const NFT_PRICING = {
  PRO: {
    cost: 100_000_000, // 0.1 SUI
    costSui: 0.1,
    collection: 'PRO',
    name: 'PRO Tier NFT',
    description: 'Unlock PRO tier benefits with this soulbound NFT'
  },
  ROYAL: {
    cost: 200_000_000, // 0.2 SUI
    costSui: 0.2,
    collection: 'ROYAL',
    name: 'ROYAL Tier NFT', 
    description: 'Unlock ROYAL tier benefits with this soulbound NFT'
  }
}

export type NFTTier = 'PRO' | 'ROYAL'

export interface MintResult {
  success: boolean
  transactionHash?: string
  nftId?: string
  error?: string
}

export interface MintEvent {
  nft_id: string
  name: string
  collection: string
  owner: string
  timestamp: string
}

class NFTMintingService {
  private suiClient: SuiClient

  constructor() {
    this.suiClient = new SuiClient({
      url: 'https://fullnode.testnet.sui.io'
    })
  }

  /**
   * Create transaction for user to mint NFT directly
   * User pays gas fees and minting costs
   */
  createMintTransaction(
    tier: NFTTier,
    userAddress: string
  ): Transaction {
    const txb = new Transaction()

    const tierConfig = NFT_PRICING[tier]

    // Call mint_nft function - pass gas coin directly, contract will handle splitting
    txb.moveCall({
      target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::mint_nft`,
      arguments: [
        // collection_type: vector<u8> - pass as string and let Sui handle conversion
        txb.pure.string(tier),
        // payment: &mut Coin<SUI> - pass gas coin directly
        txb.gas
      ]
    })

    // Set the user as sender (they pay gas and minting cost)
    txb.setSender(userAddress)

    return txb
  }

  /**
   * Get user's NFTs to check current tier
   */
  async getUserNFTs(userAddress: string): Promise<any[]> {
    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::DualNFT`
        },
        options: {
          showContent: true,
          showType: true
        }
      })

      return objects.data || []
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
      return []
    }
  }

  /**
   * Check if user has specific tier NFT
   */
  async hasNFTTier(userAddress: string, tier: NFTTier): Promise<boolean> {
    const nfts = await this.getUserNFTs(userAddress)
    
    return nfts.some(nft => {
      const content = nft.data?.content
      if (content?.dataType === 'moveObject') {
        const fields = content.fields as any
        return fields?.collection === tier
      }
      return false
    })
  }

  /**
   * Get user's current highest tier
   * Priority: ROYAL > PRO > NOMAD
   */
  async getUserTier(userAddress: string): Promise<NFTTier | 'NOMAD'> {
    try {
      console.log(`🔍 Checking NFT tier for address: ${userAddress}`)

      const nfts = await this.getUserNFTs(userAddress)
      console.log(`📦 Found ${nfts.length} NFTs:`, nfts)

      let hasRoyal = false
      let hasPro = false

      // Check each NFT for tier
      for (const nft of nfts) {
        const content = nft.data?.content
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as any
          const collection = fields?.collection
          console.log(`🎨 NFT collection: ${collection}`)

          if (collection === 'ROYAL') {
            hasRoyal = true
          } else if (collection === 'PRO') {
            hasPro = true
          }
        }
      }

      console.log(`🏆 User has: PRO=${hasPro}, ROYAL=${hasRoyal}`)

      // Return highest tier (ROYAL > PRO > NOMAD)
      if (hasRoyal) return 'ROYAL'
      if (hasPro) return 'PRO'
      return 'NOMAD'

    } catch (error) {
      console.error('Error checking user tier:', error)
      return 'NOMAD'
    }
  }

  /**
   * Validate minting requirements
   */
  async validateMinting(
    userAddress: string,
    tier: NFTTier,
    userBalance: number
  ): Promise<{ valid: boolean; error?: string }> {
    const tierConfig = NFT_PRICING[tier]
    
    // Check balance (need minting cost + gas)
    const estimatedGas = 0.01 // 0.01 SUI for gas
    const totalNeeded = tierConfig.costSui + estimatedGas
    
    if (userBalance < totalNeeded) {
      return {
        valid: false,
        error: `Insufficient balance. Need ${totalNeeded.toFixed(3)} SUI, have ${userBalance.toFixed(4)} SUI`
      }
    }

    // Check if user already has this tier or higher
    const currentTier = await this.getUserTier(userAddress)
    
    if (tier === 'PRO' && (currentTier === 'PRO' || currentTier === 'ROYAL')) {
      return {
        valid: false,
        error: 'You already have PRO tier or higher'
      }
    }
    
    if (tier === 'ROYAL' && currentTier === 'ROYAL') {
      return {
        valid: false,
        error: 'You already have ROYAL tier'
      }
    }

    return { valid: true }
  }

  /**
   * Parse mint event from transaction effects
   */
  parseMintEvent(events: any[]): MintEvent | null {
    const mintEvent = events.find(event => 
      event.type.includes('MintEvent')
    )
    
    if (mintEvent?.parsedJson) {
      return {
        nft_id: mintEvent.parsedJson.nft_id,
        name: mintEvent.parsedJson.name,
        collection: mintEvent.parsedJson.collection,
        owner: mintEvent.parsedJson.owner,
        timestamp: mintEvent.parsedJson.timestamp
      }
    }
    
    return null
  }

  /**
   * Get contract configuration
   */
  getContractConfig() {
    return CONTRACT_CONFIG
  }

  /**
   * Update contract configuration (for when you deploy)
   */
  updateContractConfig(config: Partial<typeof CONTRACT_CONFIG>) {
    Object.assign(CONTRACT_CONFIG, config)
  }
}

// Export singleton instance
export const nftMintingService = new NFTMintingService()

// Export types and constants
export { CONTRACT_CONFIG }
