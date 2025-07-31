'use client'

// Client-side CSRF token management
class CSRFManager {
  private token: string | null = null
  private doubleSubmitToken: string | null = null
  private expiresAt: number = 0
  private userAddress: string | null = null

  /**
   * Get current user address from wallet or localStorage
   */
  public getCurrentUserAddress(): string | null {
    // Try to get from localStorage first (where wallet address is typically stored)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wallet_address') || 
             localStorage.getItem('user_address') ||
             sessionStorage.getItem('wallet_address') ||
             null
    }
    return null
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async fetchNewToken(): Promise<void> {
    try {
      const userAddress = this.getCurrentUserAddress()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Include user address in headers if available
      if (userAddress) {
        headers['x-user-address'] = userAddress
      }

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers,
        credentials: 'include' // Include cookies for double submit pattern
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        this.token = data.csrfToken
        this.doubleSubmitToken = data.doubleSubmitToken
        this.expiresAt = Date.now() + (data.expiresIn * 1000)
        this.userAddress = userAddress
        
        console.log('🔒 CSRF token refreshed')
      } else {
        throw new Error(data.error || 'Failed to get CSRF token')
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error)
      throw error
    }
  }

  /**
   * Get a valid CSRF token (fetch new one if needed)
   */
  async getToken(): Promise<string> {
    const currentUserAddress = this.getCurrentUserAddress()
    
    // Check if we need a new token
    const needsNewToken = 
      !this.token || 
      !this.doubleSubmitToken ||
      Date.now() >= this.expiresAt ||
      this.userAddress !== currentUserAddress

    if (needsNewToken) {
      await this.fetchNewToken()
    }

    if (!this.token) {
      throw new Error('Failed to obtain CSRF token')
    }

    return this.token
  }

  /**
   * Get the double submit token
   */
  async getDoubleSubmitToken(): Promise<string> {
    // Ensure we have a valid token
    await this.getToken()
    
    if (!this.doubleSubmitToken) {
      throw new Error('Failed to obtain double submit token')
    }

    return this.doubleSubmitToken
  }

  /**
   * Clear stored tokens (e.g., on logout)
   */
  clearTokens(): void {
    this.token = null
    this.doubleSubmitToken = null
    this.expiresAt = 0
    this.userAddress = null
    console.log('🔒 CSRF tokens cleared')
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    const currentUserAddress = this.getCurrentUserAddress()
    return !!(
      this.token && 
      this.doubleSubmitToken &&
      Date.now() < this.expiresAt &&
      this.userAddress === currentUserAddress
    )
  }
}

// Global CSRF manager instance
const csrfManager = new CSRFManager()

/**
 * Get CSRF token for API requests
 */
export async function getCSRFToken(): Promise<string> {
  return csrfManager.getToken()
}

/**
 * Get double submit token for enhanced protection
 */
export async function getDoubleSubmitToken(): Promise<string> {
  return csrfManager.getDoubleSubmitToken()
}

/**
 * Clear CSRF tokens (call on logout)
 */
export function clearCSRFTokens(): void {
  csrfManager.clearTokens()
}

/**
 * Check if CSRF token is valid
 */
export function isCSRFTokenValid(): boolean {
  return csrfManager.isTokenValid()
}

/**
 * Enhanced fetch wrapper with automatic CSRF protection
 */
export async function csrfFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'
  
  // Only add CSRF protection for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const csrfToken = await getCSRFToken()
      const userAddress = csrfManager.getCurrentUserAddress()
      
      // Add CSRF headers
      const headers = new Headers(options.headers)
      headers.set('x-csrf-token', csrfToken)
      
      if (userAddress) {
        headers.set('x-user-address', userAddress)
      }
      
      // Ensure credentials are included for cookies
      options = {
        ...options,
        headers,
        credentials: 'include'
      }
    } catch (error) {
      console.error('Failed to add CSRF protection:', error)
      throw new Error('CSRF protection failed')
    }
  }
  
  return fetch(url, options)
}

/**
 * React hook for CSRF token management
 */
export function useCSRF() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshToken = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await getCSRFToken()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh CSRF token'
      setError(errorMessage)
      console.error('CSRF token refresh failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearTokens = () => {
    clearCSRFTokens()
    setError(null)
  }

  const isValid = isCSRFTokenValid()

  return {
    isLoading,
    error,
    isValid,
    refreshToken,
    clearTokens,
    csrfFetch
  }
}

// Import useState for the hook
import { useState } from 'react'

/**
 * Utility to add CSRF headers to form data
 */
export async function addCSRFToFormData(formData: FormData): Promise<FormData> {
  try {
    const csrfToken = await getCSRFToken()
    formData.append('_csrf', csrfToken)
    return formData
  } catch (error) {
    console.error('Failed to add CSRF to form data:', error)
    throw error
  }
}

/**
 * Utility to create CSRF-protected form submission handler
 */
export function createCSRFFormHandler(
  onSubmit: (formData: FormData) => Promise<void>
) {
  return async (formData: FormData) => {
    try {
      const protectedFormData = await addCSRFToFormData(formData)
      await onSubmit(protectedFormData)
    } catch (error) {
      console.error('CSRF-protected form submission failed:', error)
      throw error
    }
  }
}

/**
 * Initialize CSRF protection (call this in your app initialization)
 */
export async function initializeCSRF(): Promise<void> {
  try {
    await getCSRFToken()
    console.log('🔒 CSRF protection initialized')
  } catch (error) {
    console.error('Failed to initialize CSRF protection:', error)
  }
}

// Auto-initialize CSRF protection when module loads
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure app is ready
  setTimeout(() => {
    initializeCSRF().catch(console.error)
  }, 1000)
}
