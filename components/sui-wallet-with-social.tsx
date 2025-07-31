"use client"

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useZkLogin } from './zklogin-provider'
import { ZkLoginSocialLogin } from './zklogin-social-login'
import { EnhancedSocialLogin } from './enhanced-social-login'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wallet, CheckCircle, Users, Copy, ExternalLink } from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

export function SuiWalletWithSocial() {
  const suiAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const connectButtonRef = useRef<HTMLDivElement>(null)

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(true)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Determine wallet icon color based on connection status
  const getWalletIconColor = () => {
    if (suiAccount) return "text-green-400" // Green for crypto wallet
    if (zkLoginUserAddress) return "text-orange-400" // Orange for zkLogin
    return "text-white" // White when not connected
  }

  // Handle custom connect button click
  const handleConnectClick = () => {
    // Trigger the hidden ConnectButton
    const button = connectButtonRef.current?.querySelector('button')
    if (button) {
      button.click()
    }
  }

  // If either wallet is connected, show connected state
  if (suiAccount || zkLoginUserAddress) {
    const activeAddress = suiAccount?.address || zkLoginUserAddress
    const connectionType = suiAccount ? 'Wallet' : 'zkLogin'

    return (
      <div className="flex items-center gap-2">
        {/* Show regular connect button for wallet connections */}
        {suiAccount && (
          <div className="sui-connect-button-wrapper">
            <ConnectButton />
          </div>
        )}

        {/* Show address for zkLogin connections */}
        {zkLoginUserAddress && !suiAccount && (
          <div className="flex items-center gap-1">
            <code className="px-2 py-1 bg-[#030F1C] border border-[#C0E6FF]/30 rounded text-[#FFFFFF] text-xs font-mono">
              {formatAddress(zkLoginUserAddress)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyAddress(zkLoginUserAddress)}
              className="h-6 w-6 p-0 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            >
              {copiedAddress ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // If no wallet is connected, show connect options
  return (
    <div className="flex items-center gap-2">
      <Wallet className={`w-4 h-4 ${getWalletIconColor()}`} />

      {/* Hidden ConnectButton for functionality */}
      <div ref={connectButtonRef} className="hidden">
        <ConnectButton />
      </div>

      {/* Custom styled button */}
      <Button
        onClick={handleConnectClick}
        className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#4DA2FF]/25"
      >
        Connect
      </Button>
    </div>
  )
}

// Full modal component for DApps page or dedicated wallet page
export function SuiWalletModal() {
  const suiAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()

  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#1a2f51] rounded-xl">
            <Wallet className="w-6 h-6 text-[#4DA2FF]" />
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold">Connect to Sui</h3>
            <p className="text-[#C0E6FF] text-sm">Choose your preferred connection method</p>
          </div>
        </div>

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#030F1C] border border-[#1e3a8a]">
            <TabsTrigger 
              value="wallet" 
              className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white text-[#C0E6FF]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Crypto Wallet
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white text-[#C0E6FF]"
            >
              <Users className="w-4 h-4 mr-2" />
              Social Login
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-4">
            <Card className="bg-[#030F1C] border-[#1e3a8a]">
              <CardHeader>
                <CardTitle className="text-white text-base">Crypto Wallet</CardTitle>
                <p className="text-[#C0E6FF] text-sm">
                  Connect using your existing Sui wallet (Sui Wallet, Suiet, Ethos, etc.)
                </p>
              </CardHeader>
              <CardContent>
                {!suiAccount ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="sui-connect-button-wrapper">
                        <ConnectButton />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-[#FFFFFF] font-medium text-sm">Supported Wallets:</h4>
                      <ul className="space-y-1">
                        {[
                          'Sui Wallet (Official)',
                          'Suiet Wallet',
                          'Ethos Wallet',
                          'Martian Wallet',
                          'Glass Wallet'
                        ].map((wallet, index) => (
                          <li key={index} className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                            <div className="w-1.5 h-1.5 bg-[#4DA2FF] rounded-full"></div>
                            {wallet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Wallet Connected</span>
                      </div>
                      <Badge className="bg-[#4DA2FF] text-white">
                        Sui Network
                      </Badge>
                    </div>

                    <div>
                      <label className="text-[#C0E6FF] text-sm font-medium">Wallet Address</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg text-[#FFFFFF] text-sm font-mono">
                          {suiAccount.address.slice(0, 6)}...{suiAccount.address.slice(-4)}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(suiAccount.address)}
                          className="border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.open('https://suiexplorer.com/address/' + suiAccount.address + '?network=devnet', '_blank')}
                      className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Sui Explorer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <Card className="bg-[#030F1C] border-[#1e3a8a]">
              <CardHeader>
                <CardTitle className="text-white text-base">Social Login (zkLogin)</CardTitle>
                <p className="text-[#C0E6FF] text-sm">
                  Use your social accounts to create a Sui wallet address
                </p>
              </CardHeader>
              <CardContent>
                <EnhancedSocialLogin
                  onSuccess={(address, method) => {
                    console.log(`Connected via ${method}:`, address)
                  }}
                  onError={(error) => {
                    console.error('Social login error:', error)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
