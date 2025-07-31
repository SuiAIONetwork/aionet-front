/**
 * Database + Supabase Storage Integration
 * Unified storage solution using Supabase for both database and file storage
 */

import { createClient } from '@supabase/supabase-js'
import { supabaseStorage, uploadProfileImage, uploadChannelBanner, getImageUrl } from './supabase-storage'

// Database schema (SQL)
/*
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  profile_image_path TEXT, -- Supabase storage path
  banner_image_path TEXT,  -- Supabase storage path
  bio TEXT,
  social_links JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_address ON user_profiles(address);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
*/

interface DatabaseProfile {
  id: string
  address: string
  username?: string
  email?: string
  profile_image_path?: string
  banner_image_path?: string
  bio?: string
  social_links: any[]
  created_at: string
  updated_at: string
}

class DatabaseSupabaseIntegration {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  /**
   * Create or update user profile with Supabase image storage
   */
  async upsertProfileWithImage(
    address: string,
    profileData: Partial<DatabaseProfile>,
    imageFile?: File
  ): Promise<DatabaseProfile> {
    try {
      let profileImagePath: string | undefined

      // Store image in Supabase Storage if provided
      if (imageFile) {
        const imageResult = await uploadProfileImage(imageFile)
        if (imageResult.success && imageResult.path) {
          profileImagePath = imageResult.path
          console.log(`Image stored in Supabase Storage: ${profileImagePath}`)
        } else {
          throw new Error(imageResult.error || 'Failed to upload image')
        }
      }

      // Prepare profile data
      const profileUpdate = {
        ...profileData,
        address,
        updated_at: new Date().toISOString(),
        ...(profileImagePath && { profile_image_path: profileImagePath })
      }

      // Upsert profile in database
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(profileUpdate, { 
          onConflict: 'address',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('Database upsert failed:', error)
        throw error
      }

      console.log('✅ Profile updated successfully')
      return data
    } catch (error) {
      console.error('Failed to upsert profile with image:', error)
      throw error
    }
  }

  /**
   * Update profile banner image
   */
  async updateProfileBanner(
    address: string,
    bannerFile: File
  ): Promise<string> {
    try {
      // Upload banner to Supabase Storage
      const bannerResult = await uploadChannelBanner(bannerFile)
      if (!bannerResult.success || !bannerResult.path) {
        throw new Error(bannerResult.error || 'Failed to upload banner')
      }

      // Update database record
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ 
          banner_image_path: bannerResult.path,
          updated_at: new Date().toISOString()
        })
        .eq('address', address)

      if (error) {
        console.error('Database update failed:', error)
        throw error
      }

      console.log(`Banner updated successfully: ${bannerResult.path}`)
      return bannerResult.path
    } catch (error) {
      console.error('Failed to update profile banner:', error)
      throw error
    }
  }

  /**
   * Get profile by address
   */
  async getProfile(address: string): Promise<DatabaseProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('address', address)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get profile:', error)
      throw error
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<DatabaseProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get profile by username:', error)
      throw error
    }
  }

  /**
   * Get avatar URL for a user
   */
  async getAvatarUrl(address: string): Promise<string | null> {
    try {
      const profile = await this.getProfile(address)
      if (!profile?.profile_image_path) {
        return null
      }

      return getImageUrl(profile.profile_image_path)
    } catch (error) {
      console.error('Failed to get avatar URL:', error)
      return null
    }
  }

  /**
   * Get banner URL for a user
   */
  async getBannerUrl(address: string): Promise<string | null> {
    try {
      const profile = await this.getProfile(address)
      if (!profile?.banner_image_path) {
        return null
      }

      return getImageUrl(profile.banner_image_path)
    } catch (error) {
      console.error('Failed to get banner URL:', error)
      return null
    }
  }

  /**
   * Delete profile and associated images
   */
  async deleteProfile(address: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(address)
      if (!profile) {
        return false
      }

      // Delete images from storage if they exist
      if (profile.profile_image_path) {
        await supabaseStorage.deleteFile(profile.profile_image_path)
      }
      if (profile.banner_image_path) {
        await supabaseStorage.deleteFile(profile.banner_image_path)
      }

      // Delete profile from database
      const { error } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('address', address)

      if (error) {
        console.error('Database delete failed:', error)
        throw error
      }

      console.log(`Profile deleted successfully: ${address}`)
      return true
    } catch (error) {
      console.error('Failed to delete profile:', error)
      return false
    }
  }

  /**
   * Search profiles by username
   */
  async searchProfiles(query: string, limit: number = 10): Promise<DatabaseProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to search profiles:', error)
      return []
    }
  }

  /**
   * Get recent profiles
   */
  async getRecentProfiles(limit: number = 10): Promise<DatabaseProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to get recent profiles:', error)
      return []
    }
  }
}

// Export singleton
export const dbSupabaseIntegration = new DatabaseSupabaseIntegration()

// Helper functions for React components
export async function updateUserAvatar(
  address: string,
  imageFile: File
): Promise<string> {
  const result = await dbSupabaseIntegration.upsertProfileWithImage(
    address,
    {},
    imageFile
  )
  return result.profile_image_path!
}

export async function updateUserBanner(
  address: string,
  bannerFile: File
): Promise<string> {
  return dbSupabaseIntegration.updateProfileBanner(address, bannerFile)
}

export async function getUserAvatarUrl(address: string): Promise<string | null> {
  return dbSupabaseIntegration.getAvatarUrl(address)
}

export async function getUserBannerUrl(address: string): Promise<string | null> {
  return dbSupabaseIntegration.getBannerUrl(address)
}
