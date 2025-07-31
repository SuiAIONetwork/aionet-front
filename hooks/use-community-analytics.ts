"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface CommunityAnalytics {
  totalHolders: number
  nomadUsers: number
  proHolders: number
  royalHolders: number
  targetHolders: number
  dewhaleTargetHolders: number
  monthlyGrowth: string
  lastUpdated: string
}

export function useCommunityAnalytics() {
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/community-analytics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch community analytics')
      }

      const data = await response.json()
      setAnalytics(data)

    } catch (error) {
      console.error('Error fetching community analytics:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to load community analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    await fetchAnalytics()
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics
  }
}
