"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

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

      if (entry.isIntersecting && options.once) {
        observer.unobserve(currentRef)
      }
    }, options)

    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
    }
  }, [ref, options.once, options.threshold, options])

  return isInView
}

const faqs = [
  {
    question: "What is AIONET and how does it work?",
    answer: "AIONET is an NFT-gated community on Sui Network that combines social features, achievement systems, and creator monetization. Members can build profiles, earn XP through achievements, grow referral networks, and access premium creator content."
  },
  {
    question: "How do I join the community?",
    answer: "You can join for free as a NOMAD member using zkLogin (Google) or by connecting your Sui wallet. Complete the 4-step onboarding process to set up your profile, choose an avatar, and start earning achievements."
  },
  {
    question: "What are the different membership tiers?",
    answer: "There are three tiers: NOMAD (free), PRO (0.5 SUI NFT), and ROYAL (1.0 SUI NFT). PRO members get 3 free premium channel accesses and can create 2 channels. ROYAL members get 9 free accesses and can create 3 channels."
  },
  {
    question: "How does the referral system work?",
    answer: "The referral system has 5 levels with commission tracking. Generate your unique referral code, share it with others, and earn from their activities. Your affiliate level matches your profile level (1-5) based on XP earned through achievements."
  },
  {
    question: "What is RaffleCraft and how do I participate?",
    answer: "RaffleCraft is a weekly quiz-based raffle system. Answer blockchain-related questions to earn ticket minting rights, then use SUI tokens to mint numbered tickets and participate in weekly prize drawings."
  },
  {
    question: "How do creator channels work?",
    answer: "Verified creators can monetize their Telegram channels through AIONET. Users pay in SUI tokens for 30, 60, or 90-day access. PRO and ROYAL members get free premium channel accesses based on their tier."
  },
  {
    question: "What achievements can I earn?",
    answer: "There are 21 unique achievements worth 50-800 XP each, covering profile completion, social connections, referrals, and community participation. Achievements unlock as you progress through 10 profile levels (0-5000 XP total)."
  }
]

export function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  return (
    <section className="py-32 bg-black relative overflow-hidden" id="faq">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-[size:30px_30px] opacity-5 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px]" />

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
            <span className="text-sm font-medium text-white/80">Questions & Answers</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Frequently Asked <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Questions</span>
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Find answers to common questions about AIONET's NFT-gated community and Web3 features.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              faq={faq} 
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ faq, index, isInView }: { faq: { question: string; answer: string }, index: number, isInView: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef(null)

  return (
    <div 
      className="mb-4 last:mb-0 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/5 hover:border-white/20 transition-all duration-300"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${index * 100}ms`,
        transitionProperty: "transform, opacity",
        transitionDuration: "500ms",
        transitionTimingFunction: "cubic-bezier(0.17, 0.55, 0.55, 1)"
      }}
    >
      <button
        className="w-full text-left p-6 flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-medium text-white">{faq.question}</h3>
        <ChevronDown 
          className={`h-5 w-5 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div 
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: isOpen ? `${(contentRef.current as unknown as HTMLDivElement)?.scrollHeight}px` : "0px",
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="p-6 pt-0 text-white/70">
          <div className="h-px w-full bg-white/10 mb-6"></div>
          <p>{faq.answer}</p>
        </div>
      </div>
    </div>
  )
}