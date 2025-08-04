"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { reactivateAccount } from "@/actions/profile"

export default function ReactivateAccountPage() {
  const router = useRouter()
  const { user, isLoaded } = useSuiAuth()
  const [isReactivating, setIsReactivating] = useState(false)
  const [isReactivated, setIsReactivated] = useState(false)

  // Check if user is already active
  useEffect(() => {
    if (isLoaded && user) {
      // If user is already active, redirect to dashboard
      router.push('/aio-dashboard')
    }
  }, [isLoaded, user, router])

  const handleReactivateAccount = async () => {
    if (!user) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsReactivating(true)

    try {
      await reactivateAccount()
      
      toast.success("Account reactivated successfully! Welcome back!")
      setIsReactivated(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/aio-dashboard')
      }, 2000)
      
    } catch (error) {
      console.error("Failed to reactivate account:", error)
      toast.error("Failed to reactivate account. Please try again.")
    } finally {
      setIsReactivating(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4DA2FF]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030f1c] via-[#0a1628] to-[#1a2f51] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card className="bg-[#0c1b36] border-[#1a2f51] shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center">
              {isReactivated ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <RefreshCw className="w-8 h-8 text-[#4DA2FF]" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {isReactivated ? "Account Reactivated!" : "Reactivate Your Account"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isReactivated ? (
              <div className="text-center space-y-4">
                <p className="text-[#C0E6FF]">
                  Welcome back! Your account has been successfully reactivated.
                </p>
                <p className="text-sm text-gray-400">
                  Redirecting you to the dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 text-center">
                  <p className="text-[#C0E6FF]">
                    Your account is currently deactivated. Click the button below to reactivate it and restore full access to all features.
                  </p>
                  
                  <div className="bg-[#1a2f51]/50 rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-semibold text-sm">What happens when you reactivate:</h4>
                    <ul className="text-sm text-[#C0E6FF] space-y-1 text-left">
                      <li>• Your profile becomes visible to other users</li>
                      <li>• All your data and settings are restored</li>
                      <li>• You regain access to all platform features</li>
                      <li>• Your achievements and progress are preserved</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleReactivateAccount}
                  disabled={isReactivating}
                  className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white font-semibold py-3"
                >
                  {isReactivating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Reactivating Account...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reactivate My Account
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Need help? <a href="/contact-support" className="text-[#4DA2FF] hover:underline">Contact Support</a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
