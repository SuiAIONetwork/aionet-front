"use client"

import { useState, useEffect } from "react"
import { SuiWalletWithSocial } from "@/components/sui-wallet-with-social"
import { SignedIn, SignedOut } from "@/contexts/sui-auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Squares from "@/components/ui/squares"

// Simplified motion implementation since framer-motion might not be installed
const motion = {
  div: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  )
}

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="relative pt-24 min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-4">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Animated squares background */}
        <div className="absolute inset-0">
          <Squares
            speed={0.2}
            squareSize={40}
            direction="down"
            borderColor="rgba(255,255,255,0.1)"
            hoverFillColor="rgba(46, 26, 73, 0.8)"
            className="opacity-60"
          />
        </div>

        {/* Rest of background elements */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px] transform -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px] transform translate-x-1/2 translate-y-1/2"
          style={{ transform: `translate(50%, 50%) translateY(${-scrollY * 0.05}px)` }}
        />

        {/* Move this below the grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_80%)]"></div>
      </div>

      {/* Rest of the component */}
      <div className="container relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-block mb-3 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm font-medium text-white/80">🚀 NFT-Gated Community on Sui</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AIONET</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join the exclusive NFT-gated community on Sui Network. Build your profile, earn achievements, grow your referral network, and access premium creator content. Experience Web3 social features with zkLogin authentication.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
              <span className="text-sm font-medium text-white/80">NFT-Gated</span>
            </div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
              <span className="text-sm font-medium text-white/80">Sui Network</span>
            </div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm font-medium text-white/80">Social Auth</span>
            </div>
          </div>


        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 relative mb-[150px]"
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5" />

            {/* Browser-like header */}
            <div className="relative z-10 flex items-center bg-black/50 px-4 py-3 border-b border-white/10">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              <div className="mx-auto bg-black/50 rounded-md px-4 py-1 text-xs text-white/50 flex items-center">
                <div className="w-3 h-3 mr-2 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="21.17" y1="8" x2="12" y2="8"></line>
                    <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                    <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                  </svg>
                </div>
                app.aionet.io/dashboard
              </div>
            </div>

            <div className="relative w-full h-auto overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
              <Image
                src="/images/landing/dashboard.png"
                alt="AIONET Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto transform transition-transform duration-700 hover:scale-10"
                style={{
                  transform: `scale(${1 + scrollY * 0.0005}) translateY(${-scrollY * 0.02}px)`,
                  opacity: Math.max(0.7, 1 - scrollY * 0.001)
                }}
                priority
              />
            </div>

            {/* Floating stats */}
            <div className="absolute top-24 right-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="text-xs text-blue-400 font-medium">Community Members</div>
              <div className="text-lg font-bold text-white">2,847</div>
            </div>

            <div className="absolute bottom-24 left-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="text-xs text-purple-400 font-medium">NFT Holders</div>
              <div className="text-lg font-bold text-white">1,234</div>
            </div>

            <div className="absolute top-1/2 left-1/4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="text-xs text-green-400 font-medium">Active Creators</div>
              <div className="text-lg font-bold text-white">89</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowRight className="h-6 w-6 rotate-90 text-white/40" />
      </div>
    </section>
  )
}
