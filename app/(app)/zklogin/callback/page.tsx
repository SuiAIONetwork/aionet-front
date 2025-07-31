"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useZkLogin } from '@/components/zklogin-provider'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ZkLoginCallbackPage() {
  const router = useRouter()
  const { handleCallback, zkLoginUserAddress, isLoading, error } = useZkLogin()
  const { isSignedIn, user, isNewUser, isLoaded } = useSuiAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get JWT from URL fragment (for implicit flow)
        const fragment = window.location.hash.substring(1)
        const params = new URLSearchParams(fragment)
        const idToken = params.get('id_token')

        if (!idToken) {
          throw new Error('No ID token found in callback')
        }

        console.log('Processing callback with ID token...')

        // Process the JWT with zkLogin
        await handleCallback(idToken)

        console.log('✅ Callback processing completed, waiting for auth integration...')
      } catch (err) {
        console.error('Callback processing failed:', err)
        const message = err instanceof Error ? err.message : 'Authentication failed'
        setErrorMessage(message)
        setStatus('error')
      }
    }

    // Only run once when component mounts
    if (status === 'processing') {
      processCallback()
    }
  }, []) // Remove handleCallback from dependencies to prevent re-runs

  // Update status based on zkLogin state - auth system integration is automatic
  useEffect(() => {
    if (zkLoginUserAddress && isSignedIn && user && isLoaded && status === 'processing') {
      console.log('✅ User signed in with zkLogin and integrated with auth system')
      console.log('🔍 User status:', { isNewUser, hasProfile: !!user, isLoaded })

      // For existing users, redirect directly to profile
      if (!isNewUser) {
        console.log('🔄 Existing user detected, redirecting to profile...')
        router.push('/profile')
        return
      }

      // For new users, show the success dialog
      setStatus('success')
      console.log('🆕 New user detected, showing success dialog')
    }

    if (error && status === 'processing') {
      setStatus('error')
      setErrorMessage(error)
    }
  }, [zkLoginUserAddress, isSignedIn, user, isLoaded, error, status, isNewUser, router])

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  const handleRetry = () => {
    router.push('/zklogin')
  }

  if (status === 'processing' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#4DA2FF]" />
              Processing Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-[#C0E6FF] mb-4">
                Please wait while we process your social login and create your Sui wallet address...
              </p>
              <div className="space-y-2">
                <div className="w-full bg-[#1e3a8a] rounded-full h-2">
                  <div className="bg-[#4DA2FF] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-[#C0E6FF] text-sm">
                  Generating zkLogin credentials...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success' && zkLoginUserAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Welcome to AIONET!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">
                  Your Sui wallet has been created successfully!
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-[#C0E6FF] text-sm">
                  Wallet Address:
                </p>
                <code className="block px-3 py-2 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg text-[#FFFFFF] text-sm font-mono break-all">
                  {zkLoginUserAddress}
                </code>
              </div>

              <p className="text-[#C0E6FF] text-sm mb-4">
                You can now use this wallet to interact with Sui dApps and make transactions. Let's set up your profile to get started!
              </p>

              <Button
                onClick={handleGoToProfile}
                className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Set Up Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Authentication Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30 mb-4">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-medium mb-2">
                  Something went wrong
                </p>
                <p className="text-red-300 text-sm">
                  {errorMessage || 'An unexpected error occurred during authentication.'}
                </p>
              </div>

              <p className="text-[#C0E6FF] text-sm mb-4">
                Please try again or contact support if the problem persists.
              </p>

              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/zklogin')}
                  variant="outline"
                  className="w-full border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to zkLogin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
