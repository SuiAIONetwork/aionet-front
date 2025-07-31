"use client"

import { UserCard } from "./user-card"
import { UserListItem } from "./user-list-item"
import { UserAvatarGrid } from "./user-avatar-grid"
import { User } from "./user-search-interface"
import { Users, Search } from "lucide-react"

interface UserGridProps {
  users: User[]
  viewMode: 'grid' | 'list'
}

export function UserGrid({ users, viewMode }: UserGridProps) {
  if (users.length === 0) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-[#C0E6FF]/50 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              No users found
            </h3>
            <p className="text-[#C0E6FF] max-w-md mx-auto">
              Try adjusting your search criteria or filters to find more users in AIO Connect.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="space-y-2">
            {users.map((user) => (
              <UserListItem key={user.id} user={user} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Grid view now shows stacked avatars
  return <UserAvatarGrid users={users} />
}
