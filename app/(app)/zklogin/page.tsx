/**
 * zkLogin Main Page
 * Entry point for zkLogin authentication and testing
 */

"use client"


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ZkLoginPage() {
  return (
    <div className="min-h-screen bg-dashboard-dark p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-[#4DA2FF]" />
            <h1 className="text-4xl font-bold text-white">
              zkLogin
            </h1>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Beta
            </Badge>
          </div>
          <p className="text-[#C0E6FF] text-xl max-w-3xl mx-auto">
            Experience the future of Web3 authentication. Login with your social accounts 
            and get a Sui wallet address without managing private keys.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#0c1b36] border-[#1e3a8a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#4DA2FF]" />
                No Private Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#C0E6FF] text-sm">
                No need to remember seed phrases or manage private keys. 
                Your wallet is secured by your social login and zero-knowledge proofs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1b36] border-[#1e3a8a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#4DA2FF]" />
                Privacy First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#C0E6FF] text-sm">
                Zero-knowledge proofs ensure your social identity is never 
                linked to your on-chain address. Complete privacy guaranteed.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1b36] border-[#1e3a8a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4DA2FF]" />
                Social Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#C0E6FF] text-sm">
                Login with Google, Facebook, Twitch, and more. 
                Familiar authentication flow with Web3 capabilities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Demo Section */}
        <Card className="bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white">zkLogin Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-[#C0E6FF] text-lg">zkLogin demo components have been removed.</p>
              <p className="text-[#C0E6FF] text-sm mt-2">This functionality is currently under maintenance.</p>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white text-2xl">How zkLogin Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#4DA2FF] font-bold">1</span>
                </div>
                <h3 className="text-white font-medium">Social Login</h3>
                <p className="text-[#C0E6FF] text-sm">
                  Choose your preferred social provider and complete OAuth authentication
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#4DA2FF] font-bold">2</span>
                </div>
                <h3 className="text-white font-medium">Generate Proof</h3>
                <p className="text-[#C0E6FF] text-sm">
                  Zero-knowledge proof is generated to verify your identity without revealing it
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#4DA2FF] font-bold">3</span>
                </div>
                <h3 className="text-white font-medium">Create Address</h3>
                <p className="text-[#C0E6FF] text-sm">
                  Your unique Sui wallet address is derived from your social identity
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#4DA2FF]/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-[#4DA2FF] font-bold">4</span>
                </div>
                <h3 className="text-white font-medium">Start Trading</h3>
                <p className="text-[#C0E6FF] text-sm">
                  Use your wallet to interact with Sui dApps and make transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="bg-[#0c1b36] border-[#1e3a8a]">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">What's Protected:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Your social identity is never revealed on-chain
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    No permanent private keys stored anywhere
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Ephemeral keys expire automatically
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Two-factor authentication (OAuth + salt)
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-white font-medium">How It's Secured:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Zero-knowledge proofs (Groth16 zkSNARK)
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Cryptographic ceremony with 100+ participants
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Audited by multiple security firms
                  </li>
                  <li className="flex items-center gap-2 text-[#C0E6FF] text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Native Sui blockchain integration
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links and Resources */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-[#0c1b36] border-[#1e3a8a]">
            <CardHeader>
              <CardTitle className="text-white">Learn More</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href="https://docs.sui.io/concepts/cryptography/zklogin" 
                target="_blank"
                className="flex items-center justify-between p-3 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg hover:bg-[#C0E6FF]/5 transition-colors"
              >
                <span className="text-[#C0E6FF]">Sui zkLogin Documentation</span>
                <ExternalLink className="w-4 h-4 text-[#4DA2FF]" />
              </Link>
              <Link 
                href="/zklogin-test" 
                className="flex items-center justify-between p-3 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg hover:bg-[#C0E6FF]/5 transition-colors"
              >
                <span className="text-[#C0E6FF]">Advanced Testing Interface</span>
                <ArrowRight className="w-4 h-4 text-[#4DA2FF]" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1b36] border-[#1e3a8a]">
            <CardHeader>
              <CardTitle className="text-white">Get Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href="https://discord.gg/sui" 
                target="_blank"
                className="flex items-center justify-between p-3 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg hover:bg-[#C0E6FF]/5 transition-colors"
              >
                <span className="text-[#C0E6FF]">Join Sui Discord</span>
                <ExternalLink className="w-4 h-4 text-[#4DA2FF]" />
              </Link>
              <Link 
                href="https://docs.sui.io/guides/developer/getting-started/get-coins" 
                target="_blank"
                className="flex items-center justify-between p-3 bg-[#030F1C] border border-[#C0E6FF]/30 rounded-lg hover:bg-[#C0E6FF]/5 transition-colors"
              >
                <span className="text-[#C0E6FF]">Get Test SUI Tokens</span>
                <ExternalLink className="w-4 h-4 text-[#4DA2FF]" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
