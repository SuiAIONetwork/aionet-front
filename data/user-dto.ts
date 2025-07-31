import 'server-only'
import { getCurrentUser, User } from './auth'
import { createClient } from '@supabase/supabase-js'
// Note: experimental_taintObjectReference removed due to React version compatibility

// Server-side Supabase client
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

// Data Transfer Objects - safe to pass to client
export interface PublicProfileDTO {
  id: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  role: 'NOMAD' | 'PRO' | 'ROYAL'
  joinDate: string
  totalPoints: number
  level: number
  achievements: Achievement[]
  socialLinks: SocialLink[]
}

export interface PrivateProfileDTO extends PublicProfileDTO {
  email: string | null
  phoneNumber: string | null
  notificationSettings: NotificationSettings
  subscriptionStatus: SubscriptionStatus
}

export interface Achievement {
  name: string
  icon: string
  color: string
  unlocked: boolean
  claimed: boolean
  xp: number
  tooltip: string
}

export interface SocialLink {
  platform: string
  username: string
  verified: boolean
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  trading: boolean
  governance: boolean
}

export interface SubscriptionStatus {
  isActive: boolean
  tier: string
  expiresAt: string | null
}

// Permission checking functions
function canSeeUsername(viewer: User | null): boolean {
  // Public info for now, but can change
  return true
}

function canSeeEmail(viewer: User | null, profileOwner: string): boolean {
  // Only the profile owner or admin can see email
  return viewer?.address === profileOwner || viewer?.isAdmin === true
}

function canSeePhoneNumber(viewer: User | null, profileOwner: string): boolean {
  // Only the profile owner or admin can see phone number
  return viewer?.address === profileOwner || viewer?.isAdmin === true
}

function canSeePrivateData(viewer: User | null, profileOwner: string): boolean {
  // Only the profile owner can see private data
  return viewer?.address === profileOwner
}

// Get public profile data (safe for any user to see)
export async function getPublicProfileDTO(identifier: string): Promise<PublicProfileDTO | null> {
  try {
    const currentUser = await getCurrentUser()
    
    // Query by address or username
    let query = supabaseServer
      .from('user_profiles')
      .select(`
        id,
        address,
        username,
        bio,
        avatar_url,
        banner_url,
        nft_tier,
        created_at,
        points,
        level,
        achievements,
        social_links
      `)

    // Check if identifier is an address or username
    if (identifier.startsWith('0x')) {
      query = query.eq('address', identifier)
    } else {
      query = query.eq('username', identifier)
    }

    const { data: profile, error } = await query.single()

    if (error || !profile) {
      return null
    }

    // Security note: Ensure raw profile data is not accidentally exposed to client
    // (experimental_taintObjectReference removed due to React version compatibility)

    // Return only safe, public data
    return {
      id: profile.id,
      username: canSeeUsername(currentUser) ? profile.username : null,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      role: mapNftTierToRole(profile.nft_tier),
      joinDate: profile.created_at,
      totalPoints: profile.points || 0,
      level: profile.level || 1,
      achievements: profile.achievements || [],
      socialLinks: profile.social_links || []
    }
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return null
  }
}

// Get private profile data (only for profile owner)
export async function getPrivateProfileDTO(address: string): Promise<PrivateProfileDTO | null> {
  try {
    const currentUser = await getCurrentUser()
    
    // Only allow access to own profile or admin
    if (!canSeePrivateData(currentUser, address)) {
      return null
    }

    const { data: profile, error } = await supabaseServer
      .from('user_profiles')
      .select(`
        id,
        address,
        username,
        email,
        phone_number,
        bio,
        avatar_url,
        banner_url,
        nft_tier,
        created_at,
        points,
        level,
        achievements,
        social_links,
        notification_settings,
        subscription_status
      `)
      .eq('address', address)
      .single()

    if (error || !profile) {
      return null
    }

    // Security note: Ensure raw profile data is not accidentally exposed to client
    // (experimental_taintObjectReference removed due to React version compatibility)

    return {
      id: profile.id,
      username: profile.username,
      email: canSeeEmail(currentUser, address) ? profile.email : null,
      phoneNumber: canSeePhoneNumber(currentUser, address) ? profile.phone_number : null,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      role: mapNftTierToRole(profile.nft_tier),
      joinDate: profile.created_at,
      totalPoints: profile.points || 0,
      level: profile.level || 1,
      achievements: profile.achievements || [],
      socialLinks: profile.social_links || [],
      notificationSettings: profile.notification_settings || {
        email: true,
        push: true,
        trading: true,
        governance: true
      },
      subscriptionStatus: profile.subscription_status || {
        isActive: false,
        tier: 'NOMAD',
        expiresAt: null
      }
    }
  } catch (error) {
    console.error('Error fetching private profile:', error)
    return null
  }
}

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

// Get user's trading statistics (with proper authorization)
export async function getTradingStatsDTO(address: string) {
  try {
    const currentUser = await getCurrentUser()
    
    // Only allow access to own stats or admin
    if (currentUser?.address !== address && !currentUser?.isAdmin) {
      return null
    }

    const { data: stats, error } = await supabaseServer
      .from('trading_stats')
      .select('*')
      .eq('user_address', address)
      .single()

    if (error || !stats) {
      return null
    }

    // Security note: Ensure raw trading stats data is not accidentally exposed to client
    // (experimental_taintObjectReference removed due to React version compatibility)

    // Return only safe data
    return {
      totalTrades: stats.total_trades || 0,
      winRate: stats.win_rate || 0,
      totalProfit: stats.total_profit || 0,
      bestTrade: stats.best_trade || 0,
      worstTrade: stats.worst_trade || 0,
      averageProfit: stats.average_profit || 0
    }
  } catch (error) {
    console.error('Error fetching trading stats:', error)
    return null
  }
}
