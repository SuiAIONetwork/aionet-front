"use client"

import { useState } from "react"
import { AffiliateControls } from "@/components/affiliate-controls"
import { ContactSponsorButton } from "@/components/contact-sponsor-button"
import { SubscriptionGuard } from "@/components/subscription-guard"
import { AffiliateSubscriptionPayment } from "@/components/affiliate-subscription-payment"
import { AffiliateSubscriptionManagement } from "@/components/affiliate-subscription-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useRouter } from "next/navigation"
import { Zap, BarChart3, CreditCard, Info, DollarSign, Users, Crown, Gift } from "lucide-react"

export default function AffiliateControlsPage() {
  const account = useCurrentAccount()
  const { user } = useSuiAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address

  return (
    <SubscriptionGuard feature="affiliate controls dashboard">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Affiliate Controls</h1>
            <p className="text-gray-400 mt-1">Manage your affiliates, view metrics, and track your affiliate performance</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Information Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 hover:text-white transition-colors"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Information
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1628] border-[#4DA2FF]/30 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Affiliate Program Benefits
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* NFT Commission */}
                  <div className="flex items-start gap-3 p-3 bg-[#1a2f51]/30 rounded-lg border border-[#4DA2FF]/20">
                    <div className="bg-[#4DA2FF]/20 p-2 rounded-full">
                      <DollarSign className="w-4 h-4 text-[#4DA2FF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">NFT Mint Commission</p>
                      <p className="text-[#C0E6FF] text-xs mt-1">
                        Earn up to 50% commission from every new NFT mint minted within your network.
                      </p>
                    </div>
                  </div>

                  {/* Trading Circle Commission */}
                  <div className="flex items-start gap-3 p-3 bg-[#1a2f51]/30 rounded-lg border border-[#4DA2FF]/20">
                    <div className="bg-[#4DA2FF]/20 p-2 rounded-full">
                      <Users className="w-4 h-4 text-[#4DA2FF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Trading Circle Commission</p>
                      <p className="text-[#C0E6FF] text-xs mt-1">
                        Receive 20% commission from all activity in each Nomad Trading Circle you're connected to.
                      </p>
                    </div>
                  </div>

                  {/* Subscription Commission */}
                  <div className="flex items-start gap-3 p-3 bg-[#1a2f51]/30 rounded-lg border border-[#4DA2FF]/20">
                    <div className="bg-[#4DA2FF]/20 p-2 rounded-full">
                      <BarChart3 className="w-4 h-4 text-[#4DA2FF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Subscription Commission</p>
                      <p className="text-[#C0E6FF] text-xs mt-1">
                        Get 15% commission for every affiliate subscription generated through your network.
                      </p>
                    </div>
                  </div>

                  {/* Royalty Rewards */}
                  <div className="flex items-start gap-3 p-3 bg-[#1a2f51]/30 rounded-lg border border-[#4DA2FF]/20">
                    <div className="bg-[#4DA2FF]/20 p-2 rounded-full">
                      <Gift className="w-4 h-4 text-[#4DA2FF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Exclusive Royalty Rewards</p>
                      <p className="text-[#C0E6FF] text-xs mt-1">
                        Achieve Profile Level 10 and unlock exclusive royalty rewards every 6 months.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <ContactSponsorButton />
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a2f51]/30 border border-[#C0E6FF]/20">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white text-[#C0E6FF] flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Affiliate Overview
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white text-[#C0E6FF] flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Subscription Management
            </TabsTrigger>
          </TabsList>

          {/* Affiliate Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <AffiliateControls />
          </TabsContent>

          {/* Subscription Management Tab */}
          <TabsContent value="subscription" className="space-y-6 mt-6">
            {/* Subscription Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Renew Subscription Button */}
              {userAddress ? (
                <AffiliateSubscriptionPayment
                  userAddress={userAddress}
                  onPaymentSuccess={() => window.location.reload()}
                  trigger={
                    <Button className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Renew Subscription
                      <span className="text-xs opacity-80">($30/month)</span>
                    </Button>
                  }
                />
              ) : (
                <Button
                  disabled
                  className="bg-gray-600 text-gray-300 flex items-center gap-2 cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  Renew Subscription
                  <span className="text-xs opacity-80">(Connect wallet)</span>
                </Button>
              )}
            </div>

            {/* Subscription Management Component */}
            {userAddress && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Subscription Management</h2>
                  <p className="text-gray-400 mt-1">View your payment history and manage your affiliate subscription</p>
                </div>
                <AffiliateSubscriptionManagement userAddress={userAddress} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SubscriptionGuard>
  )
}
