/**
 * Server-side Supabase Client
 * Uses service role key for server-side operations that bypass RLS
 */

import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side client with service role key (bypasses RLS)
let supabaseServer: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (!supabaseServer) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key')
      // Fallback to anon key if service key is not available
      supabaseServer = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    } else {
      supabaseServer = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    }
  }
  
  return supabaseServer
}

// Client-side client with user context (respects RLS)
export function getSupabaseClient(userAddress?: string): SupabaseClient {
  const headers: Record<string, string> = {}

  // Add user address header for RLS policies
  if (userAddress) {
    headers['X-User-Address'] = userAddress
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers,
      },
    }
  )
}

// Frontend-compatible client that can be used in React components
export function createSupabaseClientWithUser(userAddress?: string): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: use server client
    return getSupabaseServer()
  } else {
    // Client-side: use client with headers
    return getSupabaseClient(userAddress)
  }
}

// Utility function to validate admin access
export function isAdminUser(userAddress?: string): boolean {
  const adminAddress = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
  return userAddress === adminAddress
}

// Utility function to extract user address from request
export function getUserAddressFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url)
    return url.searchParams.get('user_address')
  } catch {
    return null
  }
}

export { supabaseServer }
