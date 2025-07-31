"use client"

import { useRef, useState, useEffect } from "react"
import { TrendingUp, BarChart2, Shield, Zap, Users, Globe } from "lucide-react"
import { SpotlightCard } from "@/components/ui/spotlight-card"

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

const features = [
  {
    icon: Users,
    title: "Profile & Achievement System",
    description: "Build your profile with XP-based achievements, level progression, and showcase your Web3 journey with 21 unique achievements to unlock."
  },
  {
    icon: TrendingUp,
    title: "Referral Network",
    description: "Grow your network with a 5-level affiliate system. Earn commissions from referrals and track your network growth with detailed analytics."
  },
  {
    icon: Zap,
    title: "RaffleCraft",
    description: "Participate in weekly quiz-based raffles. Answer blockchain questions to earn ticket minting rights and win SUI token prizes."
  },
  {
    icon: BarChart2,
    title: "Creator Marketplace",
    description: "Access premium Telegram channels from verified creators. Subscribe with SUI tokens and join exclusive communities."
  },
  {
    icon: Shield,
    title: "NFT-Gated Access",
    description: "Hold NOMAD, PRO, or ROYAL NFTs to unlock exclusive features, premium channel access, and creator tools on Sui Network."
  },
  {
    icon: Globe,
    title: "Social Authentication",
    description: "Seamless login with zkLogin social authentication (Google) or traditional Sui wallet connection with persistent sessions."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-32 bg-black relative overflow-hidden" id="features">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-[size:30px_30px] opacity-5 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm font-medium text-white/80">Advanced Features</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Exclusive Community <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Features</span>
          </h2>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Experience the future of Web3 communities with NFT-gated access, social features, and decentralized rewards on Sui Network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, index }: {
  feature: {
    icon: React.ComponentType<{ className?: string }>,
    title: string,
    description: string
  },
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  const Icon = feature.icon

  // Define spotlight colors based on feature type
  const getSpotlightColor = () => {
    switch (index % 3) {
      case 0:
        return "rgba(59, 130, 246, 0.15)" // Blue
      case 1:
        return "rgba(139, 92, 246, 0.15)" // Purple
      case 2:
        return "rgba(14, 165, 233, 0.15)" // Sky
      default:
        return "rgba(59, 130, 246, 0.15)"
    }
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${index * 100}ms`
      }}
      className="transition-all duration-700"
    >
      <SpotlightCard
        spotlightColor={getSpotlightColor()}
        className="h-full backdrop-blur-sm border border-white/10 bg-white/5 p-6 rounded-2xl hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
      >
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <div className={`p-3 rounded-full w-12 h-12 flex items-center justify-center ${
              index % 3 === 0 ? "bg-blue-500/10" :
              index % 3 === 1 ? "bg-purple-500/10" :
              "bg-sky-500/10"
            }`}>
              <Icon className={`h-6 w-6 ${
                index % 3 === 0 ? "text-blue-400" :
                index % 3 === 1 ? "text-purple-400" :
                "text-sky-400"
              }`} />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
          <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
          
          <div className="mt-auto pt-6">
            <div className="flex items-center text-sm">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}
