"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Shield, 
  AlertOctagon, 
  MoreHorizontal,
  Flag,
  X,
  Send
} from "lucide-react"
import { toast } from "sonner"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import type {
  ChannelReportCategory,
  CreateChannelReportRequest,
  ReportCategoryInfo
} from "@/types/channel-reports"

interface ChannelReportModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  channelName: string
  creatorAddress: string
  creatorName?: string
  onReportSubmitted?: () => void
}

// Report categories with icons
const REPORT_CATEGORIES: ReportCategoryInfo[] = [
  {
    value: 'content_mismatch',
    label: 'Content Mismatch',
    description: 'Channel description doesn\'t match actual content',
    icon: 'AlertTriangle'
  },
  {
    value: 'not_delivering',
    label: 'Not Delivering Content',
    description: 'Channel is not delivering promised content or services',
    icon: 'XCircle'
  },
  {
    value: 'inactive_channel',
    label: 'Inactive Channel',
    description: 'Channel appears to be inactive or non-functional',
    icon: 'Clock'
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Channel contains inappropriate or harmful content',
    icon: 'Shield'
  },
  {
    value: 'spam_or_scam',
    label: 'Spam or Scam',
    description: 'Channel appears to be spam or a scam operation',
    icon: 'AlertOctagon'
  },
  {
    value: 'other',
    label: 'Other Issues',
    description: 'Other issues not covered by the above categories',
    icon: 'MoreHorizontal'
  }
]

// Icon mapping
const IconMap = {
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  AlertOctagon,
  MoreHorizontal
}

export function ChannelReportModal({
  isOpen,
  onClose,
  channelId,
  channelName,
  creatorAddress,
  creatorName,
  onReportSubmitted
}: ChannelReportModalProps) {
  const { user } = useSuiAuth()
  const [selectedCategory, setSelectedCategory] = useState<ChannelReportCategory>('content_mismatch')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet to submit a report')
      return
    }

    if (!description.trim()) {
      toast.error('Please provide a detailed description of the issue')
      return
    }

    if (description.trim().length < 20) {
      toast.error('Please provide a more detailed description (at least 20 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const reportData: CreateChannelReportRequest = {
        reporter_address: user.address,
        channel_id: channelId,
        channel_name: channelName,
        creator_address: creatorAddress,
        creator_name: creatorName,
        report_category: selectedCategory,
        report_description: description.trim(),
        metadata: {
          reported_from: 'aio_creators_page',
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch('/api/channel-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (!response.ok) {
        let error
        try {
          error = await response.json()
        } catch (e) {
          error = { message: 'Failed to parse error response' }
        }

        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error,
          url: response.url
        })

        // Show more specific error message
        const errorMessage = error.error || error.message || `Server error (${response.status}): Failed to submit report`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      toast.success('Report submitted successfully. Thank you for helping keep our community safe!')

      // Call the callback if provided
      if (onReportSubmitted) {
        onReportSubmitted()
      }

      // Reset form and close modal
      setSelectedCategory('content_mismatch')
      setDescription('')
      onClose()

    } catch (error) {
      console.error('Error submitting report:', error)

      // Show more detailed error information
      let errorMessage = 'Failed to submit report'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      console.log('Report submission error details:', {
        error,
        channelId,
        channelName,
        creatorAddress,
        userAddress: user?.address,
        category: selectedCategory,
        descriptionLength: description.length
      })

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCategory('content_mismatch')
      setDescription('')
      onClose()
    }
  }

  const selectedCategoryInfo = REPORT_CATEGORIES.find(cat => cat.value === selectedCategory)
  const IconComponent = selectedCategoryInfo ? IconMap[selectedCategoryInfo.icon as keyof typeof IconMap] : AlertTriangle

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] bg-[#0a1628] border-[#C0E6FF]/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-lg">
            <Flag className="w-4 h-4 text-red-400" />
            Report Channel
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Report issues with this channel to help keep our community safe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Information */}
          <div className="bg-[#1a2f51] rounded-lg p-3">
            <div className="space-y-1">
              <p className="text-[#C0E6FF] font-medium text-sm">{channelName}</p>
              {creatorName && (
                <p className="text-gray-400 text-xs">by {creatorName}</p>
              )}
            </div>
          </div>

          {/* Report Category Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium text-sm">What's the issue?</Label>
            <RadioGroup
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as ChannelReportCategory)}
              className="space-y-1"
            >
              {REPORT_CATEGORIES.map((category) => {
                const Icon = IconMap[category.icon as keyof typeof IconMap]
                return (
                  <div key={category.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={category.value}
                      id={category.value}
                      className="border-[#C0E6FF]/30 text-[#4DA2FF]"
                    />
                    <Label
                      htmlFor={category.value}
                      className="text-white text-sm cursor-pointer flex items-center gap-2 flex-1"
                    >
                      <Icon className="w-3 h-3 text-[#4DA2FF]" />
                      {category.label}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Selected Category Display */}
          {selectedCategoryInfo && (
            <div className="bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded p-2">
              <div className="flex items-center gap-2">
                <IconComponent className="w-3 h-3 text-[#4DA2FF]" />
                <span className="text-[#4DA2FF] text-sm font-medium">{selectedCategoryInfo.label}</span>
              </div>
              <p className="text-[#C0E6FF] text-xs mt-1">{selectedCategoryInfo.description}</p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white font-medium text-sm">
              Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue with this channel..."
              className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 min-h-[80px] resize-none text-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">
                Min 20 characters
              </span>
              <span className={`${description.length >= 20 ? 'text-green-400' : 'text-gray-400'}`}>
                {description.length}/500
              </span>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">
                False reports may result in account restrictions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-[#C0E6FF]/20 text-[#C0E6FF] hover:bg-[#C0E6FF]/10 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim() || description.trim().length < 20}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  Submit
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
