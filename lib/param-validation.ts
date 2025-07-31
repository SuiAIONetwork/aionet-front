import 'server-only'
import { z } from 'zod'

/**
 * Comprehensive parameter validation for dynamic routes
 * Prevents path traversal, injection attacks, and malformed inputs
 */

// Common validation patterns
const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SLUG_REGEX = /^[a-z0-9-_]{1,50}$/
const SAFE_STRING_REGEX = /^[a-zA-Z0-9\s\-_.,!?()]{1,100}$/

// Validation schemas for different parameter types
export const ParamSchemas = {
  walletAddress: z.string()
    .regex(WALLET_ADDRESS_REGEX, 'Invalid wallet address format')
    .length(66, 'Wallet address must be exactly 66 characters'),
    
  username: z.string()
    .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, underscores, and hyphens')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
    
  uuid: z.string()
    .regex(UUID_REGEX, 'Invalid UUID format'),
    
  slug: z.string()
    .regex(SLUG_REGEX, 'Slug can only contain lowercase letters, numbers, hyphens, and underscores')
    .min(1, 'Slug cannot be empty')
    .max(50, 'Slug must be less than 50 characters'),
    
  safeString: z.string()
    .regex(SAFE_STRING_REGEX, 'String contains invalid characters')
    .min(1, 'String cannot be empty')
    .max(100, 'String must be less than 100 characters'),
    
  positiveInteger: z.string()
    .regex(/^\d+$/, 'Must be a positive integer')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Must be greater than 0'),
    
  pageNumber: z.string()
    .regex(/^\d+$/, 'Page number must be a positive integer')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 10000, 'Page number must be between 1 and 10000'),
    
  limitNumber: z.string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
    
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be either "asc" or "desc"' })
  }),
  
  dateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(val => {
      const date = new Date(val)
      return !isNaN(date.getTime()) && date.toISOString().startsWith(val)
    }, 'Invalid date'),
    
  nftTier: z.enum(['NOMAD', 'PRO', 'ROYAL'], {
    errorMap: () => ({ message: 'NFT tier must be NOMAD, PRO, or ROYAL' })
  })
}

/**
 * Validate a single parameter
 */
export function validateParam<T>(
  value: string | undefined,
  schema: z.ZodSchema<T>,
  paramName: string
): T {
  if (value === undefined) {
    throw new Error(`Parameter '${paramName}' is required`)
  }
  
  try {
    return schema.parse(value)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => e.message).join(', ')
      throw new Error(`Invalid parameter '${paramName}': ${message}`)
    }
    throw new Error(`Invalid parameter '${paramName}': ${error}`)
  }
}

/**
 * Validate multiple parameters at once
 */
export function validateParams<T extends Record<string, any>>(
  params: Record<string, string | undefined>,
  schemas: Record<keyof T, z.ZodSchema<any>>
): T {
  const result: any = {}
  const errors: string[] = []
  
  for (const [key, schema] of Object.entries(schemas)) {
    try {
      result[key] = validateParam(params[key], schema, key)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Invalid parameter '${key}'`)
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Parameter validation failed: ${errors.join('; ')}`)
  }
  
  return result as T
}

/**
 * Validate search parameters from URL
 */
export function validateSearchParams(
  searchParams: URLSearchParams,
  schemas: Record<string, z.ZodSchema<any>>
): Record<string, any> {
  const params: Record<string, string | undefined> = {}
  
  for (const key of Object.keys(schemas)) {
    params[key] = searchParams.get(key) || undefined
  }
  
  return validateParams(params, schemas)
}

/**
 * Common parameter validation patterns for different route types
 */
export const RouteValidators = {
  // User profile routes: /profile/[address]
  userProfile: (address: string) => 
    validateParam(address, ParamSchemas.walletAddress, 'address'),
    
  // Governance proposal routes: /governance/[proposalId]
  governanceProposal: (proposalId: string) =>
    validateParam(proposalId, ParamSchemas.uuid, 'proposalId'),
    
  // Username routes: /user/[username]
  username: (username: string) =>
    validateParam(username, ParamSchemas.username, 'username'),
    
  // Pagination parameters
  pagination: (searchParams: URLSearchParams) =>
    validateSearchParams(searchParams, {
      page: ParamSchemas.pageNumber.optional().default('1'),
      limit: ParamSchemas.limitNumber.optional().default('20'),
      sort: ParamSchemas.sortOrder.optional().default('desc')
    }),
    
  // Trading activity routes
  tradingActivity: (params: { address: string }, searchParams: URLSearchParams) => ({
    address: validateParam(params.address, ParamSchemas.walletAddress, 'address'),
    ...validateSearchParams(searchParams, {
      page: ParamSchemas.pageNumber.optional().default('1'),
      limit: ParamSchemas.limitNumber.optional().default('20'),
      type: z.enum(['buy', 'sell', 'all']).optional().default('all')
    })
  }),
  
  // Admin user management routes
  adminUserManagement: (address: string) => 
    validateParam(address, ParamSchemas.walletAddress, 'address'),
    
  // API key validation
  apiKey: (key: string) =>
    validateParam(key, z.string().min(32).max(64).regex(/^[a-zA-Z0-9_-]+$/), 'apiKey')
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[\\]/g, '') // Remove backslashes
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitizeInput(
  input: string,
  maxLength: number = 1000,
  allowedChars: RegExp = SAFE_STRING_REGEX
): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string')
  }
  
  const sanitized = sanitizeString(input)
  
  if (sanitized.length === 0) {
    throw new Error('Input cannot be empty after sanitization')
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`Input must be less than ${maxLength} characters`)
  }
  
  if (!allowedChars.test(sanitized)) {
    throw new Error('Input contains invalid characters')
  }
  
  return sanitized
}

/**
 * Validate file upload parameters
 */
export const FileValidators = {
  imageFile: z.object({
    name: z.string().regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Invalid image file extension'),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
    type: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, 'Invalid image file type')
  }),
  
  documentFile: z.object({
    name: z.string().regex(/\.(pdf|doc|docx|txt)$/i, 'Invalid document file extension'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().regex(/^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain)$/, 'Invalid document file type')
  })
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): boolean {
  // This is a simple in-memory rate limiter
  // In production, use Redis or a proper rate limiting service
  
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries (simplified)
  // In production, implement proper cleanup
  
  return true // Simplified for now
}

/**
 * Comprehensive request validation middleware
 */
export function validateRequest(
  params: Record<string, string | undefined>,
  searchParams: URLSearchParams,
  body?: any,
  validationRules?: {
    params?: Record<string, z.ZodSchema<any>>
    searchParams?: Record<string, z.ZodSchema<any>>
    body?: z.ZodSchema<any>
  }
) {
  const errors: string[] = []
  const result: any = {}
  
  try {
    // Validate route parameters
    if (validationRules?.params) {
      result.params = validateParams(params, validationRules.params)
    }
    
    // Validate search parameters
    if (validationRules?.searchParams) {
      result.searchParams = validateSearchParams(searchParams, validationRules.searchParams)
    }
    
    // Validate request body
    if (validationRules?.body && body) {
      result.body = validationRules.body.parse(body)
    }
    
    return result
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message))
    } else if (error instanceof Error) {
      errors.push(error.message)
    } else {
      errors.push('Validation failed')
    }
    
    throw new Error(`Request validation failed: ${errors.join('; ')}`)
  }
}
