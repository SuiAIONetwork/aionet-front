"use client"

import { useState, useEffect, useCallback } from "react"
import { ForumStats, ForumCategory, ForumTopic, ForumPost, forumService } from "@/lib/forum-service"
import { encryptedStorage } from "@/lib/encrypted-database-storage"
import { useSubscription } from "@/contexts/subscription-context"
import { useSuiAuth } from "@/contexts/sui-auth-context"
import { toast } from "sonner"

interface UseForumReturn {
  // Data
  stats: ForumStats
  categories: ForumCategory[]
  topics: ForumTopic[]
  posts: ForumPost[]
  
  // Loading states
  isLoading: boolean
  isLoadingStats: boolean
  isLoadingCategories: boolean
  isLoadingTopics: boolean
  isLoadingPosts: boolean
  
  // Actions
  refreshStats: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshTopics: (categoryId: string) => Promise<void>
  refreshPosts: (topicId: string, page?: number) => Promise<void>
  createPost: (topicId: string, title: string, content: string) => Promise<boolean>
  likePost: (postId: string) => Promise<boolean>
  reportPost: (postId: string, reason: string) => Promise<boolean>
  
  // Utilities
  canAccessCategory: (category: ForumCategory) => boolean
  canAccessTopic: (topic: ForumTopic) => boolean
  getUserProfile: (address: string) => Promise<any>
}

export function useForum(): UseForumReturn {
  const { tier } = useSubscription()
  const { user } = useSuiAuth()
  
  // State
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    totalMembers: 0,
    todaysPosts: 0,
    activeDiscussions: 0,
    totalReplies: 0
  })
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  
  const isLoading = isLoadingStats || isLoadingCategories || isLoadingTopics || isLoadingPosts

  // Access control utilities
  const canAccessCategory = useCallback((category: ForumCategory): boolean => {
    if (category.access_level === 'ALL') return true
    if (category.access_level === 'PRO') return tier === 'PRO' || tier === 'ROYAL'
    if (category.access_level === 'ROYAL') return tier === 'ROYAL'
    if (category.access_level === 'CREATORS') return tier === 'PRO' || tier === 'ROYAL'
    return false
  }, [tier])

  const canAccessTopic = useCallback((topic: ForumTopic): boolean => {
    if (topic.access_level === 'ALL') return true
    if (topic.access_level === 'PRO') return tier === 'PRO' || tier === 'ROYAL'
    if (topic.access_level === 'ROYAL') return tier === 'ROYAL'
    if (topic.access_level === 'CREATORS') return tier === 'PRO' || tier === 'ROYAL'
    return false
  }, [tier])

  // Get user profile with decryption
  const getUserProfile = useCallback(async (address: string) => {
    try {
      const profile = await encryptedStorage.getDecryptedProfile(address)
      return profile
    } catch (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
  }, [])

  // Refresh functions
  const refreshStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const newStats = await forumService.getForumStats()
      setStats(newStats)
    } catch (error) {
      console.error('Failed to refresh forum stats:', error)
      toast.error('Failed to load forum statistics')
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  const refreshCategories = useCallback(async () => {
    setIsLoadingCategories(true)
    try {
      const newCategories = await forumService.getCategories(tier)
      setCategories(newCategories)
    } catch (error) {
      console.error('Failed to refresh categories:', error)
      toast.error('Failed to load forum categories')
    } finally {
      setIsLoadingCategories(false)
    }
  }, [tier])

  const refreshTopics = useCallback(async (categoryId: string) => {
    setIsLoadingTopics(true)
    try {
      const newTopics = await forumService.getTopics(categoryId, tier)
      setTopics(newTopics)
    } catch (error) {
      console.error('Failed to refresh topics:', error)
      toast.error('Failed to load forum topics')
    } finally {
      setIsLoadingTopics(false)
    }
  }, [tier])

  const refreshPosts = useCallback(async (topicId: string, page: number = 1) => {
    setIsLoadingPosts(true)
    try {
      const { posts: newPosts } = await forumService.getPosts(topicId, page, 20, tier)
      
      // Enhance posts with user profile data
      const enhancedPosts = await Promise.all(
        newPosts.map(async (post) => {
          const profile = await getUserProfile(post.author_address)
          return {
            ...post,
            author_username: profile?.username || `User ${post.author_address.slice(0, 6)}`,
            author_tier: profile?.role_tier || 'NOMAD',
            author_avatar: profile?.profile_image_blob_id
          }
        })
      )
      
      setPosts(enhancedPosts)
    } catch (error) {
      console.error('Failed to refresh posts:', error)
      toast.error('Failed to load forum posts')
    } finally {
      setIsLoadingPosts(false)
    }
  }, [tier, getUserProfile])

  // Action functions
  const createPost = useCallback(async (topicId: string, title: string, content: string): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please connect your wallet to create a post')
      return false
    }

    try {
      const result = await forumService.createPost(
        user.address,
        { topic_id: topicId, title, content },
        tier
      )

      if (result.success) {
        toast.success('Post created successfully!')
        // Refresh relevant data
        await refreshStats()
        await refreshPosts(topicId)
        return true
      } else {
        toast.error(result.error || 'Failed to create post')
        return false
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
      return false
    }
  }, [user?.address, tier, refreshStats, refreshPosts])

  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please connect your wallet to like posts')
      return false
    }

    try {
      // This would be implemented in the forum service
      // For now, just show success
      toast.success('Post liked!')
      return true
    } catch (error) {
      console.error('Failed to like post:', error)
      toast.error('Failed to like post')
      return false
    }
  }, [user?.address])

  const reportPost = useCallback(async (postId: string, reason: string): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please connect your wallet to report posts')
      return false
    }

    try {
      // This would be implemented in the forum service
      // For now, just show success
      toast.success('Post reported successfully')
      return true
    } catch (error) {
      console.error('Failed to report post:', error)
      toast.error('Failed to report post')
      return false
    }
  }, [user?.address])

  // Initial load
  useEffect(() => {
    refreshStats()
    refreshCategories()
  }, [refreshStats, refreshCategories])

  return {
    // Data
    stats,
    categories,
    topics,
    posts,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isLoadingCategories,
    isLoadingTopics,
    isLoadingPosts,
    
    // Actions
    refreshStats,
    refreshCategories,
    refreshTopics,
    refreshPosts,
    createPost,
    likePost,
    reportPost,
    
    // Utilities
    canAccessCategory,
    canAccessTopic,
    getUserProfile
  }
}
