"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useZkLogin } from './zklogin-provider'
import { 
  Chrome, 
  Facebook, 
  Twitter, 
  Twitch, 
  User, 
  LogOut, 
  Copy, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

// Social provider configurations
const SOCIAL_PROVIDERS = {
  google: {
    name: 'Google',
    icon: Chrome,
    color: 'bg-red-500 hover:bg-red-600',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || '',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  twitch: {
    name: 'Twitch',
    icon: Twitch,
    color: 'bg-purple-600 hover:bg-purple-700',
    clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '',
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
  },
}

interface ZkLoginSocialLoginProps {
  redirectUri?: string
  onSuccess?: (address: string) => void
  onError?: (error: string) => void
}

export function ZkLoginSocialLogin({ 
  redirectUri = window.location.origin + '/zklogin/callback',
  onSuccess,
  onError 
}: ZkLoginSocialLoginProps) {
  const {
    zkLoginUserAddress,
    nonce,
    isLoading,
    error,
    initiateZkLogin,
    reset,
  } = useZkLogin()

  const [copiedAddress, setCopiedAddress] = useState(false)

  // Handle authentication success
  useEffect(() => {
    if (zkLoginUserAddress && onSuccess) {
      onSuccess(zkLoginUserAddress)
    }
  }, [zkLoginUserAddress, onSuccess])

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  const handleSocialLogin = async (provider: keyof typeof SOCIAL_PROVIDERS) => {
    try {
      // First initiate zkLogin to get nonce
      await initiateZkLogin()
      
      // Wait a bit for nonce to be set
      setTimeout(() => {
        const currentNonce = localStorage.getItem('zklogin_nonce')
        if (!currentNonce) {
          toast.error('Failed to generate nonce')
          return
        }

        const providerConfig = SOCIAL_PROVIDERS[provider]
        
        // Build OAuth URL
        const params = new URLSearchParams({
          client_id: providerConfig.clientId,
          redirect_uri: redirectUri,
          response_type: 'id_token',
          scope: 'openid email profile',
          nonce: currentNonce,
        })

        // Add provider-specific parameters
        if (provider === 'google') {
          params.append('prompt', 'select_account')
        }

        const authUrl = `${providerConfig.authUrl}?${params.toString()}`

        // Use direct redirect instead of popup for better reliability
        console.log('Redirecting to OAuth provider:', authUrl)
        window.location.href = authUrl

      }, 100)

    } catch (err) {
      console.error('Social login failed:', err)
      toast.error('Failed to initiate social login')
    }
  }

  const copyAddress = async () => {
    if (zkLoginUserAddress) {
      await navigator.clipboard.writeText(zkLoginUserAddress)
      setCopiedAddress(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleLogout = () => {
    reset()
    toast.success('Logged out successfully')
  }

  if (zkLoginUserAddress) {
    return (
      <Card className="w-full max-w-md mx-auto bg-[#0c1b36] border-[#1e3a8a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            zkLogin Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Authenticated</span>
            </div>
            <Badge className="bg-[#4DA2FF] text-white">
              Sui zkLogin
            </Badge>
          </div>

          <div>
            <label className="text-[#C0E6FF] text-sm font-medium">Wallet Address</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg text-[#FFFFFF] text-sm font-mono">
                {formatAddress(zkLoginUserAddress)}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyAddress}
                className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
              >
                {copiedAddress ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => window.open('https://suiexplorer.com/address/' + zkLoginUserAddress + '?network=devnet', '_blank')}
              className="flex-1 bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
            >
              View on Explorer
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#0c1b36] border-[#1e3a8a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#4DA2FF]" />
          Social Login with zkLogin
        </CardTitle>
        <p className="text-[#C0E6FF] text-sm">
          Connect using your social accounts to get a Sui wallet address
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(SOCIAL_PROVIDERS).map(([key, provider]) => {
            const Icon = provider.icon
            const isDisabled = !provider.clientId || isLoading

            return (
              <Button
                key={key}
                onClick={() => handleSocialLogin(key as keyof typeof SOCIAL_PROVIDERS)}
                disabled={isDisabled}
                className={`w-full ${provider.color} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 mr-2" />
                )}
                Continue with {provider.name}
                {!provider.clientId && (
                  <span className="ml-2 text-xs opacity-75">(Not configured)</span>
                )}
              </Button>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-[#C0E6FF] text-xs">
            By continuing, you agree to create a Sui wallet address linked to your social account
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
