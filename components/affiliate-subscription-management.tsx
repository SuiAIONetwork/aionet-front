"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { affiliateSubscriptionService, SubscriptionStatus, AffiliateSubscription } from "@/lib/affiliate-subscription-service"

// Function to get user-friendly subscription type names
const getSubscriptionTypeDisplayName = (subscriptionType: string, durationDays?: number) => {
  switch (subscriptionType) {
    case 'one_time_30_days':
      return '30 Days Extend (one time payment)'
    case 'one_time_60_days':
      return '60 Days Extend (one time payment)'
    case 'one_time_90_days':
      return '90 Days Extend (one time payment)'
    case 'recurring_monthly':
      return 'Monthly Recurring Payment (30 days)'
    case 'recurring_quarterly':
      return 'Quarterly Recurring Payment (90 days)'
    case 'recurring_yearly':
      return 'Yearly Recurring Payment (365 days)'
    default:
      // Fallback for any other types
      if (durationDays) {
        return `${durationDays} Days Extend (one time payment)`
      }
      return subscriptionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}
import { AffiliateSubscriptionPayment } from "@/components/affiliate-subscription-payment"
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Gift,
  History
} from "lucide-react"
import { toast } from "sonner"

interface AffiliateSubscriptionManagementProps {
  userAddress: string
}

export function AffiliateSubscriptionManagement({ userAddress }: AffiliateSubscriptionManagementProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionHistory, setSubscriptionHistory] = useState<AffiliateSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load subscription data
  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Loading subscription data for:', userAddress)

      // Get current subscription status
      console.log('📊 Getting subscription status...')
      const status = await affiliateSubscriptionService.getSubscriptionStatus(userAddress)
      console.log('📊 Subscription status:', status)
      setSubscriptionStatus(status)

      // Get subscription history
      console.log('📋 Getting subscription history...')
      const history = await affiliateSubscriptionService.getSubscriptionHistory(userAddress)
      console.log('📋 Subscription history:', history)
      console.log('📋 History length:', history.length)
      setSubscriptionHistory(history)

    } catch (error) {
      console.error('❌ Failed to load subscription data:', error)
      toast.error('Failed to load subscription information')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh subscription data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSubscriptionData()
    setIsRefreshing(false)
    toast.success('Subscription data refreshed')
  }

  // Load data on component mount
  useEffect(() => {
    if (userAddress) {
      loadSubscriptionData()
    }
  }, [userAddress])

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
      case 'trial':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Trial</Badge>
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-[#4DA2FF] mx-auto mb-4 animate-spin" />
          <p className="text-[#C0E6FF]">Loading subscription information...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#4DA2FF]" />
            Current Subscription
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#C0E6FF] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subscriptionStatus.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {subscriptionStatus.isActive ? 'Active Subscription' : 'Subscription Inactive'}
                    </p>
                    <p className="text-[#C0E6FF] text-sm">
                      {subscriptionStatus.isActive 
                        ? `${subscriptionStatus.daysRemaining} days remaining`
                        : 'No active subscription'
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(subscriptionStatus.status)}
              </div>

              {subscriptionStatus.isActive && (
                <div className="bg-[#0c1b36]/30 rounded-lg p-4 border border-[#C0E6FF]/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4DA2FF]" />
                      <div>
                        <p className="text-[#C0E6FF] text-xs">Expires</p>
                        <p className="text-white text-sm font-medium">
                          {formatDate(subscriptionStatus.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#4DA2FF]" />
                      <div>
                        <p className="text-[#C0E6FF] text-xs">Auto-Renewal</p>
                        <p className="text-white text-sm font-medium">
                          {subscriptionStatus.autoRenew ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#4DA2FF]" />
                      <div>
                        <p className="text-[#C0E6FF] text-xs">Monthly Cost</p>
                        <p className="text-white text-sm font-medium">$30.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {userAddress && (
                  <AffiliateSubscriptionPayment
                    userAddress={userAddress}
                    onPaymentSuccess={loadSubscriptionData}
                    trigger={
                      <Button className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        {subscriptionStatus.isActive ? 'Extend Subscription' : 'Subscribe Now'}
                      </Button>
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-[#C0E6FF]">Unable to load subscription status</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-[#1a2f51] border-[#C0E6FF]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#4DA2FF]" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#C0E6FF]/20">
                    <TableHead className="text-[#C0E6FF]">Date</TableHead>
                    <TableHead className="text-[#C0E6FF]">Type</TableHead>
                    <TableHead className="text-[#C0E6FF]">Amount</TableHead>
                    <TableHead className="text-[#C0E6FF]">Duration</TableHead>
                    <TableHead className="text-[#C0E6FF]">Status</TableHead>
                    <TableHead className="text-[#C0E6FF]">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((subscription) => (
                    <TableRow key={subscription.id} className="border-[#C0E6FF]/10">
                      <TableCell className="text-white">
                        {formatDate(subscription.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.subscription_type === 'bonus' ? (
                            <Gift className="w-4 h-4 text-green-400" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-[#4DA2FF]" />
                          )}
                          <span className="text-white text-sm">
                            {getSubscriptionTypeDisplayName(subscription.subscription_type, subscription.duration_days)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        {subscription.price_usdc > 0 ? formatCurrency(subscription.price_usdc) : 'Free'}
                      </TableCell>
                      <TableCell className="text-white">
                        {subscription.duration_days} days
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell className="text-white">
                        {formatDate(subscription.expires_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-[#C0E6FF]/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Payment History</h3>
              <p className="text-[#C0E6FF]/70 mb-4">
                You haven't made any payments yet. Subscribe to start building your payment history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
