"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useNotifications } from '@/hooks/use-notifications'
import { useWelcomePopup } from '@/hooks/use-welcome-popup'
import { DatabaseNotification } from '@/types/notifications'
import { toast } from 'sonner'
import { WelcomeNotificationsPopup } from '@/components/welcome-notifications-popup'

interface NotificationContextType {
  // State
  notifications: DatabaseNotification[]
  unreadCount: number
  isLoading: boolean
  
  // Actions
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (id: string) => Promise<boolean>
  refresh: () => void
  
  // Notification creators
  sendWelcome: (username: string) => Promise<void>
  sendTradeAlert: (type: 'open' | 'close', symbol: string, profit?: number) => Promise<void>
  sendLevelUp: (username: string, level: number) => Promise<void>
  sendAchievement: (achievementName: string, xp: number) => Promise<void>
  sendSystemNotification: (title: string, message: string, actionUrl?: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSuiAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    notifyWelcome,
    notifyTrade,
    notifyLevelUp,
    notifyAchievement,
    notifySystem
  } = useNotifications(user?.address)

  // Welcome popup for returning users
  const { showPopup, closePopup } = useWelcomePopup({
    userAddress: user?.address,
    unreadCount,
    isAuthenticated: !!user
  })

  // Show toast notifications for new notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<DatabaseNotification>) => {
      const notification = event.detail
      
      // Show toast for new notifications
      toast.info(notification.title, {
        description: notification.message,
        action: notification.action_url ? {
          label: notification.action_label || 'View',
          onClick: () => window.open(notification.action_url, '_blank')
        } : undefined,
        duration: 5000
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('newNotification', handleNewNotification as EventListener)
      return () => {
        window.removeEventListener('newNotification', handleNewNotification as EventListener)
      }
    }
  }, [])

  // Notification creator functions with error handling
  const sendWelcome = async (username: string) => {
    try {
      await notifyWelcome(username)
    } catch (error) {
      console.error('Error sending welcome notification:', error)
    }
  }

  const sendTradeAlert = async (type: 'open' | 'close', symbol: string, profit?: number) => {
    try {
      await notifyTrade(type, symbol, profit)
    } catch (error) {
      console.error('Error sending trade notification:', error)
    }
  }

  const sendLevelUp = async (username: string, level: number) => {
    try {
      await notifyLevelUp(username, level)
    } catch (error) {
      console.error('Error sending level up notification:', error)
    }
  }

  const sendAchievement = async (achievementName: string, xp: number) => {
    try {
      await notifyAchievement(achievementName, xp)
    } catch (error) {
      console.error('Error sending achievement notification:', error)
    }
  }

  const sendSystemNotification = async (title: string, message: string, actionUrl?: string) => {
    try {
      await notifySystem(title, message, actionUrl)
    } catch (error) {
      console.error('Error sending system notification:', error)
    }
  }

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    isLoading,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    
    // Notification creators
    sendWelcome,
    sendTradeAlert,
    sendLevelUp,
    sendAchievement,
    sendSystemNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <WelcomeNotificationsPopup
        isOpen={showPopup}
        onClose={closePopup}
      />
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

// Export for convenience
export { NotificationContext }
