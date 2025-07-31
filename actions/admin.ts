'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAdmin } from '@/data/auth'
import { createClient } from '@supabase/supabase-js'
// Note: experimental_taintUniqueValue removed due to React version compatibility

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

// Input validation schemas
const UpdateUserTierSchema = z.object({
  userAddress: z.string()
    .min(1, 'User address is required')
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid wallet address format'),
  newTier: z.enum(['NOMAD', 'PRO', 'ROYAL'], {
    required_error: 'New tier is required'
  }),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters')
})

const BanUserSchema = z.object({
  userAddress: z.string()
    .min(1, 'User address is required')
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid wallet address format'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters'),
  duration: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(8760, 'Duration cannot exceed 1 year (8760 hours)')
    .optional()
})

const SendNotificationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
  type: z.enum(['info', 'warning', 'success', 'error'], {
    required_error: 'Notification type is required'
  }),
  targetUsers: z.enum(['all', 'nomad', 'pro', 'royal', 'specific'], {
    required_error: 'Target users is required'
  }),
  specificAddresses: z.array(z.string()).optional()
})

// Server Action: Update user's NFT tier (Admin only)
export async function updateUserTier(formData: FormData) {
  try {
    // Require admin access
    const admin = await requireAdmin()
    
    // Extract and validate form data
    const rawData = {
      userAddress: formData.get('userAddress'),
      newTier: formData.get('newTier'),
      reason: formData.get('reason')
    }

    const validatedData = UpdateUserTierSchema.parse(rawData)

    // Security note: Ensure user address is not accidentally exposed to client
    // (experimental_taintUniqueValue removed due to React version compatibility)

    // Check if user exists
    const { data: user, error: userError } = await supabaseServer
      .from('user_profiles')
      .select('id, username, nft_tier')
      .eq('address', validatedData.userAddress)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Update the user's tier
    const { error: updateError } = await supabaseServer
      .from('user_profiles')
      .update({
        nft_tier: validatedData.newTier,
        updated_at: new Date().toISOString()
      })
      .eq('address', validatedData.userAddress)

    if (updateError) {
      throw new Error('Failed to update user tier')
    }

    // Log the admin action
    await supabaseServer
      .from('admin_actions')
      .insert({
        admin_address: admin.address,
        action_type: 'update_user_tier',
        target_address: validatedData.userAddress,
        details: {
          old_tier: user.nft_tier,
          new_tier: validatedData.newTier,
          reason: validatedData.reason
        },
        created_at: new Date().toISOString()
      })

    // Revalidate relevant pages
    revalidatePath('/admin-dashboard')
    revalidatePath('/community')
    revalidatePath('/leaderboard')

    return { 
      success: true, 
      message: `User tier updated to ${validatedData.newTier} successfully`
    }
  } catch (error) {
    console.error('Error updating user tier:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user tier'
    }
  }
}

// Server Action: Ban/Suspend user (Admin only)
export async function banUser(formData: FormData) {
  try {
    // Require admin access
    const admin = await requireAdmin()
    
    // Extract and validate form data
    const rawData = {
      userAddress: formData.get('userAddress'),
      reason: formData.get('reason'),
      duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined
    }

    const validatedData = BanUserSchema.parse(rawData)

    // Security note: Ensure user address is not accidentally exposed to client
    // (experimental_taintUniqueValue removed due to React version compatibility)

    // Check if user exists
    const { data: user, error: userError } = await supabaseServer
      .from('user_profiles')
      .select('id, username')
      .eq('address', validatedData.userAddress)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Calculate ban expiry if duration is provided
    const banExpiresAt = validatedData.duration 
      ? new Date(Date.now() + validatedData.duration * 60 * 60 * 1000).toISOString()
      : null

    // Insert ban record
    const { error: banError } = await supabaseServer
      .from('user_bans')
      .insert({
        user_address: validatedData.userAddress,
        banned_by: admin.address,
        reason: validatedData.reason,
        expires_at: banExpiresAt,
        created_at: new Date().toISOString()
      })

    if (banError) {
      throw new Error('Failed to ban user')
    }

    // Log the admin action
    await supabaseServer
      .from('admin_actions')
      .insert({
        admin_address: admin.address,
        action_type: 'ban_user',
        target_address: validatedData.userAddress,
        details: {
          reason: validatedData.reason,
          duration_hours: validatedData.duration,
          expires_at: banExpiresAt
        },
        created_at: new Date().toISOString()
      })

    // Revalidate admin pages
    revalidatePath('/admin-dashboard')
    revalidatePath('/community')

    const durationText = validatedData.duration 
      ? `for ${validatedData.duration} hours`
      : 'permanently'

    return { 
      success: true, 
      message: `User banned ${durationText} successfully`
    }
  } catch (error) {
    console.error('Error banning user:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to ban user'
    }
  }
}

// Server Action: Unban user (Admin only)
export async function unbanUser(userAddress: string) {
  try {
    // Require admin access
    const admin = await requireAdmin()
    
    // Validate user address
    if (!userAddress || !z.string().regex(/^0x[a-fA-F0-9]{64}$/).safeParse(userAddress).success) {
      throw new Error('Invalid user address')
    }

    // Remove ban record
    const { error: unbanError } = await supabaseServer
      .from('user_bans')
      .delete()
      .eq('user_address', userAddress)

    if (unbanError) {
      throw new Error('Failed to unban user')
    }

    // Log the admin action
    await supabaseServer
      .from('admin_actions')
      .insert({
        admin_address: admin.address,
        action_type: 'unban_user',
        target_address: userAddress,
        details: {
          reason: 'Admin unbanned user'
        },
        created_at: new Date().toISOString()
      })

    // Revalidate admin pages
    revalidatePath('/admin-dashboard')
    revalidatePath('/community')

    return { success: true, message: 'User unbanned successfully' }
  } catch (error) {
    console.error('Error unbanning user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unban user'
    }
  }
}

// Server Action: Send notification to users (Admin only)
export async function sendNotification(formData: FormData) {
  try {
    // Require admin access
    const admin = await requireAdmin()
    
    // Extract and validate form data
    const specificAddressesRaw = formData.get('specificAddresses') as string
    const specificAddresses = specificAddressesRaw 
      ? specificAddressesRaw.split(',').map(addr => addr.trim()).filter(addr => addr)
      : []

    const rawData = {
      title: formData.get('title'),
      message: formData.get('message'),
      type: formData.get('type'),
      targetUsers: formData.get('targetUsers'),
      specificAddresses
    }

    const validatedData = SendNotificationSchema.parse(rawData)
    
    // Determine target users
    let targetUserAddresses: string[] = []

    if (validatedData.targetUsers === 'specific') {
      if (!validatedData.specificAddresses || validatedData.specificAddresses.length === 0) {
        throw new Error('Specific addresses are required when targeting specific users')
      }
      targetUserAddresses = validatedData.specificAddresses
    } else if (validatedData.targetUsers === 'all') {
      const { data: allUsers } = await supabaseServer
        .from('user_profiles')
        .select('address')
      targetUserAddresses = allUsers?.map(user => user.address) || []
    } else {
      // Target specific tier
      const tierMap = {
        'nomad': 'NOMAD',
        'pro': 'PRO',
        'royal': 'ROYAL'
      }
      const tier = tierMap[validatedData.targetUsers as keyof typeof tierMap]
      
      const { data: tierUsers } = await supabaseServer
        .from('user_profiles')
        .select('address')
        .eq('nft_tier', tier)
      targetUserAddresses = tierUsers?.map(user => user.address) || []
    }

    // Create notifications for all target users
    const notifications = targetUserAddresses.map(address => ({
      user_address: address,
      title: validatedData.title,
      message: validatedData.message,
      type: validatedData.type,
      created_by: admin.address,
      created_at: new Date().toISOString()
    }))

    const { error: notificationError } = await supabaseServer
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      throw new Error('Failed to send notifications')
    }

    // Log the admin action
    await supabaseServer
      .from('admin_actions')
      .insert({
        admin_address: admin.address,
        action_type: 'send_notification',
        target_address: null,
        details: {
          title: validatedData.title,
          message: validatedData.message,
          type: validatedData.type,
          target_users: validatedData.targetUsers,
          recipient_count: targetUserAddresses.length
        },
        created_at: new Date().toISOString()
      })

    // Revalidate admin and notification pages
    revalidatePath('/admin-dashboard')
    revalidatePath('/notifications')

    return { 
      success: true, 
      message: `Notification sent to ${targetUserAddresses.length} users successfully`
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }
  }
}
