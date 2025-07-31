"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Wallet, 
  Chrome, 
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react'
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'
import { useZkLogin } from '@/components/zklogin-provider'
import { toast } from 'sonner'

interface CleanAuthModalProps {
  onSuccess?: (address: string, method: 'legacy-zklogin' | 'enoki' | 'wallet') => void
  onError?: (error: string) => void
}

export function CleanAuthModal({ onSuccess, onError }: CleanAuthModalProps) {
  const currentAccount = useCurrentAccount()
  const { zkLoginUserAddress, initiateZkLogin, isLoading: zkLoginLoading } = useZkLogin()
  const [isLoading, setIsLoading] = useState(false)
  const isConnectingRef = useRef(false)

  // Handle wallet connection detection
  useEffect(() => {
    if (currentAccount && isConnectingRef.current) {
      // We just connected during a connection process
      isConnectingRef.current = false
      onSuccess?.(currentAccount.address, 'wallet')
      toast.success('Wallet connected!')
    }
  }, [currentAccount, onSuccess])

  // If already connected via zkLogin or wallet, show connected state
  if (currentAccount || zkLoginUserAddress) {
    const address = currentAccount?.address || zkLoginUserAddress
    const method = zkLoginUserAddress ? 'zkLogin' : 'Wallet'
    
    return (
      <Card className="bg-[#030F1C] border-[#1a2f51]">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Connected via {method}</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-300 text-xs">
                Address: <code className="bg-green-500/20 px-1 rounded text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleLegacyZkLogin = async () => {
    setIsLoading(true)
    try {
      await initiateZkLogin()
      
      // Wait a bit for nonce to be set
      setTimeout(() => {
        const currentNonce = localStorage.getItem('zklogin_nonce')
        if (!currentNonce) {
          toast.error('Failed to generate nonce')
          setIsLoading(false)
          return
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const redirectUri = `${window.location.origin}/zklogin/callback`

        if (!clientId) {
          toast.error('Google Client ID not configured')
          setIsLoading(false)
          return
        }

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'id_token',
          scope: 'openid email profile',
          nonce: currentNonce,
          prompt: 'select_account'
        })

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        
        console.log('Legacy zkLogin - Redirecting to:', authUrl)
        window.location.href = authUrl
      }, 100)
    } catch (error) {
      console.error('Legacy zkLogin failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Legacy zkLogin failed: ${errorMessage}`)
      onError?.(errorMessage)
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
          <p className="text-sm text-gray-400 mb-4">
            Choose your preferred method to sign in
          </p>
          
          <Tabs defaultValue="zklogin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1a2f51]">
              <TabsTrigger 
                value="zklogin" 
                className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                zkLogin (Google)
              </TabsTrigger>
              <TabsTrigger 
                value="wallet" 
                className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Crypto Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zklogin" className="space-y-4 mt-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Your Working zkLogin</span>
                </div>
                <p className="text-blue-300 text-xs">
                  Sign in with Google using your proven zkLogin implementation. 
                  No wallet installation required.
                </p>
              </div>
              
              <Button
                onClick={handleLegacyZkLogin}
                disabled={isLoading || zkLoginLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white border-0 h-12"
              >
                <Chrome className="w-5 h-5 mr-2" />
                {isLoading || zkLoginLoading ? 'Connecting...' : 'Sign in with Google'}
              </Button>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="font-medium">Crypto Wallets</span>
                </div>
                <p className="text-green-300 text-xs">
                  Connect with Sui wallets like Sui Wallet, Phantom, or others. 
                  You may also see social login options here (powered by Enoki).
                </p>
              </div>
              
              <div
                onClick={() => {
                  // Mark that we're in a connection process
                  if (!currentAccount) {
                    isConnectingRef.current = true
                  }
                }}
              >
                <ConnectButton
                  connectText="Connect Wallet"
                  className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-12 flex items-center justify-center gap-2"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3 mt-4">
            <p className="text-xs text-gray-300">
              <strong>Recommendation:</strong> Use zkLogin (Google) for the easiest experience. 
              If you prefer crypto wallets or want to try Enoki social login, use the Crypto Wallet option.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
