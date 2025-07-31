"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Flag,
  RefreshCw,
  TrendingUp,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCreatorsDatabase } from '@/contexts/creators-database-context'

interface ChannelReport {
  id: string
  channel_name: string
  category: string
  status: string
  created_at: string
  reporter_address: string
}

interface ReportStats {
  total_reports: number
  pending_reports: number
  under_review_reports: number
  resolved_reports: number
  dismissed_reports: number
}

export function AdminCreatorManagement() {
  // Card Collapse State
  const [isExpanded, setIsExpanded] = useState(false)

  // Channel Reports State
  const [reports, setReports] = useState<ChannelReport[]>([])
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  const [isLoadingReports, setIsLoadingReports] = useState(true)

  // User Management State
  const {
    creators,
    syncSubscriberCounts,
    toggleRealTimeSubscriberCounts,
    useRealTimeSubscriberCounts,
    isLoading: isLoadingCreators
  } = useCreatorsDatabase()

  const [isSyncing, setIsSyncing] = useState(false)
  const [showCreatorDetails, setShowCreatorDetails] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoadingReports(true)
    try {
      const params = new URLSearchParams({
        admin_address: '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4',
        limit: '5',
        offset: '0'
      })

      const response = await fetch(`/api/channel-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
      setReportStats(data.summary)

    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setIsLoadingReports(false)
    }
  }

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

  // Helper functions for reports
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'under_review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'dismissed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'under_review': return <Eye className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'dismissed': return <XCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper functions for creators
  const getTotalSubscribers = () => {
    return creators.reduce((total, creator) => total + (creator.subscribers || 0), 0)
  }

  const getActiveCreators = () => {
    return creators.filter(creator => creator.subscribers && creator.subscribers > 0).length
  }

  const getTopCreators = () => {
    return creators
      .filter(creator => creator.subscribers && creator.subscribers > 0)
      .sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
      .slice(0, 3)
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
              <Users className="w-5 h-5 text-blue-400" />
              Creator & Channel Management
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">Channel reports, creator analytics, and subscriber management</p>
          </div>
        </div>
        {isExpanded && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreatorDetails(!showCreatorDetails)}
              className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
            >
              {showCreatorDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showCreatorDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#0a1628]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a2f51]">Overview</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#1a2f51]">Channel Reports</TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-[#1a2f51]">Creator Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Combined Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{creators.length}</p>
                <p className="text-xs text-gray-400">Total Creators</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{getTotalSubscribers().toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Subscribers</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{reportStats?.total_reports || 0}</p>
                <p className="text-xs text-gray-400">Total Reports</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{reportStats?.pending_reports || 0}</p>
                <p className="text-xs text-gray-400">Pending Reports</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0a1628] rounded-lg p-4 space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Quick Actions
              </h4>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="real-time-mode"
                    checked={useRealTimeSubscriberCounts}
                    onCheckedChange={toggleRealTimeSubscriberCounts}
                  />
                  <Label htmlFor="real-time-mode" className="text-white">
                    Real-time subscriber counts
                  </Label>
                  <Badge variant={useRealTimeSubscriberCounts ? "default" : "secondary"} className="text-xs">
                    {useRealTimeSubscriberCounts ? "Live" : "Cached"}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSyncAll}
                    disabled={isSyncing || isLoadingCreators}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    {isSyncing ? 'Syncing...' : 'Sync Counts'}
                  </Button>
                  
                  <Link href="/admin-reports">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Full Reports
                    </Button>
                  </Link>
                  
                  <Link href="/aio-creators">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Creators
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Channel Reports Tab */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            {/* Report Stats */}
            {reportStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{reportStats.total_reports}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{reportStats.pending_reports}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{reportStats.under_review_reports}</p>
                  <p className="text-xs text-gray-400">Review</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{reportStats.resolved_reports}</p>
                  <p className="text-xs text-gray-400">Resolved</p>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-400">{reportStats.dismissed_reports}</p>
                  <p className="text-xs text-gray-400">Dismissed</p>
                </div>
              </div>
            )}

            {/* Recent Reports */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">Recent Reports</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchReports}
                  disabled={isLoadingReports}
                  className="bg-transparent border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingReports ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {isLoadingReports ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#0a1628] rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-[#0a1628] rounded-lg p-3 hover:bg-[#0a1628]/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{report.channel_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{report.status.replace('_', ' ')}</span>
                            </Badge>
                            <span className="text-xs text-gray-400">{report.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatDate(report.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a1628] rounded-lg p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">No reports found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Creator Analytics Tab */}
          <TabsContent value="creators" className="space-y-4 mt-4">
            {/* Creator Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{creators.length}</p>
                <p className="text-sm text-gray-400">Total Creators</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{getActiveCreators()}</p>
                <p className="text-sm text-gray-400">Active Creators</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{getTotalSubscribers().toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Subscribers</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {creators.length > 0 ? Math.round(getTotalSubscribers() / creators.length) : 0}
                </p>
                <p className="text-sm text-gray-400">Avg per Creator</p>
              </div>
            </div>

            {/* Top Creators */}
            {showCreatorDetails && (
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Creators by Subscribers
                </h4>
                
                {isLoadingCreators ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-[#0a1628] rounded-lg p-3 animate-pulse">
                        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : getTopCreators().length > 0 ? (
                  <div className="space-y-2">
                    {getTopCreators().map((creator, index) => (
                      <div key={creator.creatorAddress} className="bg-[#0a1628] rounded-lg p-3 hover:bg-[#0a1628]/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 rounded-full w-8 h-8 flex items-center justify-center">
                              <span className="text-blue-400 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium truncate">{creator.name}</p>
                              <p className="text-xs text-gray-400 truncate">{creator.creatorAddress}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{(creator.subscribers || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">subscribers</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0a1628] rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No active creators found</p>
                  </div>
                )}
              </div>
            )}

            {/* System Status */}
            <div className="bg-[#0a1628] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">System Status</p>
                  <p className="text-sm text-gray-400">
                    {isLoadingCreators ? 'Loading data...' : `${creators.length} creators tracked`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLoadingCreators ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                  <span className="text-sm text-gray-400">
                    {isLoadingCreators ? 'Syncing' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
