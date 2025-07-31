"use client"

import { ChannelReportsDashboard } from '@/components/admin/channel-reports-dashboard'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle } from 'lucide-react'

// Admin wallet address
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

export default function AdminReportsPage() {
  const { isSignedIn, user } = useSuiAuth()

  // Check if user is the admin
  const isAdmin = isSignedIn && user?.address === ADMIN_ADDRESS

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-[#C0E6FF]">Please sign in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-[#C0E6FF] mb-4">
              Admin access is restricted to authorized administrators only.
            </p>
            <p className="text-sm text-gray-400">
              Current address: <span className="text-white font-mono text-xs break-all">{user?.address}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChannelReportsDashboard adminAddress={user.address} />
    </div>
  )
}
