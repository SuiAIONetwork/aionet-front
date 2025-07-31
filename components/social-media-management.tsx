"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  X,
  Users,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useProfile } from '@/contexts/profile-context'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import Image from "next/image"

interface SocialLink {
  platform: string
  username: string
  verified: boolean
  following_aionet?: boolean
  profile_url?: string
}

export function SocialMediaManagement() {
  const { profile, updateProfile } = useProfile()
  const { user } = useSuiAuth()
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newLink, setNewLink] = useState({ platform: '', username: '' })
  const [isVerifying, setIsVerifying] = useState<string | null>(null)

  // Load existing social links
  useEffect(() => {
    if (profile?.social_links) {
      setSocialLinks(profile.social_links)
    }
  }, [profile?.social_links])

  const platforms = [
    { id: 'X', name: 'X (Twitter)', icon: X, color: '#1DA1F2', placeholder: '@username' }
  ]

  const addSocialLink = async () => {
    if (!newLink.username.trim()) {
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
      username: newLink.username.trim(),
      verified: false,
      following_aionet: false
    }

    const updatedLinks = [...socialLinks, socialLink]
    setSocialLinks(updatedLinks)

    // Save to profile
    await updateSocialLinks(updatedLinks)

    setNewLink({ platform: '', username: '' })
    toast.success('X account connected successfully')
  }

  const removeSocialLink = async (platform: string) => {
    const updatedLinks = socialLinks.filter(link => link.platform !== platform)
    setSocialLinks(updatedLinks)
    await updateSocialLinks(updatedLinks)
    toast.success(`${platform} account removed`)
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

  const verifyXFollowing = async (platform: string) => {
    if (platform !== 'X') return

    const xLink = socialLinks.find(link => link.platform === platform)
    if (!xLink) {
      toast.error('Please add your X account first')
      return
    }

    setIsVerifying(platform)
    try {
      // Honor system: Just mark as followed without verification
      await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay for UX

      // Update local state
      const updatedLinks = socialLinks.map(link => {
        if (link.platform === platform) {
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

      toast.success('🎉 Achievement claimed! Thank you for following @AIONET_Official')
    } catch (error) {
      console.error('Failed to claim achievement:', error)
      toast.error('Failed to claim achievement. Please try again.')
    } finally {
      setIsVerifying(null)
    }
  }

  const openXProfile = () => {
    window.open('https://twitter.com/AIONET_Official', '_blank')
  }

  const getPlatformIcon = (platformId: string) => {
    if (platformId === 'X') {
      return ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
        <Image
          src="/images/social/x.png"
          alt="X (Twitter) icon"
          width={20}
          height={20}
          className={className}
          style={style}
        />
      )
    }
    // Fallback to Lucide icon for other platforms
    const platform = platforms.find(p => p.id === platformId)
    return platform?.icon || X
  }

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    return platform?.color || '#1DA1F2'
  }

  return (
    <Card className="bg-[#030f1c] border border-[#C0E6FF]/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Image
            src="/images/social/x.png"
            alt="X (Twitter) icon"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          Follow AIONET on X
        </CardTitle>
        <p className="text-[#C0E6FF] text-sm">
          Follow @AIONET_Official on X (Twitter) and claim your achievement reward
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Social Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Your X Account</h4>
            {socialLinks.map((link) => {
              const IconComponent = getPlatformIcon(link.platform)
              const color = getPlatformColor(link.platform)
              
              return (
                <div key={link.platform} className="flex items-center justify-between p-3 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" style={{ color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{link.platform}</span>
                        {link.verified && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {link.following_aionet && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            Following AIONET
                          </Badge>
                        )}
                      </div>
                      <span className="text-[#C0E6FF] text-sm">{link.username}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {link.platform === 'X' && !link.following_aionet && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => verifyXFollowing(link.platform)}
                            disabled={isVerifying === link.platform}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                          >
                            {isVerifying === link.platform ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              'Claim Achievement'
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Claim your achievement for following @AIONET_Official</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {link.profile_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.profile_url, '_blank')}
                        className="text-[#C0E6FF] hover:bg-[#C0E6FF]/10 p-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSocialLink(link.platform)}
                      className="text-red-400 hover:bg-red-500/10 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add X Account */}
        {!socialLinks.some(link => link.platform === 'X') && (
          <div className="space-y-4">
            <h4 className="text-white font-medium">Add Your X Username</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="username" className="text-[#C0E6FF] text-sm">X Username</Label>
                <Input
                  id="username"
                  value={newLink.username}
                  onChange={(e) => setNewLink(prev => ({ ...prev, username: e.target.value, platform: 'X' }))}
                  placeholder="@username"
                  className="mt-1 bg-[#1a2f51] border-[#C0E6FF]/30 text-white"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={addSocialLink}
                  disabled={isLoading || !newLink.username.trim()}
                  className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Username
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* X Follow Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h5 className="text-blue-300 font-medium mb-2">How to Earn the Achievement</h5>
              <p className="text-blue-200 text-sm mb-3">
                Follow these simple steps to earn 100 XP and 75 pAION tokens:
              </p>
              <ol className="text-blue-200 text-sm space-y-1 mb-3">
                <li>1. Add your X username above</li>
                <li>2. Follow @AIONET_Official on X (Twitter)</li>
                <li>3. Click "Claim Achievement" to get your reward</li>
              </ol>
              <div className="flex gap-2">
                <Button
                  onClick={openXProfile}
                  size="sm"
                  className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white"
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
              </div>
              <p className="text-blue-300 text-xs mt-2 opacity-75">
                Honor system: We trust you to follow before claiming the achievement
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
