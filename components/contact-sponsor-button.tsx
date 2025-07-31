"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ContactSponsorModal } from "@/components/contact-sponsor-modal"
import { api } from "@/lib/api-client"
// Remove unused import
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { MessageCircle, HelpCircle } from "lucide-react"

export function ContactSponsorButton() {
  const account = useCurrentAccount()
  const { user, isSignedIn } = useSuiAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sponsorInfo, setSponsorInfo] = useState<{
    username: string
    email: string
    address: string
    status: 'NOMAD' | 'PRO' | 'ROYAL'
    profileLevel: number
    affiliateLevel: number
    kycStatus: 'verified' | 'pending' | 'not_verified'
    joinDate: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  // Get the current user address from either traditional wallet or zkLogin
  const userAddress = user?.address || account?.address

  const handleOpenModal = async () => {
    if (!userAddress) {
      return
    }

    setIsModalOpen(true)
    setLoading(true)
    setSponsorInfo(null)

    try {
      console.log('🔍 Fetching sponsor info for:', userAddress)

      // Get sponsor information from backend API
      const sponsorData = await api.affiliate.getSponsor()
      console.log('🔍 Sponsor data:', sponsorData)

      // Type assertion for the sponsor data
      const typedSponsorData = sponsorData as {
        username: string
        email: string
        address: string
        status: 'NOMAD' | 'PRO' | 'ROYAL'
        profileLevel: number
        affiliateLevel: number
        kycStatus: 'verified' | 'pending' | 'not_verified'
        joinDate: string
      } | null

      setSponsorInfo(typedSponsorData)
      console.log('🔍 Sponsor info set to:', typedSponsorData)
    } catch (error) {
      console.error('Failed to fetch sponsor info:', error)
      setSponsorInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSponsorInfo(null)
  }

  const handleRefresh = async () => {
    // Refresh sponsor information without closing the modal
    setLoading(true)
    setSponsorInfo(null)

    try {
      console.log('🔄 Refreshing sponsor info for:', userAddress)

      // Get sponsor information from backend API
      const sponsorData = await api.affiliate.getSponsor()
      console.log('🔍 Refreshed sponsor data:', sponsorData)

      // Type assertion for the sponsor data
      const typedSponsorData = sponsorData as {
        username: string
        email: string
        address: string
        status: 'NOMAD' | 'PRO' | 'ROYAL'
        profileLevel: number
        affiliateLevel: number
        kycStatus: 'verified' | 'pending' | 'not_verified'
        joinDate: string
      } | null

      setSponsorInfo(typedSponsorData)
      console.log('🔍 Refreshed sponsor info set to:', typedSponsorData)
    } catch (error) {
      console.error('Failed to refresh sponsor info:', error)
      setSponsorInfo(null)
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if user not authenticated
  if (!isSignedIn || !userAddress) {
    return null
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 hover:text-white transition-colors"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        Need Help?
      </Button>

      <ContactSponsorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sponsor={sponsorInfo}
        loading={loading}
        userAddress={userAddress}
        onRefresh={handleRefresh}
      />
    </>
  )
}
