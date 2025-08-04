"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Bell,
  Megaphone,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { api } from "@/lib/api-client"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { NotificationCategory, NotificationType } from "@/types/notifications"

interface AdminContentNotificationsProps {
  isAdmin: boolean
}

export function AdminContentNotifications({ isAdmin }: AdminContentNotificationsProps) {
  const { user } = useSuiAuth()

  // Card Collapse State
  const [isExpanded, setIsExpanded] = useState(false)

  // Notifications State
  const [isLoadingNotification, setIsLoadingNotification] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'platform' as NotificationCategory,
    type: 'info' as NotificationType,
    actionUrl: '',
    actionLabel: ''
  })

  // Notification Functions
  const handleSubmitNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoadingNotification(true)
    try {
      // Send notification to all users via API
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          category: formData.category,
          type: formData.type,
          action_url: formData.actionUrl || undefined,
          action_label: formData.actionLabel || undefined,
          admin_address: user?.address || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }

      toast.success('Notification sent successfully!')
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        category: 'platform',
        type: 'info',
        actionUrl: '',
        actionLabel: ''
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setIsLoadingNotification(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Card className="bg-[#030F1C] border-[#1a2f51] shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Platform Communications
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">Send notifications to users</p>
            </div>
          </div>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#C0E6FF] hover:text-white hover:bg-[#C0E6FF]/10"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-6">
            {/* Send Notifications */}
            <div className="space-y-4 mt-4">
              <div className="bg-[#0a1628] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#4da2ff]/20 p-3 rounded-full">
                    <Megaphone className="w-6 h-6 text-[#4da2ff]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">Broadcast Notification</h3>
                    <p className="text-gray-400 text-sm">Send notifications to all platform users</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitNotification} className="space-y-4">
                  {/* Title and Message */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-white font-medium">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Notification title..."
                        className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-white font-medium">Category</Label>
                      <Select value={formData.category} onValueChange={(value: NotificationCategory) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white font-medium">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your notification message..."
                      className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Type and Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-white font-medium">Type</Label>
                      <Select value={formData.type} onValueChange={(value: NotificationType) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="actionLabel" className="text-white font-medium">Action Label</Label>
                      <Input
                        id="actionLabel"
                        value={formData.actionLabel}
                        onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                        placeholder="Button text (optional)"
                        className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="actionUrl" className="text-white font-medium">Action URL</Label>
                    <Input
                      id="actionUrl"
                      value={formData.actionUrl}
                      onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                      placeholder="URL for action button (optional)"
                      className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoadingNotification}
                    className="w-full bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white"
                  >
                    {isLoadingNotification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </>
  )
}
