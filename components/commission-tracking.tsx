"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleImage } from "@/components/ui/role-image"
import { SuiIcon } from "@/components/ui/sui-icon"
import { CommissionData, CommissionTransaction } from "@/types/affiliate"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  UserPlus, 
  CreditCard,
  BarChart3,
  Gift,
  Clock,
  CheckCircle
} from "lucide-react"

interface CommissionTrackingProps {
  commissionData: CommissionData
  loading: boolean
}

export function CommissionTracking({ commissionData, loading }: CommissionTrackingProps) {
  const getCommissionTypeIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <UserPlus className="w-4 h-4" />
      case 'subscription':
        return <CreditCard className="w-4 h-4" />
      case 'purchase':
        return <ShoppingCart className="w-4 h-4" />
      case 'trading_fee':
        return <BarChart3 className="w-4 h-4" />
      default:
        return <Gift className="w-4 h-4" />
    }
  }

  const getCommissionTypeColor = (type: string) => {
    switch (type) {
      case 'signup':
        return 'text-green-400'
      case 'subscription':
        return 'text-blue-400'
      case 'purchase':
        return 'text-purple-400'
      case 'trading_fee':
        return 'text-orange-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatCommissionType = (type: string) => {
    switch (type) {
      case 'signup':
        return 'Sign Up'
      case 'subscription':
        return 'Subscription'
      case 'purchase':
        return 'Purchase'
      case 'trading_fee':
        return 'Trading Fee'
      default:
        return 'Other'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4DA2FF]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
