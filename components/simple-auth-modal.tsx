"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Wallet, 
  Chrome, 
  Facebook, 
  Twitch, 
  Apple,
  Zap,
  Shield
} from 'lucide-react'
import { useConnectWallet, useCurrentAccount } from '@mysten/dapp-kit'
import { toast } from 'sonner'

interface SimpleAuthModalProps {
  onSuccess?: (address: string, method: 'social' | 'wallet') => void
  onError?: (error: string) => void
}

export function SimpleAuthModal({ onSuccess, onError }: SimpleAuthModalProps) {
  const { mutate: connectWallet } = useConnectWallet()
  const currentAccount = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(false)

  // If already connected, show connected state
  if (currentAccount) {
    return (
      <Card className="bg-[#030F1C] border-[#1a2f51]">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Connected</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-300 text-xs">
                Address: <code className="bg-green-500/20 px-1 rounded text-xs">
                  {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitch' | 'apple') => {
    setIsLoading(true)
    try {
      // This will use the Enoki wallet that appears in the wallet connection modal
      // We'll trigger the wallet connection modal and let users choose the social option
      toast.info(`Click "Sign in with ${provider}" in the wallet connection modal`)
      
      // Trigger the wallet connection modal
      // The user will see the social login options there
      connectWallet(
        { wallet: null as any }, // This will open the wallet selection modal
        {
          onSuccess: (result) => {
            if (result.accounts?.[0]?.address) {
              onSuccess?.(result.accounts[0].address, 'social')
              toast.success(`Connected with ${provider}!`)
            }
            setIsLoading(false)
          },
          onError: (error) => {
            console.error('Social login failed:', error)
            onError?.(error.message || 'Social login failed')
            toast.error(`Failed to connect with ${provider}`)
            setIsLoading(false)
          }
        }
      )
    } catch (error) {
      console.error('Social login error:', error)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
      setIsLoading(false)
    }
  }

  const handleWalletConnect = () => {
    setIsLoading(true)
    try {
      connectWallet(
        { wallet: null as any }, // This will open the wallet selection modal
        {
          onSuccess: (result) => {
            if (result.accounts?.[0]?.address) {
              onSuccess?.(result.accounts[0].address, 'wallet')
              toast.success('Wallet connected!')
            }
            setIsLoading(false)
          },
          onError: (error) => {
            console.error('Wallet connection failed:', error)
            onError?.(error.message || 'Wallet connection failed')
            toast.error('Failed to connect wallet')
            setIsLoading(false)
          }
        }
      )
    } catch (error) {
      console.error('Wallet connection error:', error)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-[#030F1C] border-[#1a2f51]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="w-5 h-5" />
          Sign in to your account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-6">
            Choose your preferred method to sign in
          </p>
          
          {/* Social Login Section */}
          <div className="space-y-4">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium text-sm">Social Login</span>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Recommended</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Sign in with your social accounts. No wallet installation required.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white border-0 h-10"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Google
                </Button>
                <Button
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-10"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  onClick={() => handleSocialLogin('twitch')}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-0 h-10"
                >
                  <Twitch className="w-4 h-4 mr-2" />
                  Twitch
                </Button>
                <Button
                  onClick={() => handleSocialLogin('apple')}
                  disabled={isLoading}
                  className="bg-gray-800 hover:bg-gray-900 text-white border-0 h-10"
                >
                  <Apple className="w-4 h-4 mr-2" />
                  Apple
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-600" />

            {/* Crypto Wallet Section */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium text-sm">Crypto Wallet</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Connect with Sui wallets like Sui Wallet, Phantom, or others.
              </p>
              
              <Button
                onClick={handleWalletConnect}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-10"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-300">
              <strong>New to crypto?</strong> Use social login for the easiest experience. 
              Your account will be secured with zkLogin technology.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
