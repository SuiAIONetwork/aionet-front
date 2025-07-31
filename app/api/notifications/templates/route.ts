/**
 * API Routes for Notification Templates
 * GET /api/notifications/templates - Get all templates
 * POST /api/notifications/templates - Create notification from template
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  NotificationTemplate, 
  CreateNotificationFromTemplateRequest,
  DatabaseNotification 
} from '@/types/notifications'

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/notifications/templates
 * Get all notification templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    const category = searchParams.get('category')

    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('template_key')

    if (enabled === 'true') {
      query = query.eq('enabled', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates as NotificationTemplate[]
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/templates
 * Create notification from template
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNotificationFromTemplateRequest = await request.json()

    // Validate required fields
    if (!body.user_address || !body.template_key || !body.variables) {
      return NextResponse.json(
        { error: 'Missing required fields: user_address, template_key, variables' },
        { status: 400 }
      )
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_key', body.template_key)
      .eq('enabled', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or disabled' },
        { status: 404 }
      )
    }

    // Replace variables in template
    const title = replaceTemplateVariables(template.title_template, body.variables)
    const message = replaceTemplateVariables(template.message_template, body.variables)
    const actionUrl = template.action_url_template 
      ? replaceTemplateVariables(template.action_url_template, body.variables)
      : undefined

    // Calculate expiry if template has auto_expire_hours
    let expiresAt = body.expires_at
    if (!expiresAt && template.auto_expire_hours) {
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + template.auto_expire_hours)
      expiresAt = expiry.toISOString()
    }

    // Prepare notification data
    const notificationData = {
      user_address: body.user_address,
      title,
      message,
      type: template.type,
      category: template.category,
      priority: template.priority,
      action_url: actionUrl,
      action_label: template.action_label,
      image_url: template.image_url,
      metadata: {
        ...body.metadata,
        template_key: body.template_key,
        template_variables: body.variables
      },
      scheduled_for: body.scheduled_for || new Date().toISOString(),
      expires_at: expiresAt
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification from template:', error)
      return NextResponse.json(
        { error: 'Failed to create notification from template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notification: notification as DatabaseNotification,
      template_used: template.template_key,
      message: 'Notification created from template successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/notifications/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to replace template variables
 */
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template
  
  // Replace {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, String(value))
  })
  
  return result
}
