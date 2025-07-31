"use client"

import { useState, useCallback } from 'react'
import { 
  supabaseStorage, 
  uploadProfileImage, 
  uploadChannelBanner, 
  uploadAchievementIcon,
  getImageUrl,
  type StorageContentType,
  type StorageResult 
} from '@/lib/supabase-storage'
import { toast } from 'sonner'

// Storage options interface
export interface StorageOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
}

// Hook result interface
export interface UseSupabaseStorageResult {
  isLoading: boolean
  isAvailable: boolean
  uploadImage: (image: File | string, contentType: StorageContentType, options?: StorageOptions) => Promise<StorageResult>
  uploadFile: (file: File, contentType: StorageContentType, options?: StorageOptions) => Promise<StorageResult>
  getPublicUrl: (path: string) => string
  deleteFile: (path: string) => Promise<boolean>
  convertPathToUrl: (path: string | null) => string | null
}

/**
 * Hook for Supabase Storage operations
 * Provides a simple interface for uploading and managing files
 */
export function useSupabaseStorage(): UseSupabaseStorageResult {
  const [isLoading, setIsLoading] = useState(false)

  // Check if storage is available
  const isAvailable = supabaseStorage.isAvailable()

  /**
   * Upload an image (File or data URL)
   */
  const uploadImage = useCallback(async (
    image: File | string,
    contentType: StorageContentType,
    options: StorageOptions = {}
  ): Promise<StorageResult> => {
    if (!isAvailable) {
      const error = 'Supabase Storage is not available'
      toast.error(error)
      return { success: false, error }
    }

    setIsLoading(true)

    try {
      console.log(`📁 Uploading ${contentType} image...`)
      
      const result = await supabaseStorage.uploadImage(image, contentType, options)
      
      if (result.success) {
        console.log(`✅ Image uploaded successfully: ${result.url}`)
        toast.success('Image uploaded successfully!')
      } else {
        console.error('Upload failed:', result.error)
        toast.error(result.error || 'Upload failed')
      }

      return result
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable])

  /**
   * Upload a file
   */
  const uploadFile = useCallback(async (
    file: File,
    contentType: StorageContentType,
    options: StorageOptions = {}
  ): Promise<StorageResult> => {
    if (!isAvailable) {
      const error = 'Supabase Storage is not available'
      toast.error(error)
      return { success: false, error }
    }

    setIsLoading(true)

    try {
      console.log(`📁 Uploading ${contentType} file: ${file.name}`)
      
      const result = await supabaseStorage.uploadFile(file, contentType, options)
      
      if (result.success) {
        console.log(`✅ File uploaded successfully: ${result.url}`)
        toast.success('File uploaded successfully!')
      } else {
        console.error('Upload failed:', result.error)
        toast.error(result.error || 'Upload failed')
      }

      return result
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable])

  /**
   * Get public URL for a file path
   */
  const getPublicUrl = useCallback((path: string): string => {
    return supabaseStorage.getPublicUrl(path)
  }, [])

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    if (!isAvailable) {
      toast.error('Supabase Storage is not available')
      return false
    }

    try {
      const success = await supabaseStorage.deleteFile(path)
      if (success) {
        toast.success('File deleted successfully!')
      } else {
        toast.error('Failed to delete file')
      }
      return success
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file')
      return false
    }
  }, [isAvailable])

  /**
   * Convert storage path to public URL
   */
  const convertPathToUrl = useCallback((path: string | null): string | null => {
    return getImageUrl(path)
  }, [])

  return {
    isLoading,
    isAvailable,
    uploadImage,
    uploadFile,
    getPublicUrl,
    deleteFile,
    convertPathToUrl
  }
}

/**
 * Specialized hook for profile image uploads
 */
export function useProfileImageUpload() {
  const { uploadImage, isLoading, isAvailable } = useSupabaseStorage()

  const uploadProfileImage = useCallback(async (image: File | string): Promise<StorageResult> => {
    return uploadImage(image, 'profile-image')
  }, [uploadImage])

  return {
    uploadProfileImage,
    isLoading,
    isAvailable
  }
}

/**
 * Specialized hook for banner image uploads
 */
export function useBannerImageUpload() {
  const { uploadImage, isLoading, isAvailable } = useSupabaseStorage()

  const uploadBannerImage = useCallback(async (image: File | string): Promise<StorageResult> => {
    return uploadImage(image, 'channel-banner')
  }, [uploadImage])

  return {
    uploadBannerImage,
    isLoading,
    isAvailable
  }
}

/**
 * Specialized hook for achievement icon uploads
 */
export function useAchievementIconUpload() {
  const { uploadImage, isLoading, isAvailable } = useSupabaseStorage()

  const uploadAchievementIcon = useCallback(async (image: File | string): Promise<StorageResult> => {
    return uploadImage(image, 'achievement-icon')
  }, [uploadImage])

  return {
    uploadAchievementIcon,
    isLoading,
    isAvailable
  }
}

// Helper functions for backward compatibility
export async function storeImage(
  image: File | string,
  contentType: StorageContentType,
  options?: StorageOptions
): Promise<StorageResult> {
  return supabaseStorage.uploadImage(image, contentType, options)
}

export async function storeFile(
  file: File,
  contentType: StorageContentType,
  options?: StorageOptions
): Promise<StorageResult> {
  return supabaseStorage.uploadFile(file, contentType, options)
}

export { getImageUrl } from '@/lib/supabase-storage'
