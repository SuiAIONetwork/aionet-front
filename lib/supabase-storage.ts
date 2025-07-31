/**
 * Supabase Storage Service
 * Handles all image storage operations using Supabase Storage
 * Replaces Walrus storage functionality
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { testSupabaseStorageConfig } from './supabase-storage-test'

// Content type definitions (matching Walrus types for compatibility)
export type StorageContentType = 
  | 'profile-image'
  | 'channel-banner' 
  | 'achievement-icon'
  | 'user-profile'
  | 'channel-description'
  | 'achievement-data'
  | 'settings-data'

// Storage result interface
export interface StorageResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

// Upload options interface
export interface UploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
}

class SupabaseStorageService {
  private supabase: SupabaseClient
  private bucketName = 'aionetmedia'
  private isInitialized = false

  constructor() {
    // Run configuration test in development
    if (process.env.NODE_ENV === 'development') {
      testSupabaseStorageConfig()
    }

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
    // Initialize immediately and mark as available for basic operations
    this.isInitialized = true
    this.initialize()
  }

  /**
   * Initialize the storage service (optional bucket verification)
   */
  private async initialize() {
    try {
      // Optional: Check if bucket exists and is accessible
      // This is just for logging, we don't block operations on this
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName)

      if (error) {
        console.warn(`⚠️ Supabase storage bucket '${this.bucketName}' verification failed:`, error.message)
        console.log('📝 Storage operations will still work if bucket exists and is properly configured')
      } else {
        console.log(`✅ Supabase storage verified with bucket: ${this.bucketName}`)
      }
    } catch (error) {
      console.warn('Supabase storage verification failed:', error)
      console.log('📝 Storage operations will still work if bucket exists and is properly configured')
    }
  }

  /**
   * Get the folder path based on content type
   */
  private getFolderPath(contentType: StorageContentType): string {
    const folderMap: Record<StorageContentType, string> = {
      'profile-image': 'avatars',
      'channel-banner': 'banners',
      'achievement-icon': 'achievements',
      'user-profile': 'profiles',
      'channel-description': 'descriptions',
      'achievement-data': 'achievements',
      'settings-data': 'settings'
    }
    return folderMap[contentType] || 'misc'
  }

  /**
   * Generate a unique filename
   */
  private generateFileName(originalName?: string, contentType?: StorageContentType): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    
    if (originalName) {
      const extension = originalName.split('.').pop()
      return `${timestamp}_${random}.${extension}`
    }
    
    // Default to jpg for images
    const defaultExt = contentType?.includes('image') ? 'jpg' : 'json'
    return `${timestamp}_${random}.${defaultExt}`
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    contentType: StorageContentType,
    options: UploadOptions = {}
  ): Promise<StorageResult> {
    // Always try to upload, don't block on initialization status

    try {
      const folder = this.getFolderPath(contentType)
      const fileName = this.generateFileName(file.name, contentType)
      const filePath = `${folder}/${fileName}`

      console.log(`📁 Uploading file to Supabase Storage: ${filePath}`)

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          upsert: options.upsert || false,
          contentType: options.contentType || file.type,
          cacheControl: options.cacheControl || '3600'
        })

      if (error) {
        console.error('Upload failed:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      console.log(`✅ File uploaded successfully: ${urlData.publicUrl}`)

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload image data (File or data URL)
   */
  async uploadImage(
    image: File | string,
    contentType: StorageContentType,
    options: UploadOptions = {}
  ): Promise<StorageResult> {
    try {
      let file: File

      if (typeof image === 'string') {
        // Convert data URL to File
        const response = await fetch(image)
        const blob = await response.blob()
        const fileName = this.generateFileName(undefined, contentType)
        file = new File([blob], fileName, { type: blob.type })
      } else {
        file = image
      }

      return await this.uploadFile(file, contentType, options)
    } catch (error) {
      console.error('Image upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image'
      }
    }
  }

  /**
   * Get public URL for a file path
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    // Always try to delete, don't block on initialization status

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Delete failed:', error)
        return false
      }

      console.log(`🗑️ File deleted: ${filePath}`)
      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    // Always return true since we initialize immediately
    // The actual upload will handle any errors
    return true
  }

  /**
   * Convert old Walrus blob ID to Supabase storage URL
   * This is for backward compatibility during migration
   */
  convertBlobIdToUrl(blobId: string | null): string | null {
    if (!blobId) return null

    // Check if it's already a Supabase URL
    if (blobId.includes('supabase.co')) {
      return blobId
    }

    // Check if it's a default avatar path
    if (blobId.startsWith('/images/animepfp/')) {
      return blobId
    }

    // For old Walrus blob IDs, we can't convert them directly
    // Return null so the app can handle missing images gracefully
    console.warn(`⚠️ Cannot convert Walrus blob ID to Supabase URL: ${blobId}`)
    return null
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService()

// Helper functions for easy usage
export async function uploadProfileImage(file: File): Promise<StorageResult> {
  return supabaseStorage.uploadImage(file, 'profile-image')
}

export async function uploadChannelBanner(file: File): Promise<StorageResult> {
  return supabaseStorage.uploadImage(file, 'channel-banner')
}

export async function uploadAchievementIcon(file: File): Promise<StorageResult> {
  return supabaseStorage.uploadImage(file, 'achievement-icon')
}

export function getImageUrl(pathOrBlobId: string | null): string | null {
  if (!pathOrBlobId) return null
  
  // If it's already a full URL, return as is
  if (pathOrBlobId.startsWith('http')) {
    return pathOrBlobId
  }
  
  // If it's a default avatar path, return as is
  if (pathOrBlobId.startsWith('/images/')) {
    return pathOrBlobId
  }
  
  // If it's a Supabase storage path, get public URL
  if (pathOrBlobId.includes('/')) {
    return supabaseStorage.getPublicUrl(pathOrBlobId)
  }
  
  // Try to convert old Walrus blob ID
  return supabaseStorage.convertBlobIdToUrl(pathOrBlobId)
}
