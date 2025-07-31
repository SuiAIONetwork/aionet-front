"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  leaderboardService, 
  LeaderboardFilters, 
  LeaderboardResponse, 
  LeaderboardUser 
} from '@/lib/leaderboard-service'

interface UseLeaderboardOptions {
  category: string
  timePeriod: 'weekly' | 'monthly' | 'all-time'
  locationFilter?: string
}

interface UseLeaderboardReturn {
  data: LeaderboardResponse | null
  stats: Record<string, any> | null
  availableLocations: Array<{code: string, name: string, flag: string, count: number}>
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  refresh: () => Promise<void>
  setPage: (page: number) => void
  preloadNext: () => Promise<void>
}

export function useLeaderboard({
  category,
  timePeriod,
  locationFilter = 'all'
}: UseLeaderboardOptions): UseLeaderboardReturn {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [availableLocations, setAvailableLocations] = useState<Array<{code: string, name: string, flag: string, count: number}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const itemsPerPage = 20
  const totalPages = Math.ceil((data?.totalCount || 0) / itemsPerPage)

  const loadLeaderboard = useCallback(async (page: number = currentPage, showLoading: boolean = true) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    if (showLoading) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const filters: LeaderboardFilters = {
        category,
        timePeriod,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        locationFilter
      }

      const result = await leaderboardService.getLeaderboard(filters)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      setData(result)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to load leaderboard')
        console.error('Leaderboard loading error:', err)
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [category, timePeriod, locationFilter, currentPage, itemsPerPage])

  const loadStats = useCallback(async () => {
    try {
      const statsData = await leaderboardService.getLeaderboardStats()
      setStats(statsData)
    } catch (err) {
      console.error('Stats loading error:', err)
    }
  }, [])

  const loadAvailableLocations = useCallback(async () => {
    try {
      const locations = await leaderboardService.getAvailableLocations()
      setAvailableLocations(locations)
    } catch (err) {
      console.error('Available locations loading error:', err)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([
      loadLeaderboard(currentPage, true),
      loadStats(),
      loadAvailableLocations()
    ])
  }, [loadLeaderboard, loadStats, loadAvailableLocations, currentPage])

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
    }
  }, [currentPage, totalPages])

  const preloadNext = useCallback(async () => {
    if (currentPage < totalPages) {
      // Preload next page without showing loading state
      await loadLeaderboard(currentPage + 1, false)
    }
  }, [currentPage, totalPages, loadLeaderboard])

  // Load data when dependencies change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when category/period/location changes
  }, [category, timePeriod, locationFilter])

  useEffect(() => {
    loadLeaderboard(currentPage)
  }, [loadLeaderboard, currentPage])

  // Load stats and available locations once on mount
  useEffect(() => {
    loadStats()
    loadAvailableLocations()
  }, [loadStats, loadAvailableLocations])



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Preload popular categories on mount
  useEffect(() => {
    const preloadPopularCategories = async () => {
      try {
        await leaderboardService.preloadLeaderboards()
      } catch (error) {
        console.warn('Failed to preload leaderboards:', error)
      }
    }

    preloadPopularCategories()
  }, [])

  return {
    data,
    stats,
    availableLocations,
    isLoading,
    error,
    currentPage,
    totalPages,
    refresh,
    setPage,
    preloadNext
  }
}

// Hook for getting user's rank in a specific category
export function useUserRank(userAddress: string, category: string) {
  const [rank, setRank] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getUserRank = useCallback(async () => {
    if (!userAddress) return

    setIsLoading(true)
    try {
      // This would require a specific API endpoint to get user rank efficiently
      // For now, we'll implement a basic version
      const filters: LeaderboardFilters = {
        category,
        timePeriod: 'all-time',
        limit: 1000, // Get enough users to find rank
        offset: 0
      }

      const result = await leaderboardService.getLeaderboard(filters)
      const userRank = result.users.findIndex(user => user.address === userAddress) + 1
      setRank(userRank > 0 ? userRank : null)
    } catch (error) {
      console.error('Failed to get user rank:', error)
      setRank(null)
    } finally {
      setIsLoading(false)
    }
  }, [userAddress, category])

  useEffect(() => {
    getUserRank()
  }, [getUserRank])

  return { rank, isLoading, refresh: getUserRank }
}
