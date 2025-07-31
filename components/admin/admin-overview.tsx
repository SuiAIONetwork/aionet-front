"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, Star, Shield, TrendingUp } from "lucide-react"
import { AdminPaionTokenStats } from "./admin-paion-token-stats"

// Admin wallet address
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface OverviewStats {
  totalUsers: number
  proUsers: number
  royalUsers: number
  nomadUsers: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    proUsers: 0,
    royalUsers: 0,
    nomadUsers: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOverviewStats()
  }, [])

  const fetchOverviewStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        admin_address: ADMIN_ADDRESS
      })

      const response = await fetch(`/api/admin/stats?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
      }

      const data = await response.json()

      if (data.success) {
        console.log('📊 Admin stats received:', data.data)
        setStats({
          totalUsers: data.data.totalUsers,
          proUsers: data.data.proUsers,
          royalUsers: data.data.royalUsers,
          nomadUsers: data.data.nomadUsers
        })
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('Error fetching overview stats:', error)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? '...' : stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">Active platform users</span>
            </div>
          </CardContent>
        </Card>

        {/* PRO Users */}
        <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">PRO Users</p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? '...' : stats.proUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-400">
                {isLoading ? '0' : stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : '0'}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ROYAL Users */}
        <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">ROYAL Users</p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? '...' : stats.royalUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-yellow-400">
                {isLoading ? '0' : stats.totalUsers > 0 ? ((stats.royalUsers / stats.totalUsers) * 100).toFixed(1) : '0'}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* NOMAD Users */}
        <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">NOMAD Users</p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? '...' : stats.nomadUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-500/20 p-3 rounded-full">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-400">
                {isLoading ? '0' : stats.totalUsers > 0 ? ((stats.nomadUsers / stats.totalUsers) * 100).toFixed(1) : '0'}% of total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* pAION Token Statistics */}
      <AdminPaionTokenStats />
    </div>
  )
}
