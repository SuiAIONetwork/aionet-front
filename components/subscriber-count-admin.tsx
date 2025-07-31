"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCreatorsDatabase } from '@/contexts/creators-database-context'
import { RefreshCw, Users, TrendingUp, Database, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface SubscriberAudit {
  creator_address: string
  channel_name: string
  stored_count: number
  actual_count: number
  count_difference: number
  last_updated: string
}

export function SubscriberCountAdmin() {
  const { 
    creators, 
    syncSubscriberCounts, 
    syncCreatorSubscriberCount,
    toggleRealTimeSubscriberCounts,
    useRealTimeSubscriberCounts,
    isLoading 
  } = useCreatorsDatabase()
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [auditData, setAuditData] = useState<SubscriberAudit[]>([])
  const [showAudit, setShowAudit] = useState(false)

  const handleSyncAll = async () => {
    setIsSyncing(true)
    try {
      await syncSubscriberCounts()
      toast.success('All subscriber counts synced successfully!')
    } catch (error) {
      toast.error('Failed to sync subscriber counts')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncCreator = async (creatorAddress: string, creatorName: string) => {
    try {
      const newCount = await syncCreatorSubscriberCount(creatorAddress)
      toast.success(`Updated ${creatorName}: ${newCount} subscribers`)
    } catch (error) {
      toast.error(`Failed to sync ${creatorName}`)
    }
  }

  const loadAuditData = async () => {
    try {
      const response = await fetch('/api/sync-subscriber-counts')
      const result = await response.json()
      
      if (result.success && result.audit) {
        setAuditData(result.audit)
        setShowAudit(true)
        toast.success('Audit data loaded')
      } else {
        toast.error('Failed to load audit data')
      }
    } catch (error) {
      toast.error('Error loading audit data')
    }
  }

  const totalCreators = creators.length
  const totalSubscribers = creators.reduce((sum, creator) => sum + creator.subscribers, 0)
  const creatorsWithSubscribers = creators.filter(creator => creator.subscribers > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscriber Count Management</h2>
          <p className="text-gray-400">Manage and monitor real-time subscriber counting</p>
        </div>
      </div>

      {/* Settings Card */}
      <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Settings
          </CardTitle>
          <CardDescription>Configure subscriber counting behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="realtime-toggle" className="text-white">Real-time Subscriber Counts</Label>
              <p className="text-sm text-gray-400">
                Automatically fetch live subscriber counts from database
              </p>
            </div>
            <Switch
              id="realtime-toggle"
              checked={useRealTimeSubscriberCounts}
              onCheckedChange={toggleRealTimeSubscriberCounts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Creators</p>
                <p className="text-2xl font-bold text-white">{totalCreators}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Subscribers</p>
                <p className="text-2xl font-bold text-white">{totalSubscribers.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Creators</p>
                <p className="text-2xl font-bold text-white">{creatorsWithSubscribers}</p>
              </div>
              <Badge variant="outline" className="border-green-400 text-green-400">
                {Math.round((creatorsWithSubscribers / totalCreators) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Card */}
      <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
        <CardHeader>
          <CardTitle className="text-white">Actions</CardTitle>
          <CardDescription>Sync subscriber counts and view audit data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync All Counts
            </Button>

            <Button
              onClick={loadAuditData}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {showAudit ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showAudit ? 'Hide' : 'Show'} Audit Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Creators List */}
      <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
        <CardHeader>
          <CardTitle className="text-white">Creators</CardTitle>
          <CardDescription>Individual creator subscriber counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creators.map((creator) => (
              <div key={creator.id} className="flex items-center justify-between p-3 bg-[#1a2f51] rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">{creator.name}</p>
                    <p className="text-sm text-gray-400">{creator.creatorAddress.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-blue-400 text-blue-400">
                    {creator.subscribers} subscribers
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncCreator(creator.creatorAddress, creator.name)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Data */}
      {showAudit && auditData.length > 0 && (
        <Card className="bg-[#0A1628] border-[#1E3A8A]/20">
          <CardHeader>
            <CardTitle className="text-white">Audit Data</CardTitle>
            <CardDescription>Comparison between stored and actual subscriber counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditData.map((audit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#1a2f51] rounded-lg">
                  <div>
                    <p className="font-medium text-white">{audit.channel_name}</p>
                    <p className="text-sm text-gray-400">{audit.creator_address.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-gray-400 text-gray-400">
                      Stored: {audit.stored_count}
                    </Badge>
                    <Badge variant="outline" className="border-blue-400 text-blue-400">
                      Actual: {audit.actual_count}
                    </Badge>
                    {audit.count_difference !== 0 && (
                      <Badge
                        variant="outline"
                        className={audit.count_difference > 0 ? "border-green-400 text-green-400" : "border-red-400 text-red-400"}
                      >
                        {audit.count_difference > 0 ? '+' : ''}{audit.count_difference}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
