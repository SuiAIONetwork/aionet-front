"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSuiAuth } from './sui-auth-context'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useZkLogin } from '@/components/zklogin-provider'
import { useSupabaseStorage } from '@/hooks/use-supabase-storage'
import { toast } from 'sonner'
import { encryptedStorage } from '@/lib/encrypted-database-storage'

interface AvatarData {
  path?: string
  url?: string
  lastUpdated?: string
}

interface AvatarContextType {
  // Current avatar data
  avatarData: AvatarData
  isLoading: boolean
  error: string | null

  // Methods
  updateAvatar: (file: File | string, options?: { upsert?: boolean }) => Promise<boolean>
  removeAvatar: () => Promise<boolean>
  clearError: () => void

  // Utilities
  getAvatarUrl: () => string | undefined
  getFallbackText: () => string
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile } = useSuiAuth()
  const currentAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()
  const {
    uploadImage,
    convertPathToUrl,
    isAvailable: storageAvailable
  } = useSupabaseStorage()

  const [avatarData, setAvatarData] = useState<AvatarData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedImageUrl, setCachedImageUrl] = useState<string | undefined>()

  // Get user address with fallback to wallet address or zkLogin address
  const getUserAddress = () => user?.address || currentAccount?.address || zkLoginUserAddress

  // Load avatar data on mount and when user changes
  useEffect(() => {
    const address = getUserAddress()
    if (address) {
      loadAvatarFromDatabase(address)
    }
  }, [currentAccount?.address, zkLoginUserAddress, user?.address])

  // Also trigger loading when storage is available (in case wallet connects after storage)
  useEffect(() => {
    if (storageAvailable) {
      const address = getUserAddress()

      if (address && !cachedImageUrl) {
        loadAvatarFromDatabase(address)
      }
    }
  }, [storageAvailable])

  // Load avatar from database (primary) or fallback to cookies
  const loadAvatarFromDatabase = async (address: string) => {
    console.log('🔍 Loading avatar for address:', address)
    setIsLoading(true)
    setError(null)

    try {
      // Try to get avatar URL from database first
      console.log('🔄 Checking database for avatar...')
      const avatarUrl = await encryptedStorage.getAvatarUrl(address)
      console.log('📡 Database response:', avatarUrl)

      if (avatarUrl) {
        // Check if it's a default avatar path
        if (avatarUrl.startsWith('/images/animepfp/')) {
          // It's a default avatar path
          setAvatarData({ path: avatarUrl, url: avatarUrl, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(avatarUrl)
          console.log('✅ Default avatar loaded from database:', avatarUrl)
          setIsLoading(false)
          return
        } else if (avatarUrl.includes('supabase.co')) {
          // It's a Supabase storage URL
          setAvatarData({ url: avatarUrl, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(avatarUrl)
          console.log('✅ Supabase avatar loaded from database:', avatarUrl)
          setIsLoading(false)
          return
        } else if (avatarUrl.includes('walrus')) {
          // It's an old Walrus URL - extract blob ID for backward compatibility
          const blobId = avatarUrl.split('/').pop()
          if (blobId) {
            setAvatarData({ path: blobId, url: avatarUrl, lastUpdated: new Date().toISOString() })
            setCachedImageUrl(avatarUrl)
            console.log('✅ Legacy Walrus avatar loaded from database:', blobId)
            setIsLoading(false)
            return
          }
        } else {
          // It might be a Supabase storage path, try to convert it
          const convertedUrl = convertPathToUrl(avatarUrl)
          if (convertedUrl) {
            setAvatarData({ path: avatarUrl, url: convertedUrl, lastUpdated: new Date().toISOString() })
            setCachedImageUrl(convertedUrl)
            console.log('✅ Supabase avatar path converted from database:', avatarUrl)
            setIsLoading(false)
            return
          }
        }
      }

      // Fallback to cookies if database doesn't have avatar
      console.log('🍪 Falling back to cookies...')
      const blobId = user?.profileImageBlobId
      if (blobId) {
        // Check if it's a default avatar path
        if (blobId.startsWith('/images/animepfp/')) {
          setAvatarData({ path: blobId, url: blobId, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(blobId) // Use path directly for default avatars
          console.log('✅ Default avatar loaded from cookies:', blobId)
        } else if (blobId.startsWith('http')) {
          // It's already a full URL (Supabase or Walrus)
          setAvatarData({ url: blobId, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(blobId)
          console.log('✅ Full URL avatar loaded from cookies:', blobId)
        } else {
          // Try to convert as Supabase storage path first
          const convertedUrl = convertPathToUrl(blobId)
          if (convertedUrl) {
            setAvatarData({ path: blobId, url: convertedUrl, lastUpdated: new Date().toISOString() })
            setCachedImageUrl(convertedUrl)
            console.log('✅ Supabase avatar path converted from cookies:', blobId)
          } else {
            console.log('❌ Invalid avatar path in cookies:', blobId)
            setAvatarData({})
            setCachedImageUrl(undefined)
          }
        }
      } else {
        console.log('❌ No avatar found in database or cookies')
        setAvatarData({})
        setCachedImageUrl(undefined)
      }
    } catch (error) {
      console.error('❌ Failed to load avatar from database:', error)
      setError('Failed to load avatar')
      // Fallback to cookies
      const blobId = user?.profileImageBlobId
      if (blobId) {
        if (blobId.startsWith('/images/animepfp/')) {
          setAvatarData({ path: blobId, url: blobId, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(blobId) // Use path directly for default avatars
        } else if (blobId.startsWith('http')) {
          setAvatarData({ url: blobId, lastUpdated: new Date().toISOString() })
          setCachedImageUrl(blobId)
        } else {
          // Try to convert as Supabase storage path first
          const convertedUrl = convertPathToUrl(blobId)
          if (convertedUrl) {
            setAvatarData({ path: blobId, url: convertedUrl, lastUpdated: new Date().toISOString() })
            setCachedImageUrl(convertedUrl)
          } else {
            console.log('❌ Invalid avatar path from database:', blobId)
            setAvatarData({})
            setCachedImageUrl(undefined)
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update avatar using Supabase storage
  const updateAvatar = async (
    file: File | string,
    options: { upsert?: boolean } = {}
  ): Promise<boolean> => {
    const address = getUserAddress()
    if (!address) {
      setError('No wallet connected - please connect your wallet or sign in with zkLogin')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Store in Supabase Storage
      console.log('🔍 Avatar storage method:', {
        hasCurrentAccount: !!currentAccount,
        hasZkLoginAddress: !!zkLoginUserAddress,
        storageMethod: 'Supabase Storage'
      })

      const result = await uploadImage(file, 'profile-image', {
        upsert: options.upsert ?? true
      })

      if (result.success && result.path && result.url) {
        // Update avatar data with path and URL
        const newAvatarData: AvatarData = {
          path: result.path,
          url: result.url,
          lastUpdated: new Date().toISOString()
        }

        setAvatarData(newAvatarData)

        // Save to database (primary storage) - ONLY UPDATE AVATAR PATH
        console.log('🔄 Attempting to save avatar to database...', { address, path: result.path })
        try {
          // Use updateAvatarBlobId to ONLY update the avatar, not overwrite the entire profile
          await encryptedStorage.updateAvatarBlobId(address, result.path)
          console.log('✅ Avatar path saved to database successfully')
        } catch (dbError) {
          console.error('❌ Failed to save to database, using cookies fallback:', dbError)
          console.error('Database error details:', dbError)
        }

        // Also update user profile in auth context (cookies fallback)
        // Store the URL in cookies for immediate display
        await updateProfile({
          profileImageBlobId: result.url
        })

        // Set the avatar URL directly
        const avatarUrl = result.url
        setCachedImageUrl(avatarUrl)
        console.log('✅ Avatar updated successfully, URL set to:', avatarUrl)

        // Refresh avatar from database to ensure consistency
        setTimeout(() => {
          console.log('🔄 Refreshing avatar from database after upload...')
          loadAvatarFromDatabase(address)
        }, 1000)

        toast.success('Avatar uploaded to Supabase Storage successfully!')

        return true
      } else {
        setError('Failed to store avatar')
        toast.error('Failed to store avatar')
        return false
      }
    } catch (error) {
      console.error('Failed to update avatar:', error)
      setError('Failed to update avatar')
      toast.error('Failed to update avatar')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Remove avatar
  const removeAvatar = async (): Promise<boolean> => {
    const address = getUserAddress()
    if (!address) return false

    setIsLoading(true)
    setError(null)

    try {
      // Clear avatar data
      setAvatarData({})
      setCachedImageUrl(undefined)

      // Update user profile in auth context (this saves to cookies)
      await updateProfile({
        profileImageBlobId: undefined
      })

      toast.success('Avatar removed')
      return true
    } catch (error) {
      console.error('Failed to remove avatar:', error)
      setError('Failed to remove avatar')
      toast.error('Failed to remove avatar')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Get current avatar URL
  const getAvatarUrl = (): string | undefined => {
    if (cachedImageUrl) {
      console.log('🖼️ Using cached image URL:', cachedImageUrl)
      return cachedImageUrl
    }

    if (avatarData.url) {
      console.log('🖼️ Using avatar data URL:', avatarData.url)
      return avatarData.url
    }

    if (avatarData.path) {
      const convertedUrl = convertPathToUrl(avatarData.path)
      console.log('🖼️ Converting path to URL:', avatarData.path, '->', convertedUrl)
      return convertedUrl || undefined
    }

    console.log('🖼️ No avatar URL available')
    return undefined
  }

  // Get fallback text for avatar
  const getFallbackText = (): string => {
    const address = getUserAddress()
    return user?.username?.charAt(0)?.toUpperCase() || address?.charAt(2)?.toUpperCase() || 'U'
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  const value: AvatarContextType = {
    avatarData,
    isLoading,
    error,
    updateAvatar,
    removeAvatar,
    clearError,
    getAvatarUrl,
    getFallbackText
  }

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider')
  }
  return context
}
