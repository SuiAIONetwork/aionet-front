import { useState, useEffect, useCallback } from 'react'
import { notificationService } from '@/services/notification-service'
import {
  isNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission
} from '@/lib/notifications'
import { DatabaseNotification, NotificationSettings } from '@/types/notifications'

/**
 * Enhanced hook for managing notifications with real-time support
 */
export function useNotifications(userAddress?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [notifications, setNotifications] = useState<DatabaseNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize service when user address is available
  useEffect(() => {
    if (userAddress && !isInitialized) {
      initializeNotifications()
    } else if (!userAddress && isInitialized) {
      cleanup()
    }
  }, [userAddress, isInitialized])

  // Check notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(Notification.permission)
    }
  }, [])

  // Listen for new notifications via custom events
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<DatabaseNotification>) => {
      const newNotification = event.detail
      console.log('🔔 Hook received new notification:', newNotification.title)

      setNotifications(prev => [newNotification, ...prev])
      if (!newNotification.read) {
        console.log('🔔 Incrementing unread count')
        setUnreadCount(prev => prev + 1)
      }
    }

    if (typeof window !== 'undefined') {
      console.log('🔔 Setting up notification event listener')
      window.addEventListener('newNotification', handleNewNotification as EventListener)
      return () => {
        console.log('🔔 Cleaning up notification event listener')
        window.removeEventListener('newNotification', handleNewNotification as EventListener)
      }
    }
  }, [])

  /**
   * Initialize notification service
   */
  const initializeNotifications = useCallback(async () => {
    if (!userAddress || isInitialized) return

    setIsLoading(true)
    try {
      await notificationService.initialize(userAddress)
      const userSettings = await notificationService.loadUserSettings(userAddress)
      setSettings(userSettings)

      // Load initial notifications
      await loadNotifications()

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userAddress, isInitialized])

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (filters?: {
    category?: string
    read?: boolean
    limit?: number
  }) => {
    if (!userAddress) return

    try {
      const fetchedNotifications = await notificationService.fetchNotifications(filters)
      setNotifications(fetchedNotifications)
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [userAddress])

  /**
   * Cleanup when component unmounts or user disconnects
   */
  const cleanup = useCallback(() => {
    notificationService.cleanup()
    setSettings(null)
    setNotifications([])
    setUnreadCount(0)
    setIsInitialized(false)
  }, [])

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    if (!isNotificationSupported()) {
      return 'denied'
    }

    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)

    // Update browser notification setting based on permission
    if (newPermission === 'granted' && settings) {
      await updateSettings({ browser_enabled: true })
    }

    return newPermission
  }

  /**
   * Update notification settings
   */
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      await notificationService.updateSettings(newSettings)
      const updatedSettings = notificationService.getSettings()
      if (updatedSettings) {
        setSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId)
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    return success
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async (category?: string) => {
    const success = await notificationService.markAllAsRead(category)
    if (success) {
      setNotifications(prev =>
        prev.map(n =>
          (!category || n.category === category) ? { ...n, read: true } : n
        )
      )
      if (!category) {
        setUnreadCount(0)
      } else {
        setUnreadCount(prev =>
          prev - notifications.filter(n => !n.read && n.category === category).length
        )
      }
    }
    return success
  }

  /**
   * Delete notification
   */
  const deleteNotification = async (notificationId: string) => {
    const success = await notificationService.deleteNotification(notificationId)
    if (success) {
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
    return success
  }

  /**
   * Send a test notification
   */
  const sendTestNotification = async () => {
    if (hasNotificationPermission() && settings?.browser_enabled) {
      const notification = await notificationService.notifySystem(
        'Test Notification',
        'This is a test notification from AIONET'
      )

      // Manually refresh notifications to ensure UI updates
      if (notification) {
        setTimeout(() => {
          loadNotifications()
        }, 500) // Small delay to ensure database is updated
      }

      return notification !== null
    }
    return false
  }

  /**
   * Create notification from template
   */
  const createFromTemplate = async (templateKey: string, variables: Record<string, any>) => {
    return notificationService.createNotificationFromTemplate(templateKey, variables)
  }

  /**
   * Refresh notifications
   */
  const refresh = () => {
    loadNotifications()
  }

  return {
    // State
    isSupported: isNotificationSupported(),
    permission,
    settings,
    notifications,
    unreadCount,
    isLoading,
    isInitialized,

    // Actions
    updateSettings,
    requestPermission,
    sendTestNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    createFromTemplate,
    refresh,

    // Service methods
    notifyTrade: notificationService.notifyTrade.bind(notificationService),
    notifySystem: notificationService.notifySystem.bind(notificationService),
    notifyWelcome: notificationService.notifyWelcome.bind(notificationService),
    notifyLevelUp: notificationService.notifyLevelUp.bind(notificationService),
    notifyAchievement: notificationService.notifyAchievement.bind(notificationService),
  }
}
