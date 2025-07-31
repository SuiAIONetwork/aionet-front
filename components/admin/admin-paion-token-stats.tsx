"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Wallet, 
  PieChart,
  ExternalLink,
  Copy,
  CheckCircle,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"

// Admin and treasury wallet addresses
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
const TREASURY_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'
const ROYALTIES_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface PaionTokenStats {
  totalSupply: number
  circulatingSupply: number
  totalHolders: number
  averageBalance: number
  topHolders: Array<{
    address: string
    balance: number
    percentage: number
  }>
  treasuryBalance: number
  royaltiesBalance: number
}

interface CopyButtonProps {
  text: string
  label: string
}

function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )
}

export function AdminPaionTokenStats() {
  const [stats, setStats] = useState<PaionTokenStats>({
    totalSupply: 0,
    circulatingSupply: 0,
    totalHolders: 0,
    averageBalance: 0,
    topHolders: [],
    treasuryBalance: 0,
    royaltiesBalance: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchTokenStats()
  }, [])

  const fetchTokenStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/paion-stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch pAION stats')
      }

      const data = await response.json()

      if (data.success) {
        console.log('📊 pAION stats received:', data.stats)
        setStats(data.stats)
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('Error fetching pAION stats:', error)
      toast.error('Failed to load pAION token statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K'
    }
    return num.toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const openInExplorer = (address: string) => {
    const explorerUrl = `https://testnet.suivision.xyz/account/${address}`
    window.open(explorerUrl, '_blank')
  }

  return (
    <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-[#C0E6FF]/10 p-2"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-400" />
              pAION Token Analytics
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">Comprehensive token statistics and distribution</p>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Supply */}
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Supply</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : formatNumber(stats.totalSupply)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">pAION tokens</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-full">
                  <Coins className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">All minted tokens</span>
              </div>
            </div>

            {/* Circulating Supply */}
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Circulating Supply</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : formatNumber(stats.circulatingSupply)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isLoading ? '0' : stats.totalSupply > 0 ?
                      ((stats.circulatingSupply / stats.totalSupply) * 100).toFixed(1) : '0'}% of total
                  </p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <PieChart className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-400">Tokens in circulation</span>
              </div>
            </div>

            {/* Total Holders */}
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Holders</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : stats.totalHolders.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Unique addresses</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-400">
                  Avg: {isLoading ? '0' : formatNumber(stats.averageBalance)} pAION
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Treasury Wallet */}
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Wallet className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Treasury Wallet</h3>
                    <p className="text-sm text-gray-400">Main treasury address</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <div className="flex items-center">
                    <code className="text-sm text-white bg-black/30 px-2 py-1 rounded">
                      {formatAddress(TREASURY_ADDRESS)}
                    </code>
                    <CopyButton text={TREASURY_ADDRESS} label="Treasury address" />
                    <button
                      onClick={() => openInExplorer(TREASURY_ADDRESS)}
                      className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                      title="View in explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-xl font-bold text-green-400">
                    {isLoading ? '...' : formatNumber(stats.treasuryBalance)} pAION
                  </p>
                </div>
              </div>
            </div>

            {/* Royalties Wallet */}
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-2 rounded-full">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Royalties Wallet</h3>
                    <p className="text-sm text-gray-400">NFT royalties address</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <div className="flex items-center">
                    <code className="text-sm text-white bg-black/30 px-2 py-1 rounded">
                      {formatAddress(ROYALTIES_ADDRESS)}
                    </code>
                    <CopyButton text={ROYALTIES_ADDRESS} label="Royalties address" />
                    <button
                      onClick={() => openInExplorer(ROYALTIES_ADDRESS)}
                      className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                      title="View in explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {isLoading ? '...' : formatNumber(stats.royaltiesBalance)} pAION
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Holders Section */}
          {!isLoading && stats.topHolders.length > 0 && (
            <div className="bg-[#1a2f51] border border-[#C0E6FF]/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500/20 p-2 rounded-full">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Top Token Holders</h3>
                  <p className="text-sm text-gray-400">Distribution of pAION tokens by address</p>
                </div>
              </div>

              <div className="space-y-3">
                {stats.topHolders.map((holder, index) => (
                  <div key={holder.address} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/20 rounded-full">
                        <span className="text-sm font-bold text-indigo-400">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-white bg-black/30 px-2 py-1 rounded">
                            {formatAddress(holder.address)}
                          </code>
                          <CopyButton text={holder.address} label="Address" />
                          <button
                            onClick={() => openInExplorer(holder.address)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="View in explorer"
                          >
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {holder.address === TREASURY_ADDRESS ? 'Treasury Wallet' :
                           holder.address === ROYALTIES_ADDRESS ? 'Royalties Wallet' :
                           holder.address === ADMIN_ADDRESS ? 'Admin Wallet' : 'User Wallet'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {formatNumber(holder.balance)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {holder.percentage.toFixed(2)}% of supply
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {stats.topHolders.length === 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Showing top 10 holders • Total holders: {stats.totalHolders.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
