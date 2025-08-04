"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface EnokiAuthProps {
  onAuthChange?: (isAuthenticated: boolean, address?: string) => void
}

export function EnokiAuth({ onAuthChange }: EnokiAuthProps) {
  return (
    <Card className="bg-[#030F1C] border-[#1a2f51] shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Enoki Authentication
          <Badge variant="secondary" className="ml-2">Disabled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Enoki authentication is currently disabled</p>
          <p className="text-sm text-gray-500">This feature has been removed from the platform</p>
        </div>
      </CardContent>
    </Card>
  )
}
