/**
 * TypeScript types and interfaces for the notification system
 */

// Base notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'platform' | 'monthly' | 'community' | 'trade' | 'system' | 'promotion'
export type NotificationPriority = 1 | 2 | 3 | 4 | 5 // 1=low, 5=urgent

// Database notification interface
export interface DatabaseNotification {
  id: string
  user_address: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  priority: NotificationPriority
  action_url?: string
  action_label?: string
  image_url?: string
  metadata: Record<string, any>
  scheduled_for: string
  delivered_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// Client-side notification interface (for UI components)
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  priority: NotificationPriority
  date: string // Formatted date string for display
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  metadata?: Record<string, any>
  icon?: any // React component for icon
}

// Notification template interface
export interface NotificationTemplate {
  id: string
  template_key: string
  title_template: string
  message_template: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  action_url_template?: string
  action_label?: string
  image_url?: string
  enabled: boolean
  auto_expire_hours?: number
  created_at: string
  updated_at: string
}

// Notification settings interface
export interface NotificationSettings {
  id?: string
  user_address: string
  
  // Delivery preferences
  email_enabled: boolean
  push_enabled: boolean
  browser_enabled: boolean
  
  // Category preferences
  platform_enabled: boolean
  monthly_enabled: boolean
  community_enabled: boolean
  trade_enabled: boolean
  system_enabled: boolean
  promotion_enabled: boolean
  
  // Timing preferences
  quiet_hours_start?: string
  quiet_hours_end?: string
  timezone: string
  
  // Frequency limits
  max_notifications_per_hour: number
  max_notifications_per_day: number
  
  created_at?: string
  updated_at?: string
}

// API request/response types
export interface CreateNotificationRequest {
  user_address: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  priority?: NotificationPriority
  action_url?: string
  action_label?: string
  image_url?: string
  metadata?: Record<string, any>
  scheduled_for?: string
  expires_at?: string
}

export interface CreateNotificationFromTemplateRequest {
  user_address: string
  template_key: string
  variables: Record<string, any> // Variables to replace in template
  scheduled_for?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface UpdateNotificationRequest {
  read?: boolean
  delivered_at?: string
}

export interface NotificationFilters {
  category?: NotificationCategory
  type?: NotificationType
  read?: boolean
  priority?: NotificationPriority
  limit?: number
  offset?: number
  search?: string
}

export interface NotificationStats {
  total: number
  unread: number
  by_category: Record<NotificationCategory, number>
  by_type: Record<NotificationType, number>
}

// Real-time subscription types
export interface NotificationSubscription {
  user_address: string
  callback: (notification: DatabaseNotification) => void
  filters?: {
    categories?: NotificationCategory[]
    types?: NotificationType[]
    priority_min?: NotificationPriority
  }
}

// Notification service types
export interface NotificationServiceConfig {
  supabaseUrl: string
  supabaseKey: string
  enableRealtime: boolean
  enableBrowserNotifications: boolean
  defaultSettings: Partial<NotificationSettings>
}

// Template variable types for common templates
export interface WelcomeTemplateVars {
  username: string
}

export interface TradeTemplateVars {
  symbol: string
  tradeType: string
  price?: string
  profit?: number
  profitLoss?: 'profit' | 'loss'
  amount?: string
}

export interface LevelUpTemplateVars {
  username: string
  level: number
  xp?: number
}

export interface AchievementTemplateVars {
  achievementName: string
  xp: number
  username?: string
}

export interface SubscriptionTemplateVars {
  tier: string
  days: number
  username?: string
}

export interface FeatureTemplateVars {
  featureName: string
  description: string
}

export interface MaintenanceTemplateVars {
  date: string
  time: string
  duration: string
}

export interface ReferralTemplateVars {
  amount: number
  username: string
}

// Union type for all template variables
export type TemplateVariables = 
  | WelcomeTemplateVars
  | TradeTemplateVars
  | LevelUpTemplateVars
  | AchievementTemplateVars
  | SubscriptionTemplateVars
  | FeatureTemplateVars
  | MaintenanceTemplateVars
  | ReferralTemplateVars
  | Record<string, any>

// Error types
export interface NotificationError {
  code: string
  message: string
  details?: any
}

// Batch operations
export interface BatchNotificationRequest {
  notifications: CreateNotificationRequest[]
}

export interface BatchNotificationFromTemplateRequest {
  template_key: string
  recipients: Array<{
    user_address: string
    variables: Record<string, any>
  }>
  scheduled_for?: string
  expires_at?: string
}

// Export utility type for notification icon mapping
export interface NotificationIconMap {
  [key: string]: any // React component
}

// Notification delivery status
export type NotificationDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'expired'

// Enhanced notification with delivery tracking
export interface NotificationWithDelivery extends DatabaseNotification {
  delivery_status: NotificationDeliveryStatus
  delivery_attempts: number
  last_delivery_attempt?: string
  delivery_error?: string
}
