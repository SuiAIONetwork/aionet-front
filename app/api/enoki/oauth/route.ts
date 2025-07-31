/**
 * Enoki OAuth Handler (Backend)
 * Handles OAuth flow using private Enoki API key
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, redirectUri } = await request.json()

    // Get private Enoki API key from environment
    const privateApiKey = process.env.ENOKI_PRIVATE_API_KEY
    if (!privateApiKey) {
      return NextResponse.json(
        { error: 'Enoki private API key not configured' },
        { status: 500 }
      )
    }

    // Test the private key first by getting app info
    const appResponse = await fetch('https://api.enoki.mystenlabs.com/v1/app', {
      headers: {
        'Authorization': `Bearer ${privateApiKey}`,
      },
    })

    if (!appResponse.ok) {
      const errorText = await appResponse.text()
      console.error('Enoki private key test failed:', errorText)
      return NextResponse.json(
        { error: 'Invalid private API key or insufficient permissions' },
        { status: 401 }
      )
    }

    const appData = await appResponse.json()
    console.log('Enoki app data:', appData)

    // For now, return success with app data to test the private key
    return NextResponse.json({
      success: true,
      message: 'Private key is working!',
      appData: appData.data,
      provider,
      redirectUri,
    })

  } catch (error) {
    console.error('OAuth handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle OAuth callback
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      )
    }

    const privateApiKey = process.env.ENOKI_PRIVATE_API_KEY
    if (!privateApiKey) {
      return NextResponse.json(
        { error: 'Enoki private API key not configured' },
        { status: 500 }
      )
    }

    // Exchange code for tokens using Enoki API
    const response = await fetch('https://api.enoki.mystenlabs.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        network: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Enoki token exchange error:', errorText)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
