"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { affiliateSubscriptionService, SubscriptionStatus } from "@/lib/affiliate-subscription-service"
import { AffiliateSubscriptionPayment } from "@/components/affiliate-subscription-payment"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { 
  Lock, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Gift
} from "lucide-react"

interface SubscriptionGuardProps {
  children: React.ReactNode
  feature?: string
  showUpgrade?: boolean
  className?: string
}

/**
 * Component that restricts access to affiliate features based on subscription status
 * Shows upgrade prompt when subscription is expired
 */
export function SubscriptionGuard({ 
  children, 
  feature = "affiliate feature",
  showUpgrade = true,
  className = ""
}: SubscriptionGuardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const account = useCurrentAccount()
  const { isSignedIn, user } = useSuiAuth()

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address
  const isAuthenticated = isSignedIn || !!account?.address

  useEffect(() => {
    if (userAddress && isAuthenticated) {
      loadSubscriptionStatus()
    } else {
      setLoading(false)
    }
  }, [userAddress, isAuthenticated])

  const loadSubscriptionStatus = async () => {
    if (!userAddress) return

    try {
      setLoading(true)
      setError(null)
      
      const status = await affiliateSubscriptionService.getSubscriptionStatus(userAddress)
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error loading subscription status:', error)
      setError('Failed to load subscription status')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF]" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className={`bg-[#0a1628] border-[#C0E6FF]/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Unable to verify subscription</p>
          <p className="text-[#C0E6FF] text-sm mb-4">{error}</p>
          <Button
            onClick={loadSubscriptionStatus}
            className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated || !userAddress) {
    return (
      <Card className={`bg-[#0a1628] border-[#C0E6FF]/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <Lock className="w-12 h-12 text-[#4DA2FF] mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Authentication Required</p>
          <p className="text-[#C0E6FF] text-sm">
            Please connect your wallet to access {feature}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Allow access if subscription is active OR in development mode
  if (subscriptionStatus?.isActive || process.env.NODE_ENV === 'development') {
    return <div className={className}>{children}</div>
  }

  // Show subscription expired/upgrade prompt
  return (
    <Card className={`bg-[#0a1628] border-[#C0E6FF]/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-orange-400" />
          Subscription Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Status */}
        <div className="bg-[#1a2f51]/30 rounded-lg p-4 border border-[#C0E6FF]/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {subscriptionStatus?.status === 'trial' ? (
                <Clock className="w-5 h-5 text-orange-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <span className="text-white font-medium capitalize">
                {subscriptionStatus?.status || 'Unknown'} Status
              </span>
            </div>
            <Badge className={`${
              subscriptionStatus?.status === 'trial' 
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {subscriptionStatus?.status === 'trial' ? 'Trial Expired' : 'Subscription Expired'}
            </Badge>
          </div>
          
          <p className="text-[#C0E6FF] text-sm mb-3">
            {subscriptionStatus?.status === 'trial'
              ? `Your 30-day free trial has expired. Upgrade to continue accessing ${feature}.`
              : `Your affiliate subscription has expired. Renew to continue accessing ${feature}.`
            }
          </p>

          {subscriptionStatus?.daysRemaining !== undefined && subscriptionStatus.daysRemaining <= 0 && (
            <p className="text-red-300 text-sm">
              Expired {Math.abs(subscriptionStatus.daysRemaining)} days ago
            </p>
          )}
        </div>

        {/* Benefits Reminder */}
        <div className="bg-[#4DA2FF]/10 rounded-lg p-4 border border-[#4DA2FF]/20">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#4DA2FF]" />
            Affiliate Subscription Benefits
          </h4>
          <ul className="text-[#C0E6FF] text-sm space-y-1">
            <li>• Access to affiliate controls dashboard</li>
            <li>• Referral management</li>
            <li>• Earn network commissions</li>
            <li>• RaffleQuiz bonus integration</li>
            <li>• Commission tracking and analytics</li>
          </ul>
        </div>

        {/* Upgrade Actions */}
        {showUpgrade && (
          <div className="space-y-3">
            <AffiliateSubscriptionPayment
              userAddress={userAddress}
              onPaymentSuccess={loadSubscriptionStatus}
              trigger={
                <Button className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  {subscriptionStatus?.status === 'trial' ? 'Upgrade Now' : 'Renew Subscription'}
                  <span className="ml-2 text-xs opacity-80">($30/month)</span>
                </Button>
              }
            />
            

          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Hook to check subscription status
 */
export function useSubscriptionStatus() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const account = useCurrentAccount()
  const { isSignedIn, user } = useSuiAuth()

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address
  const isAuthenticated = isSignedIn || !!account?.address

  useEffect(() => {
    if (userAddress && isAuthenticated) {
      loadStatus()
    } else {
      setLoading(false)
    }
  }, [userAddress, isAuthenticated])

  const loadStatus = async () => {
    if (!userAddress) return

    try {
      setLoading(true)
      const status = await affiliateSubscriptionService.getSubscriptionStatus(userAddress)
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error loading subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasActiveSubscription = subscriptionStatus?.isActive || false

  return {
    subscriptionStatus,
    loading,
    hasActiveSubscription,
    refreshStatus: loadStatus
  }
}
