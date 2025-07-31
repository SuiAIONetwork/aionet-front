"use client"

import { PersistentProfileSystem } from "@/components/persistent-profile-system"
import { NewUserOnboarding } from "@/components/new-user-onboarding"
import { useSuiAuth } from "@/contexts/sui-auth-context"

export default function ProfilePage() {
  const { isNewUser, user } = useSuiAuth()

  return (
    <>
      {/* New User Onboarding Modal */}
      <NewUserOnboarding />

      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Profile</h1>
            <p className="text-gray-400 mt-1">
              {isNewUser && !user?.onboardingCompleted
                ? "Complete your profile setup to get started"
                : "Manage your persistent profile with encrypted database storage"
              }
            </p>
          </div>
        </div>

        <PersistentProfileSystem />
      </div>
    </>
  )
}
