"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useTierRefresh } from "@/hooks/use-tier-sync"
import { useSubscription } from "@/contexts/subscription-context"
import { useState } from "react"

export function TierRefreshButton() {
  const { refreshTier } = useTierRefresh()
  const { reloadTier } = useSubscription()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshTier()
      // Force reload tier from database
      await reloadTier()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Syncing...' : 'Sync Tier'}
    </Button>
  )
}
