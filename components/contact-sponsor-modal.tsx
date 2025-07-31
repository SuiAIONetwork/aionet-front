"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Mail, MessageCircle, X, Wrench } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface SponsorInfo {
  username: string
  email: string
  address: string
  status: 'NOMAD' | 'PRO' | 'ROYAL'
  profileLevel: number
  affiliateLevel: number
  kycStatus: 'verified' | 'pending' | 'not_verified'
  joinDate: string
  profileImage?: string
  profileImageBlobId?: string
}

interface ContactSponsorModalProps {
  isOpen: boolean
  onClose: () => void
  sponsor: SponsorInfo | null
  loading: boolean
  userAddress?: string
  onRefresh?: () => void
}

export function ContactSponsorModal({ isOpen, onClose, sponsor, loading, userAddress, onRefresh }: ContactSponsorModalProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  // Clear fix result when sponsor data changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFixResult(null)
    }
  }, [isOpen, sponsor])

  const handleEmailContact = () => {
    if (sponsor?.email) {
      window.open(`mailto:${sponsor.email}?subject=Need Help - AIONET Platform`, '_blank')
    }
  }

  const handleMessageContact = () => {
    // Placeholder for messaging functionality
    console.log('Message sponsor:', sponsor?.username)
  }

  const handleFixRelationship = async () => {
    try {
      setIsFixing(true)
      setFixResult(null)

      if (!userAddress) {
        toast.error('User address not found')
        return
      }

      console.log('🔧 Fixing affiliate relationship for:', userAddress)

      // Call the backend API to fix the relationship
      const result = await api.affiliate.fixRelationship()
      console.log('🔧 Fix result:', result)

      // Type assertion for the API response
      const typedResult = result as { success?: boolean; message?: string } | null

      // The API client returns result.data directly, so result is the actual response data
      if (typedResult && typedResult.success === true) {
        const message = typedResult.message || 'Affiliate relationship fixed successfully'
        setFixResult({ success: true, message })
        toast.success('✅ Affiliate relationship fixed! Refreshing sponsor information...')

        // Refresh sponsor information after successful fix
        if (onRefresh) {
          setTimeout(() => {
            onRefresh()
          }, 2000) // Give more time for the backend to process
        }
      } else {
        // Handle error response
        const errorMessage = typedResult?.message || 'Failed to fix relationship'
        setFixResult({ success: false, message: errorMessage })
        toast.error(`❌ ${errorMessage}`)
      }
    } catch (error) {
      console.error('Failed to fix relationship:', error)

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message
      }

      setFixResult({ success: false, message: errorMessage })
      toast.error(`Failed to fix relationship: ${errorMessage}`)
    } finally {
      setIsFixing(false)
    }
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0a1628] border border-[#C0E6FF]/20 text-white">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold text-[#C0E6FF] mb-2">
            Need help?
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Contact your account manager
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4DA2FF]"></div>
          </div>
        ) : sponsor ? (
          <div className="space-y-6">
            {/* Sponsor Profile - Main Section */}
            <div className="p-6 bg-[#030f1c] rounded-lg border border-[#C0E6FF]/10">
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="w-16 h-16 bg-blue-100">
                    {sponsor.profileImage && (
                      <AvatarImage
                        src={sponsor.profileImage}
                        alt={`${sponsor.username}'s profile`}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-[#4DA2FF] to-[#3D8BFF] text-white text-xl font-bold shadow-lg">
                      {sponsor.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Sponsor Info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {sponsor.username}
                    </h3>
                  </div>

                  {/* Status and Levels */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-[#4DA2FF]/20 text-[#4DA2FF] border-[#4DA2FF]/30 text-sm">
                      {sponsor.status}
                    </Badge>
                    <span className="text-sm text-gray-400">Profile Lv. {sponsor.profileLevel}</span>
                    <span className="text-sm text-gray-400">Affiliate Lv. {sponsor.affiliateLevel}</span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">
                      {sponsor.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleEmailContact}
                    className="bg-green-600 hover:bg-green-700 text-white h-12"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          disabled
                          className="bg-gray-600 text-gray-400 cursor-not-allowed h-12 w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Member Since */}
              <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-[#C0E6FF]/10">
                Member since {new Date(sponsor.joinDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Sponsor Found
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              You don't have a sponsor or account manager assigned yet.
            </p>

            {/* Fix Result Display */}
            {fixResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                fixResult.success
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {fixResult.message}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleFixRelationship}
                  disabled={isFixing}
                  className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                >
                  {isFixing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Fixing...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4 mr-2" />
                      Fix
                    </>
                  )}
                </Button>

                <Button
                  onClick={onRefresh}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>

              <Button
                onClick={onClose}
                variant="outline"
                className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
