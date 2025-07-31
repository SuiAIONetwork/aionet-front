"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Brain, MessageSquare, TrendingUp, AlertTriangle, Zap, X, Minimize2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'info' | 'action'
  title: string
  message: string
  confidence: number
  suggestedAction?: string
  impact?: string
  actionable?: boolean
  priority?: 'high' | 'medium' | 'low'
}

interface AffiliateAnalysisData {
  totalReferrals: number
  lastActivity?: string
  joinedDate?: string
  tier?: 'NOMAD' | 'PRO' | 'ROYAL'
  commissionEarned?: number
  isActive?: boolean
  affiliateLevel?: number
  profileLevel?: number
  username?: string
}

interface AIChatWidgetProps {
  context: 'admin' | 'affiliate' | 'creator'
  data?: {
    affiliates?: AffiliateAnalysisData[]
    userStats?: {
      totalNetworkUsers?: number
      totalAffiliates?: number
      affiliateLevel?: number
      totalReferrals?: number
      estimatedRevenue?: number
      tierBreakdown?: {
        NOMAD: number
        PRO: number
        ROYAL: number
      }
    }
    commissionData?: {
      totalCommissions?: number
      [key: string]: any
    }
    networkMetrics?: {
      [key: string]: any
    }
    [key: string]: any
  }
}

export function AIChatWidget({ context, data }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [command, setCommand] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAllInsights, setShowAllInsights] = useState(false)
  const [hasNewInsights, setHasNewInsights] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new insights are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [insights])

  // Generate insights when data changes (always generate, not just when open)
  useEffect(() => {
    generateInsights() // Always generate insights, even without data (will show welcome message)
  }, [context, data])

  // Generate initial insights on mount
  useEffect(() => {
    generateInsights()
  }, [])

  // Show notification dot when there are new insights and chat is closed
  useEffect(() => {
    if (insights.length > 0 && !isOpen) {
      setHasNewInsights(true)
    }
  }, [insights, isOpen])

  const generateInsights = async () => {
    setIsAnalyzing(true)

    setTimeout(() => {
      const contextInsights = getContextInsights(context, data || {})
      setInsights(contextInsights)
      setIsAnalyzing(false)
    }, 1500)
  }

  const getContextInsights = (context: string, data: { affiliates?: AffiliateAnalysisData[], userStats?: { totalNetworkUsers?: number, totalAffiliates?: number, affiliateLevel?: number, totalReferrals?: number, estimatedRevenue?: number, tierBreakdown?: { NOMAD: number, PRO: number, ROYAL: number } }, commissionData?: { totalCommissions?: number, [key: string]: any }, networkMetrics?: { [key: string]: any }, [key: string]: any }): AIInsight[] => {
    if (context === 'affiliate') {
      return generateAffiliateInsights(data)
    }
    // Fallback for other contexts
    return [{
      id: 'welcome',
      type: 'info',
      title: 'Welcome to AIDA! 👋',
      message: 'I\'m your AI assistant. I\'ll provide insights once your data is available!',
      confidence: 100,
      priority: 'low'
    }]
  }

  const generateAffiliateInsights = (data: { affiliates?: AffiliateAnalysisData[], userStats?: { totalNetworkUsers?: number, totalAffiliates?: number, affiliateLevel?: number, totalReferrals?: number, estimatedRevenue?: number, tierBreakdown?: { NOMAD: number, PRO: number, ROYAL: number } }, commissionData?: { totalCommissions?: number, [key: string]: any }, networkMetrics?: { [key: string]: any }, [key: string]: any }): AIInsight[] => {
    const insights: AIInsight[] = []

    if (!data?.userStats) {
      return [{
        id: 'welcome',
        type: 'info',
        title: 'Welcome to AIDA! 👋',
        message: 'I\'m your personal AI assistant for affiliate management. I\'ll analyze YOUR network data and provide personalized insights to help YOU grow your affiliate business and earnings.\n\nOnce your data loads, I\'ll provide detailed analytics!',
        confidence: 100,
        priority: 'low'
      }]
    }

    const myNetworkUsers = data.userStats?.totalNetworkUsers || 0
    const myAffiliates = data.userStats?.totalAffiliates || 0
    const myLevel = data.userStats?.affiliateLevel || 1
    const affiliates = data.affiliates || [] // Fix: Define affiliates variable

    // Add welcome message first
    insights.push({
      id: 'welcome',
      type: 'info',
      title: 'AIDA Analysis Complete ✨',
      message: `I've analyzed YOUR affiliate network:

• ${myNetworkUsers} total users
• ${myAffiliates} affiliates
• Level ${myLevel}

Here are personalized insights for YOUR business!`,
      confidence: 100,
      priority: 'low'
    })

    // Inactive Affiliates Analysis
    const inactiveAffiliates = affiliates.filter(a => {
      if (!a.lastActivity) return true
      const lastActivity = new Date(a.lastActivity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return lastActivity < thirtyDaysAgo
    })

    if (inactiveAffiliates.length > 0) {
      const inactivePercentage = Math.round((inactiveAffiliates.length / myAffiliates) * 100)
      insights.push({
        id: 'inactive-affiliates',
        type: 'warning',
        title: '⚠️ Inactive Affiliates Alert',
        message: `${inactiveAffiliates.length} affiliates (${inactivePercentage}%) haven't been active in 30+ days. This represents a significant opportunity for re-engagement.`,
        confidence: 95,
        suggestedAction: 'Send personalized re-engagement emails with bonus incentives and success tips',
        impact: `Potential to recover $${inactiveAffiliates.length * 150}/month in referral revenue`,
        actionable: true,
        priority: 'high'
      })
    }

    // Top Performers Recognition
    const topPerformers = affiliates.filter(a => a.totalReferrals >= 5)
    if (topPerformers.length > 0) {
      insights.push({
        id: 'top-performers',
        type: 'opportunity',
        title: '🏆 Top Performers Identified',
        message: `${topPerformers.length} affiliates are your star performers! They're driving the majority of your referrals and deserve special recognition.`,
        confidence: 92,
        suggestedAction: 'Offer exclusive bonuses, early access to new features, or tier upgrades',
        impact: 'Maintaining top performer satisfaction increases retention by 80%',
        actionable: true,
        priority: 'medium'
      })
    }

    // Tier Distribution Analysis
    const tierDistribution = {
      NOMAD: affiliates.filter(a => (a.tier || 'NOMAD') === 'NOMAD').length,
      PRO: affiliates.filter(a => (a.tier || 'NOMAD') === 'PRO').length,
      ROYAL: affiliates.filter(a => (a.tier || 'NOMAD') === 'ROYAL').length
    }

    const proRoyalPercentage = Math.round(((tierDistribution.PRO + tierDistribution.ROYAL) / myAffiliates) * 100)
    
    if (proRoyalPercentage < 30) {
      insights.push({
        id: 'tier-upgrades',
        type: 'opportunity',
        title: '📈 Massive Upgrade Potential',
        message: `Only ${proRoyalPercentage}% of your affiliates are PRO/ROYAL tier. This is a huge opportunity for growth!`,
        confidence: 87,
        suggestedAction: 'Create a tier upgrade campaign highlighting the benefits and increased earning potential',
        impact: 'Higher tier affiliates typically generate 3x more referrals',
        actionable: true,
        priority: 'high'
      })
    }

    // Revenue Analysis
    const totalReferrals = affiliates.reduce((sum, a) => sum + a.totalReferrals, 0)
    const estimatedRevenue = totalReferrals * 25
    
    insights.push({
      id: 'revenue-summary',
      type: 'action',
      title: '💰 Revenue Impact Summary',
      message: `Your affiliate program has generated ${totalReferrals} referrals worth approximately $${estimatedRevenue.toLocaleString()}. Great work!`,
      confidence: 85,
      suggestedAction: 'Consider increasing commission rates for top performers to accelerate growth',
      impact: 'Strategic commission increases could boost referral volume by 25-40%',
      actionable: true,
      priority: 'medium'
    })

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low']) || (b.confidence - a.confidence)
    })
  }

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    setIsAnalyzing(true)
    setCommand('')

    // Add user message to chat
    const userMessage: AIInsight = {
      id: `user-${Date.now()}`,
      type: 'info',
      title: 'You',
      message: cmd,
      confidence: 100,
      priority: 'low'
    }
    setInsights(prev => [...prev, userMessage])

    // Process analytical questions
    setTimeout(() => {
      let responseInsight: AIInsight
      const lowerCmd = cmd.toLowerCase()

      // Analytics Questions - USER SPECIFIC
      if (lowerCmd.includes('how many') && (lowerCmd.includes('affiliate') || lowerCmd.includes('total'))) {
        const myTotalAffiliates = data?.userStats?.totalAffiliates || 0
        const myTotalUsers = data?.userStats?.totalNetworkUsers || 0
        const myActiveAffiliates = data?.affiliates?.filter(a => a.isActive)?.length || 0

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'info',
          title: 'AIDA',
          message: `📊 Your Affiliate Network Analysis

📈 Network Overview:
• Total Affiliates: ${myTotalAffiliates}
• Network Users: ${myTotalUsers}
• Active Affiliates: ${myActiveAffiliates}
• Inactive Affiliates: ${myTotalAffiliates - myActiveAffiliates}

📊 Performance Metrics:
• Activity Rate: ${myTotalAffiliates > 0 ? Math.round((myActiveAffiliates / myTotalAffiliates) * 100) : 0}%
• Your Level: ${data?.userStats?.affiliateLevel || 1}

${myTotalAffiliates > 5 ? '🚀 Your network is growing well!' : '🌱 Great start! Focus on growing your network!'}`,
          confidence: 100,
          priority: 'low'
        }
      } else if (lowerCmd.includes('breakdown') || lowerCmd.includes('tier') || lowerCmd.includes('distribution')) {
        const myTierBreakdown = data?.userStats?.tierBreakdown || { NOMAD: 0, PRO: 0, ROYAL: 0 }
        const totalUsers = myTierBreakdown.NOMAD + myTierBreakdown.PRO + myTierBreakdown.ROYAL

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'info',
          title: 'AIDA',
          message: `🎯 Your Network Tier Distribution

👥 User Breakdown by Tier:
• NOMAD: ${myTierBreakdown.NOMAD} users (${totalUsers > 0 ? Math.round((myTierBreakdown.NOMAD / totalUsers) * 100) : 0}%)
• PRO: ${myTierBreakdown.PRO} users (${totalUsers > 0 ? Math.round((myTierBreakdown.PRO / totalUsers) * 100) : 0}%)
• ROYAL: ${myTierBreakdown.ROYAL} users (${totalUsers > 0 ? Math.round((myTierBreakdown.ROYAL / totalUsers) * 100) : 0}%)

📊 Summary:
• Total Network: ${totalUsers} users
• Premium Users: ${myTierBreakdown.PRO + myTierBreakdown.ROYAL} (${totalUsers > 0 ? Math.round(((myTierBreakdown.PRO + myTierBreakdown.ROYAL) / totalUsers) * 100) : 0}%)

${myTierBreakdown.NOMAD > (myTierBreakdown.PRO + myTierBreakdown.ROYAL) ? '💡 Focus on helping your users upgrade tiers!' : '✨ Excellent tier distribution in your network!'}`,
          confidence: 100,
          priority: 'low'
        }
      } else if (lowerCmd.includes('referral') && (lowerCmd.includes('total') || lowerCmd.includes('count'))) {
        const myTotalReferrals = data?.userStats?.totalReferrals || 0
        const myTotalAffiliates = data?.userStats?.totalAffiliates || 0
        const avgReferrals = myTotalAffiliates > 0 ? Math.round(myTotalReferrals / myTotalAffiliates) : 0
        const topReferrer = data?.affiliates?.reduce((max, a) => (a.totalReferrals || 0) > (max.totalReferrals || 0) ? a : max, { totalReferrals: 0 })

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'info',
          title: 'AIDA',
          message: `📈 Your Referral Performance Analysis

🎯 Referral Metrics:
• Total Referrals: ${myTotalReferrals}
• Network Size: ${data?.userStats?.totalNetworkUsers || 0} users
• Active Affiliates: ${myTotalAffiliates}
• Average per Affiliate: ${avgReferrals} referrals

🏆 Top Performer:
• Best Affiliate: ${topReferrer?.username || 'N/A'}
• Their Referrals: ${topReferrer?.totalReferrals || 0}

💰 Value Analysis:
• Estimated Value: $${(myTotalReferrals * 25).toLocaleString()}
• Your Level: ${data?.userStats?.affiliateLevel || 1}

${myTotalReferrals > 20 ? '🚀 Excellent referral performance!' : '💪 Great start! Focus on helping your affiliates grow!'}`,
          confidence: 100,
          priority: 'low'
        }
      } else if (lowerCmd.includes('top') && (lowerCmd.includes('performer') || lowerCmd.includes('affiliate'))) {
        const topPerformers = data?.affiliates
          ?.filter(a => a.totalReferrals > 0)
          ?.sort((a, b) => (b.totalReferrals || 0) - (a.totalReferrals || 0))
          ?.slice(0, 5) || []

        const performersList = topPerformers.map((p, i) =>
          `• #${i + 1}: ${p.username}\n  └ ${p.totalReferrals} referrals (${p.tier} tier)`
        ).join('\n')

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'opportunity',
          title: 'AIDA',
          message: `🏆 Your Top Performing Affiliates

🌟 Leaderboard:
${performersList || '• No active performers yet'}

📊 Performance Summary:
• Total Top Performers: ${topPerformers.length}
• Combined Referrals: ${topPerformers.reduce((sum, p) => sum + p.totalReferrals, 0)}
• Average Performance: ${topPerformers.length > 0 ? Math.round(topPerformers.reduce((sum, p) => sum + p.totalReferrals, 0) / topPerformers.length) : 0} referrals

${topPerformers.length > 0 ? '💡 These stars deserve special recognition and rewards!' : '🎯 Focus on affiliate activation strategies!'}`,
          confidence: 100,
          suggestedAction: topPerformers.length > 0 ? 'Send personalized thank you messages with bonus rewards' : 'Create activation campaigns for new affiliates',
          priority: 'medium'
        }
      } else if (lowerCmd.includes('revenue') || lowerCmd.includes('commission') || lowerCmd.includes('earning')) {
        const myEstimatedRevenue = data?.userStats?.estimatedRevenue || 0
        const myTotalCommissions = data?.commissionData?.totalCommissions || 0
        const monthlyProjection = myEstimatedRevenue * 0.1 // Assume 10% monthly growth
        const myNetworkValue = (data?.userStats?.totalNetworkUsers || 0) * 25 // Estimated network value

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'action',
          title: 'AIDA',
          message: `💰 **Your Revenue & Earnings Analysis**\n\n` +
                   `💵 **Current Earnings:**\n` +
                   `• Commissions Earned: $${myTotalCommissions.toLocaleString()}\n` +
                   `• Network Value: $${myNetworkValue.toLocaleString()}\n` +
                   `• Monthly Projection: $${monthlyProjection.toLocaleString()}\n\n` +
                   `📊 **Network Stats:**\n` +
                   `• Total Network Users: ${data?.userStats?.totalNetworkUsers || 0}\n` +
                   `• Your Affiliate Level: ${data?.userStats?.affiliateLevel || 1}\n` +
                   `• Commission Rate: ${(data?.userStats?.affiliateLevel || 1) * 2}%\n\n` +
                   `🎯 **Growth Potential:**\n` +
                   `• Next Level Bonus: ${(data?.userStats?.affiliateLevel || 1) < 5 ? '+2% commission rate' : 'Maximum level reached!'}\n` +
                   `• Upgrade Impact: ${(data?.userStats?.affiliateLevel || 1) < 5 ? `+$${Math.round(myNetworkValue * 0.02).toLocaleString()}/month` : 'N/A'}\n\n` +
                   `${myTotalCommissions > 100 ? '🎉 Great earning performance!' : '📈 Focus on growing your network for higher earnings!'}`,
          confidence: 88,
          suggestedAction: 'Focus on helping your affiliates upgrade tiers to increase your commission rates',
          priority: 'high'
        }
      } else if (lowerCmd.includes('inactive') || lowerCmd.includes('not active')) {
        const inactiveAffiliates = data?.affiliates?.filter(a => !a.isActive) || []
        const inactiveNames = inactiveAffiliates.slice(0, 3).map(a => a.username).join(', ')

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'warning',
          title: 'AIDA',
          message: `⚠️ **Inactive Affiliates Analysis**\n\n` +
                   `📊 **Inactivity Overview:**\n` +
                   `• Inactive Count: ${inactiveAffiliates.length}\n` +
                   `• Total Affiliates: ${data?.userStats?.totalAffiliates || 0}\n` +
                   `• Inactivity Rate: ${(data?.userStats?.totalAffiliates || 0) > 0 ? Math.round((inactiveAffiliates.length / (data?.userStats?.totalAffiliates || 1)) * 100) : 0}%\n\n` +
                   `👥 **Inactive Examples:**\n` +
                   `${inactiveNames ? inactiveNames.split(', ').map(name => `• ${name}`).join('\n') : '• None - all affiliates are active!'}\n\n` +
                   `💰 **Recovery Potential:**\n` +
                   `• Estimated Value: $${(inactiveAffiliates.length * 150).toLocaleString()}/month\n` +
                   `• Recovery Rate: 30-40% typical\n` +
                   `• Potential Earnings: $${Math.round(inactiveAffiliates.length * 150 * 0.35).toLocaleString()}/month\n\n` +
                   `${inactiveAffiliates.length > 0 ? '💡 Re-engagement campaigns can recover 30-40% of inactive affiliates!' : '✅ Great! All affiliates are currently active!'}`,
          confidence: 95,
          suggestedAction: inactiveAffiliates.length > 0 ? 'Launch targeted re-engagement campaign with bonus incentives' : 'Maintain current engagement strategies',
          priority: inactiveAffiliates.length > 0 ? 'high' : 'low'
        }
      } else if (lowerCmd.includes('growth') || lowerCmd.includes('trend') || lowerCmd.includes('compare')) {
        const myTotalAffiliates = data?.userStats?.totalAffiliates || 0
        const myTotalUsers = data?.userStats?.totalNetworkUsers || 0
        const newThisMonth = data?.affiliates?.filter(a => {
          if (!a.joinedDate) return false
          const joinDate = new Date(a.joinedDate)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          return joinDate > thirtyDaysAgo
        })?.length || 0

        const growthRate = myTotalAffiliates > 0 ? Math.round((newThisMonth / myTotalAffiliates) * 100) : 0

        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'info',
          title: 'AIDA',
          message: `📊 **Your Network Growth Analysis**\n\n` +
                   `🌐 **Network Overview:**\n` +
                   `• Total Network: ${myTotalUsers} users\n` +
                   `• Active Affiliates: ${myTotalAffiliates}\n` +
                   `• Your Level: ${data?.userStats?.affiliateLevel || 1}\n\n` +
                   `📈 **Growth Metrics:**\n` +
                   `• New This Month: ${newThisMonth} affiliates\n` +
                   `• Growth Rate: ${growthRate}%\n` +
                   `• Trend Status: ${growthRate > 15 ? '🚀 Accelerating' : growthRate > 5 ? '📈 Steady' : '🌱 Building'}\n\n` +
                   `🎯 **Performance Rating:**\n` +
                   `• Growth Score: ${growthRate > 15 ? 'Excellent' : growthRate > 5 ? 'Good' : 'Developing'}\n` +
                   `• Next Milestone: ${myTotalUsers < 50 ? '50 users' : myTotalUsers < 100 ? '100 users' : '200+ users'}\n` +
                   `• Progress: ${myTotalUsers < 50 ? Math.round((myTotalUsers / 50) * 100) : myTotalUsers < 100 ? Math.round((myTotalUsers / 100) * 100) : '100+'}%\n\n` +
                   `${growthRate > 10 ? 'Excellent network growth!' : 'Focus on consistent referral activities to boost growth!'}`,
          confidence: 90,
          priority: 'medium'
        }
      } else {
        // Default response with available analytics
        responseInsight = {
          id: `aida-${Date.now()}`,
          type: 'info',
          title: 'AIDA',
          message: `🤖 I can help you analyze your affiliate data!

📊 Available Analytics:

🔢 Network Questions:
• "How many affiliates do I have?"
• "Show me tier breakdown"
• "What's my growth trend?"

📈 Performance Questions:
• "What's my total referral count?"
• "Who are my top performers?"
• "Show me inactive affiliates"

💰 Revenue Questions:
• "How much revenue generated?"
• "What are my earnings?"
• "Show commission breakdown"

❓ What would you like to know about YOUR affiliate business?`,
          confidence: 100,
          priority: 'low'
        }
      }

      setInsights(prev => [...prev, responseInsight])
      setIsAnalyzing(false)
    }, 2000)
  }

  // Action Handlers
  const handleTakeAction = async (insight: AIInsight) => {
    setActionLoading(insight.id)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      switch (insight.id) {
        case 'inactive-affiliates':
          // Simulate sending re-engagement campaign
          toast.success('✅ Re-engagement campaign sent to inactive affiliates!')

          // Add success message to chat
          const successMessage: AIInsight = {
            id: `action-success-${Date.now()}`,
            type: 'info',
            title: 'AIDA',
            message: '🎉 Great! I\'ve sent personalized re-engagement emails to all inactive affiliates with bonus incentives. You should see increased activity within 3-5 days.',
            confidence: 100,
            priority: 'low'
          }
          setInsights(prev => [...prev, successMessage])
          break

        case 'top-performers':
          // Simulate sending rewards to top performers
          toast.success('✅ Rewards sent to top performing affiliates!')

          const rewardMessage: AIInsight = {
            id: `action-success-${Date.now()}`,
            type: 'info',
            title: 'AIDA',
            message: '🏆 Excellent! I\'ve sent $50 bonus rewards to your top 3 performers along with personalized thank you messages. This will boost their motivation significantly!',
            confidence: 100,
            priority: 'low'
          }
          setInsights(prev => [...prev, rewardMessage])
          break

        case 'tier-upgrades':
          // Simulate tier upgrade campaign
          toast.success('✅ Tier upgrade campaign launched!')

          const upgradeMessage: AIInsight = {
            id: `action-success-${Date.now()}`,
            type: 'info',
            title: 'AIDA',
            message: '📈 Perfect! I\'ve created a targeted campaign showing PRO tier benefits to eligible affiliates. This typically increases upgrade rates by 40-60%.',
            confidence: 100,
            priority: 'low'
          }
          setInsights(prev => [...prev, upgradeMessage])
          break

        case 'revenue-summary':
          // Simulate commission rate optimization
          toast.success('✅ Commission optimization implemented!')

          const optimizeMessage: AIInsight = {
            id: `action-success-${Date.now()}`,
            type: 'info',
            title: 'AIDA',
            message: '💰 Smart move! I\'ve increased commission rates for top performers by 2%. This strategic investment should boost referral volume by 25-30% within the next month.',
            confidence: 100,
            priority: 'low'
          }
          setInsights(prev => [...prev, optimizeMessage])
          break

        default:
          toast.success('✅ Action completed successfully!')

          const defaultMessage: AIInsight = {
            id: `action-success-${Date.now()}`,
            type: 'info',
            title: 'AIDA',
            message: '✨ Action completed! I\'ve implemented your requested changes. Monitor your affiliate metrics over the next few days to see the impact.',
            confidence: 100,
            priority: 'low'
          }
          setInsights(prev => [...prev, defaultMessage])
      }

    } catch (error) {
      toast.error('❌ Action failed. Please try again.')

      const errorMessage: AIInsight = {
        id: `action-error-${Date.now()}`,
        type: 'warning',
        title: 'AIDA',
        message: '⚠️ Sorry, I encountered an issue while executing that action. Please try again or contact support if the problem persists.',
        confidence: 100,
        priority: 'low'
      }
      setInsights(prev => [...prev, errorMessage])
    } finally {
      setActionLoading(null)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'action': return <Zap className="w-4 h-4 text-blue-400" />
      default: return <Brain className="w-4 h-4 text-green-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-900/10'
      case 'medium': return 'border-yellow-500/30 bg-yellow-900/10'
      default: return 'border-gray-600/30 bg-gray-900/10'
    }
  }

  // Format message with proper line breaks
  const formatMessage = (message: string) => {
    return message.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line}
      </div>
    ))
  }

  const handleOpen = () => {
    setIsOpen(true)
    setHasNewInsights(false)
    if (!insights.length && data) {
      generateInsights()
    }
  }

  // Floating chat button (minimized state)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Tooltip */}
          <div className="absolute bottom-16 right-0 bg-black/90 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Ask AIDA anything! 🤖
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>

          <Button
            onClick={handleOpen}
            className="relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <Brain className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12" />
            {hasNewInsights && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
              </div>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Full chat interface (expanded state)
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} ${isOpen ? 'animate-in slide-in-from-bottom-4 fade-in' : ''}`}>
      <Card className="h-full bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border-green-500/30 shadow-2xl ring-1 ring-green-500/20">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-5 h-5 text-green-400" />
                {isAnalyzing && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              <CardTitle className="text-lg text-white">AIDA Assistant</CardTitle>
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                {context.charAt(0).toUpperCase() + context.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-full p-0">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
              {isAnalyzing && insights.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span>AIDA is analyzing your {context} data...</span>
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`rounded-lg p-3 border ${
                      insight.title === 'You' 
                        ? 'bg-blue-900/20 border-blue-500/30 ml-8' 
                        : getPriorityColor(insight.priority || 'low')
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.title !== 'You' && getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xs font-medium text-white">{insight.title}</h4>
                          {insight.title !== 'You' && (
                            <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-300 px-1 py-0">
                              {insight.confidence}%
                            </Badge>
                          )}
                          {insight.priority === 'high' && insight.title !== 'You' && (
                            <Badge className="text-[10px] bg-red-600 text-white px-1 py-0">High Priority</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mb-2">
                          {formatMessage(insight.message)}
                        </div>
                        
                        {insight.suggestedAction && insight.title !== 'You' && (
                          <div className="space-y-2">
                            <p className="text-xs text-blue-300">
                              <strong>💡 Suggested Action:</strong> {insight.suggestedAction}
                            </p>
                            {insight.impact && (
                              <p className="text-xs text-green-300">
                                <strong>📈 Expected Impact:</strong> {insight.impact}
                              </p>
                            )}
                            {insight.actionable && (
                              <Button
                                size="sm"
                                onClick={() => handleTakeAction(insight)}
                                disabled={actionLoading === insight.id}
                                className="bg-green-600 hover:bg-green-700 text-xs mt-2 disabled:opacity-50"
                              >
                                {actionLoading === insight.id ? (
                                  <>
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3 h-3 mr-1" />
                                    Take Action
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Hi! I'm AIDA, your AI assistant.</p>
                  <p className="text-xs text-gray-500 mt-1">Ask me anything about your {context} data!</p>
                </div>
              )}

              {/* Typing Indicator */}
              {isAnalyzing && insights.length > 0 && (
                <div className="rounded-lg p-3 border border-gray-600/30 bg-gray-900/10">
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-green-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">AIDA</h4>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-xs text-gray-400 ml-2">AIDA is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions - Above Input */}
            <div className="border-t border-green-500/20 px-4 py-2">
              <div className="flex flex-wrap gap-1 justify-center">
                {[
                  "📊",
                  "🎯",
                  "🏆",
                  "💰",
                  "😴",
                  "📈"
                ].map((emoji, index) => {
                  const fullQuestions = [
                    "How many affiliates do I have?",
                    "Show me tier breakdown",
                    "Who are my top performers?",
                    "What's my total revenue?",
                    "Show inactive affiliates",
                    "What's my growth trend?"
                  ]
                  const tooltips = [
                    "Stats",
                    "Tiers",
                    "Top",
                    "Revenue",
                    "Inactive",
                    "Growth"
                  ]
                  return (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCommand(fullQuestions[index])}
                      className="text-green-300 hover:text-green-200 hover:bg-green-900/20 border border-green-500/20 h-9 w-9 p-0 text-lg"
                      title={tooltips[index]}
                    >
                      {emoji}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="border-t border-green-500/10 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask AIDA anything..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommand(command)}
                  className="bg-[#0a1628] border-green-500/30 text-white placeholder:text-gray-400 text-sm"
                  disabled={isAnalyzing}
                />
                <Button
                  size="sm"
                  onClick={() => handleCommand(command)}
                  disabled={!command.trim() || isAnalyzing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
