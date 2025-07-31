import 'server-only'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// CSRF Token Configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

// In-memory token store (in production, use Redis or database)
const tokenStore = new Map<string, { token: string; expires: number; userAgent: string }>()

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < now) {
      tokenStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

/**
 * Generate a CSRF token for a user session
 */
export function generateCSRFToken(userIdentifier: string, userAgent: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const expires = Date.now() + CSRF_TOKEN_EXPIRY
  
  // Store token with expiry and user agent
  tokenStore.set(userIdentifier, {
    token,
    expires,
    userAgent
  })
  
  return token
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(
  userIdentifier: string, 
  providedToken: string, 
  userAgent: string
): boolean {
  const storedData = tokenStore.get(userIdentifier)
  
  if (!storedData) {
    return false
  }
  
  // Check if token has expired
  if (storedData.expires < Date.now()) {
    tokenStore.delete(userIdentifier)
    return false
  }
  
  // Verify token matches
  if (storedData.token !== providedToken) {
    return false
  }
  
  // Verify user agent matches (additional security)
  if (storedData.userAgent !== userAgent) {
    return false
  }
  
  return true
}

/**
 * Middleware function to verify CSRF token in API routes
 */
export function withCSRFProtection(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      const userIdentifier = request.headers.get('x-user-address') || 
                           request.headers.get('authorization')?.replace('Bearer ', '') ||
                           request.ip ||
                           'anonymous'
      const userAgent = request.headers.get('user-agent') || ''
      
      if (!csrfToken) {
        return new Response(
          JSON.stringify({ 
            error: 'CSRF token required',
            code: 'CSRF_TOKEN_MISSING'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      if (!verifyCSRFToken(userIdentifier, csrfToken, userAgent)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    return handler(request)
  }
}

/**
 * Get CSRF token for client-side use
 */
export function getCSRFTokenForClient(userIdentifier: string, userAgent: string): string {
  // Check if we already have a valid token
  const storedData = tokenStore.get(userIdentifier)
  
  if (storedData && storedData.expires > Date.now() && storedData.userAgent === userAgent) {
    return storedData.token
  }
  
  // Generate new token
  return generateCSRFToken(userIdentifier, userAgent)
}

/**
 * Validate Origin header (additional CSRF protection)
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  const xForwardedHost = request.headers.get('x-forwarded-host')
  
  if (!origin) {
    // Some requests might not have origin header (like same-origin requests)
    return true
  }
  
  const allowedHosts = [
    host,
    xForwardedHost,
    'localhost:3000',
    '127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
    process.env.VERCEL_URL
  ].filter(Boolean)
  
  const originHost = origin.replace(/^https?:\/\//, '')
  
  return allowedHosts.includes(originHost)
}

/**
 * Complete CSRF protection middleware with origin validation
 */
export function withFullCSRFProtection(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    // Validate origin for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (!validateOrigin(request)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid origin',
            code: 'INVALID_ORIGIN'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // Apply CSRF token validation
    return withCSRFProtection(handler)(request)
  }
}

/**
 * Generate a secure hash for additional validation
 */
function generateSecureHash(data: string): string {
  return createHash('sha256')
    .update(data + CSRF_SECRET)
    .digest('hex')
}

/**
 * Double Submit Cookie pattern for additional CSRF protection
 */
export function generateDoubleSubmitToken(userIdentifier: string): {
  token: string
  cookieValue: string
} {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const cookieValue = generateSecureHash(token + userIdentifier)
  
  return { token, cookieValue }
}

/**
 * Verify double submit cookie pattern
 */
export function verifyDoubleSubmitToken(
  userIdentifier: string,
  token: string,
  cookieValue: string
): boolean {
  const expectedCookieValue = generateSecureHash(token + userIdentifier)
  return cookieValue === expectedCookieValue
}

/**
 * Enhanced CSRF protection with double submit cookies
 */
export function withEnhancedCSRFProtection(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // Validate origin
      if (!validateOrigin(request)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid origin',
            code: 'INVALID_ORIGIN'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Get tokens
      const csrfToken = request.headers.get('x-csrf-token')
      const csrfCookie = request.cookies.get('csrf-token')?.value
      const userIdentifier = request.headers.get('x-user-address') || 
                           request.ip ||
                           'anonymous'
      
      if (!csrfToken || !csrfCookie) {
        return new Response(
          JSON.stringify({ 
            error: 'CSRF protection required',
            code: 'CSRF_PROTECTION_REQUIRED'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Verify double submit pattern
      if (!verifyDoubleSubmitToken(userIdentifier, csrfToken, csrfCookie)) {
        return new Response(
          JSON.stringify({ 
            error: 'CSRF validation failed',
            code: 'CSRF_VALIDATION_FAILED'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    return handler(request)
  }
}
