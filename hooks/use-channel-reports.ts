"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChannelReportStatistics } from '@/types/channel-reports'

// Simple cache to prevent duplicate API calls
const statisticsCache = new Map<string, { data: Record<string, ChannelReportStatistics>, timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

interface UseChannelReportsReturn {
  statistics: Record<string, ChannelReportStatistics>
  isLoading: boolean
  error: string | null
  getChannelStats: (channelId: string) => ChannelReportStatistics | null
  refreshStats: (channelIds: string[]) => Promise<void>
  hasWarning: (channelId: string) => boolean
  getWarningLevel: (channelId: string) => string
  getReportCount: (channelId: string) => number
}

/**
 * Hook to manage channel report statistics
 * Provides easy access to report data and warning indicators
 */
export function useChannelReports(initialChannelIds: string[] = []): UseChannelReportsReturn {
  const [statistics, setStatistics] = useState<Record<string, ChannelReportStatistics>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedIds, setLastFetchedIds] = useState<string>('')

  // Fetch statistics for multiple channels
  const fetchStatistics = useCallback(async (channelIds: string[]) => {
    if (channelIds.length === 0) return

    // Prevent duplicate calls for the same channel IDs
    const idsString = channelIds.sort().join(',')
    if (idsString === lastFetchedIds) {
      return
    }

    // Check cache first
    const cached = statisticsCache.get(idsString)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStatistics(prev => ({ ...prev, ...cached.data }))
      return
    }

    setIsLoading(true)
    setError(null)
    setLastFetchedIds(idsString)

    try {
      const response = await fetch(`/api/channel-reports/statistics?channel_ids=${channelIds.join(',')}`)

      if (!response.ok) {
        // If tables don't exist yet, silently fail and return empty statistics
        if (response.status === 500) {
          console.warn('Channel reports tables not yet created. Skipping statistics fetch.')
          setStatistics({})
          return
        }
        throw new Error('Failed to fetch channel statistics')
      }

      const data = await response.json()

      console.log('📊 Channel statistics fetched:', {
        channelCount: channelIds.length,
        statisticsCount: Object.keys(data.statistics || {}).length,
        statistics: data.statistics
      })

      // Cache the result
      statisticsCache.set(idsString, {
        data: data.statistics || {},
        timestamp: Date.now()
      })

      setStatistics(prev => ({
        ...prev,
        ...data.statistics
      }))

    } catch (err) {
      console.warn('Channel reports not available:', err)
      // Don't set error state for missing tables - just log and continue
      setStatistics({})
    } finally {
      setIsLoading(false)
    }
  }, [lastFetchedIds])

  // Refresh statistics for specific channels
  const refreshStats = useCallback(async (channelIds: string[]) => {
    await fetchStatistics(channelIds)
  }, [fetchStatistics])

  // Get statistics for a specific channel
  const getChannelStats = useCallback((channelId: string): ChannelReportStatistics | null => {
    return statistics[channelId] || null
  }, [statistics])

  // Check if channel has warning indicators
  const hasWarning = useCallback((channelId: string): boolean => {
    const stats = statistics[channelId]
    return stats ? stats.is_flagged && stats.warning_level !== 'none' : false
  }, [statistics])

  // Get warning level for a channel
  const getWarningLevel = useCallback((channelId: string): string => {
    const stats = statistics[channelId]
    return stats ? stats.warning_level : 'none'
  }, [statistics])

  // Get total report count for a channel
  const getReportCount = useCallback((channelId: string): number => {
    const stats = statistics[channelId]
    return stats ? stats.total_reports : 0
  }, [statistics])

  // Load initial statistics (only once when channelIds change)
  useEffect(() => {
    if (initialChannelIds.length > 0) {
      const idsString = initialChannelIds.sort().join(',')
      if (idsString !== lastFetchedIds) {
        fetchStatistics(initialChannelIds)
      }
    }
  }, [initialChannelIds.join(',')]) // Use join to prevent unnecessary re-renders

  return {
    statistics,
    isLoading,
    error,
    getChannelStats,
    refreshStats,
    hasWarning,
    getWarningLevel,
    getReportCount
  }
}

/**
 * Hook for a single channel's statistics
 */
export function useChannelReportStats(channelId: string) {
  const [stats, setStats] = useState<ChannelReportStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!channelId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/channel-reports/statistics?channel_id=${channelId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch channel statistics')
      }

      const data = await response.json()
      setStats(data.statistics)

    } catch (err) {
      console.error('Error fetching channel statistics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh,
    hasWarning: stats ? stats.is_flagged && stats.warning_level !== 'none' : false,
    warningLevel: stats ? stats.warning_level : 'none',
    reportCount: stats ? stats.total_reports : 0
  }
}
