"use client"

import { useEffect } from 'react'
import { useSuiClientContext } from '@mysten/dapp-kit'
import { registerEnokiWallets, isEnokiNetwork } from '@mysten/enoki'

export function EnokiWalletRegistration() {
  const { client, network } = useSuiClientContext()

  useEffect(() => {
    console.log('🔧 Enoki Wallet Registration - Network:', network)

    // Only register on supported networks
    if (!isEnokiNetwork(network)) {
      console.warn('⚠️ Enoki does not support network:', network)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_ENOKI_API_KEY is not configured')
      return
    }

    // Use the correct Google Client ID for Enoki
    const enokiGoogleClientId = '978685229139-bo2ngskq8l0qbh695upr82vanec6lcek.apps.googleusercontent.com'

    console.log('🔧 Enoki Configuration:', {
      apiKey: apiKey.slice(0, 20) + '...',
      googleClientId: enokiGoogleClientId.slice(0, 20) + '...',
      network
    })

    try {
      console.log('🔄 Registering Enoki wallets...')
      const { unregister } = registerEnokiWallets({
        apiKey,
        providers: {
          google: {
            clientId: enokiGoogleClientId,
          },
          // Add other providers when you have their client IDs
          // facebook: {
          //   clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || '',
          // },
          // twitch: {
          //   clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '',
          // },
        },
        client: client as any, // Type cast to handle version mismatch between @mysten/sui versions
        network,
      })

      console.log('✅ Enoki wallets registered successfully')
      return unregister
    } catch (error) {
      console.error('❌ Failed to register Enoki wallets:', error)
      console.error('Error details:', error)
      return () => {} // Return empty cleanup function
    }
  }, [client, network])

  return null // This component doesn't render anything
}
