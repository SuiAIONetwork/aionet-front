"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useProfile } from '@/contexts/profile-context'
import { forumService, ForumCategory, ForumTopic, ForumStats } from '@/lib/forum-service'
import { toast } from 'sonner'
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react'

export default function ForumPage() {
  const { user } = useSuiAuth()
  const { profile } = useProfile()
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    totalMembers: 0,
    todaysPosts: 0,
    activeDiscussions: 0,
    totalReplies: 0
  })
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)

  const userTier = profile?.role_tier || 'NOMAD'

  // Load initial data
  useEffect(() => {
    loadForumData()
  }, [userTier])

  const loadForumData = async () => {
    try {
      setIsLoading(true)
      
      // Load stats and categories in parallel
      const [statsData, categoriesData] = await Promise.all([
        forumService.getForumStats(),
        forumService.getCategories(userTier)
      ])
      
      setStats(statsData)
      setCategories(categoriesData)
      
      // Auto-select first category if available
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id)
        await loadTopics(categoriesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load forum data:', error)
      toast.error('Failed to load forum data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTopics = async (categoryId: string) => {
    try {
      setIsLoadingTopics(true)
      const topicsData = await forumService.getTopics(categoryId, userTier)
      setTopics(topicsData)
    } catch (error) {
      console.error('Failed to load topics:', error)
      toast.error('Failed to load topics')
    } finally {
      setIsLoadingTopics(false)
    }
  }

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    await loadTopics(categoryId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030f1c] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white text-lg">Loading forum...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030f1c] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AIONET Forum</h1>
          <p className="text-[#C0E6FF] text-lg">Connect, discuss, and share with the community</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-[#011829] border-[#C0E6FF]/20">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 text-[#4DA2FF] mx-auto mb-2" />
              <div className="text-white font-semibold">{stats.totalPosts}</div>
              <div className="text-[#C0E6FF] text-xs">Total Posts</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#011829] border-[#C0E6FF]/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-[#4DA2FF] mx-auto mb-2" />
              <div className="text-white font-semibold">{stats.totalMembers}</div>
              <div className="text-[#C0E6FF] text-xs">Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#011829] border-[#C0E6FF]/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-[#4DA2FF] mx-auto mb-2" />
              <div className="text-white font-semibold">{stats.todaysPosts}</div>
              <div className="text-[#C0E6FF] text-xs">Today's Posts</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#011829] border-[#C0E6FF]/20">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-[#4DA2FF] mx-auto mb-2" />
              <div className="text-white font-semibold">{stats.activeDiscussions}</div>
              <div className="text-[#C0E6FF] text-xs">Active Discussions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#011829] border-[#C0E6FF]/20">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 text-[#4DA2FF] mx-auto mb-2" />
              <div className="text-white font-semibold">{stats.totalReplies}</div>
              <div className="text-[#C0E6FF] text-xs">Total Replies</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#011829] border-[#C0E6FF]/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-[#4DA2FF]/20 border border-[#4DA2FF]/50'
                        : 'bg-[#1a2f51]/30 hover:bg-[#1a2f51]/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-[#C0E6FF] text-xs mt-1">{category.description}</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C0E6FF]" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Topics List */}
          <div className="lg:col-span-3">
            <Card className="bg-[#011829] border-[#C0E6FF]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    {selectedCategory ? 
                      categories.find(c => c.id === selectedCategory)?.name || 'Topics' 
                      : 'Select a Category'
                    }
                  </CardTitle>
                  {selectedCategory && (
                    <Button size="sm" className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80">
                      <Plus className="w-4 h-4 mr-2" />
                      New Topic
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTopics ? (
                  <div className="text-center py-8">
                    <div className="text-[#C0E6FF]">Loading topics...</div>
                  </div>
                ) : topics.length > 0 ? (
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-4 bg-[#1a2f51]/30 rounded-lg border border-[#C0E6FF]/10 hover:border-[#C0E6FF]/20 transition-colors duration-200 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{topic.name}</h3>
                            {topic.description && (
                              <p className="text-[#C0E6FF] text-sm mb-2">{topic.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-[#C0E6FF]/70">
                              <span>{topic.post_count || 0} posts</span>
                              <span>{topic.replies || 0} replies</span>
                              {topic.last_post_at && (
                                <span>Last post: {new Date(topic.last_post_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="border-[#4DA2FF] text-[#4DA2FF]">
                            {topic.access_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-[#C0E6FF]/50 mx-auto mb-4" />
                    <div className="text-[#C0E6FF] mb-2">No topics yet</div>
                    <div className="text-[#C0E6FF]/70 text-sm">Be the first to start a discussion!</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
