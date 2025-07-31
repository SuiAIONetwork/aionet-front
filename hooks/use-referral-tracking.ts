"use client"

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useReferralTrackingRateLimit } from './use-rate-limit'

interface ReferralTrackingState {
  referralCode: string | null
  sessionId: string | null
  isTracked: boolean
  isLoading: boolean
}

interface ReferralTrackingActions {
  trackReferralClick: (code: string) => Promise<boolean>
  getReferralFromUrl: () => string | null
  clearReferralData: () => void
  processReferralOnSignup: (userAddress: string) => Promise<boolean>
}

const REFERRAL_STORAGE_KEY = 'aionet_referral_data'
const SESSION_STORAGE_KEY = 'aionet_session_id'

export function useReferralTracking(): ReferralTrackingState & ReferralTrackingActions {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTracked, setIsTracked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Rate limiting for referral tracking
  const rateLimitHook = useReferralTrackingRateLimit()

  // Initialize referral tracking from URL, cookies, or localStorage
  useEffect(() => {
    const initializeReferralTracking = async () => {
      // Check URL parameters first
      const urlReferralCode = getReferralFromUrl()

      if (urlReferralCode) {
        console.log('🔗 Found referral code in URL:', urlReferralCode)
        await trackReferralClick(urlReferralCode)
        return
      }

      // Check cookies for referral code (set by middleware)
      const cookieReferralCode = document.cookie
        .split('; ')
        .find(row => row.startsWith('aionet_referral_code='))
        ?.split('=')[1]

      if (cookieReferralCode) {
        console.log('🍪 Found referral code in cookie:', cookieReferralCode)
        await trackReferralClick(cookieReferralCode)
        // Clear the cookie after processing
        document.cookie = 'aionet_referral_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        return
      }

      // Check localStorage for existing referral data
      const storedData = localStorage.getItem(REFERRAL_STORAGE_KEY)
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)

      if (storedData && storedSessionId) {
        try {
          const data = JSON.parse(storedData)
          setReferralCode(data.referralCode)
          setSessionId(storedSessionId)
          setIsTracked(true)
          console.log('📱 Restored referral data from localStorage:', data.referralCode)
        } catch (error) {
          console.error('Failed to parse stored referral data:', error)
          clearReferralData()
        }
      }
    }

    initializeReferralTracking()
  }, [])

  // Get referral code from URL parameters
  const getReferralFromUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null

    const urlParams = new URLSearchParams(window.location.search)
    const refParam = urlParams.get('ref')
    
    // Also check for /ref/CODE format in pathname
    const pathname = window.location.pathname
    const refMatch = pathname.match(/\/ref\/([^\/]+)/)
    
    return refParam || (refMatch ? refMatch[1] : null)
  }, [])

  // Track referral click
  const trackReferralClick = useCallback(async (code: string): Promise<boolean> => {
    if (!code) return false

    setIsLoading(true)

    try {
      // Check rate limit before proceeding
      const rateLimitResult = rateLimitHook.checkRateLimit('track_click')
      if (!rateLimitResult.isAllowed) {
        console.warn('⚠️ Rate limit exceeded for referral tracking:', rateLimitResult.error)
        return false
      }

      // Generate or get existing session ID
      let currentSessionId = sessionId || localStorage.getItem(SESSION_STORAGE_KEY)
      if (!currentSessionId) {
        currentSessionId = uuidv4()
        localStorage.setItem(SESSION_STORAGE_KEY, currentSessionId)
      }

      console.log('📊 Tracking referral click:', code, currentSessionId)

      // Execute with rate limit
      const trackingResult = await rateLimitHook.executeWithRateLimit(
        'track_click',
        async () => {
          const response = await fetch('/api/referral/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referralCode: code,
              sessionId: currentSessionId,
              userAgent: navigator.userAgent,
              referrerUrl: document.referrer
            })
          })
          return response.json()
        }
      )

      if (!trackingResult.success) {
        console.error('❌ Failed to track referral click:', trackingResult.error)
        return false
      }

      const result = trackingResult.data

      if (result?.success) {
        // Store referral data
        const referralData = {
          referralCode: code,
          trackedAt: new Date().toISOString()
        }

        localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralData))
        localStorage.setItem(SESSION_STORAGE_KEY, result.sessionId)

        setReferralCode(code)
        setSessionId(result.sessionId)
        setIsTracked(true)

        console.log('✅ Referral click tracked successfully')
        return true
      } else {
        console.error('❌ Failed to track referral click:', result?.error || 'Unknown error')
        return false
      }
    } catch (error) {
      console.error('❌ Error tracking referral click:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, rateLimitHook])

  // Clear referral data
  const clearReferralData = useCallback(() => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setReferralCode(null)
    setSessionId(null)
    setIsTracked(false)
    console.log('🧹 Cleared referral data')
  }, [])

  // Process referral when user completes signup
  const processReferralOnSignup = useCallback(async (userAddress: string): Promise<boolean> => {
    if (!sessionId || !referralCode) {
      console.log('ℹ️ No referral data to process')
      return false
    }

    try {
      console.log('🔄 Processing referral on signup:', referralCode, userAddress)

      // TODO: Migrate this to backend API
      // For now, we'll simulate success
      const success = true // Placeholder

      if (success) {
        console.log('✅ Referral processed successfully on signup')
        // Clear referral data after successful processing
        clearReferralData()
        return true
      } else {
        console.log('❌ Failed to process referral on signup')
        return false
      }
    } catch (error) {
      console.error('❌ Error processing referral on signup:', error)
      return false
    }
  }, [sessionId, referralCode, clearReferralData])

  return {
    referralCode,
    sessionId,
    isTracked,
    isLoading,
    trackReferralClick,
    getReferralFromUrl,
    clearReferralData,
    processReferralOnSignup
  }
}
