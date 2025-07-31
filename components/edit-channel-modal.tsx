"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupabaseProfileImage } from "@/components/supabase-profile-image"
import { SupabaseCoverImage } from "@/components/supabase-cover-image"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Channel } from "@/contexts/creators-context"

// Form validation schema
const editChannelSchema = z.object({
  channelName: z.string().min(3, "Channel name must be at least 3 characters"),
  channelDescription: z.string().min(10, "Description must be at least 10 characters"),
  channelLanguage: z.string().min(1, "Please select a language"),
  creatorRole: z.string().min(1, "Please select your role"),
  channelCategories: z.array(z.string()).min(1, "Select at least one category"),
  maxSubscribers: z.number().min(0, "Max subscribers must be 0 or greater"),
  isPremium: z.boolean(),
  subscriptionPackages: z.array(z.string()).optional(),
  tipPricing: z.object({
    thirtyDays: z.number().min(0, "Price must be 0 or greater"),
    sixtyDays: z.number().min(0, "Price must be 0 or greater"),
    ninetyDays: z.number().min(0, "Price must be 0 or greater"),
  }),
})

type EditChannelFormData = z.infer<typeof editChannelSchema>

interface EditChannelModalProps {
  isOpen: boolean
  onClose: () => void
  channel: Channel | null
  creatorId: string
  onSave: (channelId: string, updatedData: Partial<Channel>) => Promise<void>
}

export function EditChannelModal({
  isOpen,
  onClose,
  channel,
  creatorId,
  onSave
}: EditChannelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImage, setProfileImage] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [profileImagePath, setProfileImagePath] = useState("")
  const [coverImagePath, setCoverImagePath] = useState("")

  const form = useForm<EditChannelFormData>({
    resolver: zodResolver(editChannelSchema),
    defaultValues: {
      channelName: "",
      channelDescription: "",
      channelLanguage: "",
      creatorRole: "",
      channelCategories: [],
      maxSubscribers: 0,
      isPremium: false,
      subscriptionPackages: [],
      tipPricing: {
        thirtyDays: 0,
        sixtyDays: 0,
        ninetyDays: 0,
      },
    },
  })

  // Populate form when channel changes
  useEffect(() => {
    if (channel && isOpen) {
      // Initialize form data
      form.reset({
        channelName: channel.name,
        channelDescription: channel.description,
        channelLanguage: (channel as any).channelLanguage || '',
        creatorRole: (channel as any).channelRole || '',
        channelCategories: (channel as any).channelCategories || [],
        maxSubscribers: channel.availability?.maxSlots || 0,
        isPremium: channel.type === 'premium',
        subscriptionPackages: channel.subscriptionPackages || [],
        tipPricing: {
          thirtyDays: channel.pricing?.thirtyDays || 0,
          sixtyDays: channel.pricing?.sixtyDays || 0,
          ninetyDays: channel.pricing?.ninetyDays || 0,
        },
      })

      // Initialize channel images
      const channelData = channel as any
      setProfileImage(channelData.channelAvatar || '')
      setCoverImage(channelData.channelCover || '')
      setProfileImagePath(channelData.channelAvatarPath || '')
      setCoverImagePath(channelData.channelCoverPath || '')
    }
  }, [channel, isOpen, form])

  const handleProfileImageUpdate = (imageUrl: string, path?: string) => {
    setProfileImage(imageUrl)
    setProfileImagePath(path || "")
  }

  const handleCoverImageUpdate = (imageUrl: string, path?: string) => {
    setCoverImage(imageUrl)
    setCoverImagePath(path || "")
  }

  const handleProfileImageRemove = () => {
    setProfileImage("")
    setProfileImagePath("")
  }

  const handleCoverImageRemove = () => {
    setCoverImage("")
    setCoverImagePath("")
  }

  const onSubmit = async (data: EditChannelFormData) => {
    if (!channel) return

    setIsSubmitting(true)
    try {
      // Prepare updated channel data
      const updatedChannel: Partial<Channel> = {
        name: data.channelName,
        description: data.channelDescription,
        type: data.isPremium ? "premium" : "free",
        price: data.isPremium && data.subscriptionPackages?.includes("30")
          ? (data.tipPricing.thirtyDays || 0)
          : 0,
        subscriptionPackages: data.isPremium ? data.subscriptionPackages : undefined,
        pricing: data.isPremium ? {
          thirtyDays: data.tipPricing.thirtyDays,
          sixtyDays: data.tipPricing.sixtyDays,
          ninetyDays: data.tipPricing.ninetyDays,
        } : undefined,
        availability: data.maxSubscribers > 0 ? {
          hasLimit: true,
          currentSlots: channel.availability?.currentSlots || 0,
          maxSlots: data.maxSubscribers,
          status: 'available' as const
        } : { hasLimit: false, status: 'available' as const },
        // Channel-specific data
        channelCategories: data.channelCategories,
        channelLanguage: data.channelLanguage,
        channelRole: data.creatorRole,
        // Channel-specific images (only update if new images were uploaded)
        ...(profileImage && { channelAvatar: profileImage }),
        ...(coverImage && { channelCover: coverImage }),
        ...(profileImagePath && { channelAvatarPath: profileImagePath }),
        ...(coverImagePath && { channelCoverPath: coverImagePath }),
      }

      await onSave(channel.id, updatedChannel)
      toast.success('Channel updated successfully!')
      onClose()
    } catch (error) {
      console.error('Failed to update channel:', error)
      toast.error('Failed to update channel')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    "Trading",
    "DeFi",
    "NFTs",
    "Market Analysis",
    "Education",
    "AI Education",
    "Algo Trading",
    "Farming",
    "Meme Coins"
  ]

  const languages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi"
  ]

  const roles = [
    "Trading Expert", "Technical Analyst", "Trading Bot Expert",
    "DeFi Specialist", "NFT Trader", "NFT Artist/Creator",
    "Market Analyst", "Crypto Educator", "AI Educator",
    "Algorithm Developer", "Yield Farmer", "Meme Coin Expert"
  ]

  if (!channel) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#030f1c] border-[#C0E6FF]/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Edit Channel: {channel.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">

            {/* Channel Images Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Channel Images</CardTitle>
                <p className="text-gray-400 text-sm">
                  Update your channel profile image and cover photo.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#C0E6FF]">Channel Profile Image</label>
                  <div className="flex items-center gap-4">
                    <SupabaseProfileImage
                      currentImage={profileImage}
                      currentPath={profileImagePath}
                      fallbackText={channel?.name?.charAt(0) || "C"}
                      size="xl"
                      onImageUpdate={handleProfileImageUpdate}
                      onImageRemove={handleProfileImageRemove}
                      editable={true}
                      className="border-2 border-[#4DA2FF]"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Recommended: 400x400px, max 5MB</p>
                      <p className="text-xs text-[#C0E6FF] mt-1">Click the avatar to upload or change image</p>
                    </div>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#C0E6FF]">Channel Cover Photo (Optional)</label>
                  <SupabaseCoverImage
                    currentImage={coverImage}
                    currentPath={coverImagePath}
                    onImageUpdate={handleCoverImageUpdate}
                    onImageRemove={handleCoverImageRemove}
                    editable={true}
                    height="h-32"
                  />
                  <p className="text-xs text-gray-400">Recommended: 1200x400px, max 5MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Channel Details Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Channel Details</CardTitle>
                <p className="text-gray-400 text-sm">
                  Basic information about your channel.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channel Name */}
                <FormField
                  control={form.control}
                  name="channelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C0E6FF]">Channel Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your channel name"
                          {...field}
                          className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Channel Description */}
                <FormField
                  control={form.control}
                  name="channelDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C0E6FF]">Channel Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what your channel offers..."
                          className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language and Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="channelLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#C0E6FF]">Primary Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/20">
                            {languages.map((language) => (
                              <SelectItem key={language} value={language} className="text-[#C0E6FF] hover:bg-[#1a2f51] focus:bg-[#1a2f51]">
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creatorRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#C0E6FF]">Your Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/20">
                            {roles.map((role) => (
                              <SelectItem key={role} value={role} className="text-[#C0E6FF] hover:bg-[#1a2f51] focus:bg-[#1a2f51]">
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Categories */}
                <FormField
                  control={form.control}
                  name="channelCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C0E6FF]">Categories (Select up to 3)</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((category) => {
                          const isSelected = field.value?.includes(category)
                          const canSelect = !isSelected && (field.value?.length || 0) < 3

                          return (
                            <FormItem key={category}>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={!canSelect && !isSelected}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || []
                                      if (checked) {
                                        field.onChange([...currentValues, category])
                                      } else {
                                        field.onChange(currentValues.filter((value) => value !== category))
                                      }
                                    }}
                                    className="border-[#C0E6FF]/20 data-[state=checked]:bg-[#4DA2FF] data-[state=checked]:border-[#4DA2FF]"
                                  />
                                  <label className={`text-sm ${isSelected ? 'text-[#4DA2FF]' : canSelect ? 'text-[#C0E6FF]' : 'text-gray-500'}`}>
                                    {category}
                                  </label>
                                </div>
                              </FormControl>
                            </FormItem>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Channel Settings Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Channel Settings</CardTitle>
                <p className="text-gray-400 text-sm">
                  Configure your channel settings and access.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max Subscribers */}
                <FormField
                  control={form.control}
                  name="maxSubscribers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C0E6FF]">Maximum Subscribers (0 = unlimited)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing & Packages Section */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="text-white">Pricing & Packages</CardTitle>
                <p className="text-gray-400 text-sm">
                  Set up premium access and pricing for your channel.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Premium Toggle */}
                <FormField
                  control={form.control}
                  name="isPremium"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#C0E6FF]/20 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-[#C0E6FF]">
                          Premium Channel
                        </FormLabel>
                        <div className="text-sm text-gray-400">
                          Enable paid subscriptions for your channel
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#4DA2FF]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Subscription Packages - only show if premium */}
                {form.watch("isPremium") && (
                  <>
                    <FormField
                      control={form.control}
                      name="subscriptionPackages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#C0E6FF]">Subscription Packages</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { value: "30", label: "30 Days", key: "thirtyDays" },
                              { value: "60", label: "60 Days", key: "sixtyDays" },
                              { value: "90", label: "90 Days", key: "ninetyDays" },
                            ].map((pkg) => (
                              <FormItem key={pkg.value}>
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(pkg.value)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || []
                                        if (checked) {
                                          field.onChange([...currentValues, pkg.value])
                                        } else {
                                          field.onChange(currentValues.filter((value) => value !== pkg.value))
                                        }
                                      }}
                                      className="border-[#C0E6FF]/20 data-[state=checked]:bg-[#4DA2FF] data-[state=checked]:border-[#4DA2FF]"
                                    />
                                    <label className="text-sm text-[#C0E6FF]">
                                      {pkg.label}
                                    </label>
                                  </div>
                                </FormControl>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="tipPricing.thirtyDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C0E6FF]">30 Days Price (SUI)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipPricing.sixtyDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C0E6FF]">60 Days Price (SUI)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipPricing.ninetyDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C0E6FF]">90 Days Price (SUI)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white placeholder:text-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#C0E6FF]/20 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                {isSubmitting ? "Updating..." : "Update Channel"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
