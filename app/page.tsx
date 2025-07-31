"use client"

import { HeroSection } from "@/components/landing/hero-section"
import { Header } from "@/components/landing/header"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CTASection } from "@/components/landing/cta-section"
import { FAQSection } from "@/components/landing/faq-section"
import { Footer } from "@/components/landing/footer"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useSuiAuth()
  const [scrollY, setScrollY] = useState(0)

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Redirect to profile if signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect("/profile")
    }
  }, [isLoaded, isSignedIn])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-3xl"
          style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full filter blur-3xl"
          style={{ transform: `translate(50%, 50%) translateY(${-scrollY * 0.05}px)` }}
        />
      </div>

      <Header />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection /> {/* Add the FAQ section here, typically before pricing or CTA */}
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
