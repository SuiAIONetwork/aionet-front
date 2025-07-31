"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, Clock, CreditCard, Crown, CheckCircle, DollarSign } from "lucide-react"

interface CycleExplanationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CycleExplanationModal({ isOpen, onClose }: CycleExplanationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] bg-[#0f2746] border-[#1e3a8a] text-white overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-[#4DA2FF]" />
            How Profit-Based Bot Cycles Work
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-2">
          {/* NOMAD Users Section */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">For NOMAD Users (Free Tier)</h3>
            </div>
            
            <div className="space-y-3 text-sm text-blue-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>First cycle is <strong>FREE</strong> when you follow a bot</span>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Each cycle completes when the bot achieves <strong>10% profit</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <span>Pay <strong>25 USDC</strong> after each completed cycle to continue</span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Bot continues working until the 10% profit target is reached</span>
              </div>
            </div>
          </div>

          {/* PRO & ROYAL Users Section */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-green-400">For PRO & ROYAL Users (NFT Holders)</h3>
            </div>
            
            <div className="space-y-3 text-sm text-green-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited access</strong> to all bots</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>No cycle payments</strong> required</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>View cycle progress and profit information</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Automatic cycle continuation after 10% profit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Premium support and features</span>
              </div>
            </div>
          </div>

          {/* How Payments Work */}
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#4DA2FF]" />
              Payment Process
            </h3>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#4DA2FF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">1</span>
                <span>Watch your bot's profit progress in real-time</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#4DA2FF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">2</span>
                <span>When 10% profit is achieved, you'll see "Cycle Complete"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#4DA2FF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">3</span>
                <span>Click "Pay 25 USDC for Next Cycle" to continue (NOMAD only)</span>
              </div>
            </div>
          </div>

          {/* Upgrade Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-400 mb-2">💡 Want Unlimited Access?</h3>
            <p className="text-yellow-100 text-sm mb-3">
              Upgrade to PRO or ROYAL NFT to eliminate monthly payments and get unlimited access to all trading bots.
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">PRO NFT: 400 USDC</span>
              <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">ROYAL NFT: 1500 USDC</span>
            </div>
          </div>
        </div>

        {/* Action Button - Fixed at bottom */}
        <div className="flex justify-center pt-3 border-t border-gray-700/30 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white px-6"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
