/**
 * Unified Wallet Connect Component
 * Combines traditional wallet connection with zkLogin social authentication
 */

"use client"

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit'
import { useZkLogin } from './zklogin-provider'
import { SimpleLegacyZkLogin } from './simple-legacy-zklogin'
import { ZkLoginWalletDisplay } from './zklogin-wallet-display'
import { TraditionalWalletDisplay } from './traditional-wallet-display'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Wallet,
  Shield
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function UnifiedWalletConnect() {
  const suiAccount = useCurrentAccount()
  const { zkLoginUserAddress, initiateZkLogin } = useZkLogin()
  const [isOpen, setIsOpen] = useState(false)
  const isConnectingRef = useRef(false)
  const router = useRouter()

  // Determine connection state and display
  const getConnectionState = () => {
    if (suiAccount) {
      return {
        isConnected: true,
        address: suiAccount.address,
        type: 'Crypto Wallet',
        icon: <Wallet className="w-4 h-4 text-green-400" />,
        color: 'text-green-400'
      }
    }
    
    if (zkLoginUserAddress) {
      return {
        isConnected: true,
        address: zkLoginUserAddress,
        type: 'zkLogin',
        icon: <Shield className="w-4 h-4 text-orange-400" />,
        color: 'text-orange-400'
      }
    }

    return {
      isConnected: false,
      address: null,
      type: null,
      icon: <Wallet className="w-4 h-4 text-white" />,
      color: 'text-white'
    }
  }

  const connectionState = getConnectionState()

  // Auto-close dialog when wallet connects successfully (only during connection process)
  useEffect(() => {
    if (suiAccount && isConnectingRef.current) {
      // We just connected during a connection process
      isConnectingRef.current = false

      // Small delay to let the user see the connection success
      const timeoutId = setTimeout(() => {
        setIsOpen(false)
        toast.success('Wallet connected successfully!')

        // Redirect to profile page
        setTimeout(() => {
          router.push('/profile')
        }, 500) // Additional delay after modal closes
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [suiAccount])

  // Connected state - show appropriate wallet display
  if (connectionState.isConnected) {
    // For zkLogin users, use the zkLogin wallet display
    if (zkLoginUserAddress && !suiAccount) {
      return <ZkLoginWalletDisplay />
    }

    // For traditional wallet users, use the traditional wallet display
    if (suiAccount) {
      return <TraditionalWalletDisplay />
    }
  }

  // Not connected - show connect dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#4DA2FF]/25"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#0c1b36] border-[#1e3a8a] text-white max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-white">
            Login to your account
          </DialogTitle>
          <p className="text-[#C0E6FF] text-sm">
            Own your game. Trade securely on AIONET.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Legacy zkLogin Google Button */}
          <SimpleLegacyZkLogin
            onSuccess={(address, method) => {
              console.log(`Connected via ${method}:`, address)
              toast.success(`Connected successfully via ${method}!`)
              setIsOpen(false) // Close the modal

              // Redirect to profile page
              setTimeout(() => {
                router.push('/profile')
              }, 500) // Small delay to let the modal close
            }}
            onError={(error) => {
              console.error('Social login error:', error)
              toast.error(`Login failed: ${error}`)
            }}
          />

          {/* Separator */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#C0E6FF]/20"></div>
            <span className="text-[#C0E6FF]/60 text-sm">Or continue with</span>
            <div className="flex-1 h-px bg-[#C0E6FF]/20"></div>
          </div>

          {/* Wallet Connect Button */}
          <div
            className="w-full"
            onClick={() => {
              // Mark that we're in a connection process
              if (!suiAccount) {
                isConnectingRef.current = true
              }
            }}
          >
            <ConnectButton
              connectText="Connect Wallet"
              className="w-full bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white py-3 rounded-lg font-medium"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
