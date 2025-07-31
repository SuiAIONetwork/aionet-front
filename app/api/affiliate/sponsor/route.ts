import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('🎉 Next.js Sponsor API route called!')
  
  try {
    // Get user address from headers
    const userAddress = request.headers.get('X-User-Address')
    
    console.log(`👤 User address: ${userAddress}`)
    
    if (!userAddress) {
      console.log('❌ No user address provided')
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    // Get user's referral data to find their sponsor
    console.log('🔍 Querying user_profiles for referral data...')
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('referral_data')
      .eq('address', userAddress)
      .single()

    if (userError || !userData) {
      console.log(`❌ No user data found for: ${userAddress}`)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const referralData = userData.referral_data
    if (!referralData?.referred_by) {
      console.log(`❌ User has no sponsor: ${userAddress}`)
      return NextResponse.json(
        { success: false, error: 'No sponsor found' },
        { status: 404 }
      )
    }

    const sponsorReferralCode = referralData.referred_by
    console.log(`🔍 Looking for sponsor with referral code: ${sponsorReferralCode}`)

    // Find the sponsor by their referral code (exclude the user themselves to avoid circular reference)
    const { data: sponsorData, error: sponsorError } = await supabase
      .from('user_profiles')
      .select(`
        address,
        username_encrypted,
        role_tier,
        profile_level,
        referral_data
      `)
      .eq('referral_data->>referral_code', sponsorReferralCode)
      .neq('address', userAddress)
      .order('referral_data->referral_date', { ascending: true })
      .limit(1)
      .single()

    if (sponsorError || !sponsorData) {
      console.log(`❌ No sponsor found with referral code: ${sponsorReferralCode}`)
      return NextResponse.json(
        { success: false, error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found sponsor: ${sponsorData.address}`)

    // Decrypt the sponsor's username using the same logic as the frontend
    let username = `User_${sponsorData.address.slice(-8)}`
    
    if (sponsorData.username_encrypted) {
      try {
        const appSecret = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'your-app-secret-salt'
        const encryptionKey = sponsorData.address + appSecret

        console.log(`🔐 Attempting to decrypt username for: ${sponsorData.address}`)
        
        // Decrypt using CryptoJS (same as frontend)
        const decryptedBytes = CryptoJS.AES.decrypt(sponsorData.username_encrypted, encryptionKey)
        const decryptedUsername = decryptedBytes.toString(CryptoJS.enc.Utf8)

        if (decryptedUsername && decryptedUsername.length > 0) {
          username = decryptedUsername
          console.log(`🎉 Successfully decrypted sponsor username: ${username}`)
        } else {
          console.log(`⚠️ Decryption failed, using fallback username`)
        }
      } catch (decryptError) {
        console.error('❌ Failed to decrypt sponsor username:', decryptError)
      }
    }

    // Format the sponsor information
    const sponsorInfo = {
      username: username,
      email: '', // Not available in user_profiles
      address: sponsorData.address,
      status: sponsorData.role_tier || 'NOMAD',
      profileLevel: sponsorData.profile_level || 1,
      affiliateLevel: 5, // Default for sponsors
      avatar: null,
      banner: null
    }

    console.log(`✅ Sponsor info retrieved successfully:`, {
      sponsorAddress: sponsorData.address,
      username: username,
      status: sponsorInfo.status
    })

    return NextResponse.json({
      success: true,
      ...sponsorInfo
    })

  } catch (error) {
    console.error('❌ Failed to get sponsor info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sponsor information' },
      { status: 500 }
    )
  }
}
