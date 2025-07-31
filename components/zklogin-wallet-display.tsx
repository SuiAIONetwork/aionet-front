"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  ChevronDown,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react'
import { useZkLogin } from './zklogin-provider'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useSuiClientQuery } from '@mysten/dapp-kit'
import { useAvatar } from '@/contexts/avatar-context'
import { nftMintingService } from '@/lib/nft-minting-service'
import { useProfile } from '@/contexts/profile-context'

import { useSubscription } from '@/contexts/subscription-context'
import { useTokens } from '@/contexts/points-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PaionIcon } from './paion-icon'
import { DepositModal } from './deposit-modal'
import { SendModal } from './send-modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface JWTPayload {
  email?: string
  name?: string
  picture?: string
  sub: string
  iss: string
  aud: string
}

export function ZkLoginWalletDisplay() {
  const router = useRouter()
  const { zkLoginUserAddress, jwt, reset: resetZkLogin } = useZkLogin()
  const { user, signOut, formatAddress } = useSuiAuth()
  const { profile } = useProfile()
  const { getAvatarUrl, getFallbackText } = useAvatar()
  const { tier } = useSubscription()
  const { balance: paionBalance, isLoading: paionLoading } = useTokens()

  // State for collapsible NFT collections
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({})

  const [copiedAddress, setCopiedAddress] = useState(false)
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [nftImages, setNftImages] = useState<{[key: string]: string}>({})
  const [activeTab, setActiveTab] = useState<'wallet' | 'nfts'>('wallet')

  // USDC contract addresses for different networks
  const USDC_COIN_TYPES = {
    devnet: '0x2::sui::SUI', // For devnet, we'll use SUI as USDC equivalent for testing
    testnet: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
    mainnet: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
  }

  const currentNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as keyof typeof USDC_COIN_TYPES) || 'devnet'
  const USDC_COIN_TYPE = USDC_COIN_TYPES[currentNetwork]

  // Query for SUI balance
  const { data: suiBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: zkLoginUserAddress || '',
      coinType: '0x2::sui::SUI',
    },
    {
      enabled: !!zkLoginUserAddress,
    }
  )

  // Query for USDC balance
  const { data: usdcBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: zkLoginUserAddress || '',
      coinType: USDC_COIN_TYPE,
    },
    {
      enabled: !!zkLoginUserAddress,
    }
  )

  const suiAmount = suiBalance ? parseInt(suiBalance.totalBalance) / 1000000000 : 0
  const usdcAmount = usdcBalance ? parseInt(usdcBalance.totalBalance) / 1000000 : 0 // USDC has 6 decimals

  // Extract email and other info from JWT
  useEffect(() => {
    if (jwt) {
      try {
        const payload = jwt.split('.')[1]
        const decodedPayload: JWTPayload = JSON.parse(atob(payload))
        setJwtPayload(decodedPayload)
        console.log('Extracted JWT payload:', decodedPayload)
      } catch (error) {
        console.error('Failed to decode JWT:', error)
      }
    }
  }, [jwt])

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
    if (!zkLoginUserAddress) return

    setIsLoadingNFTs(true)
    try {
      console.log('🔍 Fetching NFTs for address:', zkLoginUserAddress)

      // Debug: Check all owned objects first
      const { SuiClient } = await import('@mysten/sui/client')
      const suiClient = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io' })

      const allObjects = await suiClient.getOwnedObjects({
        owner: zkLoginUserAddress,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      })

      console.log('🔍 All owned objects:', allObjects.data)
      console.log('🔍 Total objects owned:', allObjects.data.length)

      // Now try to get NFTs specifically
      const nfts = await nftMintingService.getUserNFTs(zkLoginUserAddress)
      setUserNFTs(nfts)
      console.log('🎨 Fetched NFTs:', nfts)
      console.log('🎨 NFT count:', nfts.length)

      // Debug: Check recent transactions
      try {
        const transactions = await suiClient.queryTransactionBlocks({
          filter: {
            FromAddress: zkLoginUserAddress
          },
          limit: 10,
          options: {
            showEffects: true,
            showEvents: true,
            showInput: true
          }
        })

        console.log('📋 Recent transactions:', transactions.data)

        // Look for NFT minting transactions
        const mintTransactions = transactions.data.filter(tx =>
          tx.transaction?.data?.transaction?.kind === 'ProgrammableTransaction' &&
          JSON.stringify(tx).includes('mint_nft')
        )

        console.log('🎯 Mint transactions found:', mintTransactions)

        // Check for any created objects in recent transactions
        transactions.data.forEach((tx, index) => {
          if (tx.effects?.created && tx.effects.created.length > 0) {
            console.log(`📦 Transaction ${index} created objects:`, tx.effects.created)
          }
        })

      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      }

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
  }, [zkLoginUserAddress])

  // Refresh NFTs when popover opens
  useEffect(() => {
    if (isOpen && zkLoginUserAddress) {
      fetchNFTs()
    }
  }, [isOpen, zkLoginUserAddress])

  // Debug function for manual testing
  useEffect(() => {
    if (typeof window !== 'undefined' && zkLoginUserAddress) {
      // @ts-ignore - Adding to window for debugging
      window.debugNFTs = async () => {
        console.log('🔧 Manual NFT Debug for:', zkLoginUserAddress)
        await fetchNFTs()
      }

      // @ts-ignore - Adding to window for debugging
      window.checkNFTContract = async () => {
        const { SuiClient } = await import('@mysten/sui/client')
        const suiClient = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io' })

        const contractConfig = nftMintingService.getContractConfig()
        console.log('📋 Contract Config:', contractConfig)

        try {
          const packageInfo = await suiClient.getObject({
            id: contractConfig.PACKAGE_ID,
            options: { showContent: true, showType: true }
          })
          console.log('📦 Package Info:', packageInfo)
        } catch (error) {
          console.error('❌ Failed to get package info:', error)
        }
      }

      console.log('🔧 Debug functions available:')
      console.log('  - window.debugNFTs() - Check NFTs for current user')
      console.log('  - window.checkNFTContract() - Check contract deployment')
    }
  }, [zkLoginUserAddress])

  const copyAddress = async () => {
    if (zkLoginUserAddress) {
      try {
        await navigator.clipboard.writeText(zkLoginUserAddress)
        setCopiedAddress(true)
        toast.success('Address copied to clipboard!')
        setTimeout(() => setCopiedAddress(false), 2000)
      } catch (error) {
        toast.error('Failed to copy address')
      }
    }
  }

  const handleSignOut = async () => {
    // Reset zkLogin first
    resetZkLogin()
    // Then sign out from the app
    await signOut()
    setIsOpen(false)
    toast.success('Signed out successfully')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  const toggleCollection = (collectionType: string) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionType]: !prev[collectionType]
    }))
  }

  if (!zkLoginUserAddress || !jwtPayload) {
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
          <div className="flex items-center">
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
          {/* Header with avatar, address and email */}
          <div className="flex items-center gap-2">
            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl()} alt={user?.username} />
              <AvatarFallback className="bg-[#4DA2FF] text-white text-sm">
                {getFallbackText()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-white">
                  {formatAddress(zkLoginUserAddress)}
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
              <p className="text-sm text-[#C0E6FF]">{jwtPayload.email}</p>
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
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">$</span>
                      </div>
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
      walletAddress={zkLoginUserAddress}
      suiBalance={suiAmount}
      usdcBalance={usdcAmount}
    />

    {/* Send Modal */}
    <SendModal
      isOpen={showSendModal}
      onClose={() => setShowSendModal(false)}
      walletAddress={zkLoginUserAddress}
      suiBalance={suiAmount}
      usdcBalance={usdcAmount}
      walBalance={0}
      paionBalance={paionBalance}
      isZkLogin={true}
    />
  </>
  )
}
