"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Camera, Upload, Trash2, AlertCircle, CheckCircle, Loader2, ImageIcon } from 'lucide-react'
import { supabaseStorage, uploadChannelBanner, getImageUrl } from '@/lib/supabase-storage'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SupabaseCoverImageProps {
  currentImage?: string
  currentPath?: string
  onImageUpdate?: (imageUrl: string, path?: string) => void
  onImageRemove?: () => void
  editable?: boolean
  className?: string
  height?: string
}

export function SupabaseCoverImage({
  currentImage,
  currentPath,
  onImageUpdate,
  onImageRemove,
  editable = true,
  className,
  height = 'h-48'
}: SupabaseCoverImageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the display image URL
  const displayImageUrl = currentImage || getImageUrl(currentPath || null)

  const clearError = () => setError(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    clearError()

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (10MB limit for banners)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    clearError()
    setIsUploading(true)

    try {
      const result = await uploadChannelBanner(selectedFile)

      if (result.success && result.url && result.path) {
        // Update the parent component
        if (onImageUpdate) {
          onImageUpdate(result.url, result.path)
        }

        toast.success('Cover image uploaded successfully!')

        // Reset state
        setSelectedFile(null)
        setPreviewUrl('')
        setIsDialogOpen(false)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    if (onImageRemove) {
      onImageRemove()
    }
    setIsDialogOpen(false)
    toast.success('Cover image removed')
  }

  const resetSelection = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    clearError()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!editable) {
    return (
      <div className={cn('relative w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden', height, className)}>
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-white/50" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className={cn('relative w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden group cursor-pointer', height, className)}>
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Cover Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Image Preview */}
          <div className="relative w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            {(previewUrl || displayImageUrl) ? (
              <img
                src={previewUrl || displayImageUrl || undefined}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-white/50" />
              </div>
            )}
          </div>

          {/* Storage Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            {supabaseStorage.isAvailable() ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Supabase Storage Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-600">Storage Initializing...</span>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Cover Image
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Supports JPG, PNG, GIF up to 10MB. Recommended: 1200x400px
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {selectedFile && (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !supabaseStorage.isAvailable()}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetSelection}
                  variant="outline"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {!selectedFile && displayImageUrl && (
              <Button
                onClick={handleRemove}
                variant="destructive"
                className="flex-1"
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Cover
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SupabaseCoverImage
