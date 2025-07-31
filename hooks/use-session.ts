"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  getSessionStatus,
  refreshSession,
  addSessionEventListeners
} from '@/lib/auth-session'
import { getAuthSession, type AuthSession } from '@/lib/auth-cookies'

export interface UseSessionReturn {
  // Session state
  isAuthenticated: boolean
  user: AuthSession | null
  expiresAt: string | null
  timeUntilExpiry: number | null
  needsRefresh: boolean
  isExpiringSoon: boolean
  
  // Actions
  refresh: () => Promise<boolean>
  getTimeRemaining: () => string
  
  // Status
  isRefreshing: boolean
}

/**
 * Hook for managing authentication session
 * Provides real-time session status and management functions
 */
export function useSession(): UseSessionReturn {
  const [sessionStatus, setSessionStatus] = useState(getSessionStatus())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update session status
  const updateStatus = useCallback(() => {
    setSessionStatus(getSessionStatus())
  }, [])

  // Refresh session
  const refresh = useCallback(async (): Promise<boolean> => {
    setIsRefreshing(true)
    
    try {
      const success = refreshSession()
      if (success) {
        updateStatus()
      }
      return success
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }, [updateStatus])

  // Format time remaining
  const getTimeRemaining = useCallback((): string => {
    if (!sessionStatus.timeUntilExpiry) return ''
    
    const milliseconds = sessionStatus.timeUntilExpiry
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }, [sessionStatus.timeUntilExpiry])

  // Set up real-time updates
  useEffect(() => {
    // Update immediately
    updateStatus()

    // Set up interval to update every minute
    const interval = setInterval(updateStatus, 60000)

    // Listen for session events
    const cleanup = addSessionEventListeners({
      onWarning: (detail) => {
        console.warn(`Session warning: expires in ${detail.minutes} minutes`)
        updateStatus()
      },
      onLogout: (detail) => {
        console.log('Session logout:', detail.reason)
        updateStatus()
      }
    })

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [updateStatus])

  return {
    // Session state
    isAuthenticated: sessionStatus.isAuthenticated,
    user: sessionStatus.user,
    expiresAt: sessionStatus.expiresAt,
    timeUntilExpiry: sessionStatus.timeUntilExpiry,
    needsRefresh: sessionStatus.needsRefresh,
    isExpiringSoon: sessionStatus.isExpiringSoon,
    
    // Actions
    refresh,
    getTimeRemaining,
    
    // Status
    isRefreshing
  }
}

/**
 * Hook for session warnings
 * Provides callbacks for session expiration warnings
 */
export function useSessionWarnings(callbacks: {
  onWarning?: (minutesRemaining: number) => void
  onExpiringSoon?: () => void
  onLogout?: (reason?: string) => void
} = {}) {
  useEffect(() => {
    const cleanup = addSessionEventListeners({
      onWarning: (detail) => {
        callbacks.onWarning?.(detail.minutes)
        
        // Trigger expiring soon callback if less than 10 minutes
        if (detail.minutes <= 10) {
          callbacks.onExpiringSoon?.()
        }
      },
      onLogout: (detail) => {
        callbacks.onLogout?.(detail.reason)
      }
    })

    return cleanup
  }, [callbacks])
}

/**
 * Hook for automatic session refresh
 * Automatically refreshes session when user is active
 */
export function useAutoRefresh(options: {
  enabled?: boolean
  refreshThreshold?: number // minutes before expiry to refresh
} = {}) {
  const { enabled = true, refreshThreshold = 60 } = options
  const { needsRefresh, timeUntilExpiry, refresh } = useSession()

  useEffect(() => {
    if (!enabled || !timeUntilExpiry) return

    const thresholdMs = refreshThreshold * 60 * 1000
    
    if (needsRefresh && timeUntilExpiry < thresholdMs) {
      console.log('Auto-refreshing session due to upcoming expiry')
      refresh()
    }
  }, [enabled, needsRefresh, timeUntilExpiry, refreshThreshold, refresh])
}
