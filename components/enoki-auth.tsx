"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEnokiRaffleTransactions } from '@/lib/services/enoki-raffle-service'
import { 
  Chrome, 
  Facebook, 
  Twitch,
  Apple,
  LogOut,
  User,
  Wallet,
  CheckCircle
} from 'lucide-react'

interface EnokiAuthProps {
  onAuthChange?: (isAuthenticated: boolean, address?: string) => void
}

export function EnokiAuth({ onAuthChange }: EnokiAuthProps) {
  const { signInWithProvider, signOut, getUserAddress, isConnected } = useEnokiRaffleTransactions()
  const [isLoading, setIsLoading] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on mount
  useState(() => {
    const checkAuth = async () => {
      const connected = await isConnected()
      const address = await getUserAddress()
      setIsAuthenticated(connected)
      setUserAddress(address)
      onAuthChange?.(connected, address || undefined)
    }
    checkAuth()
  })

  const handleSignIn = async (provider: 'google' | 'facebook' | 'twitch' | 'apple') => {
    setIsLoading(true)
    try {
      const address = await signInWithProvider(provider)
      setUserAddress(address)
      setIsAuthenticated(true)
      onAuthChange?.(true, address)
    } catch (error) {
      console.error(`Failed to sign in with ${provider}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      setUserAddress(null)
      setIsAuthenticated(false)
      onAuthChange?.(false)
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const providers = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: Chrome,
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'twitch' as const,
      name: 'Twitch',
      icon: Twitch,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: Apple,
      color: 'bg-gray-800 hover:bg-gray-900',
    },
  ]

  if (isAuthenticated && userAddress) {
    return (
      <Card className="bg-[#030F1C] border-[#1a2f51]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Connected with Enoki
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <User className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Wallet Address</p>
              <code className="text-xs text-white bg-[#1a2f51] px-2 py-1 rounded">
                {userAddress.slice(0, 8)}...{userAddress.slice(-8)}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Wallet className="w-3 h-3 mr-1" />
              zkLogin Active
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'}
            </Badge>
          </div>

          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="outline"
            className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#030F1C] border-[#1a2f51]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="w-5 h-5" />
          Sign in with Enoki
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-400 mb-4">
          Connect your social account to create a zkLogin wallet and start minting tickets.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {providers.map((provider) => {
            const Icon = provider.icon
            return (
              <Button
                key={provider.id}
                onClick={() => handleSignIn(provider.id)}
                disabled={isLoading}
                className={`${provider.color} text-white border-0 h-12`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {provider.name}
              </Button>
            )
          })}
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Connecting...</p>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-300">
            <strong>Powered by Enoki:</strong> Your social login creates a secure, self-custodial 
            Sui wallet using zkLogin technology. No private keys to manage!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
