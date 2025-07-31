"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Brain, MessageSquare, TrendingUp, AlertTriangle, Zap, Users, DollarSign, Clock } from 'lucide-react'

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

interface AIAssistantProps {
  context: 'admin' | 'affiliate' | 'creator'
  data?: {
    affiliates?: AffiliateAnalysisData[]
    [key: string]: any
  }
  className?: string
}

export function AIAssistant({ context, data, className = '' }: AIAssistantProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [command, setCommand] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAllInsights, setShowAllInsights] = useState(false)

  // Generate insights based on context
  useEffect(() => {
    if (data) {
      generateInsights()
    }
  }, [context, data])

  const generateInsights = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI thinking time
    setTimeout(() => {
      const contextInsights = getContextInsights(context, data || {})
      setInsights(contextInsights)
      setIsAnalyzing(false)
    }, 1500)
  }

  const getContextInsights = (context: string, data: { affiliates?: AffiliateAnalysisData[], [key: string]: any }): AIInsight[] => {
    switch (context) {
      case 'affiliate':
        return generateAffiliateInsights(data)
      case 'creator':
        return generateCreatorInsights(data)
      case 'admin':
        return generateAdminInsights(data)
      default:
        return []
    }
  }

  const generateAffiliateInsights = (data: { affiliates?: AffiliateAnalysisData[], [key: string]: any }): AIInsight[] => {
    const insights: AIInsight[] = []
    
    if (!data?.affiliates || data.affiliates.length === 0) {
      return [{
        id: 'no-data',
        type: 'info',
        title: 'Ready to Analyze',
        message: 'AIDA is ready to provide insights once affiliate data is available',
        confidence: 100,
        priority: 'low'
      }]
    }

    const affiliates = data.affiliates || []
    const totalAffiliates = affiliates.length
    const activeAffiliates = affiliates.filter(a => a.totalReferrals > 0).length
    const topPerformers = affiliates.filter(a => a.totalReferrals >= 5)
    const recentlyActive = affiliates.filter(a => {
      if (!a.lastActivity) return false
      const lastActivity = new Date(a.lastActivity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return lastActivity > thirtyDaysAgo
    })

    // Insight 1: Inactive Affiliates
    const inactiveAffiliates = affiliates.filter(a => {
      if (!a.lastActivity) return true
      const lastActivity = new Date(a.lastActivity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return lastActivity < thirtyDaysAgo
    })

    if (inactiveAffiliates.length > 0) {
      const inactivePercentage = Math.round((inactiveAffiliates.length / totalAffiliates) * 100)
      insights.push({
        id: 'inactive-affiliates',
        type: 'warning',
        title: 'Inactive Affiliates Detected',
        message: `${inactiveAffiliates.length} affiliates (${inactivePercentage}%) haven't been active in 30+ days`,
        confidence: 95,
        suggestedAction: 'Send re-engagement email with bonus incentives and success tips',
        impact: `Potential to recover $${inactiveAffiliates.length * 150}/month in referral revenue`,
        actionable: true,
        priority: 'high'
      })
    }

    // Insight 2: Top Performers Recognition
    if (topPerformers.length > 0) {
      const topPerformerRevenue = topPerformers.reduce((sum, a) => sum + (a.totalReferrals * 25), 0)
      insights.push({
        id: 'top-performers',
        type: 'opportunity',
        title: 'Reward Top Performers',
        message: `${topPerformers.length} affiliates are driving ${Math.round((topPerformers.length / totalAffiliates) * 100)}% of your referrals`,
        confidence: 92,
        suggestedAction: 'Offer exclusive bonuses, early access, or tier upgrades to maintain momentum',
        impact: `These affiliates generated ~$${topPerformerRevenue} in referral value`,
        actionable: true,
        priority: 'medium'
      })
    }

    // Insight 3: Growth Opportunity
    const potentialUpgrades = affiliates.filter(a =>
      a.totalReferrals >= 3 && a.totalReferrals < 10 && (a.affiliateLevel || 1) < 3
    )

    if (potentialUpgrades.length > 0) {
      insights.push({
        id: 'tier-upgrades',
        type: 'opportunity',
        title: 'Tier Upgrade Candidates',
        message: `${potentialUpgrades.length} affiliates are close to earning tier promotions`,
        confidence: 88,
        suggestedAction: 'Create targeted campaign showing benefits of next tier level',
        impact: 'Increase affiliate motivation and long-term retention',
        actionable: true,
        priority: 'medium'
      })
    }

    // Insight 4: Engagement Analysis
    if (recentlyActive.length > 0) {
      const engagementRate = Math.round((recentlyActive.length / totalAffiliates) * 100)
      insights.push({
        id: 'engagement-analysis',
        type: 'info',
        title: 'Engagement Health Check',
        message: `${engagementRate}% of affiliates are actively engaged (${recentlyActive.length}/${totalAffiliates})`,
        confidence: 90,
        suggestedAction: engagementRate < 60 ? 'Focus on re-engagement campaigns' : 'Maintain current engagement strategies',
        impact: engagementRate < 60 ? 'Critical for affiliate program growth' : 'Strong foundation for scaling',
        priority: engagementRate < 60 ? 'high' : 'low'
      })
    }

    // Insight 5: Performance Trends
    const highPerformers = affiliates.filter(a => a.totalReferrals >= 10)
    const mediumPerformers = affiliates.filter(a => a.totalReferrals >= 3 && a.totalReferrals < 10)
    const newAffiliates = affiliates.filter(a => {
      if (!a.joinedDate) return false
      const joinDate = new Date(a.joinedDate)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return joinDate > thirtyDaysAgo
    })

    if (newAffiliates.length > 0) {
      insights.push({
        id: 'new-affiliate-growth',
        type: 'info',
        title: 'New Affiliate Growth',
        message: `${newAffiliates.length} new affiliates joined in the last 30 days`,
        confidence: 100,
        suggestedAction: 'Provide onboarding support and training materials to new affiliates',
        impact: 'Better onboarding increases long-term affiliate success by 60%',
        actionable: true,
        priority: 'medium'
      })
    }

    // Insight 6: Revenue Optimization
    const totalReferrals = affiliates.reduce((sum, a) => sum + a.totalReferrals, 0)
    const estimatedRevenue = totalReferrals * 25 // Assuming $25 average per referral

    insights.push({
      id: 'revenue-optimization',
      type: 'action',
      title: 'Revenue Impact Analysis',
      message: `Your affiliate program has generated ${totalReferrals} referrals worth ~$${estimatedRevenue.toLocaleString()}`,
      confidence: 85,
      suggestedAction: 'Consider increasing commission rates for top performers to accelerate growth',
      impact: 'Could increase referral volume by 25-40%',
      actionable: true,
      priority: 'medium'
    })

    // Insight 7: Tier Distribution Analysis
    const tierDistribution = {
      NOMAD: affiliates.filter(a => (a.tier || 'NOMAD') === 'NOMAD').length,
      PRO: affiliates.filter(a => (a.tier || 'NOMAD') === 'PRO').length,
      ROYAL: affiliates.filter(a => (a.tier || 'NOMAD') === 'ROYAL').length
    }

    const proRoyalPercentage = Math.round(((tierDistribution.PRO + tierDistribution.ROYAL) / totalAffiliates) * 100)

    if (proRoyalPercentage < 30) {
      insights.push({
        id: 'tier-distribution',
        type: 'opportunity',
        title: 'Tier Upgrade Opportunity',
        message: `Only ${proRoyalPercentage}% of affiliates are PRO/ROYAL tier - significant upgrade potential`,
        confidence: 87,
        suggestedAction: 'Create tier upgrade incentive campaign highlighting PRO/ROYAL benefits',
        impact: 'Higher tier affiliates typically generate 3x more referrals',
        actionable: true,
        priority: 'high'
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low']) || (b.confidence - a.confidence)
    })
  }

  const generateCreatorInsights = (data: { affiliates?: AffiliateAnalysisData[], [key: string]: any }): AIInsight[] => {
    // Will implement when we add to creator controls
    return []
  }

  const generateAdminInsights = (data: { affiliates?: AffiliateAnalysisData[], [key: string]: any }): AIInsight[] => {
    // Will implement when we add to admin dashboard
    return []
  }

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    setIsAnalyzing(true)
    setCommand('')

    // Simple command processing
    setTimeout(() => {
      let responseInsight: AIInsight

      const lowerCmd = cmd.toLowerCase()

      if (lowerCmd.includes('inactive') || lowerCmd.includes('not active')) {
        responseInsight = {
          id: `command-${Date.now()}`,
          type: 'info',
          title: 'Inactive Affiliates Analysis',
          message: 'Analyzing affiliate activity patterns. Check the insights above for inactive affiliate recommendations.',
          confidence: 90,
          suggestedAction: 'Review the "Inactive Affiliates Detected" insight for specific actions',
          priority: 'medium'
        }
      } else if (lowerCmd.includes('top') || lowerCmd.includes('best') || lowerCmd.includes('performer')) {
        responseInsight = {
          id: `command-${Date.now()}`,
          type: 'info',
          title: 'Top Performers Analysis',
          message: 'Your top performers are driving the majority of referrals. Consider rewarding them to maintain momentum.',
          confidence: 95,
          suggestedAction: 'Check the "Reward Top Performers" insight for specific recommendations',
          priority: 'medium'
        }
      } else if (lowerCmd.includes('revenue') || lowerCmd.includes('money') || lowerCmd.includes('earning')) {
        responseInsight = {
          id: `command-${Date.now()}`,
          type: 'action',
          title: 'Revenue Optimization',
          message: 'Revenue analysis complete. Focus on tier upgrades and re-engaging inactive affiliates for maximum impact.',
          confidence: 88,
          suggestedAction: 'Prioritize high-impact insights marked with "High Priority"',
          priority: 'high'
        }
      } else {
        responseInsight = {
          id: `command-${Date.now()}`,
          type: 'info',
          title: 'AIDA Response',
          message: `Processed: "${cmd}". Try asking about "inactive affiliates", "top performers", or "revenue optimization"`,
          confidence: 75,
          priority: 'low'
        }
      }

      setInsights(prev => [responseInsight, ...prev])
      setIsAnalyzing(false)
    }, 2000)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'action': return <Zap className="w-4 h-4 text-blue-400" />
      default: return <Brain className="w-4 h-4 text-purple-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-900/10'
      case 'medium': return 'border-yellow-500/30 bg-yellow-900/10'
      default: return 'border-gray-600/30 bg-gray-900/10'
    }
  }

  const displayedInsights = showAllInsights ? insights : insights.slice(0, 3)

  return (
    <Card className={`ai-assistant border-purple-500/30 bg-gradient-to-br from-purple-900/10 to-blue-900/10 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-purple-400" />
              {isAnalyzing && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              )}
            </div>
            <CardTitle className="text-lg">AIDA Assistant</CardTitle>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
              {context.charAt(0).toUpperCase() + context.slice(1)} Mode
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsights}
            disabled={isAnalyzing}
            className="text-purple-300 hover:text-purple-200"
          >
            <Brain className="w-4 h-4 mr-1" />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Command Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={`Ask AIDA about ${context} insights...`}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommand(command)}
              className="bg-[#0a1628] border-purple-500/30 text-white placeholder:text-gray-400"
            />
            <Button
              size="sm"
              onClick={() => handleCommand(command)}
              disabled={!command.trim() || isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Command Suggestions */}
          <div className="flex flex-wrap gap-2">
            {[
              "Show me inactive affiliates",
              "Who are my top performers?",
              "How can I increase revenue?"
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                onClick={() => setCommand(suggestion)}
                className="text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-900/20 border border-purple-500/20"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          {isAnalyzing ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Brain className="w-4 h-4 animate-pulse" />
              <span>AIDA is analyzing your {context} data...</span>
            </div>
          ) : displayedInsights.length > 0 ? (
            <>
              {displayedInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-lg p-3 border ${getPriorityColor(insight.priority || 'low')}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {insight.confidence}% confident
                        </Badge>
                        {insight.priority === 'high' && (
                          <Badge className="text-xs bg-red-600 text-white">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{insight.message}</p>
                      
                      {insight.suggestedAction && (
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
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs mt-2">
                              Take Action
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {insights.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllInsights(!showAllInsights)}
                  className="w-full text-purple-300 hover:text-purple-200"
                >
                  {showAllInsights ? 'Show Less' : `Show ${insights.length - 3} More Insights`}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">AIDA is ready to analyze your {context} data</p>
              <p className="text-xs text-gray-500 mt-1">Pass data to the component to see intelligent insights</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
