"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Flag,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Users,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react"
import { toast } from "sonner"
import type { 
  ChannelReport, 
  ChannelReportStatus,
  ChannelReportDashboardData,
  UpdateChannelReportRequest,
  getReportCategoryInfo
} from "@/types/channel-reports"

// Admin wallet address
const ADMIN_ADDRESS = '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

interface ChannelReportsDashboardProps {
  adminAddress: string
}

export function ChannelReportsDashboard({ adminAddress }: ChannelReportsDashboardProps) {
  const [reports, setReports] = useState<ChannelReport[]>([])
  const [dashboardData, setDashboardData] = useState<ChannelReportDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<ChannelReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Verify admin access
  const isAdmin = adminAddress === ADMIN_ADDRESS

  useEffect(() => {
    if (isAdmin) {
      fetchReports()
    }
  }, [isAdmin, statusFilter])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        admin_address: adminAddress,
        limit: '50',
        offset: '0'
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/channel-reports?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
      setDashboardData(data.summary)

    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, updates: UpdateChannelReportRequest) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/channel-reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updates,
          admin_address: adminAddress,
          resolved_by: adminAddress
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      const result = await response.json()
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, ...updates } : report
      ))

      toast.success('Report updated successfully')
      setShowReportModal(false)
      setSelectedReport(null)

    } catch (error) {
      console.error('Error updating report:', error)
      toast.error('Failed to update report')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: ChannelReportStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'under_review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'dismissed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: ChannelReportStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'under_review': return <Eye className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'dismissed': return <XCircle className="w-4 h-4" />
      default: return <MoreHorizontal className="w-4 h-4" />
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (!isAdmin) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              Access Denied
            </h3>
            <p className="text-[#C0E6FF] max-w-md mx-auto">
              You don't have permission to access the channel reports dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Channel Reports</h1>
          <p className="text-gray-400 mt-1">Manage and review channel reports from users</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Reports</p>
                  <p className="text-xl font-bold text-white">{dashboardData.total_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-xl font-bold text-white">{dashboardData.pending_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Resolved</p>
                  <p className="text-xl font-bold text-white">{dashboardData.resolved_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Dismissed</p>
                  <p className="text-xl font-bold text-white">{dashboardData.dismissed_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2f51] border-[#C0E6FF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Flagged Channels</p>
                  <p className="text-xl font-bold text-white">{dashboardData.flagged_channels}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports by channel name, creator, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1a2f51] border-[#C0E6FF]/20 text-white"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#4DA2FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#C0E6FF]">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No reports found
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No channel reports have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#1a2f51] rounded-lg p-4 border border-[#C0E6FF]/10 hover:border-[#4DA2FF]/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedReport(report)
                    setShowReportModal(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-medium">{report.channel_name}</h4>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          <span className="font-medium">Creator:</span> {report.creator_name || 'Unknown'}
                        </p>
                        <p className="text-gray-400">
                          <span className="font-medium">Category:</span> {report.report_category.replace('_', ' ')}
                        </p>
                        <p className="text-[#C0E6FF] line-clamp-2">
                          {report.report_description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-400">
                      <p>{new Date(report.created_at).toLocaleDateString()}</p>
                      <p>{new Date(report.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false)
            setSelectedReport(null)
          }}
          onUpdateStatus={updateReportStatus}
          isUpdating={isUpdating}
        />
      )}
    </div>
  )
}

// Report Detail Modal Component
interface ReportDetailModalProps {
  report: ChannelReport
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (reportId: string, updates: UpdateChannelReportRequest) => void
  isUpdating: boolean
}

function ReportDetailModal({
  report,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating
}: ReportDetailModalProps) {
  const [newStatus, setNewStatus] = useState<ChannelReportStatus>(report.status)
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '')

  const handleUpdate = () => {
    const updates: UpdateChannelReportRequest = {
      status: newStatus,
      admin_notes: adminNotes.trim() || undefined
    }

    onUpdateStatus(report.id, updates)
  }

  const getStatusColor = (status: ChannelReportStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'under_review': return 'text-blue-400'
      case 'resolved': return 'text-green-400'
      case 'dismissed': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0a1628] border-[#C0E6FF]/20 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            Report Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Information */}
          <div className="bg-[#1a2f51] rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Report Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Channel Name</p>
                <p className="text-white font-medium">{report.channel_name}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Creator</p>
                <p className="text-white">{report.creator_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Category</p>
                <p className="text-white capitalize">{report.report_category.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Status</p>
                <p className={`font-medium capitalize ${getStatusColor(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Submitted</p>
                <p className="text-white">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Priority</p>
                <p className="text-white">{report.priority}/5</p>
              </div>
            </div>
          </div>

          {/* Report Description */}
          <div className="bg-[#1a2f51] rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Report Description</h4>
            <p className="text-[#C0E6FF] whitespace-pre-wrap">{report.report_description}</p>
          </div>

          {/* Reporter Information */}
          <div className="bg-[#1a2f51] rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Reporter Information</h4>
            <div className="text-sm">
              <p className="text-gray-400 mb-1">Wallet Address</p>
              <p className="text-white font-mono text-xs break-all">{report.reporter_address}</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-[#1a2f51] rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Admin Actions</h4>

            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium">Update Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ChannelReportStatus)}>
                  <SelectTrigger className="bg-[#0a1628] border-[#C0E6FF]/20 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-medium">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your review or actions taken..."
                  className="bg-[#0a1628] border-[#C0E6FF]/20 text-white placeholder:text-gray-400 mt-2"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Existing Admin Notes */}
          {report.admin_notes && (
            <div className="bg-[#1a2f51] rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Previous Admin Notes</h4>
              <p className="text-[#C0E6FF] whitespace-pre-wrap">{report.admin_notes}</p>
              {report.resolved_by && (
                <p className="text-gray-400 text-sm mt-2">
                  Resolved by: {report.resolved_by}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 border-[#C0E6FF]/20 text-[#C0E6FF] hover:bg-[#C0E6FF]/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
