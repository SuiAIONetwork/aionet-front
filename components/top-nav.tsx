"use client"

import { Notifications } from "./notifications"
import { UnifiedWalletConnect } from "@/components/unified-wallet-connect"
import { SessionRestorationBadge } from "@/components/session-restoration-indicator"
import { UserSearch } from "@/components/user-search"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { User, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const pathSegments = pathname.split("/").filter(Boolean)


  return (
    <header className="sticky top-0 z-40 header-gradient">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="hidden md:block">
          <nav className="flex items-center space-x-2">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={segment}>
                <span className="text-muted-foreground">/</span>
                <Link href={`/${pathSegments.slice(0, index + 1).join("/")}`} className="text-sm font-medium">
                  {segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ")}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="md:hidden ml-[62px]">
          <span className="text-sm font-medium">
            {pathSegments.length > 0
              ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() +
                pathSegments[pathSegments.length - 1].slice(1).replace("-", " ")
              : "Home"}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Header Navigation Icons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-slate-700 rounded-full hover:border-[#4da2ff] hover:bg-[#4da2ff]/10 transition-colors"
                  onClick={() => router.push('/profile')}
                >
                  <User className="h-[1.2rem] w-[1.2rem] text-slate-200" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Profile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-slate-700 rounded-full hover:border-[#4da2ff] hover:bg-[#4da2ff]/10 transition-colors"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-[1.2rem] w-[1.2rem] text-slate-200" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>



          <Notifications />

          {/* Session restoration indicator */}
          <SessionRestorationBadge />

          {/* Unified Wallet Connect (Crypto + zkLogin) */}
          <UnifiedWalletConnect />
        </div>
      </div>
    </header>
  )
}
