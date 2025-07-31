"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Mail,
  CheckCircle,
  ArrowRight,
  Wallet,
  Star,
  Gift,
  Trophy,
  Users,
  ChevronDown,
  ChevronUp,
  MapPin
} from 'lucide-react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useProfile } from '@/contexts/profile-context'
import { useReferralTracking } from '@/hooks/use-referral-tracking'
import { useReferralCodes } from '@/hooks/use-referral-codes'
import { LOCATIONS } from '@/lib/locations'
import ReactCountryFlag from 'react-country-flag'
import { toast } from 'sonner'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  completed: boolean
  required: boolean
}

export function NewUserOnboarding() {
  const { user, isNewUser, completeOnboarding, completeProfileSetup, refreshUserState } = useSuiAuth()
  const { referralCode: trackedReferralCode, processReferralOnSignup } = useReferralTracking()
  const { createDefaultCode } = useReferralCodes()

  // Use profile context instead of direct database calls to prevent infinite loops
  const { profile, isLoading: isLoadingProfile, updateProfile } = useProfile()

  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    referralCode: '',
    selectedAvatar: '', // Add avatar selection to form data
    country: '' // Add country selection
  })

  // Check if user is zkLogin/Enoki and extract email
  const [isSocialAuthUser, setIsSocialAuthUser] = useState(false)
  const [socialAuthEmail, setSocialAuthEmail] = useState("")

  useEffect(() => {
    const extractEmailFromZkLogin = async () => {
      if (user?.connectionType === 'zklogin') {
        setIsSocialAuthUser(true)

        let extractedEmail = ""

        try {
          // Method 1: Get JWT from zkLogin context (most reliable)
          const { useZkLogin } = await import('@/components/zklogin-provider')
          // We can't use the hook here, so let's check localStorage for the JWT

          // Method 2: Check zkLogin session from cookies/localStorage
          const { getZkLoginSession } = await import('@/lib/auth-cookies')
          const zkLoginSession = getZkLoginSession()

          if (zkLoginSession?.jwt) {
            try {
              const payload = zkLoginSession.jwt.split('.')[1]
              const decodedPayload = JSON.parse(atob(payload))
              console.log('🔍 Extracted JWT payload:', decodedPayload)

              if (decodedPayload.email) {
                extractedEmail = decodedPayload.email
                console.log('✅ Found email in zkLogin JWT:', extractedEmail)
              }
            } catch (error) {
              console.error('Failed to decode zkLogin JWT:', error)
            }
          }

          // Method 3: Fallback to localStorage JWT
          if (!extractedEmail) {
            const jwt = localStorage.getItem('zklogin_jwt')
            if (jwt) {
              try {
                const payload = jwt.split('.')[1]
                const decodedPayload = JSON.parse(atob(payload))
                if (decodedPayload.email) {
                  extractedEmail = decodedPayload.email
                  console.log('✅ Found email in localStorage JWT:', extractedEmail)
                }
              } catch (error) {
                console.error('Failed to decode localStorage JWT:', error)
              }
            }
          }

          // Method 4: Check all localStorage for JWT tokens
          if (!extractedEmail) {
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
                        console.log('✅ Found email in token:', key, extractedEmail)
                        break
                      }
                    }
                  } catch (e) {
                    // Skip invalid tokens
                  }
                }
              }
            }
          }

        } catch (error) {
          console.error('Failed to extract email from zkLogin:', error)
        }

        if (extractedEmail) {
          setSocialAuthEmail(extractedEmail)
          setFormData(prev => ({ ...prev, email: extractedEmail }))
          console.log('🎯 Email set for onboarding:', extractedEmail)
        } else {
          console.warn('⚠️ No email found in zkLogin session')
        }
      } else {
        setIsSocialAuthUser(false)
        setSocialAuthEmail("")
      }
    }

    extractEmailFromZkLogin()
  }, [user?.connectionType])

  // Referral options
  const [skipReferral, setSkipReferral] = useState(false)

  // Admin default referral code
  const ADMIN_DEFAULT_REFERRAL_CODE = 'U2FSDGVKX1VF'

  // Avatar selection state
  const [showAvatarSelection, setShowAvatarSelection] = useState(false)

  // Form validation - username and email are both required for all users
  const isFormValid = formData.username.trim().length >= 3 && formData.email.trim().length > 0

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AIONET',
      description: 'Your wallet is connected and ready to get started',
      icon: Star,
      completed: currentStep > 0,
      required: true
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Choose your avatar and add your basic information',
      icon: User,
      completed: currentStep > 1,
      required: true
    },

    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Welcome to the AIONET community',
      icon: Trophy,
      completed: currentStep >= 2,
      required: true
    }
  ]

  // Calculate progress based on current step, not completed steps
  const progress = ((currentStep + 1) / steps.length) * 100

  // Load existing profile data and auto-populate referral code
  useEffect(() => {
    if (profile) {
      console.log('📋 Loading existing profile data:', profile)
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        referralCode: trackedReferralCode || '',
        selectedAvatar: '', // Initialize as empty for existing profiles
        country: profile.location || ''
      })
    } else if (user?.address) {
      // Initialize with default username if no profile exists
      console.log('📝 Initializing default form data for new user')
      setFormData({
        username: `User ${user.address.slice(0, 6)}`,
        email: '',
        referralCode: trackedReferralCode || '',
        selectedAvatar: '', // Initialize as empty for new users
        country: ''
      })
    }

    // Auto-populate referral code if user came from referral link
    if (trackedReferralCode && !formData.referralCode) {
      console.log('🔗 Auto-populating referral code from URL:', trackedReferralCode)
      setFormData(prev => ({ ...prev, referralCode: trackedReferralCode }))
      setSkipReferral(false) // Ensure referral is not skipped if we have a code
    }
  }, [profile, user?.address, trackedReferralCode])

  // Auto-refresh user state when profile changes (DISABLED to prevent infinite loop)
  // useEffect(() => {
  //   if (profile?.username && profile.username !== `User ${user?.address.slice(0, 6)}`) {
  //     refreshUserState()
  //   }
  // }, [profile?.username, user?.address, refreshUserState])

  const handleProfileSubmit = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCompleting(true)
    try {
      console.log('🔄 Submitting profile data:', formData)

      // Prepare profile data with referral code
      const profileData: any = {
        username: formData.username.trim(),
        // Handle email based on authentication method
        email: isSocialAuthUser ? socialAuthEmail : (formData.email.trim() || undefined),
        // Add country if provided
        location: formData.country === 'unspecified' ? '' : formData.country.trim() || undefined,
        // Ensure we don't lose existing data
        role_tier: profile?.role_tier || 'NOMAD',
        profile_level: profile?.profile_level || 1,
        current_xp: profile?.current_xp || 0,
        total_xp: profile?.total_xp || 0,
        points: profile?.points || 0,

      }

      // Add referral code to referral_data
      // Use provided code, or admin default if user chose to skip
      const finalReferralCode = skipReferral ? ADMIN_DEFAULT_REFERRAL_CODE : formData.referralCode.trim()

      if (finalReferralCode) {
        profileData.referral_data = {
          ...profile?.referral_data,
          referral_code: finalReferralCode,
          referred_by: finalReferralCode,
          referral_date: new Date().toISOString()
        }
        console.log('🔗 Applying referral code:', finalReferralCode, skipReferral ? '(admin default)' : '(user provided)')
      }

      // Update profile with form data
      const success = await updateProfile(profileData)

      if (success) {
        console.log('✅ Profile updated successfully')

        // Handle avatar selection if user chose one
        if (formData.selectedAvatar) {
          console.log('🖼️ Setting selected avatar:', formData.selectedAvatar)
          try {
            // Update profile with selected avatar path
            await updateProfile({
              profile_image_blob_id: formData.selectedAvatar // Store the path as blob ID for default avatars
            })
            console.log('✅ Avatar selection saved')
          } catch (error) {
            console.error('❌ Failed to save avatar selection:', error)
            // Don't fail the entire onboarding for avatar issues
          }
        }

        // Process referral if user came from referral link OR if using admin default
        const shouldProcessReferral = (trackedReferralCode || skipReferral) && user?.address
        if (shouldProcessReferral) {
          console.log('🔗 Processing referral...', trackedReferralCode ? 'from session' : 'admin default')

          if (trackedReferralCode) {
            // Process tracked referral from session
            const referralSuccess = await processReferralOnSignup(user.address)
            if (referralSuccess) {
              toast.success('✅ Referral processed successfully!')
            }
          } else if (skipReferral) {
            // Process admin default referral code using special admin method
            try {
              // TODO: Migrate this to backend API
              // For now, we'll skip the admin referral processing
              const adminReferralSuccess = true // Placeholder
              if (adminReferralSuccess) {
                console.log('✅ Admin default referral processed successfully')
                toast.success('✅ Welcome! Admin referral applied.')
              } else {
                console.log('⚠️ Admin referral processing failed, but referral_data is stored')
                toast.success('✅ Welcome! Admin referral applied to profile.')
              }
            } catch (error) {
              console.error('❌ Failed to process admin default referral:', error)
              // Don't fail onboarding for referral processing issues
              toast.success('✅ Welcome! Profile setup complete.')
            }
          }
        }

        // Create default referral code for the user (only if they don't have one)
        if (formData.username.trim() && user?.address) {
          console.log('🔍 Checking if user needs a referral code...')

          // Check if user already has referral codes to prevent duplicates
          // TODO: Migrate to backend API
          const hasExistingCodes = false

          if (!hasExistingCodes) {
            console.log('🆕 Creating default referral code...')
            const codeSuccess = await createDefaultCode(formData.username.trim())
            if (codeSuccess) {
              console.log('✅ Default referral code created')
            } else {
              console.warn('⚠️ Failed to create referral code, but continuing onboarding')
            }
          } else {
            console.log('✅ User already has referral code, skipping creation')
          }
        }

        await completeProfileSetup()

        // Refresh user state to update isNewUser status
        await refreshUserState()

        toast.success('Profile completed successfully!')
        setCurrentStep(currentStep + 1)
      } else {
        console.error('❌ Profile update failed')
        toast.error('Failed to save profile')
      }
    } catch (error) {
      console.error('❌ Profile setup error:', error)
      toast.error('Failed to complete profile setup')
    }
    setIsCompleting(false)
  }



  const handleCompleteOnboarding = async () => {
    setIsCompleting(true)
    try {
      // Mark onboarding as completed in the database
      const success = await updateProfile({
        ...profile,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })

      if (success) {
        await completeOnboarding()
        await refreshUserState()

        toast.success('Welcome to AIONET! Your account is now fully set up.')

        // Force a page refresh to ensure the onboarding doesn't show again
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      toast.error('Failed to complete onboarding')
    }
    setIsCompleting(false)
  }

  const renderStepContent = () => {
    const step = steps[currentStep]
    
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#4DA2FF] to-[#00D4AA] rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to AIONET!</h2>
              <p className="text-sm sm:text-base text-[#C0E6FF] mb-4">
                Your wallet is connected and ready. Let's complete your profile to unlock all features.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#C0E6FF]">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Connected: {user?.address.slice(0, 6)}...{user?.address.slice(-4)}</span>
              </div>
            </div>
            <Button
              onClick={() => setCurrentStep(1)}
              className="bg-gradient-to-r from-[#4DA2FF] to-[#00D4AA] text-white px-6 sm:px-8 text-sm sm:text-base"
            >
              Get Started
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </Button>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-sm sm:text-base text-[#C0E6FF]">
                Choose your avatar and add your information to personalize your AIONET experience
              </p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Avatar Selection Section */}
              <div>
                <button
                  onClick={() => setShowAvatarSelection(!showAvatarSelection)}
                  className="flex items-center justify-between w-full text-left mb-2"
                >
                  <Label className="text-white text-sm sm:text-base">Choose Your Avatar</Label>
                  {showAvatarSelection ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#C0E6FF]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#C0E6FF]" />
                  )}
                </button>

                {/* Current Avatar Preview */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 border-[#4DA2FF] bg-[#1a2f51] flex items-center justify-center">
                    {formData.selectedAvatar ? (
                      <img
                        src={formData.selectedAvatar}
                        alt="Selected avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#4DA2FF]" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-[#C0E6FF]/70">
                    {formData.selectedAvatar
                      ? (showAvatarSelection ? 'Click an avatar below to change' : 'Click above to change avatar')
                      : 'Click above to choose an avatar'
                    }
                  </span>
                </div>

                {/* Collapsible Avatar Grid */}
                {showAvatarSelection && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10 max-h-48 sm:max-h-none overflow-y-auto">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                        const avatarPath = `/images/animepfp/default${num}.webp`
                        const isSelected = formData.selectedAvatar === avatarPath
                        return (
                          <div
                            key={num}
                            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                              isSelected
                                ? 'ring-2 ring-[#4DA2FF] ring-offset-1 ring-offset-[#0A1628] scale-105'
                                : 'hover:scale-105 hover:ring-1 hover:ring-[#C0E6FF]/50'
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, selectedAvatar: avatarPath })
                              setShowAvatarSelection(false) // Auto-collapse after selection
                            }}
                          >
                            <img
                              src={avatarPath}
                              alt={`Avatar ${num}`}
                              className="w-full h-12 sm:h-16 object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#4DA2FF]/20 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-[#4DA2FF]" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[#C0E6FF]/70 text-xs sm:text-sm">
                      Select an avatar for your profile. You can upload a custom image later.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="username" className="text-white text-sm sm:text-base">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter your username"
                  className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white text-sm sm:text-base"
                  required
                />
                {!formData.username.trim() && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">Username is required</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-white text-sm sm:text-base">
                  Email {isSocialAuthUser ? "(From Google Account)" : "(Required - Can only be set once)"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={isSocialAuthUser ? "Email from Google account" : "Enter your email address"}
                  className={`bg-[#1a2f51] border-[#C0E6FF]/20 text-white text-sm sm:text-base ${
                    isSocialAuthUser ? 'bg-green-500/10 border-green-500/30' : ''
                  }`}
                  disabled={isSocialAuthUser}
                  readOnly={isSocialAuthUser}
                  required
                />
                {isSocialAuthUser && (
                  <p className="text-green-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    ✅ Email automatically retrieved from your Google account
                  </p>
                )}
                {!isSocialAuthUser && (
                  <p className="text-[#C0E6FF]/70 text-xs sm:text-sm mt-1">
                    ⚠️ Email is required and can only be set once - cannot be changed later
                  </p>
                )}
                {!formData.email.trim() && !isSocialAuthUser && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">Email is required</p>
                )}
              </div>

              {/* Country Selection */}
              <div>
                <Label htmlFor="country" className="text-white text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  Country (Optional)
                </Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                  <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white text-sm sm:text-base">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f51] border-[#1a2f51] max-h-48 sm:max-h-60 overflow-y-auto">
                    <SelectItem value="unspecified" className="text-white hover:bg-[#2a3f61] text-sm">
                      🌍 Prefer not to say
                    </SelectItem>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location.code} value={location.name} className="text-white hover:bg-[#2a3f61] text-sm">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={location.code}
                            svg
                            style={{
                              width: '1em',
                              height: '1em',
                            }}
                            title={location.name}
                          />
                          {location.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[#C0E6FF]/70 text-xs sm:text-sm mt-1">
                  Help us show you relevant content and connect with users in your region
                </p>
              </div>



              <div>
                <Label htmlFor="referralCode" className="text-white text-sm sm:text-base flex items-center gap-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  Referral Code
                  {trackedReferralCode && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      Auto-filled
                    </Badge>
                  )}
                </Label>
                <Input
                  id="referralCode"
                  value={skipReferral ? ADMIN_DEFAULT_REFERRAL_CODE : formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder={trackedReferralCode ? "Referral code from link" : "Enter referral code (if you have one)"}
                  className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white text-sm sm:text-base"
                  disabled={skipReferral || !!trackedReferralCode}
                />
                {trackedReferralCode && (
                  <p className="text-green-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Referral code automatically applied from your link
                  </p>
                )}
                {skipReferral && !trackedReferralCode && (
                  <p className="text-blue-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Admin default referral code will be applied automatically
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="skipReferral"
                    checked={skipReferral}
                    onCheckedChange={(checked) => {
                      setSkipReferral(checked as boolean)
                      if (checked) {
                        // When skipping, the admin default code will be shown in the input (read-only)
                        // The actual processing happens in handleProfileSubmit
                        console.log('🔗 User chose to continue without referral - admin default will be applied:', ADMIN_DEFAULT_REFERRAL_CODE)
                      } else {
                        // When unchecking, restore the original referral code or clear it
                        setFormData({ ...formData, referralCode: trackedReferralCode || '' })
                      }
                    }}
                    disabled={!!trackedReferralCode} // Disable if we have a tracked referral
                  />
                  <Label htmlFor="skipReferral" className="text-xs sm:text-sm text-[#C0E6FF]">
                    Continue without referral code (admin default will be applied)
                  </Label>
                </div>
                {!formData.referralCode.trim() && !skipReferral && !trackedReferralCode && (
                  <p className="text-yellow-400 text-xs sm:text-sm mt-1">
                    Enter a referral code or check the box to continue with admin default
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(0)}
                className="flex-1 text-sm sm:text-base"
              >
                Back
              </Button>
              <Button
                onClick={handleProfileSubmit}
                disabled={isCompleting || !isFormValid}
                className="flex-1 bg-[#4DA2FF] hover:bg-[#3d8ae6] text-white text-sm sm:text-base"
              >
                {isCompleting ? 'Saving...' : 'Save & Continue'}
                {!isCompleting && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />}
              </Button>
            </div>
          </div>
        )



      case 'complete':
        return (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-sm sm:text-base text-[#C0E6FF] mb-4">
                Welcome to the AIONET community! Your account is now fully configured.
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Profile Complete
                </Badge>

              </div>
            </div>
            <Button
              onClick={handleCompleteOnboarding}
              disabled={isCompleting}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 sm:px-8 text-sm sm:text-base"
            >
              {isCompleting ? 'Completing...' : 'Enter Dashboard'}
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  // Check if onboarding is completed in database
  const isOnboardingCompleted = profile?.onboarding_completed === true

  // Show onboarding for new users or users with incomplete onboarding
  // If profile is null (new user) or onboarding is not completed, show onboarding
  if (!isNewUser && isOnboardingCompleted) {
    return null
  }

  // Also don't show if user is not connected
  if (!user?.address) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-md bg-[#0A1628] border-[#C0E6FF]/20 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <CardHeader className="text-center flex-shrink-0 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm text-[#C0E6FF]">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-xs sm:text-sm text-[#C0E6FF]">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <div className="w-full bg-[#1a2f51] rounded-full h-2 sm:h-3 mb-2">
            <div
              className="bg-gradient-to-r from-[#4DA2FF] to-[#00D4AA] h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-[#C0E6FF]/70">
            {steps[currentStep]?.title}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="pb-4">
            {renderStepContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
