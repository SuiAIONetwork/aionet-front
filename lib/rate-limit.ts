import 'server-only'

/**
 * Rate Limiting Utility
 * Implements in-memory rate limiting for API endpoints
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private defaultWindowMs = 60000 // 1 minute
  private defaultMaxRequests = 100

  // Endpoint-specific limits
  private endpointLimits: Record<string, { windowMs: number; maxRequests: number }> = {
    '/api/auth/login': { windowMs: 900000, maxRequests: 5 }, // 15 min, 5 attempts
    '/api/auth/register': { windowMs: 3600000, maxRequests: 3 }, // 1 hour, 3 attempts
    '/api/admin/*': { windowMs: 60000, maxRequests: 20 }, // 1 min, 20 requests
    '/api/governance/vote': { windowMs: 300000, maxRequests: 10 }, // 5 min, 10 votes
    '/api/profile': { windowMs: 60000, maxRequests: 30 } // 1 min, 30 requests
  }

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`
  }

  public getLimitsForEndpoint(endpoint: string): { windowMs: number; maxRequests: number } {
    // Check for exact match first
    if (this.endpointLimits[endpoint]) {
      return this.endpointLimits[endpoint]
    }

    // Check for wildcard matches
    for (const [pattern, limits] of Object.entries(this.endpointLimits)) {
      if (pattern.endsWith('*') && endpoint.startsWith(pattern.slice(0, -1))) {
        return limits
      }
    }

    // Return default limits
    return {
      windowMs: this.defaultWindowMs,
      maxRequests: this.defaultMaxRequests
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  public checkRateLimit(
    identifier: string,
    endpoint: string
  ): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanupExpiredEntries()

    const key = this.getKey(identifier, endpoint)
    const limits = this.getLimitsForEndpoint(endpoint)
    const now = Date.now()

    let entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + limits.windowMs
      }
      this.store.set(key, entry)

      return {
        allowed: true,
        remaining: limits.maxRequests - 1,
        resetTime: entry.resetTime
      }
    }

    // Increment existing entry
    entry.count++

    if (entry.count > limits.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    return {
      allowed: true,
      remaining: limits.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  public getRemainingTime(identifier: string, endpoint: string): number {
    const key = this.getKey(identifier, endpoint)
    const entry = this.store.get(key)
    
    if (!entry) {
      return 0
    }

    const now = Date.now()
    return Math.max(0, entry.resetTime - now)
  }

  public reset(identifier: string, endpoint?: string): void {
    if (endpoint) {
      const key = this.getKey(identifier, endpoint)
      this.store.delete(key)
    } else {
      // Reset all entries for this identifier
      for (const key of this.store.keys()) {
        if (key.startsWith(`${identifier}:`)) {
          this.store.delete(key)
        }
      }
    }
  }

  public getStats(): {
    totalEntries: number
    activeEntries: number
    endpointStats: Record<string, number>
  } {
    this.cleanupExpiredEntries()

    const endpointStats: Record<string, number> = {}
    
    for (const key of this.store.keys()) {
      const endpoint = key.split(':')[1]
      endpointStats[endpoint] = (endpointStats[endpoint] || 0) + 1
    }

    return {
      totalEntries: this.store.size,
      activeEntries: this.store.size,
      endpointStats
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit<T>(
  request: Request,
  endpoint: string,
  handler: () => Promise<T>
): Promise<T> {
  // Get client identifier (IP address or user ID)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  
  // Check rate limit
  const { allowed, remaining, resetTime } = rateLimiter.checkRateLimit(ip, endpoint)

  if (!allowed) {
    const remainingTime = Math.ceil((resetTime - Date.now()) / 1000)
    const limits = rateLimiter.getLimitsForEndpoint(endpoint)

    throw new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: remainingTime,
        message: `Too many requests. Try again in ${remainingTime} seconds.`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limits.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          'Retry-After': remainingTime.toString()
        }
      }
    )
  }

  // Add rate limit headers to successful responses
  const result = await handler()
  const limits = rateLimiter.getLimitsForEndpoint(endpoint)

  // If result is a Response, add headers
  if (result instanceof Response) {
    result.headers.set('X-RateLimit-Limit', limits.maxRequests.toString())
    result.headers.set('X-RateLimit-Remaining', remaining.toString())
    result.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
  }

  return result
}

/**
 * Get rate limit status for an identifier and endpoint
 */
export function getRateLimitStatus(identifier: string, endpoint: string) {
  return rateLimiter.checkRateLimit(identifier, endpoint)
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string, endpoint?: string) {
  rateLimiter.reset(identifier, endpoint)
}

/**
 * Get rate limiter statistics
 */
export function getRateLimiterStats() {
  return rateLimiter.getStats()
}

export default rateLimiter
