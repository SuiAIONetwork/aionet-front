// API Route: Get public profile data by address or username
// GET /api/profile/[identifier]

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptedStorage } from '@/lib/encrypted-database-storage'
import { getUserJoinedChannels } from '@/lib/channel-subscriptions-storage'
import { getImageUrl } from '@/lib/supabase-storage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Note: getImageUrl function is now imported from @/lib/supabase-storage

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const identifier = params.identifier

    if (!identifier) {
      return NextResponse.json(
        { error: 'Profile identifier is required' },
        { status: 400 }
      )
    }

    // Determine if identifier is an address (starts with 0x) or username
    const isAddress = identifier.startsWith('0x')
    
    let profileData = null

    if (isAddress) {
      // Validate address format
      if (identifier.length < 42) {
        return NextResponse.json(
          { error: 'Invalid address format' },
          { status: 400 }
        )
      }

      // Fetch by address - get public fields only
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          address,
          profile_image_blob_id,
          banner_image_blob_id,
          role_tier,
          profile_level,
          current_xp,
          total_xp,
          kyc_status,
          join_date,
          last_active,
          achievements_data,
          username_encrypted,
          location_encrypted
        `)
        .eq('address', identifier)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
          )
        }
        throw error
      }

      profileData = data
    } else {
      // Search by username - need to decrypt usernames to match
      // This is more complex since usernames are encrypted
      console.log('🔍 Searching for username:', identifier)

      const { data: allProfiles, error } = await supabase
        .from('user_profiles')
        .select(`
          address,
          profile_image_blob_id,
          banner_image_blob_id,
          role_tier,
          profile_level,
          current_xp,
          total_xp,
          kyc_status,
          join_date,
          last_active,
          achievements_data,
          username_encrypted,
          location_encrypted
        `)
        .not('username_encrypted', 'is', null)

      if (error) {
        throw error
      }

      console.log('🔍 Found profiles to search:', allProfiles?.length || 0)

      // Find profile with matching decrypted username
      for (const profile of allProfiles || []) {
        try {
          const decryptedProfile = await encryptedStorage.getDecryptedProfile(profile.address)
          console.log('🔍 Checking profile:', profile.address, 'username:', decryptedProfile?.username)

          if (decryptedProfile?.username?.toLowerCase() === identifier.toLowerCase()) {
            console.log('✅ Found matching profile for username:', identifier)
            profileData = profile
            break
          }
        } catch (error) {
          // Skip profiles that can't be decrypted
          console.log('⚠️ Could not decrypt profile:', profile.address)
          continue
        }
      }

      if (!profileData) {
        console.log('❌ No profile found for username:', identifier)
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
    }

    // Decrypt username and check privacy settings
    let decryptedUsername = `User ${profileData.address.slice(0, 6)}`
    let decryptedLocation = null
    let privacySettings = null
    let socialLinks: any[] = []
    try {
      const fullDecryptedProfile = await encryptedStorage.getDecryptedProfile(profileData.address)
      if (fullDecryptedProfile?.username) {
        decryptedUsername = fullDecryptedProfile.username
      }
      if (fullDecryptedProfile?.location) {
        decryptedLocation = fullDecryptedProfile.location
      }
      // Get privacy settings from display preferences
      privacySettings = fullDecryptedProfile?.display_preferences?.privacy_settings || {}
      // Get social links
      socialLinks = fullDecryptedProfile?.social_links || []
    } catch (error) {
      console.warn('Could not decrypt profile data for:', profileData.address)
    }

    // Check if profile is private
    if (privacySettings?.profile_visibility === 'private') {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      )
    }

    // Build public profile response respecting privacy settings
    const publicProfile: any = {
      address: profileData.address,
      username: decryptedUsername,
      location: decryptedLocation,
      profileImageUrl: getImageUrl(profileData.profile_image_blob_id),
      bannerImageUrl: getImageUrl(profileData.banner_image_blob_id),
      roleTier: profileData.role_tier,
      kycStatus: profileData.kyc_status || 'unverified',
      isVerified: profileData.kyc_status === 'verified'
    }

    // Add optional fields based on privacy settings
    if (privacySettings?.show_level !== false) {
      publicProfile.profileLevel = profileData.profile_level
      publicProfile.currentXp = profileData.current_xp
      publicProfile.totalXp = profileData.total_xp
      publicProfile.xpProgress = profileData.profile_level < 10
        ? {
            current: profileData.current_xp,
            required: getXpRequiredForLevel(profileData.profile_level + 1),
            percentage: Math.round((profileData.current_xp / getXpRequiredForLevel(profileData.profile_level + 1)) * 100)
          }
        : null
    }

    if (privacySettings?.show_achievements !== false) {
      publicProfile.achievementsData = profileData.achievements_data || []
    } else {
      publicProfile.achievementsData = []
    }

    if (privacySettings?.show_join_date !== false) {
      publicProfile.joinDate = profileData.join_date
      publicProfile.memberSince = new Date(profileData.join_date).toLocaleDateString()
    }

    if (privacySettings?.show_last_active === true) {
      publicProfile.lastActive = profileData.last_active
    }

    // Always include KYC status for verification badge
    publicProfile.kycStatus = profileData.kyc_status

    // Add social links (always public for profile discovery)
    publicProfile.socialLinks = socialLinks

    // Add channels joined (public information) with correct images
    try {
      const userChannels = await getUserJoinedChannels(profileData.address)

      // Fetch creator data to get correct channel images (same as successful forum pages)
      const creatorsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/creators`)
      const creatorsResult = await creatorsResponse.json()

      if (creatorsResult.success && creatorsResult.data) {
        // Update channels with correct images from database (same as forum)
        const updatedChannels = userChannels.map(channel => {
          // Find the creator in database
          const dbCreator = creatorsResult.data.find((c: any) =>
            c.creator_address === channel.creatorAddress ||
            c.id === channel.creatorAddress
          )

          if (dbCreator) {
            // Find the specific channel in channels_data
            const channelData = dbCreator.channels_data?.find((ch: any) => ch.id === channel.id)

            if (channelData) {
              console.log('✅ Public Profile: Found channel images for:', channel.name, {
                channelAvatar: channelData.channelAvatar,
                channelCover: channelData.channelCover
              })

              // Use channel-specific images from database (same as successful forum pages)
              return {
                ...channel,
                avatarUrl: channelData.channelAvatar || channel.avatarUrl,
                coverUrl: channelData.channelCover || channel.coverUrl
              }
            }
          }

          return channel
        })

        publicProfile.channelsJoined = updatedChannels
      } else {
        publicProfile.channelsJoined = userChannels
      }
    } catch (error) {
      console.warn('Could not fetch channels for profile:', profileData.address, error)
      publicProfile.channelsJoined = []
    }

    return NextResponse.json({
      success: true,
      data: publicProfile
    })

  } catch (error) {
    console.error('Error in /api/profile/[identifier]:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate XP required for each level
function getXpRequiredForLevel(level: number): number {
  // Based on your XP system: levels 1-10 with increasing XP requirements
  const xpRequirements = [
    0,    // Level 1
    100,  // Level 2
    250,  // Level 3
    450,  // Level 4
    700,  // Level 5
    1100, // Level 6
    1700, // Level 7
    2600, // Level 8
    3800, // Level 9
    5200, // Level 10
    5200  // Max level (for calculation purposes)
  ]

  return xpRequirements[level] || 5200
}
