'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAuth } from '@/data/auth'
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
const UpdateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
})

const UpdateNotificationSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  trading: z.boolean(),
  governance: z.boolean()
})

const AddSocialLinkSchema = z.object({
  platform: z.enum(['discord', 'telegram', 'twitter', 'x'], {
    required_error: 'Platform is required'
  }),
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters')
})

// Server Action: Update user profile
export async function updateProfile(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      username: formData.get('username'),
      bio: formData.get('bio'),
      email: formData.get('email'),
      phoneNumber: formData.get('phoneNumber')
    }

    const validatedData = UpdateProfileSchema.parse(rawData)
    
    // Check if username is already taken (if provided)
    if (validatedData.username) {
      const { data: existingUser } = await supabaseServer
        .from('user_profiles')
        .select('address')
        .eq('username', validatedData.username)
        .neq('address', user.address)
        .single()

      if (existingUser) {
        throw new Error('Username is already taken')
      }
    }

    // Security note: Ensure sensitive data (email, phone) is not accidentally exposed to client
    // (experimental_taintUniqueValue removed due to React version compatibility)

    // Update the profile
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.username !== undefined) updateData.username = validatedData.username
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phoneNumber !== undefined) updateData.phone_number = validatedData.phoneNumber

    const { error } = await supabaseServer
      .from('user_profiles')
      .update(updateData)
      .eq('address', user.address)

    if (error) {
      throw new Error('Failed to update profile')
    }

    // Revalidate profile pages
    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath(`/profile/${user.address}`)

    return { success: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile'
    }
  }
}

// Server Action: Update notification settings
export async function updateNotificationSettings(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      email: formData.get('email') === 'true',
      push: formData.get('push') === 'true',
      trading: formData.get('trading') === 'true',
      governance: formData.get('governance') === 'true'
    }

    const validatedData = UpdateNotificationSettingsSchema.parse(rawData)
    
    // Update notification settings
    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        notification_settings: validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('address', user.address)

    if (error) {
      throw new Error('Failed to update notification settings')
    }

    // Revalidate settings page
    revalidatePath('/settings')

    return { success: true, message: 'Notification settings updated successfully' }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update notification settings'
    }
  }
}

// Server Action: Add social media link
export async function addSocialLink(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      platform: formData.get('platform'),
      username: formData.get('username')
    }

    const validatedData = AddSocialLinkSchema.parse(rawData)
    
    // Get current social links
    const { data: profile } = await supabaseServer
      .from('user_profiles')
      .select('social_links')
      .eq('address', user.address)
      .single()

    const currentLinks = profile?.social_links || []
    
    // Check if platform already exists
    const existingLinkIndex = currentLinks.findIndex(
      (link: any) => link.platform === validatedData.platform
    )

    let updatedLinks
    if (existingLinkIndex >= 0) {
      // Update existing link
      updatedLinks = [...currentLinks]
      updatedLinks[existingLinkIndex] = {
        platform: validatedData.platform,
        username: validatedData.username,
        verified: false // Reset verification when username changes
      }
    } else {
      // Add new link
      updatedLinks = [
        ...currentLinks,
        {
          platform: validatedData.platform,
          username: validatedData.username,
          verified: false
        }
      ]
    }

    // Update the profile
    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        social_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('address', user.address)

    if (error) {
      throw new Error('Failed to add social link')
    }

    // Revalidate profile pages
    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath(`/profile/${user.address}`)

    return { success: true, message: 'Social link added successfully' }
  } catch (error) {
    console.error('Error adding social link:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add social link'
    }
  }
}

// Server Action: Remove social media link
export async function removeSocialLink(platform: string) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Validate platform
    if (!platform || typeof platform !== 'string') {
      throw new Error('Invalid platform')
    }

    // Get current social links
    const { data: profile } = await supabaseServer
      .from('user_profiles')
      .select('social_links')
      .eq('address', user.address)
      .single()

    const currentLinks = profile?.social_links || []
    
    // Remove the link
    const updatedLinks = currentLinks.filter(
      (link: any) => link.platform !== platform
    )

    // Update the profile
    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        social_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('address', user.address)

    if (error) {
      throw new Error('Failed to remove social link')
    }

    // Revalidate profile pages
    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath(`/profile/${user.address}`)

    return { success: true, message: 'Social link removed successfully' }
  } catch (error) {
    console.error('Error removing social link:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove social link'
    }
  }
}

// Server Action: Delete user account (soft delete)
export async function deleteAccount() {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Soft delete by marking account as deleted
    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        username: null,
        email: null,
        phone_number: null,
        bio: null,
        social_links: [],
        updated_at: new Date().toISOString()
      })
      .eq('address', user.address)

    if (error) {
      throw new Error('Failed to delete account')
    }

    // Revalidate and redirect
    revalidatePath('/')
    
    return { success: true, message: 'Account deleted successfully' }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account'
    }
  }
}
