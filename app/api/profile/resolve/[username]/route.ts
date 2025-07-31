import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptedStorage } from '@/lib/encrypted-database-storage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Resolve username to address for profile redirects
 * GET /api/profile/resolve/[username]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = decodeURIComponent(params.username)
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Resolving username to address:', username)

    // Get all profiles with encrypted usernames
    const { data: allProfiles, error } = await supabase
      .from('user_profiles')
      .select('address, username_encrypted')
      .not('username_encrypted', 'is', null)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('🔍 Found profiles to search:', allProfiles?.length || 0)

    // Find profile with matching decrypted username
    for (const profile of allProfiles || []) {
      try {
        const decryptedProfile = await encryptedStorage.getDecryptedProfile(profile.address)
        
        if (decryptedProfile?.username?.toLowerCase() === username.toLowerCase()) {
          console.log('✅ Found matching address for username:', username, '→', profile.address)
          
          return NextResponse.json({
            success: true,
            data: {
              username: username,
              address: profile.address
            }
          })
        }
      } catch (error) {
        // Skip profiles that can't be decrypted
        continue
      }
    }

    console.log('❌ No address found for username:', username)
    return NextResponse.json(
      { error: 'Username not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error in /api/profile/resolve/[username]:', error)
    return NextResponse.json(
      { 
        error: 'Failed to resolve username',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
