/**
 * Authentication Cookie Utilities
 * Provides secure cookie-based session management for persistent authentication
 */

export interface AuthSession {
  address: string
  connectionType: 'wallet' | 'zklogin'
  username?: string
  email?: string
  profileImage?: string
  profileImageBlobId?: string
  createdAt: string
  lastLoginAt: string
  expiresAt: string
}

export interface ZkLoginSession {
  jwt: string
  userSalt: string
  address: string
  nonce: string
  maxEpoch: number
  randomness: string
  ephemeralKey: string
  expiresAt: string
}

// Cookie configuration
const COOKIE_CONFIG = {
  AUTH_SESSION: 'aio_auth_session',
  ZKLOGIN_SESSION: 'aio_zklogin_session',
  SESSION_REFRESH: 'aio_session_refresh',
  MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds (longer session)
  REFRESH_THRESHOLD: 7 * 24 * 60 * 60, // Refresh if expires within 7 days (less aggressive)
  PATH: '/',
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
}

/**
 * Set a cookie with proper security settings
 */
function setCookie(name: string, value: string, maxAge?: number): void {
  if (typeof document === 'undefined') return

  const age = maxAge || COOKIE_CONFIG.MAX_AGE
  const secure = COOKIE_CONFIG.SECURE ? '; Secure' : ''
  const sameSite = `; SameSite=${COOKIE_CONFIG.SAME_SITE}`
  
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=${COOKIE_CONFIG.PATH}; Max-Age=${age}${secure}${sameSite}`
}

/**
 * Get a cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
  }
  return null
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=; Path=${COOKIE_CONFIG.PATH}; Expires=Thu, 01 Jan 1970 00:00:01 GMT`
}

/**
 * Check if a session is expired
 */
function isSessionExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt)
}

/**
 * Check if a session needs refresh (expires within threshold)
 */
function needsRefresh(expiresAt: string): boolean {
  const now = new Date()
  const expires = new Date(expiresAt)
  const threshold = new Date(now.getTime() + (COOKIE_CONFIG.REFRESH_THRESHOLD * 1000))
  
  return expires < threshold
}

/**
 * Create expiration date for new session
 */
function createExpirationDate(): string {
  const now = new Date()
  return new Date(now.getTime() + (COOKIE_CONFIG.MAX_AGE * 1000)).toISOString()
}

/**
 * Save authentication session to cookie
 */
export function saveAuthSession(session: Omit<AuthSession, 'expiresAt'>): void {
  try {
    const sessionWithExpiry: AuthSession = {
      ...session,
      expiresAt: createExpirationDate()
    }
    
    const sessionData = JSON.stringify(sessionWithExpiry)
    setCookie(COOKIE_CONFIG.AUTH_SESSION, sessionData)
    
    // Also save to localStorage as fallback
    localStorage.setItem(COOKIE_CONFIG.AUTH_SESSION, sessionData)
    
    console.log('Auth session saved to cookie and localStorage')
  } catch (error) {
    console.error('Failed to save auth session:', error)
  }
}

/**
 * Get authentication session from cookie
 */
export function getAuthSession(): AuthSession | null {
  try {
    // Try cookie first
    let sessionData = getCookie(COOKIE_CONFIG.AUTH_SESSION)
    
    // Fallback to localStorage
    if (!sessionData && typeof localStorage !== 'undefined') {
      sessionData = localStorage.getItem(COOKIE_CONFIG.AUTH_SESSION)
    }
    
    if (!sessionData) return null
    
    const session: AuthSession = JSON.parse(sessionData)
    
    // Check if session is expired (with grace period)
    if (isSessionExpired(session.expiresAt)) {
      console.log('Session expired, but keeping for wallet reconnection grace period')
      // Don't immediately clear - give wallet time to reconnect
      // Only clear if it's been expired for more than 1 hour
      const expiredTime = new Date().getTime() - new Date(session.expiresAt).getTime()
      const graceTime = 60 * 60 * 1000 // 1 hour grace period

      if (expiredTime > graceTime) {
        clearAuthSession()
        return null
      }

      // Return session even if expired (within grace period)
      return session
    }
    
    // Auto-refresh if needed
    if (needsRefresh(session.expiresAt)) {
      const refreshedSession = {
        ...session,
        lastLoginAt: new Date().toISOString(),
        expiresAt: createExpirationDate()
      }
      saveAuthSession(refreshedSession)
      return refreshedSession
    }
    
    return session
  } catch (error) {
    console.error('Failed to get auth session:', error)
    return null
  }
}

/**
 * Clear authentication session
 */
export function clearAuthSession(): void {
  console.log('🧹 Clearing authentication session...')

  deleteCookie(COOKIE_CONFIG.AUTH_SESSION)
  deleteCookie(COOKIE_CONFIG.ZKLOGIN_SESSION)
  deleteCookie(COOKIE_CONFIG.SESSION_REFRESH)

  // Also clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(COOKIE_CONFIG.AUTH_SESSION)
    localStorage.removeItem(COOKIE_CONFIG.ZKLOGIN_SESSION)
  }

  console.log('✅ Auth session cleared')
}

/**
 * Save zkLogin session to cookie
 */
export function saveZkLoginSession(session: Omit<ZkLoginSession, 'expiresAt'>): void {
  try {
    const sessionWithExpiry: ZkLoginSession = {
      ...session,
      expiresAt: createExpirationDate()
    }
    
    const sessionData = JSON.stringify(sessionWithExpiry)
    setCookie(COOKIE_CONFIG.ZKLOGIN_SESSION, sessionData)
    
    // Also save to localStorage as fallback
    localStorage.setItem(COOKIE_CONFIG.ZKLOGIN_SESSION, sessionData)
    
    console.log('zkLogin session saved to cookie and localStorage')
  } catch (error) {
    console.error('Failed to save zkLogin session:', error)
  }
}

/**
 * Get zkLogin session from cookie
 */
export function getZkLoginSession(): ZkLoginSession | null {
  try {
    // Try cookie first
    let sessionData = getCookie(COOKIE_CONFIG.ZKLOGIN_SESSION)
    
    // Fallback to localStorage
    if (!sessionData && typeof localStorage !== 'undefined') {
      sessionData = localStorage.getItem(COOKIE_CONFIG.ZKLOGIN_SESSION)
    }
    
    if (!sessionData) return null
    
    const session: ZkLoginSession = JSON.parse(sessionData)
    
    // Check if session is expired (with grace period)
    if (isSessionExpired(session.expiresAt)) {
      console.log('zkLogin session expired, but keeping for reconnection grace period')
      // Don't immediately clear - give time to reconnect
      const expiredTime = new Date().getTime() - new Date(session.expiresAt).getTime()
      const graceTime = 60 * 60 * 1000 // 1 hour grace period

      if (expiredTime > graceTime) {
        clearZkLoginSession()
        return null
      }

      // Return session even if expired (within grace period)
      return session
    }
    
    // Auto-refresh if needed
    if (needsRefresh(session.expiresAt)) {
      const refreshedSession = {
        ...session,
        expiresAt: createExpirationDate()
      }
      saveZkLoginSession(refreshedSession)
      return refreshedSession
    }
    
    return session
  } catch (error) {
    console.error('Failed to get zkLogin session:', error)
    return null
  }
}

/**
 * Clear zkLogin session
 */
export function clearZkLoginSession(): void {
  deleteCookie(COOKIE_CONFIG.ZKLOGIN_SESSION)
  
  // Also clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(COOKIE_CONFIG.ZKLOGIN_SESSION)
  }
  
  console.log('zkLogin session cleared')
}

/**
 * Update session activity (extends expiration)
 */
export function updateSessionActivity(): void {
  const authSession = getAuthSession()
  if (authSession) {
    saveAuthSession({
      ...authSession,
      lastLoginAt: new Date().toISOString()
    })
  }

  const zkLoginSession = getZkLoginSession()
  if (zkLoginSession) {
    saveZkLoginSession(zkLoginSession)
  }
}

/**
 * Get session expiration info
 */
export function getSessionInfo(): {
  isAuthenticated: boolean
  expiresAt: string | null
  needsRefresh: boolean
  timeUntilExpiry: number | null
} {
  const authSession = getAuthSession()

  if (!authSession) {
    return {
      isAuthenticated: false,
      expiresAt: null,
      needsRefresh: false,
      timeUntilExpiry: null
    }
  }

  const now = new Date()
  const expires = new Date(authSession.expiresAt)
  const timeUntilExpiry = expires.getTime() - now.getTime()

  return {
    isAuthenticated: true,
    expiresAt: authSession.expiresAt,
    needsRefresh: needsRefresh(authSession.expiresAt),
    timeUntilExpiry: Math.max(0, timeUntilExpiry)
  }
}
