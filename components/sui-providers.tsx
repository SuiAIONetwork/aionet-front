"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { ZkLoginProvider } from './zklogin-provider'
import { SuiAuthProvider } from '@/contexts/sui-auth-context'
import { WalletReconnection } from './wallet-reconnection'
// Walrus removed - using Supabase storage instead
import { AvatarProvider } from '@/contexts/avatar-context'
import { EnokiWalletRegistration } from './enoki-provider'
import { EnokiFlowProvider } from '@mysten/enoki/react'
import '@mysten/dapp-kit/dist/index.css'
import { useState } from 'react'

// Create networks configuration
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
}

export function SuiProviders({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Create SuiClient for zkLogin using environment variable
  const [suiClient] = useState(() => new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl('devnet')
  }))

  // Get default network from environment
  const defaultNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet') || 'devnet'

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <EnokiFlowProvider
          apiKey={process.env.NEXT_PUBLIC_ENOKI_API_KEY!}
        >
          <EnokiWalletRegistration />
          <WalletProvider
            autoConnect={true}
            enableUnsafeBurner={false}
            storageKey="sui-wallet-connection"
          >
              <ZkLoginProvider suiClient={suiClient}>
                <SuiAuthProvider>
                  <AvatarProvider>
                    <WalletReconnection />
                    {children}
                  </AvatarProvider>
                </SuiAuthProvider>
              </ZkLoginProvider>
          </WalletProvider>
        </EnokiFlowProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
