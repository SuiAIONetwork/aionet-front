import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// User class to avoid accidentally passing whole objects to client
export class User {
  public readonly id: string
  public readonly address: string
  public readonly role: 'NOMAD' | 'PRO' | 'ROYAL'
  public readonly isAdmin: boolean

  constructor(id: string, address: string, role: 'NOMAD' | 'PRO' | 'ROYAL', isAdmin: boolean = false) {
    this.id = id
    this.address = address
    this.role = role
    this.isAdmin = isAdmin
  }

  canAccessAdminFeatures(): boolean {
    return this.isAdmin
  }

  canAccessPremiumFeatures(): boolean {
    return this.role === 'PRO' || this.role === 'ROYAL'
  }

  canAccessRoyalFeatures(): boolean {
    return this.role === 'ROYAL'
  }
}

// Cached helper method to get current user
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('AUTH_TOKEN')?.value
    const userAddress = cookieStore.get('USER_ADDRESS')?.value

    if (!authToken || !userAddress) {
      return null
    }

    // Verify token and get user data
    const { data: profile, error } = await supabaseServer
      .from('user_profiles')
      .select('id, address, nft_tier')
      .eq('address', userAddress)
      .single()

    if (error || !profile) {
      return null
    }

    // Check if user is admin
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS
    const isAdmin = Boolean(adminAddress && profile.address.toLowerCase() === adminAddress.toLowerCase())

    // Map NFT tier to role
    const role = mapNftTierToRole(profile.nft_tier)

    return new User(profile.id, profile.address, role, isAdmin)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
})

// Helper function to map NFT tier to role
function mapNftTierToRole(nftTier: string | null): 'NOMAD' | 'PRO' | 'ROYAL' {
  switch (nftTier) {
    case 'ROYAL':
      return 'ROYAL'
    case 'PRO':
      return 'PRO'
    default:
      return 'NOMAD'
  }
}

// Authorization helper functions
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error('Admin access required')
  }
  return user
}

export async function requirePremium(): Promise<User> {
  const user = await requireAuth()
  if (!user.canAccessPremiumFeatures()) {
    throw new Error('Premium access required')
  }
  return user
}

export async function requireRoyal(): Promise<User> {
  const user = await requireAuth()
  if (!user.canAccessRoyalFeatures()) {
    throw new Error('Royal access required')
  }
  return user
}

// Utility function to check permissions without throwing
export async function canAccess(requiredRole: 'USER' | 'PREMIUM' | 'ROYAL' | 'ADMIN'): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    switch (requiredRole) {
      case 'USER':
        return true
      case 'PREMIUM':
        return user.canAccessPremiumFeatures()
      case 'ROYAL':
        return user.canAccessRoyalFeatures()
      case 'ADMIN':
        return user.canAccessAdminFeatures()
      default:
        return false
    }
  } catch {
    return false
  }
}
