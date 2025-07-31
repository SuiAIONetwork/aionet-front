/**
 * TypeScript types for Channel Reporting System
 */

// Report categories that users can select
export type ChannelReportCategory = 
  | 'content_mismatch'      // Channel description doesn't match actual content
  | 'not_delivering'        // Not delivering promised content
  | 'inactive_channel'      // Channel is inactive or non-functional
  | 'inappropriate_content' // Inappropriate or harmful content
  | 'spam_or_scam'         // Spam or scam content
  | 'other'                // Other issues

// Report status in the review process
export type ChannelReportStatus = 
  | 'pending'      // Newly submitted, awaiting review
  | 'under_review' // Being reviewed by admin
  | 'resolved'     // Issue resolved
  | 'dismissed'    // Report dismissed as invalid

// Report severity levels
export type ChannelReportSeverity = 
  | 'low'      // Minor issues
  | 'medium'   // Moderate issues
  | 'high'     // Serious issues
  | 'critical' // Critical issues requiring immediate attention

// Warning levels for channels based on report counts
export type ChannelWarningLevel = 
  | 'none'   // No warnings
  | 'low'    // 2-4 reports
  | 'medium' // 5-9 reports
  | 'high'   // 10+ reports

// Database interface for channel reports
export interface ChannelReport {
  id: string
  reporter_address: string
  
  // Channel information
  channel_id: string
  channel_name: string
  creator_address: string
  creator_name?: string
  
  // Report details
  report_category: ChannelReportCategory
  report_description: string
  
  // Status and processing
  status: ChannelReportStatus
  admin_notes?: string
  resolved_by?: string
  resolved_at?: string
  
  // Metadata
  severity: ChannelReportSeverity
  priority: number // 1-5
  evidence_urls?: string[]
  metadata: Record<string, any>
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Database interface for channel report statistics
export interface ChannelReportStatistics {
  id: string
  channel_id: string
  channel_name: string
  creator_address: string
  
  // Report counts
  total_reports: number
  pending_reports: number
  resolved_reports: number
  dismissed_reports: number
  
  // Category breakdown
  content_mismatch_count: number
  not_delivering_count: number
  inactive_channel_count: number
  inappropriate_content_count: number
  spam_or_scam_count: number
  other_count: number
  
  // Status flags
  is_flagged: boolean
  warning_level: ChannelWarningLevel
  last_report_date?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Form data for creating a new report
export interface CreateChannelReportRequest {
  reporter_address: string
  channel_id: string
  channel_name: string
  creator_address: string
  creator_name?: string
  report_category: ChannelReportCategory
  report_description: string
  evidence_urls?: string[]
  metadata?: Record<string, any>
}

// Form data for updating a report (admin use)
export interface UpdateChannelReportRequest {
  status?: ChannelReportStatus
  admin_notes?: string
  resolved_by?: string
  severity?: ChannelReportSeverity
  priority?: number
}

// Response from report submission API
export interface ChannelReportResponse {
  report: ChannelReport
  message: string
}

// Admin dashboard data
export interface ChannelReportDashboardData {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  dismissed_reports: number
  flagged_channels: number
  recent_reports: ChannelReport[]
  top_reported_channels: ChannelReportStatistics[]
}

// Report category display information
export interface ReportCategoryInfo {
  value: ChannelReportCategory
  label: string
  description: string
  icon?: string
}

// Predefined report categories with display information
export const REPORT_CATEGORIES: ReportCategoryInfo[] = [
  {
    value: 'content_mismatch',
    label: 'Content Mismatch',
    description: 'Channel description doesn\'t match actual content',
    icon: 'AlertTriangle'
  },
  {
    value: 'not_delivering',
    label: 'Not Delivering Content',
    description: 'Channel is not delivering promised content or services',
    icon: 'XCircle'
  },
  {
    value: 'inactive_channel',
    label: 'Inactive Channel',
    description: 'Channel appears to be inactive or non-functional',
    icon: 'Clock'
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Channel contains inappropriate or harmful content',
    icon: 'Shield'
  },
  {
    value: 'spam_or_scam',
    label: 'Spam or Scam',
    description: 'Channel appears to be spam or a scam operation',
    icon: 'AlertOctagon'
  },
  {
    value: 'other',
    label: 'Other Issues',
    description: 'Other issues not covered by the above categories',
    icon: 'MoreHorizontal'
  }
]

// Helper function to get category info
export function getReportCategoryInfo(category: ChannelReportCategory): ReportCategoryInfo {
  return REPORT_CATEGORIES.find(cat => cat.value === category) || REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1]
}

// Helper function to get warning level color
export function getWarningLevelColor(level: ChannelWarningLevel): string {
  switch (level) {
    case 'none': return 'text-gray-400'
    case 'low': return 'text-yellow-400'
    case 'medium': return 'text-orange-400'
    case 'high': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

// Helper function to get warning level background color
export function getWarningLevelBgColor(level: ChannelWarningLevel): string {
  switch (level) {
    case 'none': return 'bg-gray-500/20'
    case 'low': return 'bg-yellow-500/20'
    case 'medium': return 'bg-orange-500/20'
    case 'high': return 'bg-red-500/20'
    default: return 'bg-gray-500/20'
  }
}

// Helper function to check if channel should show warning
export function shouldShowWarning(stats?: ChannelReportStatistics): boolean {
  return stats ? stats.is_flagged && stats.warning_level !== 'none' : false
}

// Helper function to get report count display text
export function getReportCountText(count: number): string {
  if (count === 0) return 'No reports'
  if (count === 1) return '1 report'
  return `${count} reports`
}
