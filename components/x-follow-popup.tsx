"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  X,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useProfile } from '@/contexts/profile-context'
import { useSuiAuth } from '@/contexts/sui-auth-context'

interface SocialLink {
  platform: string
  username: string
  verified: boolean
  following_aionet?: boolean
  profile_url?: string
}

interface XFollowPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function XFollowPopup({ isOpen, onClose }: XFollowPopupProps) {
  const { profile, updateProfile, refreshProfile } = useProfile()
  const { user } = useSuiAuth()
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Load existing social links
  useEffect(() => {
    if (profile?.social_links) {
      setSocialLinks(profile.social_links)
    }
  }, [profile?.social_links])

  const addXAccount = async () => {
    if (!newUsername.trim()) {
      toast.error('Please enter your X username')
      return
    }

    // Check if X account already exists
    const existingLink = socialLinks.find(link => link.platform === 'X')
    if (existingLink) {
      toast.error('You already have an X account connected')
      return
    }

    const socialLink: SocialLink = {
      platform: 'X',
      username: newUsername.trim(),
      verified: false,
      following_aionet: false
    }

    const updatedLinks = [...socialLinks, socialLink]
    setSocialLinks(updatedLinks)
    
    // Save to profile
    await updateSocialLinks(updatedLinks)
    
    setNewUsername('')
    toast.success('X account added successfully')
  }

  const removeXAccount = async () => {
    const updatedLinks = socialLinks.filter(link => link.platform !== 'X')
    setSocialLinks(updatedLinks)
    await updateSocialLinks(updatedLinks)
    toast.success('X account removed')
  }

  const updateSocialLinks = async (links: SocialLink[]) => {
    try {
      setIsLoading(true)
      await updateProfile({ social_links: links })
    } catch (error) {
      console.error('Failed to update social links:', error)
      toast.error('Failed to update social links')
    } finally {
      setIsLoading(false)
    }
  }

  const claimAchievement = async () => {
    const xLink = socialLinks.find(link => link.platform === 'X')
    if (!xLink) {
      toast.error('Please add your X account first')
      return
    }

    setIsVerifying(true)
    try {
      // Honor system: Just mark as followed without verification
      await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay for UX
      
      // Update local state
      const updatedLinks = socialLinks.map(link => {
        if (link.platform === 'X') {
          return {
            ...link,
            verified: true,
            following_aionet: true,
            profile_url: `https://twitter.com/${link.username.replace('@', '')}`
          }
        }
        return link
      })

      setSocialLinks(updatedLinks)
      await updateSocialLinks(updatedLinks)

      // Force refresh the profile data to update achievements
      if (refreshProfile) {
        await refreshProfile()
      }

      toast.success('🎉 Achievement claimed! Thank you for following @AIONET_Official')

      // Close popup after successful claim
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Failed to claim achievement:', error)
      toast.error('Failed to claim achievement. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const openXProfile = () => {
    window.open('https://twitter.com/AIONET_Official', '_blank')
  }

  const xAccount = socialLinks.find(link => link.platform === 'X')
  const hasFollowed = xAccount?.following_aionet || false

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#030f1c] border border-[#C0E6FF]/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Image
              src="/images/social/x.png"
              alt="X (Twitter) icon"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            Follow AIONET on X
          </DialogTitle>
          <DialogDescription className="text-[#C0E6FF]">
            Follow @AIONET_Official and claim your achievement for 100 XP + 75 pAION tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current X Account */}
          {xAccount && (
            <div className="space-y-3">
              <h4 className="text-white font-medium text-sm">Your X Account</h4>
              <div className="flex items-center justify-between p-3 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/social/x.png"
                    alt="X (Twitter) icon"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">X</span>
                      {hasFollowed && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Achievement Claimed
                        </Badge>
                      )}
                    </div>
                    <span className="text-[#C0E6FF] text-sm">{xAccount.username}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {xAccount.profile_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(xAccount.profile_url, '_blank')}
                      className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 p-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeXAccount}
                    className="text-red-400 hover:bg-red-500/10 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add X Account */}
          {!xAccount && (
            <div className="space-y-4">
              <h4 className="text-white font-medium text-sm">Add Your X Username</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="username" className="text-[#C0E6FF] text-sm">X Username</Label>
                  <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="@username"
                    className="mt-1 bg-[#1a2f51] border-[#C0E6FF]/30 text-white"
                  />
                </div>
                
                <Button
                  onClick={addXAccount}
                  disabled={isLoading || !newUsername.trim()}
                  className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Username
                </Button>
              </div>
            </div>
          )}

          {/* Achievement Claim */}
          {xAccount && !hasFollowed && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="text-blue-300 font-medium mb-2 text-sm">How to Claim Achievement</h5>
                    <ol className="text-blue-200 text-xs space-y-1 mb-3">
                      <li>1. Follow @AIONET_Official on X</li>
                      <li>2. Click "Claim Achievement" below</li>
                      <li>3. Get 100 XP + 75 pAION tokens</li>
                    </ol>
                    <p className="text-blue-300 text-xs opacity-75">
                      Honor system: We trust you to follow before claiming
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={openXProfile}
                  size="sm"
                  className="flex-1 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white"
                >
                  <Image
                    src="/images/social/x.png"
                    alt="X (Twitter) icon"
                    width={16}
                    height={16}
                    className="w-4 h-4 mr-2"
                  />
                  Follow @AIONET_Official
                </Button>
                
                <Button
                  onClick={claimAchievement}
                  disabled={isVerifying}
                  size="sm"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Claim Achievement
                </Button>
              </div>
            </div>
          )}

          {/* Already Claimed */}
          {hasFollowed && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h5 className="text-green-300 font-medium mb-1">Achievement Claimed!</h5>
              <p className="text-green-200 text-sm">
                Thank you for following @AIONET_Official
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
