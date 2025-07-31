/**
 * Validation utilities for affiliate system
 * Basic input validation and sanitization
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

/**
 * Validate Sui wallet address format
 */
export function validateWalletAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' }
  }

  // Remove whitespace
  const sanitized = address.trim()

  // Basic Sui address validation
  if (!sanitized.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' }
  }

  if (sanitized.length < 42 || sanitized.length > 66) {
    return { isValid: false, error: 'Invalid address length' }
  }

  // Check for valid hex characters
  const hexPattern = /^0x[a-fA-F0-9]+$/
  if (!hexPattern.test(sanitized)) {
    return { isValid: false, error: 'Address contains invalid characters' }
  }

  return { isValid: true, sanitized }
}

/**
 * Validate referral code format
 */
export function validateReferralCode(code: string): ValidationResult {
  if (!code) {
    return { isValid: false, error: 'Referral code is required' }
  }

  // Remove whitespace and convert to uppercase
  const sanitized = code.trim().toUpperCase()

  // Basic validation - alphanumeric only, 3-20 characters
  if (sanitized.length < 3 || sanitized.length > 20) {
    return { isValid: false, error: 'Referral code must be 3-20 characters' }
  }

  const alphanumericPattern = /^[A-Z0-9]+$/
  if (!alphanumericPattern.test(sanitized)) {
    return { isValid: false, error: 'Referral code can only contain letters and numbers' }
  }

  return { isValid: true, sanitized }
}

/**
 * Validate commission amount
 */
export function validateCommissionAmount(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' }
  }

  if (amount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' }
  }

  if (amount > 1000000) {
    return { isValid: false, error: 'Amount exceeds maximum limit' }
  }

  return { isValid: true, sanitized: amount.toString() }
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): ValidationResult {
  if (!sessionId) {
    return { isValid: false, error: 'Session ID is required' }
  }

  const sanitized = sessionId.trim()

  // UUID format validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(sanitized)) {
    return { isValid: false, error: 'Invalid session ID format' }
  }

  return { isValid: true, sanitized }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limit length
}

/**
 * Rate limiting helper
 */
export class SimpleRateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key)
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }

  getResetTime(key: string): number {
    const record = this.attempts.get(key)
    if (!record || Date.now() > record.resetTime) {
      return 0
    }
    return record.resetTime
  }
}

// Global rate limiters for different operations
export const referralTrackingLimiter = new SimpleRateLimit(20, 60000) // 20 per minute
export const affiliateQueryLimiter = new SimpleRateLimit(50, 60000) // 50 per minute
export const commissionQueryLimiter = new SimpleRateLimit(30, 60000) // 30 per minute
