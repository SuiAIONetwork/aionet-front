"use client"

import { useEffect, useState } from 'react'
import { useCurrentAccount, useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { getAuthSession } from '@/lib/auth-cookies'
import { useZkLogin } from './zklogin-provider'

/**
 * Component that handles automatic wallet reconnection on page reload
 * based on saved session data
 */
export function WalletReconnection() {
  const currentAccount = useCurrentAccount()
  const { mutate: connectWallet } = useConnectWallet()
  const wallets = useWallets()
  const { zkLoginUserAddress } = useZkLogin()
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false)

  useEffect(() => {
    // Only attempt reconnection once and if no wallet is currently connected
    if (hasAttemptedReconnect || currentAccount?.address || zkLoginUserAddress) {
      return
    }

    const attemptReconnection = async () => {
      try {
        // Check if we have a saved session
        const session = getAuthSession()

        if (!session) {
          setHasAttemptedReconnect(true)
          return
        }

        // Only attempt wallet reconnection for wallet-type sessions
        if (session.connectionType !== 'wallet') {
          setHasAttemptedReconnect(true)
          return
        }

        console.log('Attempting to reconnect wallet based on saved session...')

        // Wait for wallets to be available
        if (wallets.length === 0) {
          console.log('No wallets available yet, retrying...')
          setTimeout(attemptReconnection, 1000)
          return
        }

        // Try multiple sources for the last connected wallet
        let walletName: string | null = null

        // Method 1: Check our custom storage
        const lastConnection = localStorage.getItem('sui-wallet-last-connection')
        if (lastConnection) {
          try {
            const connectionData = JSON.parse(lastConnection)
            // We'll try to match by address later
          } catch (e) {
            console.log('Failed to parse last connection data')
          }
        }

        // Method 2: Check the dapp-kit storage
        const dappKitConnection = localStorage.getItem('sui-wallet-connection')
        if (dappKitConnection) {
          try {
            const connectionData = JSON.parse(dappKitConnection)
            walletName = connectionData.walletName || connectionData.name || connectionData
          } catch {
            // If parsing fails, assume the value is the wallet name directly
            walletName = dappKitConnection
          }
        }

        // Method 3: Try to find a wallet that was recently connected
        if (!walletName) {
          // Look for any wallet that might have been connected
          const availableWallets = wallets.filter(wallet =>
            wallet.features['standard:connect'] &&
            wallet.accounts &&
            wallet.accounts.length > 0
          )

          if (availableWallets.length > 0) {
            walletName = availableWallets[0].name
            console.log(`Using first available connected wallet: ${walletName}`)
          }
        }

        if (!walletName) {
          console.log('No wallet name found for reconnection')
          setHasAttemptedReconnect(true)
          return
        }

        // Find the wallet in available wallets
        const targetWallet = wallets.find(wallet =>
          wallet.name === walletName ||
          wallet.name.toLowerCase() === walletName.toLowerCase()
        )

        if (!targetWallet) {
          console.log(`Wallet "${walletName}" not found in available wallets:`, wallets.map(w => w.name))
          setHasAttemptedReconnect(true)
          return
        }

        // Check if the wallet is installed and ready
        if (!targetWallet.features['standard:connect']) {
          console.log(`Wallet "${walletName}" does not support connection`)
          setHasAttemptedReconnect(true)
          return
        }

        console.log(`Attempting to reconnect to ${targetWallet.name}...`)

        // Attempt to connect to the wallet
        connectWallet(
          { wallet: targetWallet },
          {
            onSuccess: (result) => {
              console.log('Wallet reconnected successfully:', result)

              // Verify the address matches our session
              if (result.accounts?.[0]?.address === session.address) {
                console.log('Wallet address matches saved session')
              } else {
                console.warn('Wallet address does not match saved session')
                console.log('Expected:', session.address)
                console.log('Got:', result.accounts?.[0]?.address)
              }
            },
            onError: (error) => {
              console.log('Failed to reconnect wallet:', error)
              // Don't show error to user as this is automatic reconnection
            }
          }
        )

      } catch (error) {
        console.error('Error during wallet reconnection:', error)
      } finally {
        setHasAttemptedReconnect(true)
      }
    }

    // Add a small delay to ensure all providers are initialized
    const timer = setTimeout(attemptReconnection, 2000) // Increased delay

    return () => clearTimeout(timer)
  }, [
    currentAccount?.address,
    zkLoginUserAddress,
    hasAttemptedReconnect,
    connectWallet,
    wallets
  ])

  // This component doesn't render anything
  return null
}

/**
 * Enhanced wallet connection hook that includes session-based reconnection
 */
export function useWalletWithSession() {
  const currentAccount = useCurrentAccount()
  const { zkLoginUserAddress } = useZkLogin()
  const [isReconnecting, setIsReconnecting] = useState(false)

  // Check if we should be connected based on session
  const shouldBeConnected = () => {
    const session = getAuthSession()
    return session && session.connectionType === 'wallet'
  }

  // Check if we're in a disconnected state when we should be connected
  const isDisconnectedUnexpectedly = () => {
    return shouldBeConnected() && !currentAccount?.address && !zkLoginUserAddress
  }

  // Manual reconnection function
  const reconnect = async () => {
    if (isReconnecting) return false

    setIsReconnecting(true)
    
    try {
      const session = getAuthSession()
      if (!session || session.connectionType !== 'wallet') {
        return false
      }

      // Try to get the last connected wallet
      const lastConnectedWallet = localStorage.getItem('sui-wallet-connection')
      if (!lastConnectedWallet) {
        return false
      }

      // For now, we'll rely on the WalletProvider's autoConnect
      // In a real implementation, you might want to trigger reconnection here
      
      return true
    } catch (error) {
      console.error('Manual reconnection failed:', error)
      return false
    } finally {
      setIsReconnecting(false)
    }
  }

  return {
    currentAccount,
    zkLoginUserAddress,
    isConnected: !!(currentAccount?.address || zkLoginUserAddress),
    shouldBeConnected: shouldBeConnected(),
    isDisconnectedUnexpectedly: isDisconnectedUnexpectedly(),
    isReconnecting,
    reconnect
  }
}

/**
 * Hook to save wallet connection info for reconnection
 */
export function useWalletConnectionPersistence() {
  const currentAccount = useCurrentAccount()

  useEffect(() => {
    if (currentAccount?.address) {
      // Save additional connection info for better reconnection
      const connectionInfo = {
        address: currentAccount.address,
        connectedAt: new Date().toISOString(),
        // Add more wallet-specific info if needed
      }
      
      localStorage.setItem('sui-wallet-last-connection', JSON.stringify(connectionInfo))
      console.log('Wallet connection info saved for reconnection')
    }
  }, [currentAccount?.address])

  return {
    currentAccount
  }
}
