/**
 * Authentication Session Management
 * Handles session lifecycle, activity tracking, and automatic refresh
 */

import { 
  getAuthSession, 
  saveAuthSession, 
  clearAuthSession, 
  updateSessionActivity,
  getSessionInfo,
  type AuthSession 
} from './auth-cookies'

// Session activity tracking
let activityTimer: NodeJS.Timeout | null = null
let lastActivity = Date.now()

// Configuration
const SESSION_CONFIG = {
  ACTIVITY_INTERVAL: 15 * 60 * 1000, // Check activity every 15 minutes (less frequent)
  ACTIVITY_THRESHOLD: 60 * 60 * 1000, // Update session if active within 1 hour
  WARNING_THRESHOLD: 60 * 60 * 1000, // Show warning 1 hour before expiry (less aggressive)
}

/**
 * Initialize session management
 */
export function initializeSessionManager(): void {
  if (typeof window === 'undefined') return

  // Start activity tracking
  startActivityTracking()
  
  // Listen for user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  
  const updateActivity = () => {
    lastActivity = Date.now()
  }
  
  events.forEach(event => {
    document.addEventListener(event, updateActivity, true)
  })
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateActivity()
      checkAndRefreshSession()
    }
  })
  
  // Listen for focus events
  window.addEventListener('focus', () => {
    updateActivity()
    checkAndRefreshSession()
  })
  

}

/**
 * Start activity tracking timer
 */
function startActivityTracking(): void {
  if (activityTimer) {
    clearInterval(activityTimer)
  }
  
  activityTimer = setInterval(() => {
    const now = Date.now()
    const timeSinceActivity = now - lastActivity
    
    // If user has been active recently, update session
    if (timeSinceActivity < SESSION_CONFIG.ACTIVITY_THRESHOLD) {
      const sessionInfo = getSessionInfo()
      
      if (sessionInfo.isAuthenticated && sessionInfo.needsRefresh) {
        updateSessionActivity()
        console.log('Session refreshed due to user activity')
      }
    }
    
    // Check for session expiry warnings
    checkSessionWarnings()
    
  }, SESSION_CONFIG.ACTIVITY_INTERVAL)
}

/**
 * Stop activity tracking
 */
export function stopSessionManager(): void {
  if (activityTimer) {
    clearInterval(activityTimer)
    activityTimer = null
  }
}

/**
 * Check and refresh session if needed
 */
export function checkAndRefreshSession(): AuthSession | null {
  const session = getAuthSession()
  
  if (!session) {
    return null
  }
  
  const sessionInfo = getSessionInfo()
  
  if (sessionInfo.needsRefresh) {
    updateSessionActivity()
    console.log('Session auto-refreshed')
    return getAuthSession() // Get the refreshed session
  }
  
  return session
}

/**
 * Check for session warnings (near expiry)
 */
function checkSessionWarnings(): void {
  const sessionInfo = getSessionInfo()
  
  if (!sessionInfo.isAuthenticated || !sessionInfo.timeUntilExpiry) {
    return
  }
  
  // Show warning if session expires soon
  if (sessionInfo.timeUntilExpiry < SESSION_CONFIG.WARNING_THRESHOLD) {
    const minutes = Math.ceil(sessionInfo.timeUntilExpiry / (60 * 1000))
    console.warn(`Session expires in ${minutes} minutes`)
    
    // Emit custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-warning', {
        detail: { 
          timeUntilExpiry: sessionInfo.timeUntilExpiry,
          minutes 
        }
      }))
    }
  }
}

/**
 * Manually refresh session
 */
export function refreshSession(): boolean {
  try {
    const session = getAuthSession()
    
    if (!session) {
      return false
    }
    
    updateSessionActivity()
    console.log('Session manually refreshed')
    return true
  } catch (error) {
    console.error('Failed to refresh session:', error)
    return false
  }
}

/**
 * Get session status for UI components
 */
export function getSessionStatus(): {
  isAuthenticated: boolean
  expiresAt: string | null
  timeUntilExpiry: number | null
  needsRefresh: boolean
  isExpiringSoon: boolean
  user: AuthSession | null
} {
  const sessionInfo = getSessionInfo()
  const session = getAuthSession()
  
  return {
    ...sessionInfo,
    isExpiringSoon: sessionInfo.timeUntilExpiry ? 
      sessionInfo.timeUntilExpiry < SESSION_CONFIG.WARNING_THRESHOLD : false,
    user: session
  }
}

/**
 * Force session logout
 */
export function forceLogout(reason?: string): void {
  console.log(`Forcing logout${reason ? `: ${reason}` : ''}`)
  
  clearAuthSession()
  stopSessionManager()
  
  // Emit logout event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('force-logout', {
      detail: { reason }
    }))
  }
}

/**
 * Validate session and handle expiry
 */
export function validateSession(): AuthSession | null {
  const session = getAuthSession()
  
  if (!session) {
    return null
  }
  
  const sessionInfo = getSessionInfo()
  
  if (!sessionInfo.isAuthenticated) {
    forceLogout('Session expired')
    return null
  }
  
  return session
}

/**
 * Create session activity hook for React components
 */
export function useSessionActivity() {
  if (typeof window === 'undefined') {
    return {
      updateActivity: () => {},
      getStatus: () => getSessionStatus(),
      refresh: () => false,
      logout: () => {}
    }
  }
  
  return {
    updateActivity: () => {
      lastActivity = Date.now()
    },
    getStatus: getSessionStatus,
    refresh: refreshSession,
    logout: () => forceLogout('Manual logout')
  }
}

/**
 * Session event listeners for React components
 */
export function addSessionEventListeners(callbacks: {
  onWarning?: (detail: { timeUntilExpiry: number; minutes: number }) => void
  onLogout?: (detail: { reason?: string }) => void
}): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  const handleWarning = (event: CustomEvent) => {
    callbacks.onWarning?.(event.detail)
  }
  
  const handleLogout = (event: CustomEvent) => {
    callbacks.onLogout?.(event.detail)
  }
  
  window.addEventListener('session-warning', handleWarning as EventListener)
  window.addEventListener('force-logout', handleLogout as EventListener)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('session-warning', handleWarning as EventListener)
    window.removeEventListener('force-logout', handleLogout as EventListener)
  }
}
