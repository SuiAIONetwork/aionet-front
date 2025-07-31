"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useSubscription } from "@/contexts/subscription-context"
import { Coins, Calendar, Shield, CheckCircle, AlertCircle, Wallet } from "lucide-react"
import { toast } from "sonner"
import { addUserChannelSubscription } from "@/lib/channel-subscriptions-storage"
import { grantChannelAccess } from "@/lib/channel-access-storage"
import { createClient } from '@supabase/supabase-js'


interface Creator {
  id: string
  creatorAddress: string // Wallet address of the creator (for ownership verification)
  name: string
  username: string
  avatar: string
  role: string
  subscribers: number
  category: string
  channels: Channel[]
  contentTypes: string[]
  verified: boolean
  languages: string[]
  availability: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
  socialLinks: {
    website?: string
    twitter?: string
    discord?: string
  }
  bannerColor: string
}

// Helper function to extract blob ID from creator avatar URL
function extractBlobIdFromCreatorAvatar(avatarUrl: string): string | undefined {
  if (!avatarUrl) return undefined

  // Match Walrus URL pattern: https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}
  const match = avatarUrl.match(/\/blobs\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : undefined
}

// Helper function to get creator's profile image blob ID directly from database
async function getCreatorProfileImageBlobIdDirect(creatorAddress: string): Promise<string | undefined> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Fetching creator profile image blob ID directly for:', creatorAddress)

    const { data, error } = await supabase
      .from('creators')
      .select('profile_image_blob_id')
      .eq('creator_address', creatorAddress)
      .single()

    if (error) {
      console.warn('⚠️ Failed to fetch creator profile image blob ID:', error)
      return undefined
    }

    console.log('✅ Found creator profile image blob ID:', data?.profile_image_blob_id)
    return data?.profile_image_blob_id || undefined

  } catch (error) {
    console.error('❌ Error fetching creator profile image blob ID:', error)
    return undefined
  }
}

interface Channel {
  id: string
  name: string
  type: 'free' | 'premium' | 'vip'
  price: number // in SUI (default price, usually for 30 days)
  description: string
  subscribers: number
  subscriptionPackages?: string[] // Available durations: ["30", "60", "90"]
  pricing?: {
    thirtyDays?: number
    sixtyDays?: number
    ninetyDays?: number
  }
  availability?: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
}

interface TipPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  creator: Creator | null
  channel: Channel | null
  onPaymentSuccess: (creatorId: string, channelId: string) => void
}

export function TipPaymentModal({
  isOpen,
  onClose,
  creator,
  channel,
  onPaymentSuccess
}: TipPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success'>('confirm')
  const [selectedDuration, setSelectedDuration] = useState<string>("") // Will be set based on available packages
  const account = useCurrentAccount()
  const { isSignedIn, user } = useSuiAuth()
  const { tier } = useSubscription()

  // Query for SUI balance
  const { data: balance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: '0x2::sui::SUI',
    },
    {
      enabled: !!account?.address,
    }
  )

  const suiBalance = balance ? parseInt(balance.totalBalance) / 1000000000 : 0 // Convert from MIST to SUI

  // Get price based on selected duration
  const getPrice = () => {
    if (!channel) return 0

    console.log('💰 Getting price for channel:', {
      channelName: channel.name,
      selectedDuration,
      channelPrice: channel.price,
      channelPricing: channel.pricing,
      subscriptionPackages: channel.subscriptionPackages
    })

    if (channel.pricing) {
      let price = channel.price
      switch (selectedDuration) {
        case "30":
          price = channel.pricing.thirtyDays || channel.price
          break
        case "60":
          price = channel.pricing.sixtyDays || channel.price
          break
        case "90":
          price = channel.pricing.ninetyDays || channel.price
          break
        default:
          price = channel.price
      }
      console.log('💰 Calculated price:', price, 'for duration:', selectedDuration)
      return price
    }

    console.log('💰 Using default channel price:', channel.price)
    return channel.price
  }

  // Get available durations
  const getAvailableDurations = () => {
    if (!channel?.subscriptionPackages || channel.subscriptionPackages.length === 0) {
      return [{ value: "30", label: "30 Days", price: channel?.price || 0 }]
    }

    return channel.subscriptionPackages.map(duration => {
      let price = channel.price

      if (channel.pricing) {
        switch (duration) {
          case "30":
            price = channel.pricing.thirtyDays || channel.price
            break
          case "60":
            price = channel.pricing.sixtyDays || channel.price
            break
          case "90":
            price = channel.pricing.ninetyDays || channel.price
            break
        }
      }

      return {
        value: duration,
        label: `${duration} Days`,
        price: price
      }
    })
  }

  const currentPrice = getPrice()
  const availableDurations = getAvailableDurations()

  // Set default selected duration when modal opens or channel changes
  useEffect(() => {
    if (channel && isOpen && !selectedDuration) {
      const durations = getAvailableDurations()
      if (durations.length > 0) {
        // Set to the first available duration
        setSelectedDuration(durations[0].value)
        console.log('🎯 Set default duration:', durations[0].value, 'Price:', durations[0].price)
      }
    }
  }, [channel, isOpen, selectedDuration])

  const handlePayment = async () => {
    if (!creator || !channel || !account || !user) return

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate SUI transaction
      await new Promise(resolve => setTimeout(resolve, 3000))

      // In a real implementation, you would:
      // 1. Create a transaction block
      // 2. Add a transfer SUI transaction
      // 3. Sign and execute the transaction
      // 4. Verify the transaction on-chain
      // 5. Grant access to the channel

      setPaymentStep('success')

      // Grant access for selected duration
      const accessExpiry = new Date()
      const durationDays = parseInt(selectedDuration)
      accessExpiry.setDate(accessExpiry.getDate() + durationDays)

      // Store access in database
      const userAddress = user?.address
      if (userAddress) {
        try {
          await grantChannelAccess(userAddress, creator.id, channel.id, 'paid', accessExpiry, currentPrice)
          console.log('✅ Channel access granted in database')
        } catch (error) {
          console.error('❌ Failed to grant channel access in database:', error)
        }
      }

      // Also add to database for profile page integration
      try {
        console.log('💾 Adding channel subscription to database from payment modal...')

        // Get the actual profile image blob ID from the creator's database record
        const avatarBlobId = await getCreatorProfileImageBlobIdDirect(creator.creatorAddress || creator.id)
        console.log('🖼️ Retrieved creator profile image blob ID for payment modal:', avatarBlobId)

        // If no blob ID found, try extracting from avatar URL as fallback
        const fallbackBlobId = avatarBlobId || extractBlobIdFromCreatorAvatar(creator.avatar)
        console.log('🔄 Final blob ID for payment modal (with fallback):', fallbackBlobId)

        await addUserChannelSubscription(user.address, {
          creatorAddress: creator.creatorAddress || creator.id,
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.type,
          channelDescription: channel.description,
          pricePaid: currentPrice,
          subscriptionTier: channel.type,
          expiryDate: accessExpiry.toISOString(),
          // Use the actual blob ID from database (with fallback)
          channelAvatarBlobId: fallbackBlobId
        })

        console.log('✅ Channel subscription added to database from payment modal')

        // Trigger a custom event to notify profile page to refresh
        window.dispatchEvent(new CustomEvent('channelAdded', {
          detail: { channelId: channel.id, userAddress: user.address }
        }))

      } catch (error) {
        console.error('❌ Failed to add channel subscription to database from payment modal:', error)
        // Don't fail the payment process, just log the error
      }

      toast.success(`Successfully purchased ${selectedDuration}-day access to ${channel.name}!`)
      onPaymentSuccess(creator.id, channel.id)

      // Redirect to Forum Creators category with creator context
      setTimeout(() => {
        const forumUrl = `/forum?tab=creators&creator=${encodeURIComponent(creator.id)}&channel=${encodeURIComponent(channel.id)}&creatorName=${encodeURIComponent(creator.name)}&channelName=${encodeURIComponent(channel.name)}`
        window.location.href = forumUrl
      }, 1500)

    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Payment failed. Please try again.')
      setPaymentStep('confirm')
    } finally {
      setIsProcessing(false)
    }
  }



  const formatSUI = (amount: number) => {
    return amount.toFixed(2)
  }

  if (!creator || !channel) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#030F1C] border-[#C0E6FF]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {paymentStep === 'success' ? 'Payment Successful!' : 'Purchase Channel Access'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {paymentStep === 'confirm' && (
            <>
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-4 bg-[#1a2f51] rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creator.avatar} alt={creator.name} />
                  <AvatarFallback className="bg-[#4DA2FF] text-white">
                    {creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-semibold">{creator.name}</h3>
                  <p className="text-[#C0E6FF] text-sm">@{creator.username}</p>
                  <Badge className="bg-[#4da2ff] text-white text-xs mt-1">
                    {creator.role}
                  </Badge>
                </div>
              </div>

              {/* Channel Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">{channel.name}</h4>
                  <Badge
                    className={
                      channel.type === 'premium'
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    }
                  >
                    {channel.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[#C0E6FF] text-sm">{channel.description}</p>
                <div className="flex items-center gap-4 text-sm text-[#C0E6FF]">
                  <span>{channel.subscribers} subscribers</span>
                </div>
              </div>

              {/* Duration Selection */}
              {availableDurations.length > 1 && (
                <div className="space-y-3">
                  <h5 className="text-white font-medium">Select Duration</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {availableDurations.map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => setSelectedDuration(duration.value)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedDuration === duration.value
                            ? "bg-[#4DA2FF]/20 border-[#4DA2FF] text-white"
                            : "bg-[#1a2f51] border-[#C0E6FF]/20 text-[#C0E6FF] hover:border-[#4DA2FF]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{duration.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            <span className="font-bold">{formatSUI(duration.price)} SUI</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="bg-[#1a2f51] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#C0E6FF]">Channel Access ({selectedDuration} days)</span>
                  <span className="text-white font-medium">{formatSUI(currentPrice)} SUI</span>
                </div>
                <div className="border-t border-[#C0E6FF]/20 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#4DA2FF]" />
                      <span className="text-white font-bold">{formatSUI(currentPrice)} SUI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Balance */}
              {isSignedIn && account && (
                <div className="flex items-center justify-between p-3 bg-[#0f2746] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#4DA2FF]" />
                    <span className="text-[#C0E6FF] text-sm">Your SUI Balance</span>
                  </div>
                  <span className="text-white font-medium">{formatSUI(suiBalance)} SUI</span>
                </div>
              )}

              {/* Payment Button */}
              <div className="space-y-3">
                {!isSignedIn || !account ? (
                  <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-orange-400 text-sm">Please connect your Sui wallet to continue</p>
                  </div>
                ) : suiBalance < currentPrice ? (
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">Insufficient SUI balance</p>
                  </div>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${formatSUI(currentPrice)} SUI`}
                  </Button>
                )}
                
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-[#C0E6FF]/30 text-[#C0E6FF]"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DA2FF] mx-auto mb-4"></div>
              <h3 className="text-white font-semibold mb-2">Processing Payment</h3>
              <p className="text-[#C0E6FF] text-sm">Please wait while we process your SUI transaction...</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Payment Successful!</h3>
              <p className="text-[#C0E6FF] text-sm mb-4">
                You now have {selectedDuration}-day access to <strong>{channel.name}</strong>
              </p>
              <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Access granted until {new Date(Date.now() + parseInt(selectedDuration) * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                Continue to Channel Content
              </Button>
            </div>
          )}


        </div>
      </DialogContent>


    </Dialog>
  )
}
