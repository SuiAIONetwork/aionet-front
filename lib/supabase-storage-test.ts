/**
 * Supabase Storage Test Utility
 * Use this to test and debug Supabase storage configuration
 */

import { createClient } from '@supabase/supabase-js'

export function testSupabaseStorageConfig() {
  console.log('🔍 Testing Supabase Storage Configuration...')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment Variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables')
    return false
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    console.log('✅ Supabase client created successfully')
    
    // Test storage access
    testStorageAccess(supabase)
    
    return true
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    return false
  }
}

async function testStorageAccess(supabase: any) {
  try {
    console.log('🔍 Testing storage access...')
    
    // Try to list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.warn('⚠️ Could not list buckets:', bucketsError.message)
    } else {
      console.log('✅ Storage access successful')
      console.log('Available buckets:', buckets?.map((b: any) => b.name) || [])
      
      // Check if aionetmedia bucket exists
      const aionetmediaBucket = buckets?.find((b: any) => b.name === 'aionetmedia')
      if (aionetmediaBucket) {
        console.log('✅ aionetmedia bucket found')
      } else {
        console.warn('⚠️ aionetmedia bucket not found')
      }
    }
  } catch (error) {
    console.warn('⚠️ Storage access test failed:', error)
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  testSupabaseStorageConfig()
}
