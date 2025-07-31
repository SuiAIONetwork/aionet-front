/**
 * zkLogin Proof Generation API Route
 * Proxies requests to Mysten Labs proving service to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server'

export interface ZkProofRequest {
  jwt: string
  extendedEphemeralPublicKey: string
  maxEpoch: string
  jwtRandomness: string
  salt: string
  keyClaimName: string
}

export interface ZkProofResponse {
  proofPoints: {
    a: string[]
    b: string[][]
    c: string[]
  }
  issBase64Details: {
    value: string
    indexMod4: number
  }
  headerBase64: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ZkProofRequest = await request.json()
    
    // Validate required fields
    const requiredFields = ['jwt', 'extendedEphemeralPublicKey', 'maxEpoch', 'jwtRandomness', 'salt', 'keyClaimName']
    for (const field of requiredFields) {
      if (!body[field as keyof ZkProofRequest]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Determine the proving service URL based on network
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet'
    let provingServiceUrl: string

    // Check if Enoki is configured
    const enokiApiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY

    if (!enokiApiKey) {
      return NextResponse.json(
        {
          error: 'zkLogin proving service not configured',
          details: 'Enoki API key is required for zkLogin functionality. Please configure NEXT_PUBLIC_ENOKI_API_KEY.',
          network,
          alternatives: {
            enoki: 'https://docs.enoki.mystenlabs.com/',
            selfHosted: 'https://docs.sui.io/guides/developer/cryptography/zklogin-integration#run-the-proving-service-in-your-backend',
            traditionalWallet: 'Connect with Sui Wallet browser extension instead'
          }
        },
        { status: 503 }
      )
    }

    if (network !== 'testnet' && network !== 'mainnet') {
      return NextResponse.json(
        {
          error: 'Unsupported network for Enoki',
          details: 'Enoki only supports testnet and mainnet networks.',
          network,
          supportedNetworks: ['testnet', 'mainnet']
        },
        { status: 400 }
      )
    }

    // For now, return a message that Enoki handles proving internally
    return NextResponse.json(
      {
        message: 'zkLogin proving is handled by Enoki',
        details: 'When using Enoki, ZK proof generation is handled automatically during transaction signing. No separate proving step is required.',
        network,
        enokiConfigured: true
      },
      { status: 200 }
    )

    console.log(`Generating ZK proof for ${network} network...`)
    console.log(`Using proving service URL: ${provingServiceUrl}`)

    // Call Mysten Labs proving service
    const response = await fetch(`${provingServiceUrl}/prove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'zkLogin-Proxy/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Proving service error:', response.status, errorText)
      
      return NextResponse.json(
        {
          error: 'Proof generation failed',
          details: `Proving service returned ${response.status}: ${errorText}`,
          network,
          provingServiceUrl
        },
        { status: response.status }
      )
    }

    const proof: ZkProofResponse = await response.json()
    
    console.log('ZK proof generated successfully')
    return NextResponse.json(proof)

  } catch (error) {
    console.error('ZK proof API route error:', error)

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
