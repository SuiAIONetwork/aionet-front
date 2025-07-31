import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptedStorage } from '@/lib/encrypted-database-storage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Debug endpoint to check what usernames are actually in the database
 * GET /api/debug/usernames
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking database usernames...')

    // Get all profiles with encrypted usernames
    const { data: allProfiles, error } = await supabase
      .from('user_profiles')
      .select('address, username_encrypted, role_tier, profile_level')
      .not('username_encrypted', 'is', null)
      .limit(10) // Limit to first 10 for debugging

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('🔍 Found profiles with usernames:', allProfiles?.length || 0)

    const debugData = []

    // Try to decrypt usernames for debugging
    for (const profile of allProfiles || []) {
      try {
        const decryptedProfile = await encryptedStorage.getDecryptedProfile(profile.address)
        
        debugData.push({
          address: profile.address,
          username: decryptedProfile?.username || 'DECRYPTION_FAILED',
          role_tier: profile.role_tier,
          profile_level: profile.profile_level,
          has_encrypted_username: !!profile.username_encrypted
        })
        
        console.log('✅ Decrypted profile:', profile.address, '→', decryptedProfile?.username)
      } catch (error) {
        debugData.push({
          address: profile.address,
          username: 'DECRYPTION_ERROR',
          role_tier: profile.role_tier,
          profile_level: profile.profile_level,
          has_encrypted_username: !!profile.username_encrypted,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.log('❌ Failed to decrypt profile:', profile.address, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_profiles_with_usernames: allProfiles?.length || 0,
        profiles: debugData,
        database_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
        encryption_salt_exists: !!process.env.NEXT_PUBLIC_ENCRYPTION_SALT
      }
    })

  } catch (error) {
    console.error('Error in /api/debug/usernames:', error)
    return NextResponse.json(
      { 
        error: 'Failed to debug usernames',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
