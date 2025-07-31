"use client"

import { CommunityGatedAccess } from "@/components/community-gated-access"

export default function GatedAccessPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">AIO Connect</h1>
          <p className="text-gray-400 mt-1">Connect with exclusive Discord and Telegram AIO Connect communities</p>
        </div>
      </div>

      <CommunityGatedAccess />
    </div>
  )
}
