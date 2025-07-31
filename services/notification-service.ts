import { createClient } from '@supabase/supabase-js'
import {
  hasNotificationPermission,
  sendNotification,
  sendTradeNotification,
  sendSystemNotification
} from '@/lib/notifications'
import {
  DatabaseNotification,
  NotificationSettings,
  CreateNotificationRequest,
  CreateNotificationFromTemplateRequest,
  NotificationSubscription,
  TemplateVariables
} from '@/types/notifications'

/**
 * Enhanced Notification Service with Real-time Support
 *
 * This service handles:
 * - Creating notifications via API
 * - Real-time notification subscriptions
 * - Browser notification integration
 * - User preference management
 */
class NotificationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  private subscriptions = new Map<string, any>()
  private userSettings: NotificationSettings | null = null
  private currentUserAddress: string | null = null

  constructor() {
    // Settings will be loaded when user connects
  }

  /**
   * Initialize service for a user
   */
  async initialize(userAddress: string): Promise<void> {
    this.currentUserAddress = userAddress
    await this.loadUserSettings(userAddress)
    this.setupRealtimeSubscription(userAddress)
  }

  /**
   * Load user notification settings from database
   */
  async loadUserSettings(userAddress: string): Promise<NotificationSettings> {
    try {
      const response = await fetch(`/api/notifications/settings?user_address=${userAddress}`)
      const data = await response.json()

      this.userSettings = data.settings
      return data.settings
    } catch (error) {
      console.error('Error loading notification settings:', error)
      // Return default settings
      const defaultSettings: NotificationSettings = {
        user_address: userAddress,
        email_enabled: true,
        push_enabled: true,
        browser_enabled: true,
        platform_enabled: true,
        monthly_enabled: true,
        community_enabled: true,
        trade_enabled: true,
        system_enabled: true,
        promotion_enabled: false,
        timezone: 'UTC',
        max_notifications_per_hour: 10,
        max_notifications_per_day: 50
      }
      this.userSettings = defaultSettings
      return defaultSettings
    }
  }

  /**
   * Update user notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    if (!this.currentUserAddress) {
      throw new Error('Service not initialized with user address')
    }

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          user_address: this.currentUserAddress
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const data = await response.json()
      this.userSettings = data.settings
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  /**
   * Setup real-time subscription for notifications
   */
  setupRealtimeSubscription(userAddress: string): void {
    // Clean up existing subscription
    this.cleanupSubscriptions()

    console.log('🔔 Setting up real-time subscription for:', userAddress)

    const subscription = this.supabase
      .channel(`notifications:${userAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_address=eq.${userAddress}`
        },
        (payload) => {
          console.log('🔔 Real-time notification received:', payload.new)
          this.handleNewNotification(payload.new as DatabaseNotification)
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status)
      })

    this.subscriptions.set(userAddress, subscription)
  }

  /**
   * Handle new notification from real-time subscription
   */
  private handleNewNotification(notification: DatabaseNotification): void {
    console.log('🔔 Handling new notification:', notification.title)

    // Check if browser notifications are enabled
    if (this.userSettings?.browser_enabled && this.isCategoryEnabled(notification.category)) {
      console.log('🔔 Sending browser notification')
      this.sendBrowserNotification(notification)
    }

    // Trigger custom event for UI updates
    if (typeof window !== 'undefined') {
      console.log('🔔 Dispatching custom event for UI update')
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: notification
      }))
    }
  }

  /**
   * Send browser notification
   */
  private sendBrowserNotification(notification: DatabaseNotification): void {
    if (!hasNotificationPermission()) {
      return
    }

    const browserNotification = sendNotification(notification.title, {
      body: notification.message,
      icon: notification.image_url || '/images/logo-icon.png',
      badge: '/images/logo-icon.png',
      tag: notification.id,
      data: {
        notificationId: notification.id,
        actionUrl: notification.action_url
      }
    })

    // Handle notification click
    if (browserNotification) {
      browserNotification.onclick = () => {
        if (notification.action_url) {
          window.open(notification.action_url, '_blank')
        }
        browserNotification.close()
      }
    }
  }

  /**
   * Check if a specific notification type is enabled
   */
  isEnabled(type: 'browser' | 'push' | 'email'): boolean {
    if (!this.userSettings) return false

    switch (type) {
      case 'browser':
        return this.userSettings.browser_enabled
      case 'push':
        return this.userSettings.push_enabled
      case 'email':
        return this.userSettings.email_enabled
      default:
        return false
    }
  }

  /**
   * Check if a specific notification category is enabled
   */
  isCategoryEnabled(category: string): boolean {
    if (!this.userSettings) return false

    switch (category) {
      case 'platform':
        return this.userSettings.platform_enabled
      case 'monthly':
        return this.userSettings.monthly_enabled
      case 'community':
        return this.userSettings.community_enabled
      case 'trade':
        return this.userSettings.trade_enabled
      case 'system':
        return this.userSettings.system_enabled
      case 'promotion':
        return this.userSettings.promotion_enabled
      default:
        return true // Default to enabled for unknown categories
    }
  }

  /**
   * Create a new notification via API
   */
  async createNotification(notification: CreateNotificationRequest): Promise<DatabaseNotification | null> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      const data = await response.json()
      return data.notification
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  /**
   * Create notification from template
   */
  async createNotificationFromTemplate(
    templateKey: string,
    variables: TemplateVariables,
    userAddress?: string,
    options?: {
      scheduled_for?: string
      expires_at?: string
      metadata?: Record<string, any>
    }
  ): Promise<DatabaseNotification | null> {
    const targetUserAddress = userAddress || this.currentUserAddress

    if (!targetUserAddress) {
      console.error('No user address provided and service not initialized with user address')
      return null
    }

    try {
      const request: CreateNotificationFromTemplateRequest = {
        user_address: targetUserAddress,
        template_key: templateKey,
        variables,
        ...options
      }

      const response = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to create notification from template')
      }

      const data = await response.json()
      return data.notification
    } catch (error) {
      console.error('Error creating notification from template:', error)
      return null
    }
  }

  /**
   * Send a trade notification using template
   */
  async notifyTrade(tradeType: 'open' | 'close', symbol: string, profit?: number): Promise<DatabaseNotification | null> {
    if (!this.isCategoryEnabled('trade')) return null

    const templateKey = tradeType === 'open' ? 'trade_opened' : 'trade_closed'
    const variables = {
      symbol,
      tradeType,
      price: '0.00', // You can pass actual price
      profit,
      profitLoss: profit && profit >= 0 ? 'profit' : 'loss',
      amount: profit ? Math.abs(profit).toFixed(2) : '0.00'
    }

    return this.createNotificationFromTemplate(templateKey, variables)
  }

  /**
   * Send a system notification
   */
  async notifySystem(title: string, message: string, actionUrl?: string): Promise<DatabaseNotification | null> {
    if (!this.currentUserAddress) return null

    const notification: CreateNotificationRequest = {
      user_address: this.currentUserAddress,
      title,
      message,
      type: 'info',
      category: 'system',
      priority: 2,
      action_url: actionUrl
    }

    return this.createNotification(notification)
  }

  /**
   * Send a welcome notification
   */
  async notifyWelcome(username: string): Promise<DatabaseNotification | null> {
    return this.createNotificationFromTemplate('welcome', { username })
  }

  /**
   * Send level up notification
   */
  async notifyLevelUp(username: string, level: number): Promise<DatabaseNotification | null> {
    return this.createNotificationFromTemplate('level_up', { username, level })
  }

  /**
   * Send achievement unlocked notification
   */
  async notifyAchievement(achievementName: string, xp: number): Promise<DatabaseNotification | null> {
    return this.createNotificationFromTemplate('achievement_unlocked', { achievementName, xp })
  }
  /**
   * Fetch user notifications
   */
  async fetchNotifications(filters?: {
    category?: string
    read?: boolean
    limit?: number
    offset?: number
  }): Promise<DatabaseNotification[]> {
    if (!this.currentUserAddress) return []

    try {
      const params = new URLSearchParams({
        user_address: this.currentUserAddress,
        ...filters
      } as any)

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      return data.notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.currentUserAddress) return false

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_address: this.currentUserAddress,
          read: true
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(category?: string): Promise<boolean> {
    if (!this.currentUserAddress) return false

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_address: this.currentUserAddress,
          action: 'mark_all_read',
          filters: category ? { category } : undefined
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!this.currentUserAddress) return false

    try {
      const response = await fetch(`/api/notifications/${notificationId}?user_address=${this.currentUserAddress}`, {
        method: 'DELETE'
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanupSubscriptions(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }

  /**
   * Cleanup when user disconnects
   */
  cleanup(): void {
    this.cleanupSubscriptions()
    this.userSettings = null
    this.currentUserAddress = null
  }

  /**
   * Get current user settings
   */
  getSettings(): NotificationSettings | null {
    return this.userSettings
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.currentUserAddress !== null
  }
}

// Create a singleton instance
export const notificationService = new NotificationService()

// Export the class for testing purposes
export default NotificationService
