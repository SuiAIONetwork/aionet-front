"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { MIST_PER_SUI } from "@mysten/sui/utils"
import { api } from "@/lib/api-client"
// Remove direct service import - use API routes instead
export interface PriceQuote {
  usdcPrice: number
  suiPrice: number
  suiUsdRate: number
  validUntil: string
  durationDays?: number
}

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
      return subscriptionType
  }
}
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { 
  CreditCard, 
  Clock, 
  DollarSign, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface AffiliateSubscriptionPaymentProps {
  userAddress: string
  onPaymentSuccess?: () => void
  trigger?: React.ReactNode
}

export function AffiliateSubscriptionPayment({ 
  userAddress, 
  onPaymentSuccess,
  trigger 
}: AffiliateSubscriptionPaymentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'duration' | 'quote' | 'confirm' | 'processing' | 'success' | 'error'>('duration')
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(30) // Default to 30 days
  const [isRecurring, setIsRecurring] = useState(false) // Default to one-time payment

  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const { isSignedIn } = useSuiAuth()

  // Get SUI balance
  const [suiBalance, setSuiBalance] = useState<number>(0)

  // Duration options (days) with pricing and discounts
  const durationOptions = [
    { days: 30, label: "1 Month", price: 25, originalPrice: 25, discount: 0 },
    { days: 60, label: "2 Months", price: 47, originalPrice: 50, discount: 6 },
    { days: 90, label: "3 Months", price: 67, originalPrice: 75, discount: 10.7 },
    { days: 180, label: "6 Months", price: 120, originalPrice: 150, discount: 20 },
    { days: 365, label: "1 Year (12 Months)", price: 210, originalPrice: 300, discount: 30 }
  ]

  // Calculate price based on selected duration (now uses predefined discounted prices)
  const calculatePrice = (days: number) => {
    const option = durationOptions.find(opt => opt.days === days)
    return option ? option.price : (days / 30) * 25 // Fallback to $25 per month
  }

  const selectedOption = durationOptions.find(opt => opt.days === selectedDuration)
  const calculatedPrice = calculatePrice(selectedDuration)

  useEffect(() => {
    const addressToUse = userAddress || account?.address
    if (addressToUse) {
      fetchSuiBalance()
    }
  }, [userAddress, account?.address])

  const fetchSuiBalance = async () => {
    const addressToUse = userAddress || account?.address
    if (!addressToUse) return

    try {
      const balance = await suiClient.getBalance({
        owner: addressToUse,
        coinType: '0x2::sui::SUI'
      })
      setSuiBalance(parseInt(balance.totalBalance) / Number(MIST_PER_SUI))
    } catch (error) {
      console.error('Error fetching SUI balance:', error)
    }
  }

  const fetchPriceQuote = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      // Get price quote from backend API
      console.log('🔄 Fetching price quote for duration:', selectedDuration)
      const quote = await api.affiliate.getQuote(selectedDuration)

      console.log('📡 Quote received:', quote)

      // Override the quote with our calculated values
      const customQuote: PriceQuote = {
        usdcPrice: calculatedPrice,
        suiPrice: calculatedPrice / ((quote as any)?.suiUsdRate || 2.5), // Convert to SUI using current rate
        suiUsdRate: (quote as any)?.suiUsdRate || 2.5,
        validUntil: (quote as any)?.validUntil || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        durationDays: selectedDuration
      }

      setPriceQuote(customQuote)
      setPaymentStep('confirm')
    } catch (error) {
      console.error('Error fetching price quote:', error)
      setError('Failed to get current pricing. Please try again.')
      setPaymentStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle transaction success (shared logic for both wallet types)
  const handleTransactionSuccess = async (txHash: string) => {
    try {
      console.log('🔄 Processing subscription for duration:', selectedDuration, 'days')

      // Create subscription record via backend API
      const subscription = await api.affiliate.subscribe(selectedDuration, {
        userAddress,
        priceQuote,
        transactionHash: txHash,
        isRecurring
      })

      console.log('✅ Subscription created:', (subscription as any)?.id)

      // Verify and activate subscription via backend API
      console.log('🔍 Starting verification for transaction:', txHash)
      const verification = await api.affiliate.verifyPayment(txHash)

      console.log('🔍 Verification result:', (verification as any)?.verified)

      if ((verification as any)?.verified) {
        setTransactionHash(txHash)
        setPaymentStep('success')
        toast.success('🎉 Affiliate subscription activated successfully!')
        onPaymentSuccess?.()
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error: any) {
      console.error('❌ Error processing subscription:', error)
      console.error('❌ Error details:', error.message, error.stack)
      setError(`Payment sent but subscription activation failed: ${error.message}. Please contact support.`)
      setPaymentStep('error')
    }
  }

  const handlePayment = async () => {
    if (!priceQuote || !account?.address) return

    try {
      setIsProcessing(true)
      setPaymentStep('processing')
      setError(null)

      // Check if user has sufficient balance
      if (suiBalance < priceQuote.suiPrice) {
        throw new Error(`Insufficient SUI balance. You need ${priceQuote.suiPrice.toFixed(4)} SUI but only have ${suiBalance.toFixed(4)} SUI.`)
      }

      // Create transaction to send SUI to the platform wallet
      const tx = new Transaction()
      
      // In production, replace with your actual platform wallet address
      const platformWallet = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
      const amountInMist = Math.floor(priceQuote.suiPrice * Number(MIST_PER_SUI))

      tx.transferObjects(
        [tx.splitCoins(tx.gas, [amountInMist])],
        platformWallet
      )

      // Execute transaction using Enoki-compatible signAndExecuteTransaction
      console.log('🔄 Executing payment transaction...')
      console.log('🔧 Transaction details:', {
        userAddress,
        amountInSui: priceQuote.suiPrice,
        amountInMist: amountInMist.toString(),
        platformWallet
      })

      // Check if user is properly authenticated
      console.log('🔍 Checking authentication state...')
      console.log('- Current account:', account)
      console.log('- User address:', userAddress)
      console.log('- Account address:', account?.address)

      try {
        console.log('🔄 Attempting to sign and execute transaction...')
        const result = await signAndExecuteTransaction({
          transaction: tx as any, // Type assertion to handle version mismatch between @mysten/sui packages
        })

        console.log('✅ Payment transaction successful:', result)
        await handleTransactionSuccess(result.digest)

      } catch (error: any) {
        console.error('❌ Payment transaction failed:', error)
        console.error('❌ Error stack:', error.stack)
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          cause: error.cause,
          code: error.code
        })

        // Check if this is an Enoki authentication issue
        if (error.message?.includes('Missing required parameters for proof generation')) {
          console.error('🚨 This appears to be an Enoki zkLogin authentication issue')
          console.error('🔍 Possible causes:')
          console.error('  1. Google OAuth redirect URI not configured correctly')
          console.error('  2. Enoki wallet not properly registered')
          console.error('  3. User not properly authenticated with Enoki')
          setError('Authentication error: Please try logging out and logging back in with Google.')
        } else {
          setError(`Payment failed: ${error.message}`)
        }
        setPaymentStep('error')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setError(error.message || 'Payment failed. Please try again.')
      setPaymentStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPayment = () => {
    setPaymentStep('duration')
    setPriceQuote(null)
    setError(null)
    setTransactionHash(null)
    setIsProcessing(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setPaymentStep('duration')
    } else {
      resetPayment()
    }
  }

  // Check if user is authenticated with either method
  const isAuthenticated = isSignedIn || !!account
  const currentUserAddress = userAddress || account?.address

  if (!isAuthenticated || !currentUserAddress) {
    return null
  }

  const defaultTrigger = (
    <Button className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white">
      <CreditCard className="w-4 h-4 mr-2" />
      Renew Subscription
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0a1628] border-[#C0E6FF]/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#4DA2FF]" />
            Affiliate Subscription Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duration Selection Step */}
          {paymentStep === 'duration' && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock className="w-12 h-12 text-[#4DA2FF] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Select Subscription Duration</h3>
                <p className="text-[#C0E6FF] text-sm">Choose how many days to add to your subscription</p>
              </div>

              {/* Duration Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#C0E6FF]">Duration</label>
                <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                  <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
                    {durationOptions.map((option) => (
                      <SelectItem
                        key={option.days}
                        value={option.days.toString()}
                        className="text-white hover:bg-[#C0E6FF]/10"
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col">
                            <span>{option.label} ({option.days} days)</span>
                            {option.discount > 0 && (
                              <span className="text-xs text-green-400">Save {option.discount}%</span>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            {option.discount > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[#4DA2FF] font-semibold">${option.price}</span>
                                <span className="text-xs text-gray-400 line-through">${option.originalPrice}</span>
                              </div>
                            ) : (
                              <span className="text-[#4DA2FF] font-semibold">${option.price}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subscription Type Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#C0E6FF]">Subscription Type</label>
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      !isRecurring
                        ? 'bg-[#4DA2FF]/20 border-[#4DA2FF] text-white'
                        : 'bg-[#1a2f51]/30 border-[#C0E6FF]/30 text-[#C0E6FF] hover:border-[#C0E6FF]/50'
                    }`}
                    onClick={() => setIsRecurring(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">One-Time Payment</p>
                        <p className="text-sm opacity-80">Pay once, extends your current subscription</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        !isRecurring ? 'bg-[#4DA2FF] border-[#4DA2FF]' : 'border-[#C0E6FF]/50'
                      }`} />
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isRecurring
                        ? 'bg-[#4DA2FF]/20 border-[#4DA2FF] text-white'
                        : 'bg-[#1a2f51]/30 border-[#C0E6FF]/30 text-[#C0E6FF] hover:border-[#C0E6FF]/50'
                    }`}
                    onClick={() => setIsRecurring(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Recurring Subscription</p>
                        <p className="text-sm opacity-80">Automatically renews every period (can be cancelled)</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        isRecurring ? 'bg-[#4DA2FF] border-[#4DA2FF]' : 'border-[#C0E6FF]/50'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Preview */}
              <div className="bg-[#1a2f51]/30 rounded-lg p-4 border border-[#C0E6FF]/10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[#C0E6FF] text-sm">Selected Duration</p>
                      <p className="text-white font-semibold">{selectedOption?.label || `${selectedDuration} days`}</p>
                      {selectedOption && selectedOption.discount > 0 && (
                        <p className="text-green-400 text-xs">Save {selectedOption.discount}% with upfront payment</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#C0E6FF] text-sm">Total Price</p>
                      <div className="flex flex-col items-end">
                        <p className="text-white font-bold text-lg">${calculatedPrice.toFixed(2)}</p>
                        {selectedOption && selectedOption.discount > 0 && (
                          <p className="text-gray-400 text-sm line-through">${selectedOption.originalPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#C0E6FF]/10">
                    <p className="text-[#C0E6FF] text-sm">Type</p>
                    <p className="text-white font-medium">
                      {isRecurring ? 'Recurring Subscription' : 'One-Time Payment'}
                    </p>
                  </div>
                  {selectedOption && selectedOption.discount > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-[#C0E6FF]/10">
                      <p className="text-[#C0E6FF] text-sm">You Save</p>
                      <p className="text-green-400 font-semibold">
                        ${(selectedOption.originalPrice - selectedOption.price).toFixed(2)} ({selectedOption.discount}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={fetchPriceQuote}
                className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                disabled={!selectedDuration}
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Quote Step */}
          {paymentStep === 'quote' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF] mx-auto mb-4" />
              <p className="text-[#C0E6FF]">Getting current pricing...</p>
            </div>
          )}

          {/* Confirm Step */}
          {paymentStep === 'confirm' && priceQuote && (
            <div className="space-y-4">
              {/* Pricing Card */}
              <Card className="bg-[#1a2f51]/30 border-[#C0E6FF]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Subscription Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#C0E6FF]">Duration:</span>
                    <Badge className="bg-[#4DA2FF]/20 text-[#4DA2FF] border-[#4DA2FF]/30">
                      {selectedOption?.label || `${selectedDuration} days`}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C0E6FF]">USDC Equivalent:</span>
                    <span className="text-white font-semibold">${priceQuote.usdcPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C0E6FF]">SUI Price:</span>
                    <span className="text-white font-semibold">{priceQuote.suiPrice.toFixed(4)} SUI</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#C0E6FF]/70">Exchange Rate:</span>
                    <span className="text-[#C0E6FF]/70">${priceQuote.suiUsdRate.toFixed(2)} per SUI</span>
                  </div>
                  <Separator className="bg-[#C0E6FF]/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#C0E6FF]">Your SUI Balance:</span>
                    <span className={`font-semibold ${suiBalance >= priceQuote.suiPrice ? 'text-green-400' : 'text-red-400'}`}>
                      {suiBalance.toFixed(4)} SUI
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Warning */}
              {suiBalance < priceQuote.suiPrice && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Insufficient Balance</span>
                  </div>
                  <p className="text-red-300 text-sm mt-1">
                    You need {(priceQuote.suiPrice - suiBalance).toFixed(4)} more SUI to complete this purchase.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setPaymentStep('duration')}
                  variant="outline"
                  className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={() => fetchPriceQuote()}
                  variant="outline"
                  className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                  disabled={isProcessing}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                  disabled={isProcessing || suiBalance < priceQuote.suiPrice}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {priceQuote.suiPrice.toFixed(4)} SUI
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF] mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Processing Payment...</p>
              <p className="text-[#C0E6FF] text-sm">Please confirm the transaction in your wallet</p>
            </div>
          )}

          {/* Success Step */}
          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Payment Successful!</p>
              <p className="text-[#C0E6FF] text-sm mb-4">Your affiliate subscription has been activated for 30 days.</p>
              {transactionHash && (
                <p className="text-xs text-[#C0E6FF]/70 break-all">
                  Transaction: {transactionHash}
                </p>
              )}
              <Button
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Error Step */}
          {paymentStep === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Payment Failed</p>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <div className="flex gap-3">
                <Button
                  onClick={resetPayment}
                  variant="outline"
                  className="flex-1 border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
