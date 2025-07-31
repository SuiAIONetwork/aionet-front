"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useZkLogin } from './zklogin-provider'
import { useConnectWallet, useWallets, useCurrentAccount } from '@mysten/dapp-kit'
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki'
import {
  Chrome,
  Facebook,
  Twitch,
  Apple,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Zap,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface EnhancedSocialLoginProps {
  onSuccess?: (address: string, method: 'enoki' | 'legacy') => void
  onError?: (error: string) => void
}

export function EnhancedSocialLogin({ onSuccess, onError }: EnhancedSocialLoginProps) {
  const { zkLoginUserAddress, initiateZkLogin, isLoading: legacyLoading } = useZkLogin()
  const { mutate: connectWallet } = useConnectWallet()
  const currentAccount = useCurrentAccount()
  const wallets = useWallets()

  const [isEnokiLoading, setIsEnokiLoading] = useState(false)
  // Enoki enabled - ready for production upgrade
  const [preferredMethod, setPreferredMethod] = useState<'enoki' | 'legacy'>('enoki')

  // Get Enoki wallets
  const enokiWallets = wallets.filter(isEnokiWallet)
  const walletsByProvider = enokiWallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  )

  // Check if Enoki is configured
  const enokiConfigured = enokiWallets.length > 0

  // Handle current account connection
  useEffect(() => {
    if (currentAccount && onSuccess) {
      // Check if it's an Enoki wallet
      const connectedWallet = wallets.find(w => w.accounts.some(acc => acc.address === currentAccount.address))
      const method = connectedWallet && isEnokiWallet(connectedWallet) ? 'enoki' : 'legacy'
      onSuccess(currentAccount.address, method)
    }
  }, [currentAccount, wallets, onSuccess])

  // Handle legacy zkLogin success (when not using Enoki)
  useEffect(() => {
    if (zkLoginUserAddress && !currentAccount && onSuccess) {
      onSuccess(zkLoginUserAddress, 'legacy')
    }
  }, [zkLoginUserAddress, currentAccount, onSuccess])

  const handleEnokiSignIn = async (provider: 'google' | 'facebook' | 'twitch' | 'apple') => {
    if (!enokiConfigured) {
      toast.error('Enoki wallets are not registered. Please check your configuration.')
      return
    }

    const wallet = walletsByProvider.get(provider as AuthProvider)
    if (!wallet) {
      toast.error(`${provider} wallet is not available`)
      return
    }

    setIsEnokiLoading(true)
    try {
      console.log(`=== Enoki ${provider} Connection Debug ===`)
      console.log('Wallet object:', wallet)
      console.log('Wallet provider:', wallet.provider)
      console.log('Wallet name:', wallet.name)
      console.log('Available features:', wallet.features)

      toast.info(`Attempting to connect with ${provider} via Enoki...`)

      connectWallet(
        { wallet },
        {
          onSuccess: (result) => {
            console.log(`✅ Connected with ${provider} via Enoki!`, result)
            toast.success(`Connected with ${provider} via Enoki!`)
            if (onSuccess && result.accounts?.[0]?.address) {
              onSuccess(result.accounts[0].address, 'enoki')
            }
            setIsEnokiLoading(false)
          },
          onError: (error) => {
            console.error(`❌ Enoki ${provider} sign in failed:`, error)
            console.error('Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              error
            })

            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            // Check for specific OAuth errors
            if (errorMessage.includes('access_denied') || errorMessage.includes('Access blocked')) {
              toast.error(`OAuth access denied. This might be due to Enoki-specific redirect URI configuration. Check the Enoki Portal settings.`)
            } else {
              toast.error(`Failed to sign in with ${provider} via Enoki: ${errorMessage}`)
            }

            if (onError) {
              onError(errorMessage)
            }
            setIsEnokiLoading(false)
          }
        }
      )
    } catch (error) {
      console.error(`❌ Enoki ${provider} connection error:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to initiate ${provider} connection: ${errorMessage}`)
      if (onError) {
        onError(errorMessage)
      }
      setIsEnokiLoading(false)
    }
  }

  const handleLegacySignIn = async (provider: 'google') => {
    try {
      // First initiate zkLogin to generate nonce and keys
      await initiateZkLogin()

      // Wait a bit for nonce to be set
      setTimeout(() => {
        const currentNonce = localStorage.getItem('zklogin_nonce')
        if (!currentNonce) {
          toast.error('Failed to generate nonce')
          return
        }

        // Build OAuth URL for Google
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        if (!clientId) {
          toast.error('Google Client ID not configured. Please check your environment variables.')
          console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set')
          return
        }

        const redirectUri = `${window.location.origin}/zklogin/callback`

        console.log('OAuth Configuration:')
        console.log('- Client ID:', clientId)
        console.log('- Redirect URI:', redirectUri)
        console.log('- Nonce:', currentNonce)

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'id_token',
          scope: 'openid email profile',
          nonce: currentNonce,
          prompt: 'select_account'
        })

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

        console.log('Generated OAuth URL:', authUrl)

        // Show a toast with instructions
        toast.info('Redirecting to Google OAuth. If you get an "Access blocked" error, check the redirect URI configuration in Google Cloud Console.')

        // Redirect to Google OAuth
        window.location.href = authUrl
      }, 100)
    } catch (error) {
      console.error('Legacy zkLogin failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Legacy zkLogin failed: ${errorMessage}`)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const providers = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: Chrome,
      color: 'bg-red-500 hover:bg-red-600',
      available: true, // Always available (legacy fallback or Enoki)
      enokiWallet: walletsByProvider.get('google' as AuthProvider),
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      available: !!walletsByProvider.get('facebook' as AuthProvider), // Only available if Enoki wallet exists
      enokiWallet: walletsByProvider.get('facebook' as AuthProvider),
    },
    {
      id: 'twitch' as const,
      name: 'Twitch',
      icon: Twitch,
      color: 'bg-purple-600 hover:bg-purple-700',
      available: !!walletsByProvider.get('twitch' as AuthProvider), // Only available if Enoki wallet exists
      enokiWallet: walletsByProvider.get('twitch' as AuthProvider),
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: Apple,
      color: 'bg-gray-800 hover:bg-gray-900',
      available: !!walletsByProvider.get('apple' as AuthProvider), // Only available if Enoki wallet exists
      enokiWallet: walletsByProvider.get('apple' as AuthProvider),
    },
  ]

  // If already connected via current account, don't show login buttons
  if (currentAccount) {
    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-white font-medium">Wallet Connected</span>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-300 text-xs">
            Address: <code className="bg-green-500/20 px-1 rounded text-xs">{currentAccount.address}</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Method Selection */}
      {enokiConfigured && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Preferred method:</span>
            <div className="flex gap-1">
              <Button
                variant={preferredMethod === 'enoki' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreferredMethod('enoki')}
                className="h-7 px-2 text-xs"
                disabled={!enokiConfigured}
              >
                <Zap className="w-3 h-3 mr-1" />
                Enoki {enokiConfigured && <span className="ml-1">(Private Key)</span>}
              </Button>
              <Button
                variant={preferredMethod === 'legacy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreferredMethod('legacy')}
                className="h-7 px-2 text-xs"
              >
                <Shield className="w-3 h-3 mr-1" />
                Legacy
              </Button>
            </div>
          </div>

          {preferredMethod === 'enoki' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Enoki (Recommended)</span>
              </div>
              <p className="text-green-300 text-xs mt-1">
                Uses Mysten Labs' managed proving service. More reliable and supports multiple providers.
              </p>
            </div>
          )}

          {preferredMethod === 'legacy' && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Legacy zkLogin</span>
              </div>
              <p className="text-orange-300 text-xs mt-1">
                Uses deprecated proving service. May not work reliably. Only supports Google.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Provider Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => {
          const Icon = provider.icon
          const isLoading = (preferredMethod === 'enoki' && isEnokiLoading) ||
                           (preferredMethod === 'legacy' && legacyLoading)
          const hasEnokiWallet = !!provider.enokiWallet
          const isAvailable = provider.available &&
                             (hasEnokiWallet || provider.id === 'google')

          return (
            <Button
              key={provider.id}
              onClick={() => {
                if (hasEnokiWallet && preferredMethod === 'enoki') {
                  handleEnokiSignIn(provider.id)
                } else if (provider.id === 'google') {
                  handleLegacySignIn(provider.id)
                }
              }}
              disabled={!isAvailable || isLoading}
              className={`${provider.color} text-white border-0 h-12 ${
                !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Icon className="w-4 h-4 mr-2" />
              )}
              {provider.name}
              {hasEnokiWallet && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-500/20 text-green-300">
                  Enoki
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Status Messages */}
      {!enokiConfigured && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            <strong>Note:</strong> Only Google is available with legacy zkLogin.
            Configure Enoki to access Facebook, Twitch, and Apple sign-in.
          </p>
        </div>
      )}

      {/* Upgrade Status */}
      {enokiConfigured && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            🚀 <strong>Ready for Production:</strong> Enoki is configured with private key.
            After upgrading to production mode in Enoki Portal, all social providers will work seamlessly.
          </p>
        </div>
      )}

      {isEnokiLoading && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Connecting with Enoki...</span>
          </div>
        </div>
      )}

      {legacyLoading && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-orange-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Connecting with legacy zkLogin...</span>
          </div>
        </div>
      )}
    </div>
  )
}
