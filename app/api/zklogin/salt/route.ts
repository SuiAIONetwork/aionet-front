/**
 * zkLogin Salt API Route
 * Provides user salt for zkLogin - tries Mysten Labs service first, falls back to local generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Simple in-memory cache to prevent duplicate requests
const requestCache = new Map<string, { salt: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a deterministic salt for development/testing
 * This creates a consistent salt based on the user's sub claim
 * Returns a BigInt-compatible string as expected by Sui zkLogin
 */
function generateDevelopmentSalt(jwt: string): string {
  try {
    // Decode JWT payload
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    const { sub, iss, aud } = payload

    // Create a deterministic salt based on user identity
    // This ensures the same user always gets the same salt
    const saltInput = `${sub}-${iss}-${aud}-zklogin-dev-salt`
    const hash = createHash('sha256').update(saltInput).digest()

    // Convert hash to BigInt and then to string
    // Take first 16 bytes (128 bits) to ensure it's a valid BigInt
    const hashBytes = hash.subarray(0, 16)
    const hashHex = hashBytes.toString('hex')
    const saltBigInt = BigInt('0x' + hashHex)

    // Return as string representation of BigInt
    return saltBigInt.toString()
  } catch (error) {
    console.error('Failed to generate development salt:', error)
    throw new Error('Invalid JWT format')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'JWT token is required' },
        { status: 400 }
      )
    }

    // Create cache key from JWT (use sub claim for uniqueness)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const cacheKey = `${payload.sub}-${payload.iss}`

    // Check cache first
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached salt for user')
      return NextResponse.json({
        salt: cached.salt,
        source: 'cache',
        note: 'Cached salt to prevent duplicate requests'
      })
    }

    // First, try Mysten Labs salt service
    const saltServiceUrl = process.env.NEXT_PUBLIC_ZKLOGIN_SALT_SERVICE_URL || 'https://salt.api.mystenlabs.com'

    console.log('Trying Mysten Labs salt service...')

    try {
      const response = await fetch(`${saltServiceUrl}/get_salt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'zkLogin-Client/1.0',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const saltData = await response.json()
        console.log('Salt retrieved from Mysten Labs service')

        // Cache the result
        requestCache.set(cacheKey, {
          salt: saltData.salt,
          timestamp: Date.now()
        })

        return NextResponse.json(saltData)
      } else {
        const errorText = await response.text()
        console.log('Mysten Labs service failed:', response.status, errorText)

        // If it's an "Invalid Client ID" error, fall back to development salt
        if (response.status === 403 && errorText.includes('Invalid Client ID')) {
          console.log('Client ID not whitelisted, using development salt...')

          const developmentSalt = generateDevelopmentSalt(token)
          console.log('Generated development salt successfully')

          // Cache the development salt
          requestCache.set(cacheKey, {
            salt: developmentSalt,
            timestamp: Date.now()
          })

          return NextResponse.json({
            salt: developmentSalt,
            source: 'development',
            note: 'Using development salt. For production, register your OAuth client ID with Mysten Labs.'
          })
        }

        // For other errors, return the error
        return NextResponse.json(
          {
            error: 'Failed to get user salt',
            details: `Salt service returned ${response.status}: ${errorText}`
          },
          { status: response.status }
        )
      }
    } catch (fetchError) {
      console.log('Network error with Mysten Labs service, using development salt...')

      const developmentSalt = generateDevelopmentSalt(token)
      console.log('Generated development salt successfully')

      // Cache the development salt
      requestCache.set(cacheKey, {
        salt: developmentSalt,
        timestamp: Date.now()
      })

      return NextResponse.json({
        salt: developmentSalt,
        source: 'development',
        note: 'Using development salt due to network error. For production, ensure connectivity to Mysten Labs salt service.'
      })
    }

  } catch (error) {
    console.error('Salt API route error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
