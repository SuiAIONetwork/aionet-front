"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Copy,
  Send,
  ArrowDownToLine,
  LogOut,
  Wallet,
  RefreshCw,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react'
import { useCurrentAccount, useDisconnectWallet, useSuiClientQuery } from '@mysten/dapp-kit'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useAvatar } from '@/contexts/avatar-context'
import { useProfile } from '@/contexts/profile-context'

import { useSubscription } from '@/contexts/subscription-context'
import { useTokens } from '@/contexts/points-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PaionIcon } from './paion-icon'
import { nftMintingService } from '@/lib/nft-minting-service'
import { DepositModal } from './deposit-modal'
import { SendModal } from './send-modal'

export function TraditionalWalletDisplay() {
  const router = useRouter()
  const account = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const { user, signOut, formatAddress } = useSuiAuth()
  const { profile } = useProfile()
  const { getAvatarUrl, getFallbackText } = useAvatar()
  const { tier } = useSubscription()
  const { balance: paionBalance, isLoading: paionLoading } = useTokens()

  // State for collapsible NFT collections
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({})

  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [nftImages, setNftImages] = useState<{[key: string]: string}>({})
  const [activeTab, setActiveTab] = useState<'wallet' | 'nfts'>('wallet')

  // USDC contract address on Sui testnet
  const USDC_COIN_TYPE = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'



  // Query for SUI balance
  const { data: suiBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: '0x2::sui::SUI',
    },
    {
      enabled: !!account?.address,
    }
  )

  // Query for USDC balance
  const { data: usdcBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: USDC_COIN_TYPE,
    },
    {
      enabled: !!account?.address,
    }
  )

  const suiAmount = suiBalance ? parseInt(suiBalance.totalBalance) / 1000000000 : 0
  const usdcAmount = usdcBalance ? parseInt(usdcBalance.totalBalance) / 1000000 : 0 // USDC has 6 decimals

  const copyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address)
        setCopiedAddress(true)
        toast.success('Address copied to clipboard!')
        setTimeout(() => setCopiedAddress(false), 2000)
      } catch (error) {
        toast.error('Failed to copy address')
      }
    }
  }

  const handleSignOut = async () => {
    // Disconnect wallet first
    disconnectWallet()
    // Then sign out from the app
    await signOut()
    setIsOpen(false)
    toast.success('Signed out successfully')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  // Helper function to decode NFT type
  const decodeNFTType = (nftData: any): string => {
    console.log('🔧 decodeNFTType called with:', nftData)
    console.log('🔧 Available fields:', Object.keys(nftData || {}))

    const decodeBytes = (bytes: any): string => {
      console.log('🔧 decodeBytes called with:', bytes, 'type:', typeof bytes)
      if (Array.isArray(bytes)) {
        try {
          const decoded = new TextDecoder().decode(new Uint8Array(bytes))
          console.log('🔧 Decoded array to string:', decoded)
          return decoded
        } catch (error) {
          console.log('🔧 Failed to decode array:', error)
          return 'Unknown'
        }
      }
      const result = bytes?.toString() || 'Unknown'
      console.log('🔧 Converted to string:', result)
      return result
    }

    let nftType = 'Unknown'

    // Check all possible field names where the tier might be stored
    const possibleFields = [
      'collection_type',
      'tier',
      'type',
      'name',
      'collection',
      'nft_type',
      'category'
    ]

    for (const field of possibleFields) {
      console.log(`🔧 Checking ${field}:`, nftData?.[field])
      if (nftData?.[field]) {
        nftType = decodeBytes(nftData[field])
        console.log(`🔧 Got type from ${field}:`, nftType)

        // If we found a valid type, break early
        const cleanType = nftType.trim().toUpperCase()
        if (['PRO', 'ROYAL'].includes(cleanType)) {
          break
        }
      }
    }

    const cleanType = nftType.trim().toUpperCase()
    const finalType = ['PRO', 'ROYAL'].includes(cleanType) ? cleanType : 'Unknown'

    console.log('🔧 Final type detection:', {
      original: nftType,
      cleaned: cleanType,
      final: finalType,
      allFields: nftData
    })

    return finalType
  }

  // Function to fetch user's NFTs
  const fetchNFTs = async () => {
    if (!account?.address) return

    setIsLoadingNFTs(true)
    try {
      const nfts = await nftMintingService.getUserNFTs(account.address)
      setUserNFTs(nfts)
      console.log('Fetched user NFTs:', nfts)

      // Set up static NFT images based on type
      const imageMap: {[key: string]: string} = {}

      nfts.forEach((nft, index) => {
        const nftData = nft.data?.content?.fields
        const nftId = nft.data?.objectId
        let nftType = decodeNFTType(nftData)

        // Log if type detection fails - don't use fallback for now
        if (nftType === 'Unknown') {
          console.log(`⚠️ Could not detect type for NFT ${nftId} at index ${index}`)
          console.log('⚠️ NFT data structure:', nftData)
          // Keep as Unknown so we can debug the actual data structure
        }

        // Simple assignment: PRO = pro-nft.png, ROYAL = royal-nft.png
        if (nftType === 'PRO') {
          imageMap[nftId] = '/images/nfts/pro-nft.png'
        } else if (nftType === 'ROYAL') {
          imageMap[nftId] = '/images/nfts/royal-nft.png'
        }

        console.log(`🖼️ NFT ${nftId} is ${nftType} -> ${imageMap[nftId]}`)
      })

      console.log('🗺️ Static image map:', imageMap)
      setNftImages(imageMap)

      // Test if images are accessible
      Object.entries(imageMap).forEach(([nftId, imagePath]) => {
        const img = new Image()
        img.onload = () => console.log(`✅ Image accessible: ${imagePath}`)
        img.onerror = () => console.error(`❌ Image not accessible: ${imagePath}`)
        img.src = imagePath
      })

    } catch (error) {
      console.error('Failed to fetch NFTs:', error)
      setUserNFTs([])
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Fetch NFTs on address change
  useEffect(() => {
    fetchNFTs()
  }, [account?.address])

  // Refresh NFTs when popover opens
  useEffect(() => {
    if (isOpen && account?.address) {
      fetchNFTs()
    }
  }, [isOpen, account?.address])

  const toggleCollection = (collectionType: string) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionType]: !prev[collectionType]
    }))
  }

  if (!account?.address) {
    return null
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#1a2f51] border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10 px-3 py-2 h-auto"
        >
          <div className="flex items-center gap-3">
            {/* Wallet Icon */}
            <Wallet className="w-5 h-5 text-green-400" />
            {/* User Avatar */}
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl()} alt={profile?.username || user?.username} />
              <AvatarFallback className="bg-[#4DA2FF] text-white text-xs">
                {getFallbackText()}
              </AvatarFallback>
            </Avatar>
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-96 bg-[#0c1b36] border-[#1e3a8a] text-white" side="right">
        <SheetHeader>
          <SheetTitle className="text-[#C0E6FF]">My SUI Wallet</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
          {/* Header with avatar and address */}
          <div className="flex items-center gap-2">
            {/* User Avatar */}
            <Avatar className="h-16 w-16">
              <AvatarImage src={getAvatarUrl()} alt={user?.username} />
              <AvatarFallback className="bg-[#4DA2FF] text-white text-sm">
                {getFallbackText()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-white">
                  {formatAddress(account.address)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0 hover:bg-[#1e3a8a] transition-colors"
                >
                  <Copy className={`h-3 w-3 ${copiedAddress ? 'text-green-400' : 'text-[#C0E6FF]'}`} />
                </Button>
              </div>
              <p className="text-sm text-[#C0E6FF]">{profile?.username || user?.username || 'Anonymous User'}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[#1a2f51]/30 rounded-lg p-1">
            <Button
              variant={activeTab === 'wallet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 ${
                activeTab === 'wallet'
                  ? 'bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white'
                  : 'text-[#C0E6FF] hover:bg-[#C0E6FF]/10'
              }`}
            >
              Wallet
            </Button>
            <Button
              variant={activeTab === 'nfts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('nfts')}
              className={`flex-1 ${
                activeTab === 'nfts'
                  ? 'bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white'
                  : 'text-[#C0E6FF] hover:bg-[#C0E6FF]/10'
              }`}
            >
              NFTs
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'wallet' && (
            <>
              {/* Balance */}
              <div className="bg-[#1a2f51]/50 rounded-lg p-3">
                <div className="text-sm text-[#C0E6FF] mb-2 font-medium">Balance</div>
                <div className="space-y-2">
                  {/* SUI Balance */}
                  <div className="flex items-center justify-between p-2 bg-[#0c1b36]/30 border border-[#C0E6FF]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <img
                        src="/images/logo-sui.png"
                        alt="SUI"
                        className="w-7 h-7 object-contain"
                      />
                      <span className="text-white font-medium">{suiAmount.toFixed(4)}</span>
                    </div>
                    <span className="text-[#C0E6FF] text-sm font-medium">SUI</span>
                  </div>
                  {/* USDC Balance */}
                  <div className="flex items-center justify-between p-2 bg-[#0c1b36]/30 border border-[#C0E6FF]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <img
                        src="/images/usdc-logo.png"
                        alt="USDC"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-white font-medium">{usdcAmount.toFixed(2)}</span>
                    </div>
                    <span className="text-[#C0E6FF] text-sm font-medium">USDC</span>
                  </div>
                  {/* pAION Balance */}
                  <div className="flex items-center justify-between p-2 bg-[#0c1b36]/30 border border-[#C0E6FF]/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PaionIcon size={24} />
                      <span className="text-white font-medium">
                        {paionLoading ? '...' : paionBalance.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[#C0E6FF] text-sm font-medium">pAION</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setShowSendModal(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowDepositModal(true)}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {/* TODO: Implement swap functionality */}}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Swap
                </Button>
              </div>
            </>
          )}

          {activeTab === 'nfts' && (
            <>
              {/* AIONET NFTs */}
              <div className="bg-[#1a2f51]/50 rounded-lg p-3">
                <div className="text-sm text-[#C0E6FF] mb-2">AIONET NFTs</div>

            {userNFTs.length > 0 ? (() => {
              // Map and group NFTs by collection
              const nftsByCollection = userNFTs.reduce((acc, nft, index) => {
                const nftData = nft.data?.content?.fields
                const nftId = nft.data?.objectId
                let nftType = decodeNFTType(nftData)

                if (nftType === 'Unknown') {
                  console.log(`⚠️ Display: Could not detect type for NFT ${nftId} at index ${index}`)
                  nftType = 'Unknown'
                }

                if (!acc[nftType]) {
                  acc[nftType] = []
                }
                acc[nftType].push({ nft, nftData, nftId, nftType, index })
                return acc
              }, {} as Record<string, any[]>)

              // Sort collections: PRO first, then ROYAL, then others
              const sortedCollections = Object.entries(nftsByCollection).sort(([a], [b]) => {
                const order = { 'PRO': 0, 'ROYAL': 1, 'Unknown': 2 }
                return (order[a as keyof typeof order] ?? 3) - (order[b as keyof typeof order] ?? 3)
              })

              return (
                <div className="space-y-4">
                  {sortedCollections.map(([collectionType, nfts]) => {
                    const typedNfts = nfts as any[]
                    return (
                    <div key={collectionType} className="space-y-3">
                      {/* Collection Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer hover:bg-[#1a2f51]/30 p-2 rounded-lg transition-colors"
                        onClick={() => toggleCollection(collectionType)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-4 h-4 text-[#C0E6FF] transition-transform ${
                            expandedCollections[collectionType] ? 'rotate-180' : ''
                          }`} />
                          <div className={`w-3 h-3 rounded-full ${
                            collectionType === 'PRO' ? 'bg-blue-500' :
                            collectionType === 'ROYAL' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`} />
                          <span className="text-white font-medium">
                            {collectionType === 'Unknown' ? 'Other NFTs' : `${collectionType} Collection`}
                          </span>
                        </div>
                        <div className="bg-[#4DA2FF]/20 text-[#4DA2FF] px-2 py-1 rounded-full text-xs font-medium">
                          {typedNfts.length} owned
                        </div>
                      </div>

                      {/* Collection NFTs */}
                      {expandedCollections[collectionType] && (
                        <div className={`grid gap-3 ${
                          typedNfts.length === 1 ? 'grid-cols-1 justify-items-center' :
                          typedNfts.length === 2 ? 'grid-cols-2' :
                          'grid-cols-2 md:grid-cols-3'
                        }`}>
                        {typedNfts.map(({ nft, nftData, nftId, nftType, index }) => (
                          <div
                            key={nftId || index}
                            className="flex flex-col items-center gap-2"
                          >
                            {/* NFT Image */}
                            {nftImages[nftId] ? (
                              <img
                                src={nftImages[nftId]}
                                alt={`${nftType} NFT`}
                                className="w-24 h-24 rounded-lg object-cover border-2 border-[#4DA2FF]"
                                onLoad={() => {
                                  console.log(`✅ Successfully loaded image: ${nftImages[nftId]}`)
                                }}
                                onError={(e) => {
                                  console.error(`❌ Failed to load image: ${nftImages[nftId]} for ${nftType} NFT`)
                                }}
                              />
                            ) : (
                              <div className={`w-24 h-24 rounded-lg flex items-center justify-center ${
                                nftType === 'PRO' ? 'bg-blue-500' :
                                nftType === 'ROYAL' ? 'bg-yellow-500' :
                                'bg-purple-500'
                              }`}>
                                <span className="text-lg font-bold text-white">
                                  {nftType === 'PRO' ? 'P' : nftType === 'ROYAL' ? 'R' : 'N'}
                                </span>
                              </div>
                            )}

                            {/* Explorer Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs bg-[#1a2f51] border-[#4DA2FF] text-[#4DA2FF] hover:bg-[#4DA2FF] hover:text-white"
                              onClick={() => {
                                const explorerUrl = `https://suiscan.xyz/testnet/object/${nftId}`
                                window.open(explorerUrl, '_blank')
                              }}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              )
            })() : (
              <div className="text-center py-3">
                <div className="text-[#C0E6FF] text-sm">No NFTs owned</div>
                <div className="text-[#C0E6FF]/60 text-xs mt-1">
                  Mint NFTs to unlock exclusive features
                </div>
              </div>
            )}
              </div>
            </>
          )}



          {/* Menu Items */}
          <div className="space-y-0.5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Deposit Modal */}
    <DepositModal
      isOpen={showDepositModal}
      onClose={() => setShowDepositModal(false)}
      walletAddress={account?.address || null}
      suiBalance={suiAmount}
      usdcBalance={usdcAmount}
    />

    {/* Send Modal */}
    <SendModal
      isOpen={showSendModal}
      onClose={() => setShowSendModal(false)}
      walletAddress={account?.address || null}
      suiBalance={suiAmount}
      usdcBalance={usdcAmount}
      walBalance={0}
      paionBalance={paionBalance}
      isZkLogin={false}
    />
  </>
  )
}
