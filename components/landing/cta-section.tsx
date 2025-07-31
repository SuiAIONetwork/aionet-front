"use client"

import { useRef, useState, useEffect, RefObject } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Simplified InView implementation with proper TypeScript types
const useInView = (ref: RefObject<Element>, options: { once?: boolean; threshold?: number } = {}) => {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)

      if (entry.isIntersecting && options.once) {
        observer.unobserve(ref.current as Element)
      }
    }, {
      threshold: options.threshold
    })

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [ref, options.once, options.threshold])

  return isInView
}

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref as unknown as RefObject<HTMLDivElement>, { once: true, threshold: 0.3 })

  return (
    <section className="py-32 bg-black relative overflow-hidden" id="cta">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-[size:30px_30px] opacity-5 [mask-image:radial-gradient(white,transparent_70%)]" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px]" />

      <div
        ref={ref}
        className="container mx-auto px-4 relative z-10"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s cubic-bezier(0.17, 0.55, 0.55, 1)"
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm font-medium text-white/80">Join the Community</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Build</span> Your Web3 Profile?
          </h2>

          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl mx-auto">
            Join the AIONET NFT-gated community on Sui Network. Build your profile, earn achievements, grow your referral network, and access exclusive creator content. Start your Web3 social journey today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-md px-8 py-6 text-lg w-full sm:w-auto"
              asChild
            >
              <Link href="/sign-up">Get Started Now</Link>
            </Button>

            <Button
              variant="outline"
              className="border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white px-8 py-6 text-lg w-full sm:w-auto"
              asChild
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          <p className="text-sm text-white/50">
            No credit card required. Free plan available. <span className="text-white/70">Premium plans start at 400 USDC.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
