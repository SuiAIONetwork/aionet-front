"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, LogOut, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { getSessionStatus, refreshSession, addSessionEventListeners } from '@/lib/auth-session'
import { useSuiAuth } from '@/contexts/sui-auth-context'

interface SessionStatusProps {
  showDetails?: boolean
  className?: string
}

export function SessionStatus({ showDetails = false, className = '' }: SessionStatusProps) {
  const { signOut } = useSuiAuth()
  const [sessionStatus, setSessionStatus] = useState(getSessionStatus())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update session status periodically
  useEffect(() => {
    const updateStatus = () => {
      setSessionStatus(getSessionStatus())
    }

    // Update immediately
    updateStatus()

    // Set up interval to update every minute
    const interval = setInterval(updateStatus, 60000)

    // Listen for session events
    const cleanup = addSessionEventListeners({
      onWarning: () => {
        updateStatus()
      },
      onLogout: () => {
        updateStatus()
      }
    })

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const success = refreshSession()
    
    if (success) {
      setSessionStatus(getSessionStatus())
    }
    
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (!sessionStatus.isAuthenticated) {
    return null
  }

  const getStatusColor = () => {
    if (sessionStatus.isExpiringSoon) {
      return 'destructive'
    } else if (sessionStatus.needsRefresh) {
      return 'secondary'
    } else {
      return 'default'
    }
  }

  const getStatusIcon = () => {
    if (sessionStatus.isExpiringSoon) {
      return <AlertTriangle className="w-4 h-4" />
    } else if (sessionStatus.needsRefresh) {
      return <Clock className="w-4 h-4" />
    } else {
      return <CheckCircle className="w-4 h-4" />
    }
  }

  const getStatusText = () => {
    if (sessionStatus.isExpiringSoon) {
      return 'Expires Soon'
    } else if (sessionStatus.needsRefresh) {
      return 'Needs Refresh'
    } else {
      return 'Active'
    }
  }

  if (!showDetails) {
    // Compact status badge
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        {sessionStatus.timeUntilExpiry && (
          <span className="text-sm text-muted-foreground">
            {formatTimeRemaining(sessionStatus.timeUntilExpiry)}
          </span>
        )}
      </div>
    )
  }

  // Detailed status card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Session Status</CardTitle>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
        <CardDescription>
          Your authentication session information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionStatus.user && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-mono">
                {sessionStatus.user.address.slice(0, 6)}...{sessionStatus.user.address.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connection:</span>
              <span className="capitalize">{sessionStatus.user.connectionType}</span>
            </div>
          </div>
        )}

        {sessionStatus.expiresAt && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <span>{new Date(sessionStatus.expiresAt).toLocaleString()}</span>
            </div>
            {sessionStatus.timeUntilExpiry && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time remaining:</span>
                <span className={sessionStatus.isExpiringSoon ? 'text-destructive' : ''}>
                  {formatTimeRemaining(sessionStatus.timeUntilExpiry)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Session
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {sessionStatus.isExpiringSoon && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              ⚠️ Your session will expire soon. Click "Refresh Session" to extend it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
