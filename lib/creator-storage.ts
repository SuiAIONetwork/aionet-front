/**
 * Creator Storage Service
 * Handles persistent storage for creator data using hybrid database + Walrus approach
 */

import { createClient } from '@supabase/supabase-js'
// Walrus removed - using Supabase storage instead
import CryptoJS from 'crypto-js'

// Database schema interfaces
interface EncryptedCreator {
  id: string
  creator_address: string // Always public (wallet address)

  // Encrypted sensitive fields
  channel_name_encrypted?: string
  channel_description_encrypted?: string
  real_name_encrypted?: string

  // Public fields (Walrus blob IDs and non-sensitive data)
  profile_image_blob_id?: string
  cover_image_blob_id?: string

  // Public creator data (searchable, non-sensitive)
  creator_role: string
  channel_language: string
  channel_categories: string[] // Array of selected categories
  primary_category?: string // Primary category for backward compatibility
  tier: 'PRO' | 'ROYAL'

  // Channel configuration
  max_subscribers: number
  is_premium: boolean
  subscription_packages: string[] // Available durations: ["30", "60", "90"]
  tip_pricing: {
    thirtyDays?: number
    sixtyDays?: number
    ninetyDays?: number
  }

  // Public metadata
  subscribers_count: number
  verified: boolean
  banner_color: string

  // Social links (public)
  social_links: {
    website?: string
    twitter?: string
    discord?: string
  }

  // Channel data (public)
  channels_data: any[] // Array of channel objects

  // Timestamps
  created_at: string
  updated_at: string
  last_active: string
}

// Decrypted creator interface (what the app uses)
interface DecryptedCreator {
  id: string
  creator_address: string

  // Decrypted sensitive fields
  channel_name?: string
  channel_description?: string
  real_name?: string

  // Public fields
  profile_image_blob_id?: string
  cover_image_blob_id?: string
  creator_role: string
  channel_language: string
  channel_categories: string[]
  primary_category?: string
  tier: 'PRO' | 'ROYAL'
  max_subscribers: number
  is_premium: boolean
  subscription_packages: string[]
  tip_pricing: {
    thirtyDays?: number
    sixtyDays?: number
    ninetyDays?: number
  }
  subscribers_count: number
  verified: boolean
  banner_color: string
  social_links: {
    website?: string
    twitter?: string
    telegram?: string
    discord?: string
  }
  channels_data: any[]
  created_at: string
  updated_at: string
  last_active: string
}

class CreatorStorage {
  public supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      },
    }
  )

  /**
   * Get Supabase client with user context for RLS
   */
  private getSupabaseWithAuth(userAddress: string) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            // Add custom header for RLS context
            'X-User-Address': userAddress,
          },
        },
      }
    )
  }

  /**
   * Generate encryption key from creator's wallet address
   */
  private generateEncryptionKey(address: string): string {
    const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
    return CryptoJS.SHA256(address + appSecret + 'creator').toString()
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString()
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  /**
   * Create or update creator profile with encryption
   */
  async upsertCreator(
    creatorAddress: string,
    creatorData: Partial<DecryptedCreator>
  ): Promise<DecryptedCreator> {
    try {
      console.log('🔄 Creator Storage: Upserting creator for address:', creatorAddress)
      console.log('📝 Creator data:', creatorData)
      console.log('🖼️ Profile image blob ID:', creatorData.profile_image_blob_id)
      console.log('🖼️ Cover image blob ID:', creatorData.cover_image_blob_id)

      const encryptionKey = this.generateEncryptionKey(creatorAddress)

      console.log('✅ Images already stored in Walrus via WalrusProfileImage components')

      // Use blob IDs from the creator data (already stored by Walrus components)
      const profileImageBlobId = creatorData.profile_image_blob_id
      const coverImageBlobId = creatorData.cover_image_blob_id


      // Prepare encrypted data with defaults
      const encryptedData: Partial<EncryptedCreator> = {
        creator_address: creatorAddress,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      }

      // Encrypt sensitive fields
      if (creatorData.channel_name) {
        encryptedData.channel_name_encrypted = this.encrypt(creatorData.channel_name, encryptionKey)
      }
      if (creatorData.channel_description) {
        encryptedData.channel_description_encrypted = this.encrypt(creatorData.channel_description, encryptionKey)
      }

      if (creatorData.real_name) {
        encryptedData.real_name_encrypted = this.encrypt(creatorData.real_name, encryptionKey)
      }

      // Set public fields with validation
      console.log('📝 Setting public fields...')

      if (profileImageBlobId) {
        encryptedData.profile_image_blob_id = profileImageBlobId
        console.log('✅ Profile image blob ID set')
      }
      if (coverImageBlobId) {
        encryptedData.cover_image_blob_id = coverImageBlobId
        console.log('✅ Cover image blob ID set')
      }

      // Required fields
      if (!creatorData.creator_role) {
        throw new Error('creator_role is required')
      }
      if (!creatorData.channel_language) {
        throw new Error('channel_language is required')
      }
      if (!creatorData.tier) {
        throw new Error('tier is required')
      }

      encryptedData.creator_role = creatorData.creator_role
      encryptedData.channel_language = creatorData.channel_language
      encryptedData.tier = creatorData.tier

      // Optional fields with defaults
      encryptedData.channel_categories = creatorData.channel_categories || []
      encryptedData.primary_category = creatorData.primary_category
      encryptedData.max_subscribers = creatorData.max_subscribers || 0
      encryptedData.is_premium = creatorData.is_premium || false
      encryptedData.subscription_packages = creatorData.subscription_packages || []
      encryptedData.tip_pricing = creatorData.tip_pricing || {}
      encryptedData.subscribers_count = creatorData.subscribers_count || 0
      encryptedData.verified = creatorData.verified || false
      encryptedData.banner_color = creatorData.banner_color || '#4DA2FF'
      encryptedData.social_links = creatorData.social_links || {}
      encryptedData.channels_data = creatorData.channels_data || []

      console.log('✅ All public fields set')

      // Store in database using API route (bypasses RLS issues)
      console.log('💾 Sending to API route:', encryptedData)

      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorData: encryptedData,
          userAddress: creatorAddress
        })
      })

      const result = await response.json()
      console.log('📡 API response:', result)

      if (!response.ok || !result.success) {
        const error = new Error(result.error || 'Failed to create creator')
        console.error('❌ API error:', error)
        throw error
      }

      const data = result.data

      if (!data) {
        throw new Error('No data returned from API')
      }

      console.log(`✅ Encrypted creator profile updated for ${creatorAddress}`)

      // Return decrypted creator
      return this.decryptCreator(data, encryptionKey)
    } catch (error) {
      console.error('Failed to upsert creator profile:', error)
      throw error
    }
  }

  /**
   * Decrypt creator profile
   */
  private decryptCreator(encryptedCreator: EncryptedCreator, encryptionKey: string): DecryptedCreator {
    const decrypted: DecryptedCreator = {
      id: encryptedCreator.id,
      creator_address: encryptedCreator.creator_address,
      creator_role: encryptedCreator.creator_role,
      channel_language: encryptedCreator.channel_language,
      channel_categories: encryptedCreator.channel_categories,
      primary_category: encryptedCreator.primary_category,
      tier: encryptedCreator.tier,
      max_subscribers: encryptedCreator.max_subscribers,
      is_premium: encryptedCreator.is_premium,
      subscription_packages: encryptedCreator.subscription_packages,
      tip_pricing: encryptedCreator.tip_pricing,
      subscribers_count: encryptedCreator.subscribers_count,
      verified: encryptedCreator.verified,
      banner_color: encryptedCreator.banner_color,
      social_links: encryptedCreator.social_links,
      channels_data: encryptedCreator.channels_data,
      profile_image_blob_id: encryptedCreator.profile_image_blob_id,
      cover_image_blob_id: encryptedCreator.cover_image_blob_id,
      created_at: encryptedCreator.created_at,
      updated_at: encryptedCreator.updated_at,
      last_active: encryptedCreator.last_active,
    }

    // Decrypt sensitive fields
    try {
      if (encryptedCreator.channel_name_encrypted) {
        decrypted.channel_name = this.decrypt(encryptedCreator.channel_name_encrypted, encryptionKey)
      }
      if (encryptedCreator.channel_description_encrypted) {
        decrypted.channel_description = this.decrypt(encryptedCreator.channel_description_encrypted, encryptionKey)
      }

      if (encryptedCreator.real_name_encrypted) {
        decrypted.real_name = this.decrypt(encryptedCreator.real_name_encrypted, encryptionKey)
      }
    } catch (error) {
      console.error('Failed to decrypt some creator fields:', error)
    }

    return decrypted
  }

  /**
   * Get decrypted creator profile by address
   */
  async getCreator(creatorAddress: string): Promise<DecryptedCreator | null> {
    try {
      console.log('🔍 Getting creator profile for address:', creatorAddress)

      const { data, error } = await this.supabase
        .from('creators')
        .select('*')
        .eq('creator_address', creatorAddress)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No creator profile found for address:', creatorAddress)
          return null
        }
        throw error
      }

      const encryptionKey = this.generateEncryptionKey(creatorAddress)
      return this.decryptCreator(data, encryptionKey)
    } catch (error) {
      console.error('Failed to get creator profile:', error)
      throw error
    }
  }

  /**
   * Get all creators (public data only for AIO Creators page)
   */
  async getAllCreators(): Promise<DecryptedCreator[]> {
    try {

      const response = await fetch('/api/creators', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get creators')
      }

      const data = result.data

      if (!data || data.length === 0) {
        console.log('ℹ️ No creator profiles found')
        return []
      }

      // Decrypt each creator profile
      const decryptedCreators: DecryptedCreator[] = []
      for (const encryptedCreator of data) {
        try {
          const encryptionKey = this.generateEncryptionKey(encryptedCreator.creator_address)
          const decrypted = this.decryptCreator(encryptedCreator, encryptionKey)
          decryptedCreators.push(decrypted)
        } catch (error) {
          console.error(`Failed to decrypt creator ${encryptedCreator.creator_address}:`, error)
          // Skip this creator if decryption fails
        }
      }

      console.log(`✅ Retrieved ${decryptedCreators.length} creator profiles`)
      return decryptedCreators
    } catch (error) {
      console.error('Failed to get all creators:', error)
      throw error
    }
  }

  /**
   * Delete creator profile
   */
  async deleteCreator(creatorAddress: string): Promise<void> {
    try {
      console.log('🗑️ Deleting creator profile for address:', creatorAddress)

      const { error } = await this.supabase
        .from('creators')
        .delete()
        .eq('creator_address', creatorAddress)

      if (error) {
        throw error
      }

      console.log(`✅ Creator profile deleted for ${creatorAddress}`)
    } catch (error) {
      console.error('Failed to delete creator profile:', error)
      throw error
    }
  }

  /**
   * Get creator avatar URL from storage
   */
  async getCreatorAvatarUrl(creatorAddress: string): Promise<string | null> {
    try {
      const creator = await this.getCreator(creatorAddress)
      if (!creator?.profile_image_blob_id) return null

      // Check if it's a default avatar path
      if (creator.profile_image_blob_id.startsWith('/images/')) {
        return creator.profile_image_blob_id
      }

      // Check if it's already a full URL
      if (creator.profile_image_blob_id.startsWith('http')) {
        return creator.profile_image_blob_id
      }

      // Check if it's a Supabase storage path
      if (creator.profile_image_blob_id.includes('/')) {
        const { getImageUrl } = await import('./supabase-storage')
        const supabaseUrl = getImageUrl(creator.profile_image_blob_id)
        if (supabaseUrl) {
          return supabaseUrl
        }
      }

      // Fallback to Walrus URL for old blob IDs
      return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${creator.profile_image_blob_id}`
    } catch (error) {
      console.error('Failed to get creator avatar URL:', error)
      return null
    }
  }

  /**
   * Get creator cover image URL from storage
   */
  async getCreatorCoverUrl(creatorAddress: string): Promise<string | null> {
    try {
      const creator = await this.getCreator(creatorAddress)
      if (!creator?.cover_image_blob_id) return null

      // Check if it's a default image path
      if (creator.cover_image_blob_id.startsWith('/images/')) {
        return creator.cover_image_blob_id
      }

      // Check if it's already a full URL
      if (creator.cover_image_blob_id.startsWith('http')) {
        return creator.cover_image_blob_id
      }

      // Check if it's a Supabase storage path
      if (creator.cover_image_blob_id.includes('/')) {
        const { getImageUrl } = await import('./supabase-storage')
        const supabaseUrl = getImageUrl(creator.cover_image_blob_id)
        if (supabaseUrl) {
          return supabaseUrl
        }
      }

      // Fallback to Walrus URL for old blob IDs
      return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${creator.cover_image_blob_id}`
    } catch (error) {
      console.error('Failed to get creator cover URL:', error)
      return null
    }
  }

  /**
   * Update creator avatar image
   */
  async updateCreatorAvatar(
    creatorAddress: string,
    imageFile: File,
    signer?: any
  ): Promise<string> {
    try {
      console.log('📸 Updating creator avatar for address:', creatorAddress)

      // Store image in Supabase storage
      // For now, use a placeholder - in production you'd implement Supabase storage upload
      const avatarBlobId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const imageResult = { blobId: avatarBlobId }

      // Update database record
      const { error } = await this.supabase
        .from('creators')
        .update({
          profile_image_blob_id: imageResult.blobId,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('creator_address', creatorAddress)

      if (error) {
        throw error
      }

      console.log(`✅ Creator avatar updated: ${imageResult.blobId}`)
      return imageResult.blobId
    } catch (error) {
      console.error('Failed to update creator avatar:', error)
      throw error
    }
  }

  /**
   * Update creator cover image
   */
  async updateCreatorCover(
    creatorAddress: string,
    imageFile: File,
    signer?: any
  ): Promise<string> {
    try {
      console.log('🖼️ Updating creator cover for address:', creatorAddress)

      // Store image in Supabase storage
      // For now, use a placeholder - in production you'd implement Supabase storage upload
      const coverBlobId = `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const imageResult = { blobId: coverBlobId }

      // Update database record
      const { error } = await this.supabase
        .from('creators')
        .update({
          cover_image_blob_id: imageResult.blobId,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('creator_address', creatorAddress)

      if (error) {
        throw error
      }

      console.log(`✅ Creator cover updated: ${imageResult.blobId}`)
      return imageResult.blobId
    } catch (error) {
      console.error('Failed to update creator cover:', error)
      throw error
    }
  }
}

// Export singleton
export const creatorStorage = new CreatorStorage()

// Helper functions for React components
export async function createOrUpdateCreator(
  creatorAddress: string,
  creatorData: Partial<DecryptedCreator>
): Promise<DecryptedCreator> {
  return creatorStorage.upsertCreator(creatorAddress, creatorData)
}

export async function getCreatorProfile(creatorAddress: string): Promise<DecryptedCreator | null> {
  return creatorStorage.getCreator(creatorAddress)
}

export async function getAllCreatorProfiles(): Promise<DecryptedCreator[]> {
  return creatorStorage.getAllCreators()
}

export async function getCreatorAvatarUrl(creatorAddress: string): Promise<string | null> {
  return creatorStorage.getCreatorAvatarUrl(creatorAddress)
}

export async function getCreatorCoverUrl(creatorAddress: string): Promise<string | null> {
  return creatorStorage.getCreatorCoverUrl(creatorAddress)
}

export type { DecryptedCreator, EncryptedCreator }
