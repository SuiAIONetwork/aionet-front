"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  ExternalLink, 
  Info, 
  Zap,
  Server,
  Wallet,
  ArrowRight
} from 'lucide-react'

export function ZkLoginServiceNotice() {
  const enokiConfigured = !!process.env.NEXT_PUBLIC_ENOKI_API_KEY
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK

  if (enokiConfigured) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Zap className="w-5 h-5" />
            Enoki zkLogin Enabled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-300">
            <Info className="w-4 h-4" />
            <p>
              Your app is now using Enoki for zkLogin functionality on {network}.
              The mint button should work properly now!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-orange-500/10 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <AlertTriangle className="w-5 h-5" />
          zkLogin Service Update Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-orange-300">
          <p className="mb-3">
            The free Mysten Labs zkLogin proving service has been deprecated. To continue using zkLogin, 
            you need to choose one of the following options:
          </p>
        </div>

        <div className="space-y-3">
          {/* Option 1: Enoki */}
          <div className="bg-[#030F1C] border border-[#1a2f51] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">Option 1: Enoki (Recommended)</h3>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Easiest
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  Use Mysten Labs' official Enoki service for production-ready zkLogin with managed infrastructure.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://docs.enoki.mystenlabs.com/', '_blank')}
                    className="text-green-400 border-green-400 hover:bg-green-400/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Enoki Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://portal.enoki.mystenlabs.com', '_blank')}
                    className="text-green-400 border-green-400 hover:bg-green-400/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Get API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Self-hosted */}
          <div className="bg-[#030F1C] border border-[#1a2f51] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">Option 2: Self-hosted Proving Service</h3>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Advanced
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  Run your own proving service using Docker. Requires 16+ cores and 16GB+ RAM.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://docs.sui.io/guides/developer/cryptography/zklogin-integration#run-the-proving-service-in-your-backend', '_blank')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Setup Guide
                </Button>
              </div>
            </div>
          </div>

          {/* Option 3: Traditional Wallet */}
          <div className="bg-[#030F1C] border border-[#1a2f51] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">Option 3: Traditional Wallet</h3>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    Quick Fix
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  Use Sui Wallet browser extension instead of zkLogin for immediate testing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank')}
                  className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Install Sui Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-blue-300 text-sm">
              <p className="font-medium mb-1">For immediate testing:</p>
              <p>
                Install the Sui Wallet browser extension and connect with a traditional wallet. 
                You can implement Enoki later for production.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-400">
            This change affects all zkLogin applications using the free proving service.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://docs.sui.io/concepts/cryptography/zklogin', '_blank')}
            className="text-gray-400 hover:text-white"
          >
            Learn More
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
