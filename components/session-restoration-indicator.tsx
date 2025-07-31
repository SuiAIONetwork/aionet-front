"use client"

import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useZkLogin } from './zklogin-provider'
import { getAuthSession } from '@/lib/auth-cookies'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, Wifi } from 'lucide-react'

interface SessionRestorationIndicatorProps {
  className?: string
}

export function SessionRestorationIndicator({ className = '' }: SessionRestorationIndicatorProps) {
  const currentAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()
  const [restorationState, setRestorationState] = useState<'checking' | 'restoring' | 'success' | 'failed' | 'none'>('checking')
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    const checkSessionRestoration = () => {
      const session = getAuthSession()
      
      if (!session) {
        setRestorationState('none')
        return
      }

      setSessionInfo(session)

      // If we have a session but no active connection, we're in restoration mode
      if (!currentAccount?.address && !zkLoginUserAddress) {
        if (session.connectionType === 'wallet') {
          setRestorationState('restoring')
          
          // Set a timeout to mark as failed if restoration takes too long
          const timeout = setTimeout(() => {
            if (!currentAccount?.address) {
              setRestorationState('failed')
            }
          }, 10000) // 10 seconds timeout
          
          return () => clearTimeout(timeout)
        } else if (session.connectionType === 'zklogin') {
          // zkLogin should restore automatically
          setRestorationState('restoring')
        }
      } else {
        // We have both session and active connection
        setRestorationState('success')
      }
    }

    checkSessionRestoration()
  }, [currentAccount?.address, zkLoginUserAddress])

  // Auto-hide success state after a few seconds
  useEffect(() => {
    if (restorationState === 'success') {
      const timer = setTimeout(() => {
        setRestorationState('none')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [restorationState])

  if (restorationState === 'none') {
    return null
  }

  const getStateConfig = () => {
    switch (restorationState) {
      case 'checking':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Checking session...',
          variant: 'secondary' as const,
          description: 'Verifying your authentication status'
        }
      case 'restoring':
        return {
          icon: <Wifi className="w-4 h-4 animate-pulse" />,
          text: 'Restoring session...',
          variant: 'secondary' as const,
          description: sessionInfo?.connectionType === 'wallet' 
            ? 'Reconnecting to your wallet...' 
            : 'Restoring your login...'
        }
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Session restored',
          variant: 'default' as const,
          description: 'Successfully reconnected to your account'
        }
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Reconnection failed',
          variant: 'destructive' as const,
          description: 'Please connect your wallet manually'
        }
      default:
        return {
          icon: <Loader2 className="w-4 h-4" />,
          text: 'Loading...',
          variant: 'secondary' as const,
          description: ''
        }
    }
  }

  const config = getStateConfig()

  return (
    <Card className={`border-l-4 ${
      config.variant === 'destructive' ? 'border-l-destructive' :
      config.variant === 'default' ? 'border-l-green-500' :
      'border-l-blue-500'
    } ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            config.variant === 'destructive' ? 'bg-destructive/10' :
            config.variant === 'default' ? 'bg-green-500/10' :
            'bg-blue-500/10'
          }`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{config.text}</span>
              <Badge variant={config.variant} className="text-xs">
                {sessionInfo?.connectionType || 'Session'}
              </Badge>
            </div>
            {config.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            )}
          </div>
        </div>
        
        {sessionInfo && restorationState === 'restoring' && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="font-mono">
                  {sessionInfo.address.slice(0, 6)}...{sessionInfo.address.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="capitalize">{sessionInfo.connectionType}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for header/navbar
 */
export function SessionRestorationBadge({ className = '' }: SessionRestorationIndicatorProps) {
  const currentAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    const session = getAuthSession()
    
    if (session && !currentAccount?.address && !zkLoginUserAddress) {
      setIsRestoring(true)
      
      // Hide after 10 seconds or when connection is established
      const timer = setTimeout(() => {
        setIsRestoring(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    } else {
      setIsRestoring(false)
    }
  }, [currentAccount?.address, zkLoginUserAddress])

  if (!isRestoring) {
    return null
  }

  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <Loader2 className="w-3 h-3 animate-spin" />
      <span className="text-xs">Reconnecting...</span>
    </Badge>
  )
}
