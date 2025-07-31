"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SessionStatus } from '@/components/session-status'
import { useSession, useSessionWarnings } from '@/hooks/use-session'
import { RefreshCw, Shield, Clock, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function SessionManagementPage() {
  const {
    isAuthenticated,
    user,
    expiresAt,
    timeUntilExpiry,
    needsRefresh,
    isExpiringSoon,
    refresh,
    getTimeRemaining,
    isRefreshing
  } = useSession()

  // Set up session warnings
  useSessionWarnings({
    onWarning: (minutes) => {
      toast.warning(`Session expires in ${minutes} minutes`, {
        description: 'Your session will expire soon. Consider refreshing it to stay logged in.',
        duration: 10000,
      })
    },
    onExpiringSoon: () => {
      toast.error('Session expiring soon!', {
        description: 'Your session will expire in less than 10 minutes. Please refresh now.',
        duration: 15000,
      })
    },
    onLogout: (reason) => {
      toast.error('Session expired', {
        description: reason || 'You have been logged out due to session expiry.',
        duration: 5000,
      })
    }
  })

  const handleRefresh = async () => {
    const success = await refresh()
    if (success) {
      toast.success('Session refreshed successfully', {
        description: 'Your session has been extended for another 7 days.',
      })
    } else {
      toast.error('Failed to refresh session', {
        description: 'Please try signing in again.',
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              You need to be signed in to view session information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your authentication session and security settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Session Status */}
        <SessionStatus showDetails={true} />

        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Session Information
            </CardTitle>
            <CardDescription>
              Details about your current authentication session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isExpiringSoon ? 'destructive' : needsRefresh ? 'secondary' : 'default'}>
                  {isExpiringSoon ? 'Expires Soon' : needsRefresh ? 'Needs Refresh' : 'Active'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection Type:</span>
                <span className="text-sm capitalize">{user?.connectionType}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Address:</span>
                <span className="text-sm font-mono">
                  {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
                </span>
              </div>
              
              {expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expires:</span>
                  <span className="text-sm">{new Date(expiresAt).toLocaleString()}</span>
                </div>
              )}
              
              {timeUntilExpiry && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Time Remaining:</span>
                  <span className={`text-sm ${isExpiringSoon ? 'text-destructive' : ''}`}>
                    {getTimeRemaining()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Features
            </CardTitle>
            <CardDescription>
              How your session is protected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Time-Sensitive Cookies</p>
                  <p className="text-xs text-muted-foreground">
                    Your session is stored in secure cookies that expire automatically
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Automatic Refresh</p>
                  <p className="text-xs text-muted-foreground">
                    Sessions are automatically refreshed when you're active
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Activity Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Your session stays active as long as you're using the app
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Expiration Warnings</p>
                  <p className="text-xs text-muted-foreground">
                    You'll be notified before your session expires
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Settings
            </CardTitle>
            <CardDescription>
              Configure your session preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Session Duration</p>
                  <p className="text-xs text-muted-foreground">7 days (default)</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Auto-Refresh</p>
                  <p className="text-xs text-muted-foreground">Enabled when active</p>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Expiry Warnings</p>
                  <p className="text-xs text-muted-foreground">10 minutes before expiry</p>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>
                <strong>Note:</strong> Session settings are automatically configured for optimal security and user experience.
                Your session will be extended automatically when you're active, and you'll receive warnings before expiration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
