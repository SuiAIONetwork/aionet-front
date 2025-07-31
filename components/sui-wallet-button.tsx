"use client"

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

function SuiWalletButtonContent() {
  try {
    const account = useCurrentAccount()

    if (account) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sui
          </Badge>
          <div className="sui-connect-button-wrapper">
            <ConnectButton />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[#4DA2FF]" />
        <div className="sui-connect-button-wrapper">
          <ConnectButton />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Sui wallet button error:', error)
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="w-4 h-4 mr-2" />
        Sui Wallet
      </Button>
    )
  }
}

export function SuiWalletButton() {
  return (
    <Suspense fallback={
      <Button variant="outline" size="sm" disabled>
        <Wallet className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    }>
      <SuiWalletButtonContent />
    </Suspense>
  )
}
