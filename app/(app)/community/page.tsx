"use client"

import { UserSearchInterface } from "@/components/user-search-interface"

export default function CommunityPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AIO Connect</h1>
          <p className="text-gray-400 mt-1">Search and connect with other users in the AIONET AIO Connect</p>
        </div>
      </div>

      <UserSearchInterface />
    </div>
  )
}
