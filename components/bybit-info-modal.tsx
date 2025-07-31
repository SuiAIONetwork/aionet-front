"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Shield, Activity, BarChart3, CheckCircle } from "lucide-react"

interface BybitInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BybitInfoModal({ isOpen, onClose }: BybitInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] bg-[#0f2746] border-[#1e3a8a] text-white overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            How AIONET Trading Bots Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-2">
          {/* Main Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-400 mb-1 text-sm">Important: AIONET is a Connection Service</h3>
                <p className="text-blue-100 text-xs leading-relaxed">
                  <strong>Bybit runs all the trading bots</strong> - AIONET simply connects you to these bots and
                  uses information provided by Bybit about your account so that you can have a detailed,
                  well-organized view and control over the bots that you follow on the Bybit platform.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4DA2FF]" />
              How It Works
            </h3>

            <div className="grid gap-2">
              <div className="flex items-start gap-2 p-2 bg-gray-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Follow Bots on Bybit</p>
                  <p className="text-[#C0E6FF] text-xs">Click "Follow in Bybit" to go to Bybit and follow the trading bot</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-gray-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Connect Your Bybit Account</p>
                  <p className="text-[#C0E6FF] text-xs">Provide your Bybit API keys to AIONET for account monitoring</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-gray-800/30 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Monitor & Control</p>
                  <p className="text-[#C0E6FF] text-xs">View detailed stats, performance, and manage your followed bots from AIONET</p>
                </div>
              </div>
            </div>
          </div>

          {/* What AIONET Provides */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#4DA2FF]" />
              What AIONET Provides
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Organized bot dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Real-time performance tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Detailed analytics & stats</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Centralized bot management</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Portfolio overview</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[#C0E6FF]">Risk management tools</span>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400 mb-1 text-sm">Security & Privacy</h4>
                <p className="text-yellow-100 text-xs">
                  Your API keys are encrypted and stored securely. AIONET only reads account information
                  and cannot execute trades or withdraw funds. You maintain full control of your Bybit account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-2 pt-3 border-t border-gray-700/30 flex-shrink-0">
          <Button
            onClick={() => window.open('https://www.bybit.com/copy-trading', '_blank')}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-8"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Visit Bybit
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-[#C0E6FF] text-[#C0E6FF] hover:bg-[#C0E6FF]/10 text-sm h-8 px-4"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
