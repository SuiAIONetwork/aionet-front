"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import {
  Copy,
  Download,
  QrCode,
  Wallet,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Coins
} from 'lucide-react'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string | null
  suiBalance: number
  usdcBalance: number
}

export function DepositModal({
  isOpen,
  onClose,
  walletAddress,
  suiBalance,
  usdcBalance
}: DepositModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      generateQRCode()
    }
  }, [isOpen, walletAddress])

  const generateQRCode = async () => {
    if (!walletAddress) return

    try {
      setIsGeneratingQR(true)
      const qrDataUrl = await QRCode.toDataURL(walletAddress, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const copyAddress = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopiedAddress(true)
      toast.success('Address copied to clipboard!')
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = 'wallet-address-qr.png'
    link.href = qrCodeDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded!')
  }

  const formatBalance = (balance: number) => {
    return balance.toFixed(6)
  }

  if (!walletAddress) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0f172a] border border-[#C0E6FF]/20 text-white shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold text-white text-center">
            Deposit Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code - Centered and Clean */}
          <div className="flex flex-col items-center space-y-4">
            {isGeneratingQR ? (
              <div className="flex items-center justify-center w-80 h-80 bg-slate-800/50 rounded-2xl">
                <RefreshCw className="w-8 h-8 animate-spin text-[#4DA2FF]" />
              </div>
            ) : qrCodeDataUrl ? (
              <div className="relative group">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <img
                    src={qrCodeDataUrl}
                    alt="Wallet Address QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <Button
                  onClick={downloadQRCode}
                  variant="ghost"
                  size="sm"
                  className="absolute -bottom-2 -right-2 w-8 h-8 p-0 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-80 h-80 bg-slate-800/50 rounded-2xl">
                <span className="text-slate-400 text-sm">QR unavailable</span>
              </div>
            )}
          </div>

          {/* Wallet Address - Minimal Design */}
          <div className="space-y-3">
            <div className="enhanced-card border-0">
              <div className="enhanced-card-content p-4">
                <div className="text-[#C0E6FF] text-xs uppercase tracking-wide mb-3 text-center">
                  Wallet Address
                </div>
                <div className="bg-[#030f1c] rounded-lg p-3 border border-[#C0E6FF]/20 flex items-center gap-2">
                  <code className="text-xs text-[#C0E6FF] break-all font-mono leading-relaxed flex-1">
                    {walletAddress}
                  </code>
                  <Button
                    onClick={copyAddress}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 hover:bg-[#4DA2FF]/20 text-[#C0E6FF] hover:text-white transition-colors flex-shrink-0"
                    disabled={copiedAddress}
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* SUI Network Info */}
          <div className="flex items-center justify-center gap-2 text-[#C0E6FF]">
            <img
              src="/images/logo-sui.png"
              alt="SUI"
              className="w-10 h-10"
              onError={(e) => {
                // Fallback to a simple circle if image fails to load
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'inline-block';
                }
              }}
            />
            <div
              className="w-10 h-10 bg-[#4DA2FF] rounded-full flex items-center justify-center text-white text-sm font-bold hidden"
            >
              S
            </div>
            <span className="text-sm font-medium">SUI Network Only</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
