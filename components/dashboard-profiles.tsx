"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"




import { useProfile } from "@/contexts/profile-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { LOCATIONS } from "@/lib/locations"
import ReactCountryFlag from 'react-country-flag'
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import {
  User,
  Wallet,
  MapPin,
  Users,
  MessageSquare,
  Edit3,
  Save,
  X,
  CheckCircle,
  Download
} from "lucide-react"

interface ProfileData {
  firstName: string
  lastName: string
  username: string
  email: string
  location: string
  walletAddress: string

  referralCode: string
}



export function DashboardProfiles() {
  const { user } = useSuiAuth()
  const { profile, isLoading, updateProfile } = useProfile()

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    location: "unspecified",
    walletAddress: "",

    referralCode: ""
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingReferralCode, setHasExistingReferralCode] = useState(false)
  const [isSocialAuthUser, setIsSocialAuthUser] = useState(false)
  const [socialAuthEmail, setSocialAuthEmail] = useState("")
  const [emailSetOnce, setEmailSetOnce] = useState(false)
  const [appliedReferralCode, setAppliedReferralCode] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  // Check if user is zkLogin/Enoki and extract email
  useEffect(() => {
    if (user?.connectionType === 'zklogin') {
      setIsSocialAuthUser(true)

      // Try to extract email from different sources
      let extractedEmail = ""

      // Method 1: Legacy zkLogin JWT from localStorage
      const jwt = localStorage.getItem('zklogin_jwt')
      if (jwt) {
        try {
          const payload = jwt.split('.')[1]
          const decodedPayload = JSON.parse(atob(payload))
          if (decodedPayload.email) {
            extractedEmail = decodedPayload.email
          }
        } catch (error) {
          console.error('Failed to decode legacy zkLogin JWT for email:', error)
        }
      }

      // Method 2: Check for Enoki session data
      if (!extractedEmail) {
        try {
          const enokiSession = localStorage.getItem('enoki_session') || sessionStorage.getItem('enoki_session')
          if (enokiSession) {
            const sessionData = JSON.parse(enokiSession)
            if (sessionData.email) {
              extractedEmail = sessionData.email
            }
          }
        } catch (error) {
          console.error('Failed to extract email from Enoki session:', error)
        }
      }

      // Method 3: Check for any JWT-like tokens that might contain email
      if (!extractedEmail) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('jwt') || key.includes('token') || key.includes('auth'))) {
              const value = localStorage.getItem(key)
              if (value && value.includes('.')) {
                try {
                  const parts = value.split('.')
                  if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]))
                    if (payload.email) {
                      extractedEmail = payload.email
                      break
                    }
                  }
                } catch (e) {
                  // Skip invalid tokens
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to search for email in tokens:', error)
        }
      }

      if (extractedEmail) {
        setSocialAuthEmail(extractedEmail)
      }
    } else {
      setIsSocialAuthUser(false)
      setSocialAuthEmail("")
    }
  }, [user?.connectionType])

  // Load profile data from persistent profile
  useEffect(() => {
    if (profile) {
      const fullName = profile.real_name || ""
      const [firstName = "", lastName = ""] = fullName.split(" ")

      // Check if email was set once for traditional wallet users
      const hasEmailSet = !isSocialAuthUser && !!profile.email && profile.email.trim() !== ""
      setEmailSetOnce(hasEmailSet)

      setProfileData({
        firstName,
        lastName: lastName || "",
        username: profile.username || "",
        email: isSocialAuthUser ? socialAuthEmail : (profile.email || ""),
        location: profile.location || "unspecified",
        walletAddress: user?.address || "",

        referralCode: ""
      })
    } else if (user?.address) {
      // Set wallet address if user is connected but no profile exists
      setProfileData(prev => ({
        ...prev,
        walletAddress: user.address,
        email: isSocialAuthUser ? socialAuthEmail : prev.email
      }))
    }
  }, [profile, user?.address, isSocialAuthUser, socialAuthEmail])

  // Check if username needs to be synced with referral code
  useEffect(() => {
    const syncUsernameWithReferralCode = async () => {
      if (!user?.address || !profile) return

      try {
        // Get user's default referral code
        // TODO: Migrate to backend API
        const defaultCode = null

        if (defaultCode && profile.username && profile.username.startsWith('User ')) {
          // If profile has a fallback username but user has a proper referral code,
          // update the username to match the referral code
          console.log('🔄 Syncing username with referral code:', defaultCode)

          const success = await updateProfile({ username: defaultCode })
          if (success) {
            console.log('✅ Username synced with referral code')
            // Update local state to reflect the change
            setProfileData(prev => ({
              ...prev,
              username: defaultCode
            }))
          }
        }
      } catch (error) {
        console.error('Failed to sync username with referral code:', error)
      }
    }

    syncUsernameWithReferralCode()
  }, [profile, user?.address, updateProfile])

  // Check for existing referral relationship from profile data
  useEffect(() => {
    if (!profile) return

    try {
      // Check if user has referral data in their profile
      const referralData = profile.referral_data
      const hasReferralCode = !!(referralData?.referred_by || referralData?.referral_code)

      setHasExistingReferralCode(hasReferralCode)

      if (hasReferralCode) {
        // Set the applied referral code from profile data
        const appliedCode = referralData?.referred_by || referralData?.referral_code || "UNKNOWN"
        setAppliedReferralCode(appliedCode)
        console.log('✅ Found existing referral code in profile:', appliedCode)
      } else {
        setAppliedReferralCode("")
        console.log('ℹ️ No referral code found in profile data')
      }
    } catch (error) {
      console.error('Error checking referral data from profile:', error)
    }
  }, [profile])



  const handleSave = async () => {
    if (!user?.address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsSaving(true)

    try {
      console.log('💾 Saving profile data to database and Walrus...')

      // Handle referral code if provided and user doesn't have existing referral
      if (profileData.referralCode.trim() && !hasExistingReferralCode) {
        console.log('🔗 Processing referral code:', profileData.referralCode)

        // TODO: Migrate referral code processing to backend API
        // For now, we'll skip referral code processing
        const referralSuccess = true // Placeholder

        if (!referralSuccess) {
          toast.error('❌ Invalid or expired referral code')
          setIsSaving(false)
          return
        }

        // Mark that user now has a referral code
        setHasExistingReferralCode(true)
        toast.success('✅ Referral code applied successfully!')
      }

      // Prepare profile data for database - PRESERVE ALL EXISTING DATA
      const profileUpdateData: any = {
        // Preserve ALL existing profile data first
        ...profile,
        // Only update the specific fields that user can edit in this form
        username: profileData.username,
        real_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        location: profileData.location === 'unspecified' ? '' : profileData.location,
        display_preferences: {
          ...profile?.display_preferences
        },
        // Explicitly preserve critical profile data to prevent reset
        role_tier: profile?.role_tier || 'NOMAD',
        profile_level: profile?.profile_level || 1,
        current_xp: profile?.current_xp || 0,
        total_xp: profile?.total_xp || 0,
        points: profile?.points || 0,

        onboarding_completed: profile?.onboarding_completed ?? false,
        onboarding_completed_at: profile?.onboarding_completed_at,
        // Preserve important data structures
        achievements_data: profile?.achievements_data,
        referral_data: profile?.referral_data,
        social_links: profile?.social_links,
        walrus_metadata: profile?.walrus_metadata,
        // Preserve image blob IDs
        profile_image_blob_id: profile?.profile_image_blob_id,
        banner_image_blob_id: profile?.banner_image_blob_id,
        // Preserve timestamps
        created_at: profile?.created_at,
        join_date: profile?.join_date,
        updated_at: new Date().toISOString()
      }

      // Handle email based on authentication method and immutability rules
      if (isSocialAuthUser) {
        // Social auth users: email is always from social login, cannot be changed
        profileUpdateData.email = socialAuthEmail
      } else {
        // Traditional wallet users: email can only be set once
        if (!emailSetOnce && profileData.email.trim()) {
          // First time setting email
          profileUpdateData.email = profileData.email.trim()
          setEmailSetOnce(true)
        } else if (emailSetOnce) {
          // Email already set, keep existing value
          profileUpdateData.email = profile?.email
        } else {
          // No email provided, keep existing or empty
          profileUpdateData.email = profile?.email || ""
        }
      }

      console.log('📋 Profile update data:', profileUpdateData)

      // Update profile in database and Walrus
      const success = await updateProfile(profileUpdateData)

      if (success) {


        toast.success('✅ Profile saved successfully to database and Walrus!')
        setIsEditing(false)
      } else {
        toast.error('❌ Failed to save profile')
      }
    } catch (error) {
      console.error('💥 Error saving profile:', error)
      toast.error(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsSaving(false)
  }

  // Avatar is now handled by the EnhancedAvatar component

  const handleExportData = async () => {
    if (!user?.address || !profile) {
      toast.error("No user data available to export")
      return
    }

    setIsExporting(true)

    try {
      // Prepare data for CSV export
      const exportData = {
        // Basic Profile Information
        'User ID': profile.id,
        'Wallet Address': user.address,
        'Username': profile.username || 'Not set',
        'Email': profile.email || 'Not set',
        'Real Name': profile.real_name || 'Not set',
        'Location': profile.location || 'Not set',

        // Account Status
        'Role Tier': profile.role_tier,
        'Profile Level': profile.profile_level,
        'Current XP': profile.current_xp,
        'Total XP': profile.total_xp,
        'Points': profile.points,
        'KYC Status': profile.kyc_status || 'Not verified',

        // Dates
        'Join Date': profile.join_date ? new Date(profile.join_date).toLocaleDateString() : 'Unknown',
        'Last Active': profile.last_active ? new Date(profile.last_active).toLocaleDateString() : 'Unknown',
        'Onboarding Completed': profile.onboarding_completed ? 'Yes' : 'No',
        'Onboarding Date': profile.onboarding_completed_at ? new Date(profile.onboarding_completed_at).toLocaleDateString() : 'Not completed',

        // Referral Information
        'Referral Code': profile.referral_data?.referral_code || 'Not set',
        'Referred By': profile.referral_data?.referred_by || 'None',
        'Referral Date': profile.referral_data?.referral_date ? new Date(profile.referral_data.referral_date).toLocaleDateString() : 'N/A',
        'Total Referrals': profile.referral_data?.referral_count || 0,
        'Direct Referrals': profile.referral_data?.direct_referrals || 0,
        'Network Commissions': profile.referral_data?.network_commissions || 0,
        'Total Network Users': profile.referral_data?.total_network_users || 0,

        // Achievements
        'Total Achievements': profile.achievements_data?.length || 0,
        'Unlocked Achievements': profile.achievements_data?.filter((a: any) => a.unlocked).length || 0,
        'Claimed Achievements': profile.achievements_data?.filter((a: any) => a.claimed).length || 0,

        // Social Links
        'Social Links Count': profile.social_links?.length || 0,
        'Verified Social Links': profile.social_links?.filter((s: any) => s.verified).length || 0,

        // Technical Information
        'Profile Image Blob ID': profile.profile_image_blob_id || 'None',
        'Banner Image Blob ID': profile.banner_image_blob_id || 'None',
        'Walrus Metadata': profile.walrus_metadata ? 'Available' : 'None',
        'Export Date': new Date().toISOString()
      }

      // Convert to CSV format
      const headers = Object.keys(exportData)
      const values = Object.values(exportData)

      const csvContent = [
        headers.join(','),
        values.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `aionet-profile-data-${user.address.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast.success("Profile data exported successfully!")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export profile data")
    } finally {
      setIsExporting(false)
    }
  }





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
          <p className="text-[#C0E6FF] text-sm">Manage your AIONET account</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                className="bg-[#ef444445] text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="bg-[#22c55e45] text-white"
              >
                {isSaving ? "Saving to Database & Walrus..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleExportData}
                disabled={isExporting || isLoading}
                className="bg-[#10b981] hover:bg-[#059669] text-white transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white transition-colors duration-200"
              >
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {/* Personal Information */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <User className="w-5 h-5 text-[#4DA2FF]" />
              <h3 className="font-semibold">Personal Information</h3>
            </div>
            <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#C0E6FF]">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditing}
                  className="bg-[#030F1C] border-[#C0E6FF]/30 text-white"
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#C0E6FF]">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditing}
                  className="bg-[#030F1C] border-[#C0E6FF]/30 text-white"
                  placeholder="Enter your last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#C0E6FF]">
                  Username {profileData.username && "(Cannot be changed)"}
                </Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!isEditing || !!profileData.username}
                  className="bg-[#030F1C] border-[#C0E6FF]/30 text-white"
                  placeholder={profileData.username ? "Username is set and cannot be changed" : "Enter your username"}
                />
                {profileData.username && (
                  <p className="text-[#C0E6FF]/70 text-sm">
                    🔒 Username cannot be changed once set to maintain referral code consistency
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#C0E6FF]">
                  Email {isSocialAuthUser ? "(From Social Login - Cannot be changed)" : emailSetOnce ? "(Set once - Cannot be changed)" : "(Can be set once)"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing || isSocialAuthUser || emailSetOnce}
                  className="bg-[#030F1C] border-[#C0E6FF]/30 text-white"
                  placeholder={
                    isSocialAuthUser
                      ? "Email from social login account"
                      : emailSetOnce
                        ? "Email is set and cannot be changed"
                        : "Enter your email address (can only be set once)"
                  }
                />
                {isSocialAuthUser && (
                  <p className="text-[#C0E6FF]/70 text-sm">
                    🔒 Email is automatically bound from your social login account and cannot be changed
                  </p>
                )}
                {!isSocialAuthUser && emailSetOnce && (
                  <p className="text-[#C0E6FF]/70 text-sm">
                    🔒 Email can only be set once and cannot be changed for security
                  </p>
                )}
                {!isSocialAuthUser && !emailSetOnce && (
                  <p className="text-[#C0E6FF]/70 text-sm">
                    ⚠️ Email can only be set once. Choose carefully as it cannot be changed later
                  </p>
                )}
              </div>

              {/* Referral Code Section */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-[#C0E6FF]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Referral Code {hasExistingReferralCode ? "(Applied)" : "(Optional)"}
                  </div>
                </Label>



                {/* Show applied referral code when not editing */}
                {!isEditing && hasExistingReferralCode ? (
                  <div className="bg-[#1a2f51]/30 rounded-lg p-3 border border-[#C0E6FF]/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-semibold">
                          {appliedReferralCode === "UNKNOWN"
                            ? "Applied (Code not found)"
                            : appliedReferralCode || profileData.referralCode || "Loading..."}
                        </span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Applied
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[#C0E6FF]/70 text-sm mt-2">
                      This referral code was used during your signup and cannot be changed
                    </p>
                  </div>
                ) : (
                  <>
                    <Input
                      id="referralCode"
                      value={profileData.referralCode}
                      onChange={(e) => setProfileData(prev => ({ ...prev, referralCode: e.target.value }))}
                      disabled={!isEditing || hasExistingReferralCode}
                      className="bg-[#030F1C] border-[#C0E6FF]/30 text-white"
                      placeholder={hasExistingReferralCode ? "Referral code already applied" : "Enter referral code (optional)"}
                    />
                    {hasExistingReferralCode && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>You have successfully applied a referral code</span>
                      </div>
                    )}
                    {!hasExistingReferralCode && profileData.referralCode.trim() && (
                      <p className="text-[#C0E6FF]/70 text-sm">
                        💡 Referral codes can only be applied once and cannot be changed later
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#C0E6FF]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Country
                  </div>
                </Label>
                <Select
                  value={profileData.location}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, location: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="bg-[#030F1C] border-[#C0E6FF]/30 text-white">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#1a2f51] max-h-60 overflow-y-auto">
                    <SelectItem value="unspecified" className="text-white hover:bg-[#2a3f61]">
                      🌍 Prefer not to say
                    </SelectItem>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location.code} value={location.name} className="text-white hover:bg-[#2a3f61]">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={location.code}
                            svg
                            style={{
                              width: '1.2em',
                              height: '1.2em',
                            }}
                            title={location.name}
                          />
                          {location.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Wallet Address Section */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="walletAddress" className="text-[#C0E6FF]">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Wallet Address (Cannot be changed)
                </div>
              </Label>
              <Input
                id="walletAddress"
                value={profileData.walletAddress}
                onChange={(e) => setProfileData(prev => ({ ...prev, walletAddress: e.target.value }))}
                disabled={true}
                className="bg-[#030F1C] border-[#C0E6FF]/30 text-white font-mono text-sm"
                placeholder="Sui wallet address"
              />
              <p className="text-[#C0E6FF]/70 text-sm">
                🔒 Wallet address is bound to your account and cannot be changed for security
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


