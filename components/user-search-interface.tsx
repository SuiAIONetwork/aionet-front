"use client"

import { useState, useEffect } from "react"
import { UserGrid } from "./user-grid"
import { UserSearchFilters } from "./user-search-filters"
import { Search, Users, Filter, Grid3X3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCommunityUsers } from "@/hooks/use-community-users"
// Define types inline since @/types/client-safe doesn't exist
export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  role: 'NOMAD' | 'PRO' | 'ROYAL'
  level: number
  totalPoints: number
  joinDate: string
  lastActive: string
  location?: string
  bio?: string
  activity?: string
  achievements: Achievement[]
}

export interface Achievement {
  name: string
  icon?: string
  color: string
  unlocked: boolean
  claimed: boolean
  xp: number
  tooltip: string
  image?: string
}

// Social media image paths
const socialImages = {
  Discord: "/images/social/discord.png",
  Telegram: "/images/social/telegram.png",
  X: "/images/social/x.png"
}

// Note: Mock data removed - now using real database data via useCommunityUsers hook



interface UserSearchInterfaceProps {
  onUserSelect?: (user: User) => void
}

export function UserSearchInterface({ onUserSelect }: UserSearchInterfaceProps = {}) {
  const { users: communityUsers, isLoading, error, refreshUsers } = useCommunityUsers()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'NOMAD' | 'PRO' | 'ROYAL'>('ALL')
  const [sortBy, setSortBy] = useState<'username' | 'joinDate' | 'level' | 'points'>('username')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and sort users
  const filteredUsers = communityUsers.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole

    return matchesSearch && matchesRole
  }).sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return a.username.localeCompare(b.username)
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      case 'level':
        return b.level - a.level
      case 'points':
        return b.totalPoints - a.totalPoints
      default:
        return 0
    }
  })

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[#4DA2FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                Loading Community Members
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto">
                Fetching user profiles from the database...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Failed to Load Community
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto mb-4">
                {error}
              </p>
              <Button
                onClick={refreshUsers}
                className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state when no users found but no error
  if (!isLoading && !error && communityUsers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No Community Members Yet
              </h3>
              <p className="text-[#C0E6FF] max-w-md mx-auto mb-4">
                The community is just getting started! Be the first to create a profile and join the AIONET community.
              </p>
              <Button
                onClick={refreshUsers}
                className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C0E6FF]" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF] placeholder:text-[#C0E6FF]/60"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  viewMode === 'grid'
                    ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                    : "border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#4DA2FF]/10"
                )}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Avatars</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  viewMode === 'list'
                    ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white"
                    : "border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#4DA2FF]/10"
                )}
              >
                <List className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <UserSearchFilters
            selectedRole={selectedRole}
            sortBy={sortBy}
            onRoleChange={setSelectedRole}
            onSortChange={setSortBy}
          />

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-[#C0E6FF]/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4DA2FF]" />
              <span className="text-[#C0E6FF] text-sm">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* User Grid/List */}
      <UserGrid users={filteredUsers} viewMode={viewMode} />
    </div>
  )
}
