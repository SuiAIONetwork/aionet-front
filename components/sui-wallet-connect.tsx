"use client"

import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SuiWalletConnect() {
  const account = useCurrentAccount()
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Query for owned objects when connected
  const { data: ownedObjects } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      options: {
        showType: true,
        showContent: true,
      },
    },
    {
      enabled: !!account?.address,
    }
  )

  const copyAddress = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address)
      setCopiedAddress(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#1a2f51] rounded-xl">
            <Wallet className="w-6 h-6 text-[#4DA2FF]" />
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold">Sui Wallet</h3>
            <p className="text-[#C0E6FF] text-sm">Connect your Sui wallet to interact with dApps</p>
          </div>
        </div>

        {!account ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-[#C0E6FF] mb-4">
                Connect your Sui wallet to access blockchain features and interact with our dApps.
              </p>
              <div className="sui-connect-button-wrapper">
                <ConnectButton />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-[#FFFFFF] font-medium text-sm">Supported Features:</h4>
              <ul className="space-y-1">
                {[
                  'Connect to Sui Network',
                  'View wallet balance',
                  'Interact with dApps',
                  'Sign transactions',
                  'View owned objects'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <div className="w-1.5 h-1.5 bg-[#4DA2FF] rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#4DA2FF]/10 rounded-lg border border-[#4DA2FF]/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Wallet Connected</span>
              </div>
              <Badge className="bg-[#4DA2FF] text-white">
                Sui Network
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[#C0E6FF] text-sm font-medium">Wallet Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg text-[#FFFFFF] text-sm font-mono">
                    {formatAddress(account.address)}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAddress}
                    className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {ownedObjects && (
                <div>
                  <label className="text-[#C0E6FF] text-sm font-medium">Owned Objects</label>
                  <div className="mt-1 px-3 py-2 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg">
                    <span className="text-[#FFFFFF] text-sm">
                      {ownedObjects.data.length} objects found
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                onClick={() => window.open('https://suiexplorer.com/address/' + account.address + '?network=devnet', '_blank')}
                className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-[#FFFFFF]"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Sui Explorer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
