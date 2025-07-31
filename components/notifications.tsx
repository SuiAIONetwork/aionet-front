"use client"

import { useState, useEffect } from "react"
import { Bell, X, Info, AlertTriangle, CreditCard, TrendingUp, Gift, Megaphone, FileText, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useNotifications } from "@/hooks/use-notifications"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { DatabaseNotification, NotificationType, NotificationCategory } from "@/types/notifications"

// UI notification interface for display
interface UINotification {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: NotificationType
  category: NotificationCategory
  icon: any
  actionUrl?: string
  actionLabel?: string
}

/**
 * Convert database notification to UI notification
 */
function convertToUINotification(dbNotification: DatabaseNotification): UINotification {
  return {
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.message,
    date: formatNotificationDate(dbNotification.created_at),
    read: dbNotification.read,
    type: dbNotification.type,
    category: dbNotification.category,
    icon: getNotificationIcon(dbNotification.type, dbNotification.category),
    actionUrl: dbNotification.action_url,
    actionLabel: dbNotification.action_label
  }
}

/**
 * Format notification date for display
 */
function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toLocaleDateString()
}

/**
 * Get icon for notification type and category
 */
function getNotificationIcon(type: NotificationType, category: NotificationCategory) {
  // Category-specific icons take precedence
  switch (category) {
    case 'platform':
      return Megaphone
    case 'monthly':
      return FileText
    case 'community':
      return Users
    case 'trade':
      return TrendingUp
    case 'system':
      return Info
    case 'promotion':
      return Gift
    default:
      // Fallback to type-based icons
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

export function Notifications() {
  const { user } = useSuiAuth()
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(user?.address)

  const [open, setOpen] = useState(false)
  const [uiNotifications, setUiNotifications] = useState<UINotification[]>([])

  // Convert database notifications to UI notifications
  useEffect(() => {
    const converted = dbNotifications.map(convertToUINotification)
    setUiNotifications(converted)
  }, [dbNotifications])

  // Get notifications by category
  const platformNotifications = uiNotifications.filter(n => n.category === "platform")
  const tradingNotifications = uiNotifications.filter(n => n.category === "trade")
  const systemNotifications = uiNotifications.filter(n => n.category === "system")

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id)
  }

  const handleNotificationClick = async (notification: UINotification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  const getTypeStyles = (type: NotificationType) => {
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

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "platform":
        return Megaphone
      case "monthly":
        return FileText
      case "community":
        return Users
      case "trade":
        return TrendingUp
      case "system":
        return Info
      case "promotion":
        return Gift
      default:
        return Info
    }
  }

  const getCategoryName = (category: NotificationCategory) => {
    switch (category) {
      case "platform":
        return "Platform Updates"
      case "monthly":
        return "Monthly Reports"
      case "community":
        return "Community Updates"
      case "trade":
        return "Trade Alerts"
      case "system":
        return "System Notifications"
      case "promotion":
        return "Promotions"
      default:
        return "Other"
    }
  }

  const renderNotificationList = (notificationList: UINotification[]) => {
    if (isLoading) {
      return (
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">Loading notifications...</p>
        </div>
      )
    }

    if (notificationList.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">No notifications in this category</p>
        </div>
      )
    }

    return (
      <div className="divide-y divide-slate-700">
        {notificationList.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-3 flex items-start gap-2 hover:bg-slate-800/50 transition-colors cursor-pointer",
              !notification.read && "bg-slate-800"
            )}
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
                  <p className="text-sm font-medium text-white">{notification.title}</p>
                  <p className="text-sm text-slate-300">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400">{notification.date}</p>
                    {notification.actionLabel && (
                      <span className="text-xs text-[#4da2ff]">• {notification.actionLabel}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white h-6 w-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotification(notification.id)
                  }}
                >
                  <span className="sr-only">Delete</span>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent border-slate-700 rounded-full hover:border-[#4da2ff] hover:bg-[#4da2ff]/10 transition-colors">
          <Bell className="h-[1.2rem] w-[1.2rem] text-slate-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] bg-slate-900 border-slate-700 p-0">
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="font-medium text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-white"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-slate-800 rounded-none border-b border-slate-700">
            <TabsTrigger value="platform" className="text-xs">Platform ({platformNotifications.length})</TabsTrigger>
            <TabsTrigger value="trading" className="text-xs">Trading ({tradingNotifications.length})</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System ({systemNotifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="max-h-[300px] overflow-y-auto">
            {renderNotificationList(platformNotifications)}
          </TabsContent>

          <TabsContent value="trading" className="max-h-[300px] overflow-y-auto">
            {renderNotificationList(tradingNotifications)}
          </TabsContent>

          <TabsContent value="system" className="max-h-[300px] overflow-y-auto">
            {renderNotificationList(systemNotifications)}
          </TabsContent>
        </Tabs>

        {/* See all Announcements button at bottom */}
        <div className="p-3 border-t border-slate-700 text-center">
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#4da2ff] hover:text-white hover:bg-[#4da2ff]/10 flex items-center gap-1 mx-auto"
            >
              See all Announcements
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
