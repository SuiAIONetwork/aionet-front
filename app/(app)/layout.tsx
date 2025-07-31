"use client"

import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { SessionRestorationIndicator } from "@/components/session-restoration-indicator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BotFollowingProvider } from "@/contexts/bot-following-context"
import { NotificationProvider } from "@/contexts/notification-context"

import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useTierSync } from "@/hooks/use-tier-sync"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import Squares from "@/components/ui/squares"
import WaterDrops from "@/components/ui/water-drops"

// Component to handle tier sync inside ProfileProvider (DISABLED)
function TierSyncWrapper() {
  // DISABLED to prevent sidebar blinking
  return null
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useSuiAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Check if we're on the dashboard page
  const isDashboardPage = pathname === '/dashboard' || pathname === '/aio-dashboard'

  // Pages that don't require authentication
  const publicPages = ['/zklogin-test', '/zklogin/callback', '/zklogin']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))

  // Redirect if not signed in (only after initial load is complete)
  useEffect(() => {
    // Skip redirect for public pages
    if (isPublicPage) return

    // Only redirect if we're sure the user is not signed in
    // and we've had enough time for the wallet to connect
    if (isLoaded && !isSignedIn) {
      const timer = setTimeout(() => {
        // Double-check the sign-in status before redirecting
        if (!isSignedIn) {
          router.push("/")
        }
      }, 1000) // Give more time for session restoration

      return () => clearTimeout(timer)
    }
  }, [isLoaded, isSignedIn, router, isPublicPage])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-dark">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Auto-sync tier when wallet is connected - inside ProfileProvider */}
      <TierSyncWrapper />
      <NotificationProvider>
        <BotFollowingProvider>
          <div className="min-h-screen flex flex-col lg:flex-row relative" style={{ backgroundColor: '#0f172a' }}>
            {/* Background - Dark blue gradient matching the image */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#1e40af] opacity-50"></div>
            {isDashboardPage ? (
              <WaterDrops
                speed={0.8}
                dropSize={12}
                direction="random"
                dropColor="rgba(30, 58, 138, 0.15)"
                hoverRippleColor="rgba(30, 58, 138, 0.3)"
                className="opacity-40"
                numDrops={35}
              />
            ) : (
              <Squares
                speed={0.1}
                squareSize={40}
                direction="down"
                borderColor="rgba(30, 58, 138, 0.3)"
                hoverFillColor="rgba(30, 58, 138, 0.15)"
                className="opacity-50"
              />
            )}
          </div>

          <Sidebar />
          <div className="flex-1 flex flex-col w-full relative z-10">
            <TopNav />
            <div className="flex-1 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              {/* Session restoration indicator */}
              <div className="mb-4">
                <SessionRestorationIndicator />
              </div>
              <main className="w-full">{children}</main>
            </div>
          </div>
          </div>
        </BotFollowingProvider>
      </NotificationProvider>
    </TooltipProvider>
  )
}
