import { NextRequest, NextResponse } from 'next/server'
import { getCSRFTokenForClient, generateDoubleSubmitToken } from '@/lib/csrf-protection'

/**
 * GET /api/csrf-token
 * Generate and return a CSRF token for the client
 */
export async function GET(request: NextRequest) {
  try {
    // Get user identifier (wallet address, IP, or session)
    const userAddress = request.headers.get('x-user-address')
    const userAgent = request.headers.get('user-agent') || ''
    const userIdentifier = userAddress || request.ip || 'anonymous'
    
    // Generate CSRF token
    const csrfToken = getCSRFTokenForClient(userIdentifier, userAgent)
    
    // Generate double submit cookie token for enhanced protection
    const { token: doubleSubmitToken, cookieValue } = generateDoubleSubmitToken(userIdentifier)
    
    // Create response with CSRF token
    const response = NextResponse.json({
      success: true,
      csrfToken,
      doubleSubmitToken,
      expiresIn: 3600 // 1 hour
    })
    
    // Set CSRF cookie for double submit pattern
    response.cookies.set('csrf-token', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate CSRF token' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/csrf-token/verify
 * Verify a CSRF token (for testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token is required' 
        },
        { status: 400 }
      )
    }
    
    // This is just for testing - in real usage, CSRF verification
    // happens automatically in the withCSRFProtection middleware
    return NextResponse.json({
      success: true,
      message: 'Token format is valid',
      note: 'Actual verification happens in protected endpoints'
    })
  } catch (error) {
    console.error('Error verifying CSRF token:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify CSRF token' 
      },
      { status: 500 }
    )
  }
}
