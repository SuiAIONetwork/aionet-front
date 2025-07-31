"use client"

import { useState, useEffect } from "react"
import { X, Bell, CheckCheck, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { DatabaseNotification, NotificationType, NotificationCategory } from "@/types/notifications"
import { Info, AlertTriangle, TrendingUp, Gift, Megaphone } from "lucide-react"

interface WelcomeNotificationsPopupProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Convert database notification to UI format
 */
function convertToUINotification(dbNotification: DatabaseNotification) {
  return {
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.message,
    type: dbNotification.type,
    category: dbNotification.category,
    date: new Date(dbNotification.created_at).toLocaleDateString(),
    time: new Date(dbNotification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: dbNotification.read,
    actionUrl: dbNotification.action_url,
    actionLabel: dbNotification.action_label,
    icon: getNotificationIcon(dbNotification.type, dbNotification.category)
  }
}

/**
 * Get icon for notification type and category
 */
function getNotificationIcon(type: NotificationType, category: NotificationCategory) {
  switch (category) {
    case 'platform':
      return Megaphone
    case 'trade':
      return TrendingUp
    case 'system':
      return Info
    case 'promotion':
      return Gift
    default:
      switch (type) {
        case 'success':
          return TrendingUp
        case 'warning':
          return AlertTriangle
        case 'error':
          return AlertTriangle
        default:
          return Info
      }
  }
}

/**
 * Get styles for notification type
 */
function getTypeStyles(type: NotificationType) {
  switch (type) {
    case "success":
      return "text-green-500"
    case "warning":
      return "text-yellow-500"
    case "error":
      return "text-red-500"
    default:
      return "text-blue-500"
  }
}

export function WelcomeNotificationsPopup({ isOpen, onClose }: WelcomeNotificationsPopupProps) {
  const { user } = useSuiAuth()
  const {
    notifications: dbNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading
  } = useNotifications(user?.address)

  // Get only unread notifications for the popup
  const unreadNotifications = dbNotifications
    .filter(notification => !notification.read)
    .slice(0, 5) // Show max 5 notifications in popup
    .map(convertToUINotification)

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  // Don't render if not open or no unread notifications
  if (!isOpen || unreadCount === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#4da2ff]" />
              <CardTitle className="text-white">Welcome Back!</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-300">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''} waiting for you.
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="max-h-[300px] overflow-y-auto pr-4">
            <div className="space-y-3">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn("p-2 rounded-full flex-shrink-0",
                    `${getTypeStyles(notification.type)} bg-opacity-10`
                  )}>
                    <notification.icon className={`h-4 w-4 ${getTypeStyles(notification.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white line-clamp-1">{notification.title}</p>
                        <p className="text-xs text-slate-300 line-clamp-2 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-slate-400">{notification.date} • {notification.time}</p>
                          <Badge variant="secondary" className="bg-[#4da2ff] text-white text-xs">
                            New
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show message if there are more notifications */}
          {unreadCount > 5 && (
            <div className="mt-3 p-2 bg-slate-800/30 rounded-lg text-center">
              <p className="text-xs text-slate-400">
                +{unreadCount - 5} more notification{unreadCount - 5 !== 1 ? 's' : ''} in your inbox
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="flex-1 bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="flex-1 bg-[#4da2ff] hover:bg-[#4da2ff]/80"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
