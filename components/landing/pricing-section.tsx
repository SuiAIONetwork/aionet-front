"use client"

import { useRef, useState, useEffect } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuiWalletWithSocial } from "@/components/sui-wallet-with-social"
import { SignedIn, SignedOut } from "@/contexts/sui-auth-context"
import Link from "next/link"

// Custom interface for IntersectionObserver options with 'once' property
interface InViewOptions extends IntersectionObserverInit {
  once?: boolean
}

// Simplified InView implementation
const useInView = (ref: React.RefObject<Element>, options: InViewOptions = {}) => {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const currentRef = ref.current
    if (!currentRef) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)

      if (entry.isIntersecting && options.once && ref.current) {
        observer.unobserve(ref.current)
      }
    }, options)

    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
    }
  }, [ref, options.once, options.threshold])

  return isInView
}

const plans = [
  {
    name: "NOMAD",
    price: "Free",
    description: "Start your Web3 journey with basic community access",
    features: [
      { included: true, text: "Profile & Achievement System" },
      { included: true, text: "Basic Referral Network" },
      { included: true, text: "RaffleQuiz Participation" },
      { included: true, text: "Community Dashboard" },
      { included: false, text: "Premium Channel Access" },
      { included: false, text: "Creator Tools" },
      { included: false, text: "Advanced Analytics" },
    ],
    popular: false,
    buttonText: "Join Free",
    color: "#3b82f6" // blue
  },
  {
    name: "PRO",
    price: "400 USDC",
    period: "NFT mint",
    description: "Unlock premium features and creator tools",
    features: [
      { included: true, text: "Everything in NOMAD" },
      { included: true, text: "3 Free Premium Channel Access" },
      { included: true, text: "Create up to 2 Channels" },
      { included: true, text: "Advanced Referral Analytics" },
      { included: true, text: "Creator Controls Dashboard" },
      { included: false, text: "Maximum Channel Creation" },
      { included: false, text: "Priority Creator Support" },
    ],
    popular: true,
    buttonText: "Mint PRO NFT",
    color: "#8b5cf6" // purple
  },
  {
    name: "ROYAL",
    price: "1500 USDC",
    period: "NFT mint",
    description: "Ultimate access with maximum creator privileges",
    features: [
      { included: true, text: "Everything in PRO" },
      { included: true, text: "9 Free Premium Channel Access" },
      { included: true, text: "Create up to 3 Channels" },
      { included: true, text: "Priority Creator Support" },
      { included: true, text: "Exclusive ROYAL Features" },
      { included: true, text: "Advanced Network Analytics" },
      { included: true, text: "Early Access to New Features" },
    ],
    popular: false,
    buttonText: "Mint ROYAL NFT",
    color: "#f59e0b" // golden color
  }
]

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  return (
    <section className="py-32 bg-black relative overflow-hidden" id="pricing">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-[size:30px_30px] opacity-5 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px]" />

      <div 
        ref={ref}
        className="container mx-auto px-4 relative z-10"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s cubic-bezier(0.17, 0.55, 0.55, 1)"
        }}
      >
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm font-medium text-white/80">Simple Pricing</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            NFT-Based <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Membership</span>
          </h2>

          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Mint your membership NFT on Sui Network for lifetime access to exclusive community features and creator tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ plan, index }: {
  plan: {
    name: string
    price: string
    period?: string
    description: string
    features: Array<{ included: boolean; text: string }>
    popular: boolean
    buttonText: string
    color: string
  }
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  return (
    <div
      ref={ref}
      className={`
        backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-500
        ${plan.popular 
          ? 'border-white/20 bg-white/10 shadow-lg relative z-10 scale-105' 
          : 'border-white/10 bg-white/5'}
        hover:shadow-lg hover:border-white/20
      `}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 100}ms`,
        boxShadow: plan.popular ? `0 0 30px ${plan.color}10` : ''
      }}
    >
      {plan.popular && (
        <div 
          className="py-1 px-3 text-center text-xs font-semibold uppercase tracking-wider"
          style={{ 
            background: `linear-gradient(to right, ${plan.color}80, ${plan.color}40)`,
            color: 'white'
          }}
        >
          Most Popular
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
        <div className="flex items-end mb-4">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          {plan.period && <span className="text-white/60 ml-2 text-sm">{plan.period === "one-time" ? "one-time payment" : plan.period}</span>}
        </div>
        <p className="text-white/70 mb-6">{plan.description}</p>

        <div className="space-y-4 flex-grow">
          {plan.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center">
              {feature.included ? (
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{
                    background: `${plan.color}20`,
                    border: `1px solid ${plan.color}40`
                  }}
                >
                  <Check className="h-3 w-3" style={{ color: plan.color }} />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-white/10 border border-white/20">
                  <X className="h-3 w-3 text-white/40" />
                </div>
              )}
              <span className={feature.included ? 'text-white/90' : 'text-white/40'}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {plan.name !== "NOMAD" && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link href="/subscriptions">
              <Button
                className={`w-full rounded-lg py-3 h-auto transition-all duration-300 font-medium text-sm ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                variant="default"
              >
                {plan.buttonText}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
