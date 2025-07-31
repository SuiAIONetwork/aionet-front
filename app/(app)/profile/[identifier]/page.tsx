"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import { PublicProfileView } from '@/components/public-profile-view'
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface PublicProfileData {
  address: string
  username: string
  location?: string | null
  profileImageUrl: string | null
  bannerImageUrl: string | null
  roleTier: 'NOMAD' | 'PRO' | 'ROYAL'
  profileLevel: number
  currentXp: number
  totalXp: number
  kycStatus: string
  joinDate: string
  lastActive: string
  achievementsData: any[]
  isVerified: boolean
  memberSince: string
  socialLinks: any[]
  channelsJoined: any[]
  xpProgress: {
    current: number
    required: number
    percentage: number
  } | null
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const identifier = params.identifier as string

  const [profileData, setProfileData] = useState<PublicProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (identifier) {
      fetchProfileData()
    }
  }, [identifier])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let profileIdentifier = identifier

      // If identifier doesn't look like an address, try to resolve username to address first
      if (!identifier.startsWith('0x')) {
        try {
          console.log('🔍 Attempting to resolve username:', identifier)
          const resolveResponse = await fetch(`/api/profile/resolve/${encodeURIComponent(identifier)}`)

          if (resolveResponse.ok) {
            const resolveResult = await resolveResponse.json()
            if (resolveResult.success && resolveResult.data?.address) {
              console.log('✅ Resolved username to address:', identifier, '→', resolveResult.data.address)
              profileIdentifier = resolveResult.data.address
            }
          } else {
            console.log('⚠️ Username resolution failed, trying direct lookup')
          }
        } catch (resolveError) {
          console.log('⚠️ Username resolution error, trying direct lookup:', resolveError)
        }
      }

      console.log('🔍 Fetching profile data for:', profileIdentifier)
      const response = await fetch(`/api/profile/${encodeURIComponent(profileIdentifier)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile')
      }

      if (result.success) {
        setProfileData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${identifier}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData?.username}'s Profile - AIONET`,
          text: `Check out ${profileData?.username}'s profile on AIONET! ${profileData?.roleTier} tier member${profileData?.profileLevel ? ` at Level ${profileData.profileLevel}` : ''}${profileData?.isVerified ? ' ✓ Verified' : ''}`,
          url: profileUrl
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        copyToClipboard(profileUrl)
      }
    } else {
      copyToClipboard(profileUrl)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Profile link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#1A2332] to-[#0A0F1C] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>

          {/* Loading State */}
          <div className="space-y-6">
            <div className="enhanced-card animate-pulse">
              <div className="enhanced-card-content p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-32 h-32 bg-gray-700 rounded-full"></div>
                  <div className="w-48 h-6 bg-gray-700 rounded"></div>
                  <div className="w-32 h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#1A2332] to-[#0A0F1C] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>

          {/* Error State */}
          <div className="enhanced-card">
            <div className="enhanced-card-content p-8 text-center">
              <div className="text-red-400 mb-4">
                <ExternalLink className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
                <p className="text-gray-400">{error}</p>
              </div>
              <button
                onClick={handleGoBack}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return null
  }

  return (
    <>
      {/* Meta tags for social sharing */}
      <Head>
        <title>{profileData?.username ? `${profileData.username}'s Profile - AIONET` : 'User Profile - AIONET'}</title>
        <meta
          name="description"
          content={profileData ?
            `${profileData.username} - ${profileData.roleTier} tier member on AIONET${profileData.profileLevel ? ` at Level ${profileData.profileLevel}` : ''}${profileData.isVerified ? ' ✓ Verified' : ''}` :
            'View user profile on AIONET'
          }
        />

        {/* Open Graph tags */}
        <meta property="og:title" content={profileData?.username ? `${profileData.username}'s Profile - AIONET` : 'User Profile - AIONET'} />
        <meta
          property="og:description"
          content={profileData ?
            `${profileData.username} - ${profileData.roleTier} tier member on AIONET${profileData.profileLevel ? ` at Level ${profileData.profileLevel}` : ''}${profileData.isVerified ? ' ✓ Verified' : ''}` :
            'View user profile on AIONET'
          }
        />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${identifier}`} />
        {profileData?.profileImageUrl && (
          <meta property="og:image" content={profileData.profileImageUrl} />
        )}
        <meta property="og:site_name" content="AIONET" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={profileData?.username ? `${profileData.username}'s Profile - AIONET` : 'User Profile - AIONET'} />
        <meta
          name="twitter:description"
          content={profileData ?
            `${profileData.username} - ${profileData.roleTier} tier member on AIONET${profileData.profileLevel ? ` at Level ${profileData.profileLevel}` : ''}${profileData.isVerified ? ' ✓ Verified' : ''}` :
            'View user profile on AIONET'
          }
        />
        {profileData?.profileImageUrl && (
          <meta name="twitter:image" content={profileData.profileImageUrl} />
        )}
      </Head>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {profileData.username}'s Profile
            </h1>
            <p className="text-gray-400 mt-1">
              Public profile • Member since {profileData.memberSince}
            </p>
          </div>
        </div>

        {/* Public Profile Component */}
        <PublicProfileView profileData={profileData} />
      </div>
    </>
  )
}
