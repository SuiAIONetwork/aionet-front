import type React from "react"
import "./globals.css"
import { Inter, Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { PointsProvider } from "@/contexts/points-context"
import { CreatorsDatabaseProvider } from "@/contexts/creators-database-context"
import { PremiumAccessProvider } from "@/contexts/premium-access-context"
import { ProfileProvider } from "@/contexts/profile-context"
import { BackendAuthProvider } from "@/contexts/BackendAuthContext"
import { SuiProviders } from "@/components/sui-providers"
import { Toaster } from "@/components/ui/sonner"


import type { Metadata, Viewport } from "next"
import '@/styles/squares.css'








const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-space-grotesk',
})









export const metadata: Metadata = {
  title: "AIONET - ALL IN ONE NETWORK",
  description: "Empowering everyday individuals through decentralized investment opportunities, NFT-gated trading bots, and educational resources on Sui Network",
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} blue-theme`}>
      <body className="font-sans bg-dashboard-dark min-h-screen">
        <ThemeProvider defaultTheme="blue-theme" enableSystem={false}>
          <SuiProviders>
            <BackendAuthProvider>
              <ProfileProvider>
                <SubscriptionProvider>
                  <PremiumAccessProvider>
                    <SettingsProvider>
                      <PointsProvider>
                        <CreatorsDatabaseProvider>
                          {children}

                          {/* <FriendRequestNotifications /> */}
                          <Toaster />
                        </CreatorsDatabaseProvider>
                      </PointsProvider>
                    </SettingsProvider>
                  </PremiumAccessProvider>
                </SubscriptionProvider>
              </ProfileProvider>
            </BackendAuthProvider>
          </SuiProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

