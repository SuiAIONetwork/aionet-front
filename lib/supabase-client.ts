/**
 * Singleton Supabase Client
 * Prevents multiple GoTrueClient instances
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

class SupabaseClientSingleton {
  private static instance: SupabaseClient | null = null

  public static getInstance(): SupabaseClient {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
          },
        }
      )
    }
    return SupabaseClientSingleton.instance
  }

  // Method to create a client with custom auth headers (for RLS)
  public static getInstanceWithAuth(userAddress: string): SupabaseClient {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'X-User-Address': userAddress,
          },
        },
      }
    )
  }
}

// Export the singleton instance
export const supabase = SupabaseClientSingleton.getInstance()

// Export the class for custom auth instances
export { SupabaseClientSingleton }
