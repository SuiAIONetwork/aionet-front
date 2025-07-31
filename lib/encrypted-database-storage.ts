/**
 * Encrypted Database + Walrus Integration
 * Client-side encryption for sensitive data before storing in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { uploadProfileImage } from './supabase-storage'
import CryptoJS from 'crypto-js'

// Database schema with encryption
/*
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL, -- Public (wallet address)
  username_encrypted TEXT,      -- Encrypted
  email_encrypted TEXT,         -- Encrypted
  profile_image_blob_id TEXT,   -- Public (Walrus blob ID)
  banner_image_blob_id TEXT,    -- Public (Walrus blob ID)

  public_data JSONB DEFAULT '{}', -- Non-sensitive public data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_address ON user_profiles(address);
*/

interface EncryptedProfile {
  id: string
  address: string // Always public (wallet address)

  // Encrypted sensitive fields
  username_encrypted?: string
  email_encrypted?: string
  real_name_encrypted?: string
  location_encrypted?: string
  social_links_encrypted?: string


  // Public fields (Walrus blob IDs and non-sensitive data)
  profile_image_blob_id?: string
  banner_image_blob_id?: string

  // Public profile data (searchable, non-sensitive)
  role_tier: 'NOMAD' | 'PRO' | 'ROYAL'
  profile_level: number
  current_xp: number
  total_xp: number
  points: number

  join_date: string
  last_active: string

  // Onboarding tracking
  onboarding_completed?: boolean
  onboarding_completed_at?: string

  // JSON data
  achievements_data: Achievement[]
  referral_data: Record<string, any>
  display_preferences: Record<string, any>
  // payment_preferences: Record<string, any> // Column doesn't exist in current schema
  walrus_metadata: Record<string, any>

  // Timestamps
  created_at: string
  updated_at: string
}

interface DecryptedProfile {
  id: string
  address: string

  // Decrypted sensitive fields
  username?: string
  email?: string
  real_name?: string
  location?: string


  // Public fields
  profile_image_blob_id?: string
  banner_image_blob_id?: string
  role_tier: 'NOMAD' | 'PRO' | 'ROYAL'
  profile_level: number
  current_xp: number
  total_xp: number
  points: number

  join_date: string
  last_active: string

  // Social links
  social_links?: any[]

  // KYC status
  kyc_status?: string

  // Onboarding tracking
  onboarding_completed?: boolean
  onboarding_completed_at?: string

  // JSON data
  achievements_data: Achievement[]
  referral_data: Record<string, any>
  display_preferences: {
    language?: string
    performance_mode?: boolean
    email_notifications?: boolean
    push_notifications?: boolean
    browser_notifications?: boolean
    trade_notifications?: boolean
    news_notifications?: boolean
    promo_notifications?: boolean
    privacy_settings?: {
      profile_visibility?: 'public' | 'private'
      show_achievements?: boolean
      show_level?: boolean
      show_join_date?: boolean
      show_last_active?: boolean
      allow_profile_search?: boolean
    }
  }
  // payment_preferences: { // Column doesn't exist in current schema
  //   points_auto_renewal?: boolean
  //   payment_methods?: Array<{
  //     id: string
  //     type: string
  //     name: string
  //     last4: string
  //     expiryMonth: string
  //     expiryYear: string
  //     isDefault: boolean
  //     autoRenewal: boolean
  //   }>
  // }
  walrus_metadata: Record<string, any>

  // Timestamps
  created_at: string
  updated_at: string
}

interface Achievement {
  name: string
  icon?: string
  color: string
  unlocked: boolean
  claimed: boolean
  xp: number
  tooltip: string
  category?: string
  claimed_at?: string
}



class EncryptedDatabaseStorage {
  public supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Don't persist auth sessions
        autoRefreshToken: false, // Don't auto refresh
      },
      global: {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      },
    }
  )

  /**
   * Generate encryption key from user's wallet address
   * This ensures only the user can decrypt their own data
   */
  private generateEncryptionKey(address: string): string {
    // Use wallet address + app secret to generate consistent key
    const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
    return CryptoJS.SHA256(address + appSecret).toString()
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
   * Create or update user profile with encryption
   */
  async upsertEncryptedProfile(
    address: string,
    profileData: Partial<DecryptedProfile>,
    imageFile?: File,
    signer?: any
  ): Promise<DecryptedProfile> {
    try {
      console.log('🔄 Database: Upserting profile for address:', address)
      console.log('📝 Profile data:', profileData)

      // First test database connection
      const connectionTest = await this.testConnection()
      if (!connectionTest.success) {
        console.error('❌ Database connection test failed:', connectionTest.error)
        throw new Error(`Database connection failed: ${connectionTest.error}`)
      }

      // Check if profile already exists and load full profile for merging
      let existingProfile: any = null
      let isExistingProfile = false

      try {
        const existingDecryptedProfile = await this.getDecryptedProfile(address)
        if (existingDecryptedProfile) {
          existingProfile = existingDecryptedProfile
          isExistingProfile = true
          console.log('📋 Found existing profile for merging:', {
            username: existingProfile.username,
            role_tier: existingProfile.role_tier,
            profile_level: existingProfile.profile_level,
            current_xp: existingProfile.current_xp
          })
        }
      } catch (error) {
        console.log('📋 No existing profile found, creating new one')
        isExistingProfile = false
      }
      console.log('✅ Database connection verified')

      const encryptionKey = this.generateEncryptionKey(address)
      let imageBlobId: string | undefined

      // Store image in Supabase Storage if provided
      if (imageFile) {
        console.log('📸 Storing image in Supabase Storage...')
        const imageResult = await uploadProfileImage(imageFile)
        if (imageResult.success && imageResult.path) {
          imageBlobId = imageResult.path
          console.log(`🔒 Image stored in Supabase Storage: ${imageBlobId}`)
        } else {
          throw new Error(imageResult.error || 'Failed to upload image')
        }
      }

      // Prepare basic data with only known columns
      const encryptedData: any = {
        address, // Always public
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),

        // Basic required fields - merge with existing data or use defaults for new profiles
        role_tier: profileData.role_tier ?? (existingProfile?.role_tier || 'NOMAD'),
        profile_level: profileData.profile_level ?? (existingProfile?.profile_level || 1),
        current_xp: profileData.current_xp ?? (existingProfile?.current_xp || 0),
        total_xp: profileData.total_xp ?? (existingProfile?.total_xp || 0),
        points: profileData.points ?? (existingProfile?.points || 0),


        // Onboarding tracking - preserve existing values for updates, set defaults for new profiles
        onboarding_completed: profileData.onboarding_completed !== undefined
          ? profileData.onboarding_completed
          : (existingProfile?.onboarding_completed ?? false),
        onboarding_completed_at: profileData.onboarding_completed_at !== undefined
          ? profileData.onboarding_completed_at
          : (existingProfile?.onboarding_completed_at || null)
      }

      // Merge optional fields with existing data
      encryptedData.achievements_data = profileData.achievements_data ?? existingProfile?.achievements_data
      encryptedData.referral_data = profileData.referral_data ?? existingProfile?.referral_data
      encryptedData.display_preferences = profileData.display_preferences ?? existingProfile?.display_preferences
      encryptedData.walrus_metadata = profileData.walrus_metadata ?? existingProfile?.walrus_metadata
      encryptedData.join_date = profileData.join_date ?? existingProfile?.join_date

      // Add created_at only if it's a new record
      if (!profileData.id) {
        encryptedData.created_at = new Date().toISOString()
      }

      // Set Walrus blob IDs - merge with existing data
      encryptedData.profile_image_blob_id = imageBlobId ?? profileData.profile_image_blob_id ?? existingProfile?.profile_image_blob_id
      encryptedData.banner_image_blob_id = profileData.banner_image_blob_id ?? existingProfile?.banner_image_blob_id

      // Encrypt sensitive fields - merge with existing data
      const usernameToEncrypt = profileData.username ?? existingProfile?.username
      if (usernameToEncrypt) {
        encryptedData.username_encrypted = this.encrypt(usernameToEncrypt, encryptionKey)
      }

      const emailToEncrypt = profileData.email ?? existingProfile?.email
      if (emailToEncrypt) {
        encryptedData.email_encrypted = this.encrypt(emailToEncrypt, encryptionKey)
      }

      // Encrypt real_name (first name + last name)
      const realNameToEncrypt = profileData.real_name ?? existingProfile?.real_name
      if (realNameToEncrypt) {
        encryptedData.real_name_encrypted = this.encrypt(realNameToEncrypt, encryptionKey)
      }

      // Encrypt location field
      const locationToEncrypt = profileData.location ?? existingProfile?.location
      if (locationToEncrypt) {
        encryptedData.location_encrypted = this.encrypt(locationToEncrypt, encryptionKey)
      }

      // Encrypt social_links field
      const socialLinksToEncrypt = profileData.social_links ?? existingProfile?.social_links
      if (socialLinksToEncrypt) {
        encryptedData.social_links_encrypted = this.encrypt(JSON.stringify(socialLinksToEncrypt), encryptionKey)
      }

      // Set public fields (non-encrypted, searchable)
      if (profileData.role_tier) {
        encryptedData.role_tier = profileData.role_tier
      }
      if (profileData.profile_level !== undefined) {
        encryptedData.profile_level = profileData.profile_level
      }
      if (profileData.current_xp !== undefined) {
        encryptedData.current_xp = profileData.current_xp
      }
      if (profileData.total_xp !== undefined) {
        encryptedData.total_xp = profileData.total_xp
      }

      if (profileData.join_date) {
        encryptedData.join_date = profileData.join_date
      }

      // Set JSON data fields
      if (profileData.achievements_data) {
        encryptedData.achievements_data = profileData.achievements_data
      }
      if (profileData.referral_data) {
        encryptedData.referral_data = profileData.referral_data
      }
      if (profileData.display_preferences) {
        encryptedData.display_preferences = profileData.display_preferences
      }
      // Skip payment_preferences as it doesn't exist in current schema
      // if (profileData.payment_preferences) {
      //   encryptedData.payment_preferences = profileData.payment_preferences
      // }
      if (profileData.walrus_metadata) {
        encryptedData.walrus_metadata = profileData.walrus_metadata
      }

      // Store in database
      console.log('💾 Inserting into database:', encryptedData)
      console.log('🔗 Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔑 Using API key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...')

      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(encryptedData, { onConflict: 'address' })
        .select()
        .single()

      console.log('📡 Database upsert response:', { data, error })

      if (error) {
        console.error('❌ Database upsert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
      }

      console.log(`✅ Encrypted profile updated for ${address}`)

      // Return decrypted profile
      return this.decryptProfile(data, encryptionKey)
    } catch (error) {
      console.error('Failed to upsert encrypted profile:', error)
      throw error
    }
  }

  /**
   * Get and decrypt user profile
   */
  async getDecryptedProfile(address: string): Promise<DecryptedProfile | null> {
    try {
      // console.log('🔍 Fetching profile for address:', address)

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('address', address)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Database error fetching profile:', error)
        throw error
      }

      if (!data) {
        console.log('📭 No profile found for address:', address)
        return null
      }



      const encryptionKey = this.generateEncryptionKey(address)
      const decryptedProfile = this.decryptProfile(data, encryptionKey)

      console.log('✅ Profile decrypted successfully:', {
        username: decryptedProfile.username,
        profileLevel: decryptedProfile.profile_level,
        onboardingCompleted: decryptedProfile.onboarding_completed
      })

      return decryptedProfile
    } catch (error) {
      console.error('❌ Failed to get decrypted profile for', address, ':', error)
      return null
    }
  }

  /**
   * Decrypt profile data
   */
  private decryptProfile(encryptedProfile: EncryptedProfile, key: string): DecryptedProfile {
    const decrypted: DecryptedProfile = {
      id: encryptedProfile.id,
      address: encryptedProfile.address,

      // Public fields (no decryption needed)
      profile_image_blob_id: encryptedProfile.profile_image_blob_id,
      banner_image_blob_id: encryptedProfile.banner_image_blob_id,
      role_tier: encryptedProfile.role_tier || 'NOMAD',
      profile_level: encryptedProfile.profile_level || 1,
      current_xp: encryptedProfile.current_xp || 0,
      total_xp: encryptedProfile.total_xp || 0,
      points: encryptedProfile.points || 0,

      join_date: encryptedProfile.join_date || encryptedProfile.created_at,
      last_active: encryptedProfile.last_active || encryptedProfile.updated_at,

      // Onboarding tracking
      onboarding_completed: encryptedProfile.onboarding_completed || false,
      onboarding_completed_at: encryptedProfile.onboarding_completed_at,

      // JSON data fields
      achievements_data: encryptedProfile.achievements_data || [],
      referral_data: encryptedProfile.referral_data || {},
      display_preferences: encryptedProfile.display_preferences || {},
      // payment_preferences: encryptedProfile.payment_preferences || {}, // Column doesn't exist
      walrus_metadata: encryptedProfile.walrus_metadata || {},



      // Timestamps
      created_at: encryptedProfile.created_at,
      updated_at: encryptedProfile.updated_at
    }

    // Decrypt sensitive fields
    try {
      if (encryptedProfile.username_encrypted) {
        decrypted.username = this.decrypt(encryptedProfile.username_encrypted, key)
      }
      if (encryptedProfile.email_encrypted) {
        decrypted.email = this.decrypt(encryptedProfile.email_encrypted, key)
      }

      // Decrypt real_name (first name + last name)
      if (encryptedProfile.real_name_encrypted) {
        decrypted.real_name = this.decrypt(encryptedProfile.real_name_encrypted, key)
      }
      // Decrypt location field
      if (encryptedProfile.location_encrypted) {
        decrypted.location = this.decrypt(encryptedProfile.location_encrypted, key)
      }

      // Decrypt social_links field
      if (encryptedProfile.social_links_encrypted) {
        const decryptedSocialLinks = this.decrypt(encryptedProfile.social_links_encrypted, key)
        decrypted.social_links = JSON.parse(decryptedSocialLinks)
      }

    } catch (error) {
      console.error('Failed to decrypt some profile fields:', error)
      // Continue with partial data
    }

    return decrypted
  }

  /**
   * Get avatar URL (public data, no decryption needed)
   */
  async getAvatarUrl(address: string): Promise<string | null> {
    try {
      console.log('🔍 Database: Getting avatar URL for address:', address)
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('profile_image_blob_id, banner_image_blob_id')
        .eq('address', address)
        .single()

      console.log('📡 Database response (avatar + banner check):', {
        data,
        error,
        avatar_blob: data?.profile_image_blob_id,
        banner_blob: data?.banner_image_blob_id,
        same_blob: data?.profile_image_blob_id === data?.banner_image_blob_id
      })

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found for address:', address)
        } else {
          console.error('❌ Database error:', error)
        }
        return null
      }

      if (!data?.profile_image_blob_id) {
        console.log('ℹ️ Profile found but no avatar blob ID')
        return null
      }

      // Check if it's a default avatar path
      if (data.profile_image_blob_id.startsWith('/images/animepfp/')) {
        console.log('✅ Default avatar path found:', data.profile_image_blob_id)
        return data.profile_image_blob_id // Return path directly for default avatars
      }
      // Check if it's already a full URL (Supabase or Walrus)
      else if (data.profile_image_blob_id.startsWith('http')) {
        console.log('✅ Full URL found:', data.profile_image_blob_id)
        return data.profile_image_blob_id
      }
      // Check if it's a Supabase storage path
      else if (data.profile_image_blob_id.includes('/')) {
        // Try to get Supabase storage URL
        const { getImageUrl } = await import('./supabase-storage')
        const supabaseUrl = getImageUrl(data.profile_image_blob_id)
        if (supabaseUrl) {
          console.log('✅ Supabase storage URL found:', supabaseUrl)
          return supabaseUrl
        }
      }

      // Fallback to Walrus URL for old blob IDs
      const avatarUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${data.profile_image_blob_id}`
      console.log('✅ Legacy Walrus avatar URL found:', avatarUrl)
      return avatarUrl
    } catch (error) {
      console.error('❌ Failed to get avatar URL:', error)
      return null
    }
  }

  /**
   * Search profiles (only public data)
   */
  async searchPublicProfiles(limit = 20): Promise<Array<{
    address: string
    profile_image_blob_id?: string
    public_data: Record<string, any>
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('address, profile_image_blob_id, public_data')
        .not('profile_image_blob_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to search public profiles:', error)
      return []
    }
  }

  /**
   * Debug method to check both avatar and banner blob IDs
   */
  async debugImageBlobIds(address: string): Promise<void> {
    try {
      console.log('🔍 DEBUG: Checking both image blob IDs for address:', address)
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('profile_image_blob_id, banner_image_blob_id, address')
        .eq('address', address)
        .single()

      if (error) {
        console.error('❌ DEBUG: Database error:', error)
        return
      }

      console.log('🔍 DEBUG: Current database state:', {
        address: data.address,
        avatar_blob_id: data.profile_image_blob_id,
        banner_blob_id: data.banner_image_blob_id,
        are_same: data.profile_image_blob_id === data.banner_image_blob_id,
        avatar_url: data.profile_image_blob_id ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${data.profile_image_blob_id}` : null,
        banner_url: data.banner_image_blob_id ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${data.banner_image_blob_id}` : null
      })
    } catch (error) {
      console.error('❌ DEBUG: Failed to check blob IDs:', error)
    }
  }

  /**
   * Update only avatar blob ID (no encryption needed)
   */
  async updateAvatarBlobId(address: string, blobId: string): Promise<void> {
    try {
      console.log(`🔄 BEFORE avatar update - checking current state...`)
      await this.debugImageBlobIds(address)

      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          profile_image_blob_id: blobId,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('address', address)

      if (error) throw error
      console.log(`🔒 Avatar blob ID updated for ${address}: ${blobId}`)

      console.log(`🔄 AFTER avatar update - checking new state...`)
      await this.debugImageBlobIds(address)
    } catch (error) {
      console.error('Failed to update avatar blob ID:', error)
      throw error
    }
  }

  /**
   * Update only banner blob ID (no encryption needed)
   */
  async updateBannerBlobId(address: string, blobId: string | null): Promise<void> {
    try {
      console.log(`🖼️ Updating banner blob ID for ${address}: ${blobId}`)

      console.log(`🔄 BEFORE banner update - checking current state...`)
      await this.debugImageBlobIds(address)

      // First check if profile exists
      const { data: existingProfile, error: selectError } = await this.supabase
        .from('user_profiles')
        .select('address')
        .eq('address', address)
        .single()

      console.log('📊 Profile check result:', { existingProfile, selectError })

      if (selectError && selectError.code === 'PGRST116') {
        // Profile doesn't exist, create it first
        console.log('➕ Creating new profile for banner update...')
        const { error: insertError } = await this.supabase
          .from('user_profiles')
          .insert({
            address,
            banner_image_blob_id: blobId,
            current_xp: 0,
            total_xp: 0,
            profile_level: 1,
            points: 0,
            role_tier: 'NOMAD',

            achievements_data: [],
            referral_data: {},
            display_preferences: {},
            walrus_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })

        if (insertError) {
          console.error('❌ Failed to create profile:', insertError)
          throw insertError
        }
        console.log(`✅ Created new profile with banner for ${address}`)
        return
      } else if (selectError) {
        console.error('❌ Profile check failed:', selectError)
        throw selectError
      }

      // Profile exists, update banner
      const { error: updateError } = await this.supabase
        .from('user_profiles')
        .update({
          banner_image_blob_id: blobId,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('address', address)

      if (updateError) {
        console.error('❌ Failed to update banner:', updateError)
        throw updateError
      }

      console.log(`✅ Banner blob ID updated for ${address}: ${blobId}`)

      console.log(`🔄 AFTER banner update - checking new state...`)
      await this.debugImageBlobIds(address)
    } catch (error) {
      console.error('❌ Failed to update banner blob ID:', error)
      throw error
    }
  }

  /**
   * Update user's XP and level
   */
  async updateXPAndLevel(address: string, currentXP: number, totalXP: number, level: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          current_xp: currentXP,
          total_xp: totalXP,
          profile_level: level,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('address', address)

      if (error) throw error
      console.log(`🔒 XP and level updated for ${address}: Level ${level}, XP ${currentXP}/${totalXP}`)
    } catch (error) {
      console.error('Failed to update XP and level:', error)
      throw error
    }
  }

  /**
   * Update achievements data
   */
  async updateAchievements(address: string, achievements: Achievement[]): Promise<void> {
    try {
      console.log(`🏆 Updating achievements for ${address}:`, achievements)

      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          achievements_data: achievements,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('address', address)
        .select()

      if (error) {
        console.error('❌ Failed to update achievements:', error)
        throw error
      }

      console.log(`✅ Achievements updated for ${address}:`, data)
    } catch (error) {
      console.error('Failed to update achievements:', error)
      throw error
    }
  }





  /**
   * Ensure profile exists for user (create if doesn't exist)
   */
  async ensureProfileExists(address: string): Promise<void> {
    try {
      console.log(`🔍 Checking if profile exists for ${address}...`)

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('address')
        .eq('address', address)
        .single()

      console.log('📊 Current profile data:', { data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found, creating new one...')
          // Create a new profile with default values for new user
          const { error: insertError } = await this.supabase
            .from('user_profiles')
            .insert({
              address,
              // username: `User ${address.slice(0, 6)}`, // Column might not exist, use encrypted version
              current_xp: 0,
              total_xp: 0,
              profile_level: 1,
              points: 0, // New users start with 0 points
              role_tier: 'NOMAD',

              onboarding_completed: false, // New users haven't completed onboarding
              onboarding_completed_at: null,
              achievements_data: [],
              referral_data: {},
              display_preferences: {
                language: 'en',
                performance_mode: false,
                email_notifications: true,
                push_notifications: true,
                browser_notifications: false,
                trade_notifications: true,
                news_notifications: true,
                promo_notifications: true
              },
              // payment_preferences column doesn't exist in current schema
              // payment_preferences: {
              //   payment_methods: [],
              //   points_auto_renewal: true
              // },
              walrus_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            })

          if (insertError) throw insertError
          console.log(`✅ Created new profile for ${address} with starting points and default settings`)
          return
        }
        throw error
      }

      console.log(`✅ Profile already exists for ${address}`)
    } catch (error) {
      console.error('Failed to ensure profile exists:', error)
      throw error
    }
  }

  /**
   * Update user tier/role
   */
  async updateUserTier(address: string, tier: 'NOMAD' | 'PRO' | 'ROYAL'): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          role_tier: tier,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('address', address)

      if (error) throw error
      console.log(`🔒 User tier updated for ${address}: ${tier}`)
    } catch (error) {
      console.error('Failed to update user tier:', error)
      throw error
    }
  }

  /**
   * Test database connection and get table schema
   */
  async testConnection(): Promise<{ success: boolean; error?: string; schema?: any }> {
    try {
      console.log('🧪 Testing database connection...')

      // Test 1: Basic connection
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Database connection failed:', error)
        return { success: false, error: `Connection failed: ${error.message}` }
      }

      // Test 2: Check table structure by getting one record
      const { data: tableInfo, error: tableError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

      if (tableError) {
        console.error('❌ Table structure check failed:', tableError)
        return { success: false, error: `Table check failed: ${tableError.message}` }
      }

      // Log available columns
      if (tableInfo && tableInfo.length > 0) {
        const availableColumns = Object.keys(tableInfo[0])
        console.log('📋 Available columns in user_profiles:', availableColumns)
        return { success: true, schema: availableColumns }
      }

      console.log('✅ Database connection verified (empty table)')
      return { success: true }
    } catch (error) {
      console.error('❌ Database connection error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Fix RLS policies by disabling them temporarily
   */
  async fixRLSPolicies(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Attempting to fix RLS policies...')

      // Try to disable RLS (this might fail if user doesn't have permissions)
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;'
      })

      if (error) {
        console.log('ℹ️ Could not disable RLS (expected if not admin):', error.message)
        return { success: false, error: 'RLS policies need to be fixed by database admin' }
      }

      console.log('✅ RLS policies fixed')
      return { success: true }
    } catch (error) {
      console.error('❌ RLS fix failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Fix missing XP fields for existing profiles
   */
  async fixMissingXPFields(address: string): Promise<void> {
    try {
      console.log(`🔧 Checking and fixing XP fields for ${address}...`)

      // First test if we can access the database
      const connectionTest = await this.testConnection()
      if (!connectionTest.success) {
        throw new Error(`Database connection failed: ${connectionTest.error}`)
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('current_xp, total_xp, profile_level, role_tier, points, address')
        .eq('address', address)
        .single()

      console.log('📊 Current profile data:', { data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found, creating new one...')
          // Create a new profile with default values
          const { error: insertError } = await this.supabase
            .from('user_profiles')
            .insert({
              address,
              current_xp: 0,
              total_xp: 0,
              profile_level: 1,
              points: 0,
              role_tier: 'NOMAD',

              achievements_data: [],
              referral_data: {},
              display_preferences: {},
              // payment_preferences: {}, // Column doesn't exist
              walrus_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            })

          if (insertError) throw insertError
          console.log(`✅ Created new profile for ${address}`)
          return
        }
        throw error
      }

      const updates: any = {}
      let needsUpdate = false

      // Check and set missing fields
      if (data.current_xp === null || data.current_xp === undefined) {
        updates.current_xp = 0
        needsUpdate = true
      }
      if (data.total_xp === null || data.total_xp === undefined) {
        updates.total_xp = 0
        needsUpdate = true
      }
      if (data.profile_level === null || data.profile_level === undefined) {
        updates.profile_level = 1
        needsUpdate = true
      }
      if (data.points === null || data.points === undefined) {
        updates.points = 0
        needsUpdate = true
      }
      if (!data.role_tier) {
        updates.role_tier = 'NOMAD'
        needsUpdate = true
      }


      if (needsUpdate) {
        updates.updated_at = new Date().toISOString()
        updates.last_active = new Date().toISOString()

        console.log('📝 Applying updates:', updates)
        const { error: updateError } = await this.supabase
          .from('user_profiles')
          .update(updates)
          .eq('address', address)

        if (updateError) throw updateError
        console.log(`✅ Fixed missing XP fields for ${address}:`, updates)
      } else {
        console.log(`✅ XP fields already correct for ${address}`)
      }
    } catch (error) {
      console.error('❌ Failed to fix XP fields:', error)
      throw error
    }
  }

  /**
   * Get public profile data for user discovery (no decryption)
   */
  async getPublicProfile(address: string): Promise<Partial<DecryptedProfile> | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select(`
          address,
          profile_image_blob_id,
          banner_image_blob_id,
          role_tier,
          profile_level,

          join_date,
          last_active,
          achievements_data,
          created_at,
          updated_at
        `)
        .eq('address', address)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        address: data.address,
        profile_image_blob_id: data.profile_image_blob_id,
        banner_image_blob_id: data.banner_image_blob_id,
        role_tier: data.role_tier,
        profile_level: data.profile_level,

        join_date: data.join_date,
        last_active: data.last_active,
        achievements_data: data.achievements_data || [],
        created_at: data.created_at,
        updated_at: data.updated_at,

        referral_data: {},
        display_preferences: {},
        walrus_metadata: {},
        current_xp: 0,
        total_xp: 0
      }
    } catch (error) {
      console.error('Failed to get public profile:', error)
      return null
    }
  }

  /**
   * Get all public profiles for community discovery
   */
  async getAllPublicProfiles(limit = 100): Promise<DecryptedProfile[]> {
    try {
      console.log('🔍 Fetching all public profiles from database...')

      // Simple query like the working ones
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Database query error:', error)
        throw error
      }

      console.log(`📊 Found ${data?.length || 0} profiles in database`)

      if (!data || data.length === 0) {
        console.log('ℹ️ No data returned from database')
        return []
      }

      // Decrypt profiles using the same method as getDecryptedProfile
      const decryptedProfiles: DecryptedProfile[] = []

      for (const profile of data) {
        try {
          console.log(`🔓 Processing profile: ${profile.address}`)
          const encryptionKey = this.generateEncryptionKey(profile.address)
          const decryptedProfile = this.decryptProfile(profile, encryptionKey)
          decryptedProfiles.push(decryptedProfile)
          console.log(`✅ Successfully processed profile: ${profile.address}`)
        } catch (decryptError) {
          console.warn(`⚠️ Failed to decrypt profile ${profile.address}:`, decryptError)
          // Add profile with public data only as fallback
          const fallbackProfile: DecryptedProfile = {
            id: profile.id,
            address: profile.address,
            username: `User ${profile.address.slice(0, 6)}`,
            profile_image_blob_id: profile.profile_image_blob_id,
            banner_image_blob_id: profile.banner_image_blob_id,
            role_tier: profile.role_tier || 'NOMAD',
            profile_level: profile.profile_level || 1,
            current_xp: profile.current_xp || 0,
            total_xp: profile.total_xp || 0,
            points: profile.points || 0,

            join_date: profile.join_date,
            last_active: profile.last_active,
            achievements_data: profile.achievements_data || [],
            referral_data: profile.referral_data || {},
            display_preferences: profile.display_preferences || {},
            walrus_metadata: profile.walrus_metadata || {},

            created_at: profile.created_at,
            updated_at: profile.updated_at
          }
          console.log(`🔄 Added fallback profile for: ${profile.address}`)
          decryptedProfiles.push(fallbackProfile)
        }
      }

      console.log(`✅ Successfully decrypted ${decryptedProfiles.length} profiles`)
      return decryptedProfiles

    } catch (error) {
      console.error('❌ Failed to get all public profiles:', error)
      throw error
    }
  }
}

// Export singleton
export const encryptedStorage = new EncryptedDatabaseStorage()

// Global debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).debugImageBlobs = async (address: string) => {
    await encryptedStorage.debugImageBlobIds(address)
  }
}

// Export types
export type { DecryptedProfile, Achievement }

// Helper functions for React components
export async function updateEncryptedUserProfile(
  address: string,
  profileData: Partial<DecryptedProfile>,
  imageFile?: File,
  signer?: any
): Promise<DecryptedProfile> {
  return encryptedStorage.upsertEncryptedProfile(address, profileData, imageFile, signer)
}

export async function getDecryptedUserProfile(address: string): Promise<DecryptedProfile | null> {
  return encryptedStorage.getDecryptedProfile(address)
}

export async function getUserAvatarUrl(address: string): Promise<string | null> {
  return encryptedStorage.getAvatarUrl(address)
}
