import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * POST /api/auth/login
 * Authenticate user with wallet address
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, '/api/auth/login', async () => {
    try {
      console.log('🔄 Auth login API called')

      const body = await request.json()
      const { wallet_address } = body

      if (!wallet_address) {
        return NextResponse.json(
          {
            success: false,
            error: 'Wallet address is required',
            code: 'MISSING_WALLET_ADDRESS'
          },
          { status: 400 }
        )
      }

      // Validate wallet address format
      if (!wallet_address.startsWith('0x') || wallet_address.length !== 66) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid wallet address format',
            code: 'INVALID_WALLET_ADDRESS'
          },
          { status: 400 }
        )
      }

      console.log('👤 Authenticating wallet:', wallet_address)

      // Always call the edge function - this is critical infrastructure
      // Use local backend URL for development
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
      const edgeFunctionUrl = `${backendUrl}/auth-login`

      console.log('🔄 Calling auth edge function:', edgeFunctionUrl)
      console.log('🔑 Environment check:', {
        hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        useEdgeFunctions: process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS
      })

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge function error:', errorText)
        throw new Error(`Edge function failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Edge function response:', data)

      const authResponse = data

      const finalResponse = NextResponse.json(authResponse)

      // Add CORS headers
      finalResponse.headers.set('Access-Control-Allow-Origin', '*')
      finalResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      finalResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return finalResponse

    } catch (error) {
      console.error('Error in auth login:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_ERROR',
          message: 'An error occurred during authentication'
        },
        { status: 500 }
      )
    }
  })
}
