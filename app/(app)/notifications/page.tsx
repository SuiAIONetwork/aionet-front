"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Bell, Megaphone, FileText, Users, X, Info, AlertTriangle, TrendingUp, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
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



export default function NotificationsPage() {
  const { user } = useSuiAuth()
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(user?.address)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<"all" | "platform" | "trade" | "system" | "promotion">("all")
  const [uiNotifications, setUiNotifications] = useState<UINotification[]>([])

  // Convert database notifications to UI notifications
  useEffect(() => {
    const converted = dbNotifications.map(convertToUINotification)
    setUiNotifications(converted)
  }, [dbNotifications])

  // Filter notifications based on search and category
  const filteredNotifications = useMemo(() => {
    return uiNotifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || notification.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [uiNotifications, searchQuery, selectedCategory])

  // Get counts for each category
  const platformCount = uiNotifications.filter(n => n.category === "platform").length
  const tradeCount = uiNotifications.filter(n => n.category === "trade").length
  const systemCount = uiNotifications.filter(n => n.category === "system").length
  const promotionCount = uiNotifications.filter(n => n.category === "promotion").length

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

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

  const getCategoryName = (category: NotificationCategory) => {
    switch (category) {
      case "platform":
        return "Platform Updates"
      case "trade":
        return "Trading Alerts"
      case "system":
        return "System Notifications"
      case "promotion":
        return "Promotions"
      default:
        return "All"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">Stay updated with platform announcements, reports, and community news</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
            disabled={isLoading}
          >
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Search and Filter Section */}
      <Card className="bg-[#1a2f51] border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all"
                  ? "bg-[#4da2ff] hover:bg-[#4da2ff]/80"
                  : "bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
                }
              >
                All ({uiNotifications.length})
              </Button>
              <Button
                variant={selectedCategory === "platform" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("platform")}
                className={selectedCategory === "platform" 
                  ? "bg-[#4da2ff] hover:bg-[#4da2ff]/80" 
                  : "bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
                }
              >
                <Megaphone className="h-4 w-4 mr-1" />
                Platform ({platformCount})
              </Button>
              <Button
                variant={selectedCategory === "trade" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("trade")}
                className={selectedCategory === "trade"
                  ? "bg-[#4da2ff] hover:bg-[#4da2ff]/80"
                  : "bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
                }
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Trading ({tradeCount})
              </Button>
              <Button
                variant={selectedCategory === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("system")}
                className={selectedCategory === "system"
                  ? "bg-[#4da2ff] hover:bg-[#4da2ff]/80"
                  : "bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
                }
              >
                <Gift className="h-4 w-4 mr-1" />
                System ({systemCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="bg-[#1a2f51] border-slate-700">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4da2ff] mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "bg-[#1a2f51] border-slate-700 transition-all hover:border-slate-600 cursor-pointer",
                !notification.read && "border-l-4 border-l-[#4da2ff] bg-[#1a2f51]/80"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-full flex-shrink-0",
                    `${getTypeStyles(notification.type)} bg-opacity-10`
                  )}>
                    <notification.icon className={`h-5 w-5 ${getTypeStyles(notification.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="bg-[#4da2ff] text-white text-xs">
                              New
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {getCategoryName(notification.category)}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-400 text-xs">{notification.date}</p>
                          {notification.actionLabel && (
                            <span className="text-xs text-[#4da2ff]">• {notification.actionLabel}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            className="text-[#4da2ff] hover:text-white hover:bg-[#4da2ff]/10 text-xs"
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotification(notification.id)
                          }}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-[#1a2f51] border-slate-700">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No notifications found</h3>
              <p className="text-slate-400 text-sm">
                {searchQuery ? "Try adjusting your search terms or filters" : "You're all caught up!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
