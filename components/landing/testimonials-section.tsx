"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlaceholderImage } from "./placeholder-images"
import Image from "next/image"

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

const testimonials = [
  {
    name: "Alex Crypto",
    role: "ROYAL Member",
    image: "/images/landing/testimonial-1.jpg",
    content: "AIONET's referral system has been incredible. I've built a network of 50+ members and the commission tracking is transparent. The achievement system keeps me engaged daily.",
    rating: 5
  },
  {
    name: "Sarah Web3",
    role: "Content Creator",
    image: "/images/landing/testimonial-2.jpg",
    content: "As a PRO member, I love the creator tools. I've monetized my Telegram channel and the SUI payment system is seamless. The community is genuinely supportive.",
    rating: 5
  },
  {
    name: "Michael Sui",
    role: "Community Builder",
    image: "/images/landing/testimonial-3.jpg",
    content: "The zkLogin authentication made joining so easy - no complex wallet setup needed. I've unlocked 15 achievements so far and love tracking my XP progress.",
    rating: 4
  },
  {
    name: "Emma NFT",
    role: "PRO Member",
    image: "/images/landing/testimonial-4.jpg",
    content: "The premium channel access is worth the NFT mint cost alone. I've learned so much from verified creators and the RaffleQuiz is addictive - won 5 SUI last week!",
    rating: 5
  },
  {
    name: "David Builder",
    role: "NOMAD Member",
    image: "/images/landing/testimonial-5.jpg",
    content: "Started as a free NOMAD member and the profile system hooked me. The anime avatars are cute and building my referral network has been surprisingly rewarding.",
    rating: 5
  }
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  // Create placeholder images for testimonials
  const testimonial1 = usePlaceholderImage(100, 100, "T1", "#3b82f6", "#ffffff")
  const testimonial2 = usePlaceholderImage(100, 100, "T2", "#8b5cf6", "#ffffff")
  const testimonial3 = usePlaceholderImage(100, 100, "T3", "#ec4899", "#ffffff")
  const testimonial4 = usePlaceholderImage(100, 100, "T4", "#10b981", "#ffffff")
  const testimonial5 = usePlaceholderImage(100, 100, "T5", "#f59e0b", "#ffffff")

  // Map testimonial images
  const testimonialImages = [
    testimonial1,
    testimonial2,
    testimonial3,
    testimonial4,
    testimonial5
  ]

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-32 bg-black relative overflow-hidden" id="testimonials">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-[size:30px_30px] opacity-5 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[100px]" />

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
            <span className="text-sm font-medium text-white/80">User Testimonials</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            What Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Users Say</span>
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Join thousands of community members who are building their Web3 presence and earning rewards with AIONET.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
            <div className="absolute -top-6 -left-6 text-blue-400/20">
              <Quote size={80} className="rotate-180" />
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 z-10" />
                <img
                  src={testimonialImages[activeIndex]}
                  alt={testimonials[activeIndex].name}
                  className="w-full h-full object-cover relative z-0"
                />
              </div>

              <div className="flex-1">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < testimonials[activeIndex].rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                    />
                  ))}
                </div>

                <blockquote className="text-lg md:text-xl mb-6 text-white/90 leading-relaxed">
                  "{testimonials[activeIndex].content}"
                </blockquote>

                <div>
                  <p className="font-semibold text-white">{testimonials[activeIndex].name}</p>
                  <p className="text-sm text-white/60">{testimonials[activeIndex].role}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2 items-center">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === activeIndex 
                        ? 'bg-gradient-to-r from-blue-400 to-purple-500 scale-125' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/70"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
