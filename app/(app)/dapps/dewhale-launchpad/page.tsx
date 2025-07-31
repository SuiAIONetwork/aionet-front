"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Rocket,
  TrendingUp,
  Users,
  Clock,
  Zap,
  ArrowRight,
  ExternalLink,
  Wallet,
  DollarSign,
  Star,
  Shield,
  Target,
  Globe,
  Award,
  CheckCircle,
  Calendar,
  BarChart3,
  Coins,
  Crown,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle
} from "lucide-react"

interface LaunchpadProject {
  id: string
  name: string
  symbol: string
  description: string
  category: string
  totalRaise: string
  pricePerToken: string
  tokensForSale: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'live' | 'ended' | 'successful'
  progress: number
  participants: number
  minAllocation: string
  maxAllocation: string
  vesting: string
  logo: string
  website: string
  whitepaper: string
  tier: 'public' | 'pro' | 'royal'
}

const launchpadProjects: LaunchpadProject[] = [
  {
    id: "1",
    name: "SuiSwap Protocol",
    symbol: "SSWAP",
    description: "Next-generation DEX built on Sui with advanced AMM features and yield farming",
    category: "DeFi",
    totalRaise: "$2.5M",
    pricePerToken: "$0.05",
    tokensForSale: "50,000,000",
    startDate: "2024-02-15",
    endDate: "2024-02-22",
    status: "live",
    progress: 75,
    participants: 1247,
    minAllocation: "100 SUI",
    maxAllocation: "5,000 SUI",
    vesting: "20% TGE, 80% over 12 months",
    logo: "/api/placeholder/80/80",
    website: "https://suiswap.io",
    whitepaper: "https://docs.suiswap.io",
    tier: "public"
  },
  {
    id: "2",
    name: "AIOVerse Sui",
    symbol: "AVSUI",
    description: "Immersive metaverse platform powered by Sui blockchain technology",
    category: "Gaming",
    totalRaise: "$5.0M",
    pricePerToken: "$0.12",
    tokensForSale: "41,666,667",
    startDate: "2024-03-01",
    endDate: "2024-03-08",
    status: "upcoming",
    progress: 0,
    participants: 0,
    minAllocation: "500 SUI",
    maxAllocation: "10,000 SUI",
    vesting: "10% TGE, 90% over 18 months",
    logo: "/api/placeholder/80/80",
    website: "https://aioversesui.com",
    whitepaper: "https://docs.aioversesui.com",
    tier: "pro"
  },
  {
    id: "3",
    name: "SuiChain AI",
    symbol: "SCAI",
    description: "AI-powered blockchain infrastructure for next-gen dApps on Sui",
    category: "AI/Infrastructure",
    totalRaise: "$10.0M",
    pricePerToken: "$0.25",
    tokensForSale: "40,000,000",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    status: "upcoming",
    progress: 0,
    participants: 0,
    minAllocation: "1,000 SUI",
    maxAllocation: "25,000 SUI",
    vesting: "5% TGE, 95% over 24 months",
    logo: "/api/placeholder/80/80",
    website: "https://suichain.ai",
    whitepaper: "https://docs.suichain.ai",
    tier: "royal"
  }
]

export default function DEWhaleLaunchpadPage() {
  const [selectedProject, setSelectedProject] = useState<LaunchpadProject | null>(null)
  const [investAmount, setInvestAmount] = useState("")
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live')
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeOrbitalIcon, setActiveOrbitalIcon] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500 text-white'
      case 'upcoming':
        return 'bg-blue-500 text-white'
      case 'ended':
        return 'bg-gray-500 text-white'
      case 'successful':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'public':
        return 'bg-gray-500 text-white'
      case 'pro':
        return 'bg-[#4DA2FF] text-white'
      case 'royal':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'royal':
        return <Crown className="w-3 h-3" />
      case 'pro':
        return <Star className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const getTierImageName = (tier: string) => {
    switch (tier) {
      case 'public':
        return 'nomad'
      case 'pro':
        return 'pro'
      case 'royal':
        return 'royal'
      default:
        return 'nomad'
    }
  }

  const totalRaised = launchpadProjects.reduce((acc, project) => {
    const value = parseFloat(project.totalRaise.replace(/[$M,]/g, '')) * 1000000
    return acc + (value * project.progress / 100)
  }, 0)

  const liveProjects = launchpadProjects.filter(p => p.status === 'live').length
  const totalParticipants = launchpadProjects.reduce((acc, project) => acc + project.participants, 0)

  // Filter projects based on active tab
  const filteredProjects = launchpadProjects.filter(project => {
    if (activeTab === 'live') {
      return project.status === 'live'
    } else {
      return project.status === 'upcoming'
    }
  })

  return (
    <>
      <style jsx>{`
        .ripple-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          filter: blur(0.5px);
        }

        .ripple {
          position: absolute;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle,
            rgba(77, 162, 255, 0.3) 0%,
            rgba(77, 162, 255, 0.15) 30%,
            rgba(77, 162, 255, 0.08) 60%,
            transparent 100%);
          border-radius: 50%;
          animation: fluid-ripple 6s infinite ease-out;
          filter: blur(2px);
        }

        .ripple-1 {
          animation-delay: 0s;
          filter: blur(1.5px);
        }

        .ripple-2 {
          animation-delay: 1.2s;
          filter: blur(2.5px);
        }

        .ripple-3 {
          animation-delay: 2.4s;
          filter: blur(1.8px);
        }

        .ripple-4 {
          animation-delay: 3.6s;
          filter: blur(2.2px);
        }

        .ripple-5 {
          animation-delay: 4.8s;
          filter: blur(1.6px);
        }

        .ripple-6 {
          animation-delay: 0.6s;
          filter: blur(2.8px);
        }

        @keyframes fluid-ripple {
          0% {
            width: 15px;
            height: 15px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          5% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(0.1);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.3);
          }
          40% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(0.7);
          }
          70% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        @media (min-width: 768px) {
          @keyframes fluid-ripple {
            0% {
              width: 20px;
              height: 20px;
              opacity: 0;
              transform: translate(-50%, -50%) scale(0);
            }
            5% {
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(0.1);
            }
            15% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(0.3);
            }
            40% {
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(0.7);
            }
            70% {
              opacity: 0.3;
              transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
              width: 300px;
              height: 300px;
              opacity: 0;
              transform: translate(-50%, -50%) scale(1.5);
            }
          }
        }

        /* Additional fluid layers for more realistic effect */
        .ripple::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle,
            rgba(192, 230, 255, 0.2) 0%,
            rgba(192, 230, 255, 0.08) 40%,
            transparent 70%);
          border-radius: 50%;
          animation: inner-wave 6s infinite ease-out;
          filter: blur(1.5px);
        }

        @keyframes inner-wave {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          10% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0.5;
          }
          30% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.4;
          }
          60% {
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 0.2;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>

      <div className="space-y-6 p-6">
      {/* Accordion Top Bar */}
      <div className="mb-6">
        {/* Top Bar */}
        <div
          className="enhanced-card cursor-pointer transition-all duration-300 hover:shadow-lg"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/dewhale.png"
                  alt="DEWhale"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dewhale</h1>
                <p className="text-sm text-gray-400">Discover and invest in blockchain projects</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-white">12</div>
                  <div className="text-gray-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">$2.4M</div>
                  <div className="text-gray-400">Raised</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">8.5K</div>
                  <div className="text-gray-400">Investors</div>
                </div>
              </div>

              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isAccordionOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Accordion Content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isAccordionOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <div className="enhanced-card p-6">
            {/* DEWhale Logo and Main Content */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/dewhale.png"
                  alt="DEWhale Launchpad"
                  width={96}
                  height={96}
                  className="w-24 h-24"
                />
              </div>
              <p className="text-xl text-[#C0E6FF] mb-6 max-w-3xl mx-auto">
                The premier launchpad for innovative projects on Sui Network. Discover, invest, and be part of the next generation of blockchain innovation.
              </p>
              <h3 className="text-xl font-bold text-white mb-2">Coming Q4 2024</h3>
              <p className="text-[#C0E6FF] mb-6">
                DEWhale Launchpad is our flagship DApp for the Sui ecosystem. Be among the first to discover groundbreaking projects.
              </p>
              <div className="flex gap-3 justify-center mb-8">
                <Button className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white transition-colors duration-200">
                  <Star className="w-4 h-4 mr-2" />
                  Join Waitlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Total Raised</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">${(totalRaised / 1000000).toFixed(1)}M</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 text-xs font-medium">+45.2%</span>
                <span className="text-[#C0E6FF] text-xs ml-2">this month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Rocket className="w-5 h-5 text-[#4DA2FF]" />
              <h3 className="font-semibold">Live Projects</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{liveProjects}</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 text-xs font-medium">+12.5%</span>
                <span className="text-[#C0E6FF] text-xs ml-2">this week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Total Investors</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{totalParticipants.toLocaleString()}</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 text-xs font-medium">+28.5%</span>
                <span className="text-[#C0E6FF] text-xs ml-2">this week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="enhanced-card">
          <div className="enhanced-card-content">
            <div className="flex items-center gap-2 text-white mb-4">
              <Target className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">Success Rate</h3>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">94.7%</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 text-xs font-medium">+2.3%</span>
                <span className="text-[#C0E6FF] text-xs ml-2">this quarter</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Featured Projects</h2>

          {/* Tabs */}
          <div className="flex bg-[#1a2f51] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'live'
                  ? 'bg-[#4da2ff] text-white shadow-md'
                  : 'text-[#C0E6FF] hover:text-white hover:bg-[#4da2ff]/20'
              }`}
            >
              Live ({launchpadProjects.filter(p => p.status === 'live').length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-[#4da2ff] text-white shadow-md'
                  : 'text-[#C0E6FF] hover:text-white hover:bg-[#4da2ff]/20'
              }`}
            >
              Upcoming ({launchpadProjects.filter(p => p.status === 'upcoming').length})
            </button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <div key={project.id} className="enhanced-card overflow-hidden rounded-2xl">
              {/* Project Image/Logo Section */}
              <div className="relative h-32 bg-gradient-to-br from-[#1a2f51] to-[#030f1c] flex rounded-t-2xl">
                {/* Left side - Logo covering 1/2 on mobile, 1/4 on desktop */}
                <div className="w-1/2 md:w-1/4 h-full relative overflow-hidden rounded-tl-2xl">
                  <Image
                    src="/images/gala.webp"
                    alt="Project Logo"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Right side - Status and other elements with square corners */}
                <div className="flex-1 relative h-full">
                  {/* Status Badge at the very top */}
                  <Badge className={`${getStatusColor(project.status)} px-3 py-1 text-xs font-semibold rounded-md absolute top-2 right-2 z-10`}>
                    {project.status.toUpperCase()}
                  </Badge>

                  {/* Bottom right elements */}
                  <div className="absolute bottom-2 right-2 flex flex-col items-end gap-2">
                    {/* Tier Image - smaller size */}
                    <div className="w-12 h-12">
                      <Image
                        src={`/images/${getTierImageName(project.tier)}.png`}
                        alt={project.tier.toUpperCase()}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Countdown Timer - smaller version */}
                    <div className="bg-red-600 rounded-md px-2 py-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-bold">2H 48M</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="enhanced-card-content space-y-6">
                {/* Project Title */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
                  <p className="text-[#C0E6FF] text-sm leading-relaxed">{project.description}</p>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#C0E6FF] text-sm font-medium">Progress</span>
                    <span className="text-white text-sm font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-[#1a2f51] rounded-full h-2.5 mb-2">
                    <div
                      className="bg-gradient-to-r from-[#4da2ff] to-[#00d4aa] h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#C0E6FF]">
                      Raised: {Math.round((project.progress / 100) * (project.id === "1" ? 10000 : project.id === "2" ? 50000 : 100000)).toLocaleString()} SUI
                    </span>
                    <span className="text-[#C0E6FF]">
                      Goal: {project.id === "1" ? '10,000' : project.id === "2" ? '50,000' : '100,000'} SUI
                    </span>
                  </div>
                </div>

                {/* Desktop: Side by side layout, Mobile: Stacked layout */}
                <div className="flex flex-col lg:flex-row lg:gap-8">
                  {/* Left Column - Targeted Raise and Token Price */}
                  <div className="flex-1">
                    {/* Targeted Raise */}
                    <div className="mb-6">
                      <p className="text-[#C0E6FF] text-sm mb-2">Targeted Raise</p>
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/logo-sui.png"
                          alt="SUI"
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <span className="text-2xl font-bold text-white">
                          {project.id === "1" ? '10,000' : project.id === "2" ? '50,000' : '100,000'}
                        </span>
                      </div>
                    </div>

                    {/* Token Price */}
                    <div>
                      <p className="text-[#C0E6FF] text-xs font-semibold mb-1">TOKEN PRICE</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{project.pricePerToken.replace('$', '')}</span>
                        <Image
                          src="/images/logo-sui.png"
                          alt="SUI"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Registration Periods (only visible on desktop) */}
                  <div className="hidden lg:block flex-1">
                    <div className="mb-6">
                      <p className="text-[#C0E6FF] text-xs font-semibold mb-1">REGISTER PERIOD (FROM)</p>
                      <p className="text-white font-bold">17 JUN 2025, 1PM UTC</p>
                    </div>
                    <div className="mt-10">
                      <p className="text-[#C0E6FF] text-xs font-semibold mb-1">REGISTER PERIOD (TO)</p>
                      <p className="text-white font-bold">24 JUN 2025, 1PM UTC</p>
                    </div>
                  </div>
                </div>

                {/* Registration Periods for Mobile (only visible on mobile) */}
                <div className="lg:hidden space-y-3">
                  <div>
                    <p className="text-[#C0E6FF] text-xs font-semibold mb-1">REGISTER PERIOD (FROM)</p>
                    <p className="text-white font-bold">17 JUN 2025, 1PM UTC</p>
                  </div>
                  <div>
                    <p className="text-[#C0E6FF] text-xs font-semibold mb-1">REGISTER PERIOD (TO)</p>
                    <p className="text-white font-bold">24 JUN 2025, 1PM UTC</p>
                  </div>
                </div>

                {/* Join Now Button */}
                <Button className="w-full bg-[#4da2ff] hover:bg-[#3d8ae6] text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                  Join Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Completed */}
      <div className="flex items-center gap-2 text-white mb-6">
        <CheckCircle className="w-6 h-6 text-green-400" />
        <h3 className="text-2xl font-semibold">Projects Completed</h3>
      </div>

      <div className="enhanced-card">
        <div className="enhanced-card-content">

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Project Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Network</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Total Raised</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">IDO End Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Round Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Project Page</th>
                </tr>
              </thead>
              <tbody>
                {/* BNB Network Project - THE PEEL */}
                <tr className="border-b border-gray-800 hover:bg-[#1a2f51]/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">TP</span>
                      </div>
                      <span className="text-white font-medium">THE PEEL</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">BNB</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/logo-sui.png"
                        alt="SUI"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      <span className="text-white">12,300</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">Jun 17th 2025</td>
                  <td className="py-4 px-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Public</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-sm font-medium">Raised</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Button size="sm" className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white text-xs">
                      Project page
                    </Button>
                  </td>
                </tr>

                {/* SOL Network Project - AXI (PUBLIC - FCFS) */}
                <tr className="border-b border-gray-800 hover:bg-[#1a2f51]/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AXS</span>
                      </div>
                      <span className="text-white font-medium">AXI (PUBLIC - FCFS)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">SOL</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/logo-sui.png"
                        alt="SUI"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      <span className="text-white">25,400</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">May 31st 2025</td>
                  <td className="py-4 px-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Public</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-sm font-medium">Incomplete</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Button size="sm" className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white text-xs">
                      Project page
                    </Button>
                  </td>
                </tr>

                {/* AVAX Network Project - AVAX (PUBLIC FCFS) */}
                <tr className="border-b border-gray-800 hover:bg-[#1a2f51]/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span className="text-white font-medium">AVAX (PUBLIC FCFS)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">AVAX</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/logo-sui.png"
                        alt="SUI"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      <span className="text-white">18,750</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">May 1st 2025</td>
                  <td className="py-4 px-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Public</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-sm font-medium">Raised</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Button size="sm" className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white text-xs">
                      Project page
                    </Button>
                  </td>
                </tr>


              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Why Choose DEWhale - Modern Circular Design */}
      <div className="relative overflow-hidden py-12">
        <div className="relative">
          {/* Title */}
          <div className="flex items-center gap-2 text-white mb-12 justify-center">
            <Rocket className="w-6 h-6 text-[#4DA2FF]" />
            <h3 className="text-2xl font-semibold">Why Choose DEWhale Launchpad?</h3>
          </div>

          {/* Circular Orbital Layout */}
          <div className="relative flex items-center justify-center min-h-[500px] lg:min-h-[600px]">
            {/* Central Hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Central Circle with DEWhale Logo */}
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-[#4da2ff] to-[#00d4aa] p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-[#030f1c] flex items-center justify-center">
                    <Image
                      src="/images/dewhale.png"
                      alt="DEWhale"
                      width={64}
                      height={64}
                      className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
                    />
                  </div>
                </div>

                {/* Pulsing Ring Animation */}
                <div className="absolute inset-0 rounded-full border-2 border-[#4da2ff]/30 animate-pulse"></div>
                <div className="absolute -inset-4 rounded-full border border-[#4da2ff]/20 animate-ping"></div>
              </div>
            </div>

            {/* Orbital Feature Cards - Desktop preserved, Mobile fixed */}
            {/* Top - Rigorous Vetting (0 degrees) */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: isMobile
                  ? 'translate(-50%, -50%) translateY(-130px)'
                  : 'translate(-50%, -50%) translateY(-220px)'
              }}
            >
              <div
                className="group cursor-pointer"
                onClick={() => isMobile && setActiveOrbitalIcon(activeOrbitalIcon === 'top' ? null : 'top')}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-[#4DA2FF]/30 to-[#4DA2FF]/10 backdrop-blur-sm border border-[#4DA2FF]/30 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#4DA2FF]" />
                </div>
                <div className="text-center mt-3 max-w-[120px]">
                  <h4 className="font-semibold text-white text-xs sm:text-sm mb-1">Rigorous Vetting</h4>
                  <p className={`text-xs text-[#C0E6FF] transition-opacity duration-300 ${
                    isMobile
                      ? (activeOrbitalIcon === 'top' ? 'opacity-100' : 'opacity-0')
                      : 'opacity-0 group-hover:opacity-100 hidden sm:block'
                  }`}>
                    Thorough due diligence
                  </p>
                </div>
              </div>
            </div>

            {/* Right - High Success Rate (90 degrees) */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: isMobile
                  ? 'translate(-50%, -50%) translateX(120px) translateY(0px)'
                  : 'translate(-50%, -50%) translateX(220px)'
              }}
            >
              <div
                className="group cursor-pointer"
                onClick={() => isMobile && setActiveOrbitalIcon(activeOrbitalIcon === 'right' ? null : 'right')}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 backdrop-blur-sm border border-green-500/30 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-400" />
                </div>
                <div className="text-center mt-3 max-w-[120px]">
                  <h4 className="font-semibold text-white text-xs sm:text-sm mb-1">High Success Rate</h4>
                  <p className={`text-xs text-[#C0E6FF] transition-opacity duration-300 ${
                    isMobile
                      ? (activeOrbitalIcon === 'right' ? 'opacity-100' : 'opacity-0')
                      : 'opacity-0 group-hover:opacity-100 hidden sm:block'
                  }`}>
                    94.7% funding success
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom - Tier-Based Access (180 degrees) */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: isMobile
                  ? 'translate(-50%, -50%) translateY(150px)'
                  : 'translate(-50%, -50%) translateY(250px)'
              }}
            >
              <div
                className="group cursor-pointer"
                onClick={() => isMobile && setActiveOrbitalIcon(activeOrbitalIcon === 'bottom' ? null : 'bottom')}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-500/10 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-purple-400" />
                </div>
                <div className="text-center mt-3 max-w-[120px]">
                  <h4 className="font-semibold text-white text-xs sm:text-sm mb-1">Tier-Based Access</h4>
                  <p className={`text-xs text-[#C0E6FF] transition-opacity duration-300 ${
                    isMobile
                      ? (activeOrbitalIcon === 'bottom' ? 'opacity-100' : 'opacity-0')
                      : 'opacity-0 group-hover:opacity-100 hidden sm:block'
                  }`}>
                    Exclusive allocations
                  </p>
                </div>
              </div>
            </div>

            {/* Left - Sui Native (270 degrees) */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: isMobile
                  ? 'translate(-50%, -50%) translateX(-110px)'
                  : 'translate(-50%, -50%) translateX(-220px)'
              }}
            >
              <div
                className="group cursor-pointer"
                onClick={() => isMobile && setActiveOrbitalIcon(activeOrbitalIcon === 'left' ? null : 'left')}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-400" />
                </div>
                <div className="text-center mt-3 max-w-[120px]">
                  <h4 className="font-semibold text-white text-xs sm:text-sm mb-1">Sui Native</h4>
                  <p className={`text-xs text-[#C0E6FF] transition-opacity duration-300 ${
                    isMobile
                      ? (activeOrbitalIcon === 'left' ? 'opacity-100' : 'opacity-0')
                      : 'opacity-0 group-hover:opacity-100 hidden sm:block'
                  }`}>
                    Optimized performance
                  </p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
    </>
  )
}
