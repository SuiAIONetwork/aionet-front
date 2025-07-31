/**
 * Rate limiting hook for frontend operations
 * Provides client-side rate limiting to prevent abuse
 */

import { useState, useCallback, useRef } from 'react'

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  keyPrefix?: string
}

interface RateLimitState {
  isAllowed: boolean
  remainingAttempts: number
  resetTime: number
  error?: string
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

export function useRateLimit(config: RateLimitConfig) {
  const { maxAttempts, windowMs, keyPrefix = 'rate_limit' } = config
  const [state, setState] = useState<RateLimitState>({
    isAllowed: true,
    remainingAttempts: maxAttempts,
    resetTime: 0
  })

  // Use ref to persist rate limit data across renders
  const rateLimitData = useRef<Map<string, RateLimitRecord>>(new Map())

  const checkRateLimit = useCallback((key: string): RateLimitState => {
    const fullKey = `${keyPrefix}_${key}`
    const now = Date.now()
    const record = rateLimitData.current.get(fullKey)

    if (!record || now > record.resetTime) {
      // Reset or create new record
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + windowMs
      }
      rateLimitData.current.set(fullKey, newRecord)
      
      const newState: RateLimitState = {
        isAllowed: true,
        remainingAttempts: maxAttempts - 1,
        resetTime: newRecord.resetTime
      }
      setState(newState)
      return newState
    }

    if (record.count >= maxAttempts) {
      const newState: RateLimitState = {
        isAllowed: false,
        remainingAttempts: 0,
        resetTime: record.resetTime,
        error: `Rate limit exceeded. Please wait ${Math.ceil((record.resetTime - now) / 1000)} seconds.`
      }
      setState(newState)
      return newState
    }

    // Increment count
    record.count++
    const newState: RateLimitState = {
      isAllowed: true,
      remainingAttempts: Math.max(0, maxAttempts - record.count),
      resetTime: record.resetTime
    }
    setState(newState)
    return newState
  }, [maxAttempts, windowMs, keyPrefix])

  const executeWithRateLimit = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    const rateLimitState = checkRateLimit(key)
    
    if (!rateLimitState.isAllowed) {
      return {
        success: false,
        error: rateLimitState.error || 'Rate limit exceeded'
      }
    }

    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed'
      }
    }
  }, [checkRateLimit])

  const getRemainingTime = useCallback((key: string): number => {
    const fullKey = `${keyPrefix}_${key}`
    const record = rateLimitData.current.get(fullKey)
    if (!record || Date.now() > record.resetTime) {
      return 0
    }
    return Math.max(0, record.resetTime - Date.now())
  }, [keyPrefix])

  const clearRateLimit = useCallback((key: string) => {
    const fullKey = `${keyPrefix}_${key}`
    rateLimitData.current.delete(fullKey)
    setState({
      isAllowed: true,
      remainingAttempts: maxAttempts,
      resetTime: 0
    })
  }, [keyPrefix, maxAttempts])

  return {
    state,
    checkRateLimit,
    executeWithRateLimit,
    getRemainingTime,
    clearRateLimit
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  REFERRAL_TRACKING: {
    maxAttempts: 10,
    windowMs: 60000, // 1 minute
    keyPrefix: 'referral_track'
  },
  AFFILIATE_QUERIES: {
    maxAttempts: 20,
    windowMs: 60000, // 1 minute
    keyPrefix: 'affiliate_query'
  },
  COMMISSION_QUERIES: {
    maxAttempts: 15,
    windowMs: 60000, // 1 minute
    keyPrefix: 'commission_query'
  },
  PROFILE_UPDATES: {
    maxAttempts: 5,
    windowMs: 300000, // 5 minutes
    keyPrefix: 'profile_update'
  }
} as const

// Convenience hooks for common operations
export const useReferralTrackingRateLimit = () => useRateLimit(RATE_LIMIT_CONFIGS.REFERRAL_TRACKING)
export const useAffiliateQueryRateLimit = () => useRateLimit(RATE_LIMIT_CONFIGS.AFFILIATE_QUERIES)
export const useCommissionQueryRateLimit = () => useRateLimit(RATE_LIMIT_CONFIGS.COMMISSION_QUERIES)
export const useProfileUpdateRateLimit = () => useRateLimit(RATE_LIMIT_CONFIGS.PROFILE_UPDATES)
