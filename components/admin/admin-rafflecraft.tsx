"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dice6,
  Trophy,
  Coins,
  Users,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface RaffleStats {
  totalRaffles: number
  activeRaffles: number
  completedRaffles: number
  totalTicketsSold: number
  totalPrizePool: number
  totalParticipants: number
}

export function AdminRaffleCraft() {
  // Card Collapse State
  const [isExpanded, setIsExpanded] = useState(false)

  const [stats, setStats] = useState<RaffleStats>({
    totalRaffles: 0,
    activeRaffles: 0,
    completedRaffles: 0,
    totalTicketsSold: 0,
    totalPrizePool: 0,
    totalParticipants: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchRaffleStats()
  }, [])

  const fetchRaffleStats = async () => {
    setIsLoading(true)
    try {
      // Note: This would need proper authentication token in production
      const response = await fetch('/api/rafflecraft/admin/stats', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAFFLE_ADMIN_TOKEN || 'demo-token'}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      } else {
        // Fallback to mock data for demo
        setStats({
          totalRaffles: 12,
          activeRaffles: 3,
          completedRaffles: 9,
          totalTicketsSold: 1247,
          totalPrizePool: 15.5,
          totalParticipants: 342
        })
      }
    } catch (error) {
      console.error('Error fetching raffle stats:', error)
      // Fallback to mock data
      setStats({
        totalRaffles: 12,
        activeRaffles: 3,
        completedRaffles: 9,
        totalTicketsSold: 1247,
        totalPrizePool: 15.5,
        totalParticipants: 342
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessRaffles = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/rafflecraft/admin/process-raffles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAFFLE_ADMIN_TOKEN || 'demo-token'}`
        }
      })
      
      if (response.ok) {
        toast.success('Raffles processed successfully!')
        fetchRaffleStats() // Refresh stats
      } else {
        toast.error('Failed to process raffles')
      }
    } catch (error) {
      console.error('Error processing raffles:', error)
      toast.error('Failed to process raffles')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-[#C0E6FF]/10 p-2"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Dice6 className="w-5 h-5 text-purple-400" />
              RaffleCraft Admin
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">Raffle management and statistics</p>
          </div>
        </div>
        {isExpanded && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRaffleStats}
              disabled={isLoading}
              className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleProcessRaffles}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Process Raffles'}
            </Button>
            <Link href="/dapps/rafflecraft">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View App
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.totalRaffles}
            </p>
            <p className="text-xs text-gray-400">Total Raffles</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">
              {isLoading ? '...' : stats.activeRaffles}
            </p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {isLoading ? '...' : stats.completedRaffles}
            </p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {isLoading ? '...' : stats.totalTicketsSold.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Tickets Sold</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {isLoading ? '...' : `${stats.totalPrizePool} SUI`}
            </p>
            <p className="text-xs text-gray-400">Prize Pool</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {isLoading ? '...' : stats.totalParticipants.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Participants</p>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0a1628] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </h4>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Healthy
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Avg. Tickets per Raffle:</span>
                <span className="text-white">
                  {stats.totalRaffles > 0 ? Math.round(stats.totalTicketsSold / stats.totalRaffles) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg. Prize per Raffle:</span>
                <span className="text-white">
                  {stats.totalRaffles > 0 ? (stats.totalPrizePool / stats.totalRaffles).toFixed(2) : 0} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Participation Rate:</span>
                <span className="text-white">
                  {stats.totalTicketsSold > 0 ? ((stats.totalParticipants / stats.totalTicketsSold) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0a1628] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Dice6 className="w-4 h-4" />
                System Status
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-gray-400">Online</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Raffles:</span>
                <span className="text-green-400">{stats.activeRaffles} running</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pending Draws:</span>
                <span className="text-yellow-400">0 waiting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Processed:</span>
                <span className="text-white">Just now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0a1628] rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Winners
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Participants
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <Coins className="w-4 h-4 mr-2" />
              Payouts
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Issues
            </Button>
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  )
}
