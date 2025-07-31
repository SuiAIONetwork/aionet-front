"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { api } from '@/lib/api-client'

// Type definition for ReferralCode
interface ReferralCode {
  id: string;
  code: string;
  userAddress: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}
import { toast } from 'sonner'

interface ReferralCodeState {
  codes: ReferralCode[]
  isLoading: boolean
  error: string | null
}

interface ReferralCodeActions {
  loadReferralCodes: () => Promise<void>
  createDefaultCode: (username: string) => Promise<boolean>
  refreshCodes: () => Promise<void>
  getDefaultCode: () => ReferralCode | null
  getReferralLink: (code?: string) => string
}

export function useReferralCodes(): ReferralCodeState & ReferralCodeActions {
  const { user } = useSuiAuth()
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load referral codes for the current user
  const loadReferralCodes = useCallback(async () => {
    if (!user?.address) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 Loading referral codes for:', user.address)
      // TODO: Migrate to backend API
      const userCodes: ReferralCode[] = []
      setCodes(userCodes)
      console.log('✅ Loaded', userCodes.length, 'referral codes')
    } catch (error) {
      console.error('❌ Failed to load referral codes:', error)
      setError('Failed to load referral codes')
    } finally {
      setIsLoading(false)
    }
  }, [user?.address])

  // Create default referral code for user
  const createDefaultCode = useCallback(async (username: string): Promise<boolean> => {
    if (!user?.address) return false

    setIsLoading(true)
    setError(null)

    try {
      console.log('🆕 Creating default referral code for:', username)
      // TODO: Migrate to backend API
      const success = false
      
      if (success) {
        // Reload codes to get the new one
        await loadReferralCodes()
        toast.success('✅ Default referral code created!')
        return true
      } else {
        setError('Failed to create default referral code')
        toast.error('❌ Failed to create referral code')
        return false
      }
    } catch (error) {
      console.error('❌ Failed to create default referral code:', error)
      setError('Failed to create default referral code')
      toast.error('❌ Failed to create referral code')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.address, loadReferralCodes])

  // Refresh codes
  const refreshCodes = useCallback(async () => {
    await loadReferralCodes()
  }, [loadReferralCodes])

  // Get default referral code
  const getDefaultCode = useCallback((): ReferralCode | null => {
    return codes.find(code => code.isDefault) || codes[0] || null
  }, [codes])

  // Generate referral link for a code
  const getReferralLink = useCallback((code?: string): string => {
    const referralCode = code || getDefaultCode()?.code
    if (!referralCode) return ''
    
    // Use the current domain in production, localhost in development
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://aionet.com'
    
    return `${baseUrl}?ref=${referralCode}`
  }, [getDefaultCode])

  // Load codes when user changes
  useEffect(() => {
    if (user?.address) {
      loadReferralCodes()
    } else {
      setCodes([])
      setError(null)
    }
  }, [user?.address, loadReferralCodes])

  return {
    codes,
    isLoading,
    error,
    loadReferralCodes,
    createDefaultCode,
    refreshCodes,
    getDefaultCode,
    getReferralLink
  }
}
