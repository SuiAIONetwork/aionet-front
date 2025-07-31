"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleImage } from "@/components/ui/role-image"
import { Filter, SortAsc, Users, Crown, Shield, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserSearchFiltersProps {
  selectedRole: 'ALL' | 'NOMAD' | 'PRO' | 'ROYAL'
  sortBy: 'username' | 'joinDate' | 'level' | 'points'
  onRoleChange: (role: 'ALL' | 'NOMAD' | 'PRO' | 'ROYAL') => void
  onSortChange: (sort: 'username' | 'joinDate' | 'level' | 'points') => void
}

export function UserSearchFilters({
  selectedRole,
  sortBy,
  onRoleChange,
  onSortChange
}: UserSearchFiltersProps) {

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ROYAL':
        return <Crown className="w-3 h-3" />
      case 'PRO':
        return <Shield className="w-3 h-3" />
      case 'NOMAD':
        return <Star className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const roleOptions = [
    { value: 'ALL', label: 'All Roles', icon: <Users className="w-3 h-3" /> },
    { value: 'ROYAL', label: 'Royal', icon: <Crown className="w-3 h-3" /> },
    { value: 'PRO', label: 'Pro', icon: <Shield className="w-3 h-3" /> },
    { value: 'NOMAD', label: 'Nomad', icon: <Star className="w-3 h-3" /> }
  ]

  const sortOptions = [
    { value: 'username', label: 'Username (A-Z)' },
    { value: 'joinDate', label: 'Join Date (Newest)' },
    { value: 'level', label: 'Level (Highest)' },
    { value: 'points', label: 'Points (Highest)' }
  ]

  return (
    <div className="mt-4">
      {/* Filter and Sort Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-[#C0E6FF]" />
          <span className="text-[#C0E6FF] text-sm font-medium">Filters:</span>
        </div>

        {/* Role Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((role) => (
            <Button
              key={role.value}
              variant={selectedRole === role.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRoleChange(role.value as 'ALL' | 'NOMAD' | 'PRO' | 'ROYAL')}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                selectedRole === role.value
                  ? "bg-[#4DA2FF] hover:bg-[#4DA2FF]/80 text-white border-[#4DA2FF]"
                  : "border-[#C0E6FF]/30 text-[#C0E6FF] hover:bg-[#4DA2FF]/10 hover:border-[#4DA2FF]/50"
              )}
            >
              {role.value !== 'ALL' && role.value !== 'NOMAD' && role.value !== 'PRO' && role.value !== 'ROYAL' ? (
                role.icon
              ) : role.value !== 'ALL' ? (
                <RoleImage role={role.value as "NOMAD" | "PRO" | "ROYAL"} size="sm" />
              ) : (
                role.icon
              )}
              {role.label}
            </Button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            <SortAsc className="w-4 h-4 text-[#C0E6FF]" />
            <span className="text-[#C0E6FF] text-sm font-medium">Sort by:</span>
          </div>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as 'username' | 'joinDate' | 'level' | 'points')}>
            <SelectTrigger className="w-48 bg-[#1a2f51] border-[#C0E6FF]/30 text-[#FFFFFF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f51] border-[#C0E6FF]/30">
              {sortOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-[#FFFFFF] focus:bg-[#4DA2FF]/20 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
