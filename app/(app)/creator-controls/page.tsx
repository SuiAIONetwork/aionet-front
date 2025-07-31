"use client"

import React from "react"
import { CreatorControlsInterface } from "@/components/creator-controls-interface"
import { useSubscription } from "@/contexts/subscription-context"
import { useProfile } from "@/contexts/profile-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Crown, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreatorControlsPage() {
  const { tier } = useSubscription()
  const { updateTier } = useProfile()
  const router = useRouter()

  // TEMPORARY: Auto-upgrade to PRO for testing Creator Controls
  // Remove this in production
  React.useEffect(() => {
    if (tier === "NOMAD") {
      console.log("🔧 TEMP: Auto-upgrading to PRO for Creator Controls testing")
      updateTier("PRO")
    }
  }, [tier, updateTier])

  // Check if user has access (PRO or ROYAL only)
  const hasAccess = tier === "PRO" || tier === "ROYAL"

  if (!hasAccess) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Creator Controls</h1>
            <p className="text-gray-400 mt-1">Create and manage your channels for the AIO Creators platform</p>
          </div>
        </div>

        {/* Access Restricted Message */}
        <Card className="enhanced-card">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Lock className="w-16 h-16 text-red-500 animate-pulse" />
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Creator Access Required</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Creator Controls is exclusively available to <span className="text-[#4DA2FF] font-semibold">PRO</span> and <span className="text-yellow-500 font-semibold">ROYAL</span> tier members.
                </p>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Upgrade your membership to start creating and managing your own channels on the AIO Creators platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/subscriptions')}
                  className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white px-6 py-3"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Upgrade to PRO
                </Button>
                <Button
                  onClick={() => router.push('/aio-creators')}
                  variant="outline"
                  className="border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#4DA2FF]/20 px-6 py-3"
                >
                  Browse Creators
                </Button>
              </div>

              <div className="mt-8 p-4 bg-[#1a2f51] rounded-lg">
                <h3 className="text-white font-semibold mb-2">Creator Benefits</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Create unlimited channels</li>
                  <li>• Set custom pricing for premium content</li>
                  <li>• Direct Telegram integration</li>
                  <li>• Real-time analytics and subscriber management</li>
                  <li>• Priority support and featured placement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Creator Controls</h1>
          <p className="text-gray-400 mt-1">Create and manage your channels for the AIO Creators platform</p>
        </div>
      </div>

      <CreatorControlsInterface />
    </div>
  )
}
