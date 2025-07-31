"use client"

import React, { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Upload, Trash2, AlertCircle, CheckCircle, Loader2, Database, HardDrive } from 'lucide-react'
import { useAvatar } from '@/contexts/avatar-context'
import { supabaseStorage } from '@/lib/supabase-storage'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EnhancedAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  editable?: boolean
  className?: string
  showStorageInfo?: boolean
  showDeleteButton?: boolean
  showStatusIndicator?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
  '2xl': 'h-44 w-44'
}

export function EnhancedAvatar({
  size = 'xl',
  editable = true,
  className,
  showStorageInfo = false,
  showDeleteButton = true,
  showStatusIndicator = false
}: EnhancedAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  // No storage epochs needed for Supabase Storage
  const {
    avatarData,
    isLoading: avatarLoading,
    error: avatarError,
    updateAvatar,
    removeAvatar,
    getAvatarUrl,
    getFallbackText,
    clearError
  } = useAvatar()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 Avatar file selection triggered')
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('✅ Avatar file selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type)
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      toast.error('Image size should be less than 5MB')
      return
    }

    console.log('✅ File validation passed')
    setSelectedFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      console.log('✅ Avatar preview URL created')
    }
    reader.readAsDataURL(file)

    setIsDialogOpen(true)
    console.log('✅ Avatar upload dialog opened')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log('❌ No file selected for avatar upload')
      return
    }

    console.log('🚀 Starting avatar upload process...', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      storageMethod: 'Supabase Storage'
    })

    clearError()

    try {
      console.log('📤 Calling updateAvatar function...')
      const success = await updateAvatar(selectedFile, {
        upsert: true
      })

      console.log('📊 Avatar upload result:', { success })

      if (success) {
        console.log('✅ Avatar upload successful, resetting dialog state')
        // Reset state
        setSelectedFile(null)
        setPreviewUrl('')
        setIsDialogOpen(false)
      } else {
        console.log('❌ Avatar upload failed')
      }
    } catch (error) {
      console.error('❌ Avatar upload failed with error:', error)
      toast.error('Failed to upload avatar')
    }
  }

  const handleRemove = async () => {
    const success = await removeAvatar()
    if (success) {
      setIsDialogOpen(false)
    }
  }

  const handleQuickUpload = () => {
    fileInputRef.current?.click()
  }

  // No cost calculation needed for Supabase Storage

  const currentImageUrl = getAvatarUrl()
  const fallbackText = getFallbackText()

  return (
    <>
      <div className={cn("relative group", className)}>
        <Avatar className={cn(
          sizeClasses[size],
          "bg-blue-100 border-4 border-[#C0E6FF]/20",
          className
        )}>
          <AvatarImage
            src={currentImageUrl}
            alt="Profile"
            className="object-cover"
            onLoad={() => console.log('✅ Avatar image loaded successfully:', currentImageUrl)}
            onError={(e) => console.error('❌ Avatar image failed to load:', currentImageUrl, e)}
          />
          <AvatarFallback className="bg-[#4DA2FF] text-white text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* Loading indicator */}
        {avatarLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* AIONET Status Indicator */}
        {showStatusIndicator && (
          <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full shadow-lg">
            <img
              src="/images/animepfp/AIONETmin.png"
              alt="AIONET Status"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        )}

        {editable && (
          <>
            {/* Upload overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={handleQuickUpload}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>

            {/* Remove button (only show if image exists and showDeleteButton is true) */}
            {currentImageUrl && showDeleteButton && (
              <button
                onClick={handleRemove}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors duration-200"
                title="Remove avatar"
              >
                ×
              </button>
            )}

            {/* Storage indicator - Updated for Supabase */}
            {showStorageInfo && avatarData.url && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" title="Stored on Supabase">
                <HardDrive className="w-3 h-3" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden file input for quick upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0A1628] border-[#C0E6FF]/20">
          <DialogHeader>
            <DialogTitle className="text-[#C0E6FF]">Update Avatar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {previewUrl && (
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={previewUrl} alt="Preview" />
                  <AvatarFallback>{fallbackText}</AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Current storage info */}
            {(avatarData.path || avatarData.url) && (
              <div className="p-3 bg-[#030f1c] rounded border border-[#C0E6FF]/20">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-green-400" />
                    <span className="text-[#C0E6FF]">Currently stored on Supabase</span>
                  </div>
                  {avatarData.path && (
                    <div className="text-[#C0E6FF]/70">Path: {avatarData.path}</div>
                  )}
                  {avatarData.lastUpdated && (
                    <div className="text-[#C0E6FF]/70">
                      Updated: {new Date(avatarData.lastUpdated).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Storage status */}
            <div className="flex items-center justify-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Supabase Storage Ready</span>
            </div>

            {/* File info */}
            {selectedFile && (
              <div className="space-y-2">
                <div className="text-sm text-[#C0E6FF]/70">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>

              </div>
            )}

            {/* Error display */}
            {avatarError && (
              <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{avatarError}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setSelectedFile(null)
                  setPreviewUrl('')
                }}
                className="border-[#C0E6FF]/20 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || avatarLoading}
                className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                {avatarLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Update Avatar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
