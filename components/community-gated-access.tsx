"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleImage } from "@/components/ui/role-image"
import { ExternalLink, Users, Shield, CheckCircle, Crown } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import Image from "next/image"

// Social Media Icon Component using actual image files
const SocialIcon = ({
  platform,
  className = "w-5 h-5",
  style
}: {
  platform: 'discord' | 'telegram' | 'x';
  className?: string;
  style?: React.CSSProperties
}) => {
  const iconPaths = {
    discord: "/images/social/discord.png",
    telegram: "/images/social/telegram.png",
    x: "/images/social/x.png"
  }

  return (
    <Image
      src={iconPaths[platform]}
      alt={`${platform} icon`}
      width={20}
      height={20}
      className={className}
      style={style}
    />
  )
}



export function CommunityGatedAccess() {
  const { tier } = useSubscription()
  const { user } = useSuiAuth()
  const [discordSynced, setDiscordSynced] = useState(false)
  const [telegramSynced, setTelegramSynced] = useState(false)
  const [isConnecting, setIsConnecting] = useState<'discord' | 'telegram' | null>(null)

  const hasNFT = tier === "PRO" || tier === "ROYAL"

  // NFT Data based on current tier
  const nftData = [
    {
      id: 'pro',
      name: 'AIONET PRO',
      type: 'PRO' as const,
      owned: tier === 'PRO' || tier === 'ROYAL',
      benefits: ['Crypto Trading Bots', 'Community Access', 'AIO Creators'],
      mintDate: tier === 'PRO' || tier === 'ROYAL' ? '2024-01-15' : undefined,
      contractAddress: '0x5164c0f7a1f2f68b266feeccca0ced8e6ed68166'
    },
    {
      id: 'royal',
      name: 'AIONET ROYAL',
      type: 'ROYAL' as const,
      owned: tier === 'ROYAL',
      benefits: ['All PRO Benefits', 'Forex Trading Bots', 'VIP Support', 'Exclusive Events'],
      mintDate: tier === 'ROYAL' ? '2024-02-20' : undefined,
      contractAddress: '0x0ff1e228e6a95aa69c76bdcb366e3e6fe1a614d3'
    },
    {
      id: 'special',
      name: 'Special Access NFT',
      type: 'SPECIAL' as const,
      owned: false, // This would be determined by actual NFT ownership check
      benefits: ['Exclusive Features', 'Special Rewards', 'Governance Rights'],
      mintDate: undefined,
      contractAddress: '0x870467a76281b5db1e0d861c3d113f3829861104'
    }
  ]

  const getNFTColor = (type: string) => {
    switch (type) {
      case 'PRO':
        return 'from-[#4DA2FF] to-[#011829]'
      case 'ROYAL':
        return 'from-yellow-400 to-yellow-600'
      case 'SPECIAL':
        return 'from-purple-400 to-purple-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getNFTIcon = (type: string) => {
    switch (type) {
      case 'PRO':
        return <RoleImage role="PRO" size="sm" />
      case 'ROYAL':
        return <RoleImage role="ROYAL" size="sm" />
      case 'NODEME':
        return <Crown className="w-4 h-4 text-white" />
      default:
        return <Shield className="w-4 h-4 text-white" />
    }
  }

  const handleDiscordJoin = () => {
    window.open('https://discord.gg/aionet', '_blank')
  }

  const handleDiscordSync = () => {
    if (!hasNFT) return
    setIsConnecting('discord')
    // Simulate role sync
    setTimeout(() => {
      setDiscordSynced(true)
      setIsConnecting(null)
    }, 2000)
  }

  const handleTelegramJoin = () => {
    window.open('https://t.me/aionet_official', '_blank')
  }

  const handleTelegramSync = () => {
    if (!hasNFT) return
    setIsConnecting('telegram')
    // Simulate role sync
    setTimeout(() => {
      setTelegramSynced(true)
      setIsConnecting(null)
    }, 2000)
  }



  return (
    <div className="space-y-6">
      {/* Social Media Access Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Discord Access Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <SocialIcon platform="discord" className="w-5 h-5" />
              <h3 className="font-semibold">Discord Access</h3>
            </div>
            <div className="space-y-4">
              <p className="text-[#C0E6FF] text-sm">
                Join our exclusive Discord server for tech discussions, blockchain insights, and AIO Connect engagement.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleDiscordJoin}
                  className="w-full bg-[#5865F2] hover:bg-[#5865F2]/80 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Discord Server
                </Button>

                {hasNFT && (
                  <Button
                    onClick={handleDiscordSync}
                    disabled={discordSynced || isConnecting === 'discord'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isConnecting === 'discord' ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Syncing Role...
                      </>
                    ) : discordSynced ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Role Synced
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Sync {tier} Role
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!hasNFT && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    <Shield className="w-4 h-4 inline mr-1" />
                    NFT required for role sync
                  </p>
                </div>
              )}

              {discordSynced && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Your {tier} role has been synced successfully!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telegram Access Card */}
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <SocialIcon platform="telegram" className="w-5 h-5" />
              <h3 className="font-semibold">Telegram Access</h3>
            </div>
            <div className="space-y-4">
              <p className="text-[#C0E6FF] text-sm">
                Join our exclusive Telegram channel for real-time updates, trading signals, and community discussions.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleTelegramJoin}
                  className="w-full bg-[#0088cc] hover:bg-[#0088cc]/80 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Telegram Channel
                </Button>

                {hasNFT && (
                  <Button
                    onClick={handleTelegramSync}
                    disabled={telegramSynced || isConnecting === 'telegram'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isConnecting === 'telegram' ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Syncing Role...
                      </>
                    ) : telegramSynced ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Role Synced
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Sync {tier} Role
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!hasNFT && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    <Shield className="w-4 h-4 inline mr-1" />
                    NFT required for role sync
                  </p>
                </div>
              )}

              {telegramSynced && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Your {tier} role has been synced successfully!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Access Information */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-2 text-white mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Gated Access Information</h3>
          </div>
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-4 p-4 bg-[#030F1C] rounded-lg border border-[#C0E6FF]/20">
              <Avatar className="h-16 w-16 bg-blue-100">
                <AvatarImage src={user?.profileImage} alt={user?.username || 'User'} />
                <AvatarFallback className="bg-[#4DA2FF] text-white text-lg font-semibold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">
                  {user?.username || 'User'}
                </h4>
                <p className="text-[#C0E6FF] text-sm font-mono">
                  {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'No wallet connected'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <RoleImage role={tier} size="sm" />
                  <Badge className={`${
                    tier === 'ROYAL' ? 'bg-yellow-500 text-black' :
                    tier === 'PRO' ? 'bg-blue-600 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {tier}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Access Level and Current Tier */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-white font-medium mb-2">Access Level</h4>
                <p className="text-[#C0E6FF] text-sm">
                  {hasNFT ? 'Full access to exclusive channels and features' : 'Basic access - upgrade for premium features'}
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Member Since</h4>
                <p className="text-[#C0E6FF] text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* NFTs Owned Section */}
            <div>
              <h4 className="text-white font-medium mb-3">AIONET NFTs Owned</h4>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                {nftData.map((nft) => (
                  <div
                    key={nft.id}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      nft.owned
                        ? 'bg-gradient-to-br from-[#4DA2FF]/20 to-[#011829]/20 border-[#4DA2FF]/50'
                        : 'bg-[#030F1C] border-[#C0E6FF]/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-full bg-gradient-to-r ${getNFTColor(nft.type)}`}>
                        {getNFTIcon(nft.type)}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white text-sm font-medium">{nft.name}</h5>
                        <p className="text-[#C0E6FF] text-xs">
                          {nft.owned ? `Minted: ${nft.mintDate}` : 'Not Owned'}
                        </p>
                      </div>
                    </div>
                    {nft.owned && (
                      <div className="text-xs text-green-400">
                        ✓ Owned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!hasNFT && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Upgrade Your Access</h4>
              <p className="text-[#C0E6FF] text-sm mb-3">
                Purchase a PRO or ROYAL NFT to unlock exclusive features, role sync, and premium content access.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                View Subscription Plans
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
