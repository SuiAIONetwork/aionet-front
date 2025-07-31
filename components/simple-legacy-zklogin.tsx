"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'
import { useZkLogin } from '@/components/zklogin-provider'
import { toast } from 'sonner'

interface SimpleLegacyZkLoginProps {
  onSuccess?: (address: string, method: string) => void
  onError?: (error: string) => void
}

export function SimpleLegacyZkLogin({ onSuccess, onError }: SimpleLegacyZkLoginProps) {
  const { zkLoginUserAddress, initiateZkLogin, isLoading: zkLoginLoading } = useZkLogin()
  const [isLoading, setIsLoading] = useState(false)

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
    <Button
      onClick={handleLegacyZkLogin}
      disabled={isLoading || zkLoginLoading}
      className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-12 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-center">
        {/* Google G Logo */}
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading || zkLoginLoading ? 'Connecting...' : 'Login with Google'}
      </div>
    </Button>
  )
}
