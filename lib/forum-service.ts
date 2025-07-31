import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Forum interfaces
export interface ForumCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  access_level: 'ALL' | 'PRO' | 'ROYAL'
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ForumTopic {
  id: string
  category_id?: string
  name: string
  description?: string
  access_level?: 'ALL' | 'PRO' | 'ROYAL'
  sort_order?: number
  is_active?: boolean
  post_count?: number
  replies?: number
  last_post_at?: string
  last_post_by?: string
  created_at?: string
  updated_at?: string
}

export interface ForumPost {
  id: string
  topic_id: string
  author_address: string
  title: string
  content: string
  content_type: 'text' | 'markdown' | 'html'
  is_deleted: boolean
  like_count: number
  view_count: number
  reply_count: number
  created_at: string
  updated_at: string
  is_pinned?: boolean
  
  // Joined data
  author_username?: string
  author_tier?: string
  author_avatar?: string
}

export interface ForumStats {
  totalPosts: number
  totalMembers: number
  todaysPosts: number
  activeDiscussions: number
  totalReplies: number
}

export interface CreatePostData {
  topic_id: string
  title: string
  content: string
  content_type?: 'text' | 'markdown' | 'html'
}

class ForumService {
  /**
   * Check if user has access to content based on tier
   */
  private hasAccess(userTier: string, requiredLevel: string): boolean {
    if (requiredLevel === 'ALL') return true
    if (requiredLevel === 'PRO') return userTier === 'PRO' || userTier === 'ROYAL'
    if (requiredLevel === 'ROYAL') return userTier === 'ROYAL'
    return false
  }

  /**
   * Get forum statistics
   */
  async getForumStats(): Promise<ForumStats> {
    try {
      // Get total posts count
      const { count: totalPosts } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)

      // Get total members (unique authors)
      const { data: authors } = await supabase
        .from('forum_posts')
        .select('author_address')
        .eq('is_deleted', false)

      const uniqueAuthors = new Set(authors?.map(a => a.author_address) || [])
      const totalMembers = uniqueAuthors.size

      // Get today's posts
      const today = new Date().toISOString().split('T')[0]
      const { count: todaysPosts } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .gte('created_at', today)

      // Get active discussions (topics with posts in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: activeDiscussions } = await supabase
        .from('forum_topics')
        .select('*', { count: 'exact', head: true })
        .gte('last_post_at', sevenDaysAgo)

      // Get total replies (posts that are replies)
      const { count: totalReplies } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .not('parent_post_id', 'is', null)

      return {
        totalPosts: totalPosts || 0,
        totalMembers: totalMembers || 0,
        todaysPosts: todaysPosts || 0,
        activeDiscussions: activeDiscussions || 0,
        totalReplies: totalReplies || 0
      }
    } catch (error) {
      console.error('Failed to get forum stats:', error)
      return {
        totalPosts: 0,
        totalMembers: 0,
        todaysPosts: 0,
        activeDiscussions: 0,
        totalReplies: 0
      }
    }
  }

  /**
   * Get forum categories accessible to user
   */
  async getCategories(userTier: string = 'NOMAD'): Promise<ForumCategory[]> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      // Filter categories based on user access level
      return (data || []).filter(category => 
        this.hasAccess(userTier, category.access_level)
      )
    } catch (error) {
      console.error('Failed to get categories:', error)
      return []
    }
  }

  /**
   * Get forum topics for a category
   */
  async getTopics(categoryId: string, userTier: string = 'NOMAD'): Promise<ForumTopic[]> {
    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      // Filter topics based on user access level
      const filteredTopics = (data || []).filter(topic =>
        this.hasAccess(userTier, topic.access_level || 'ALL')
      )

      // Get post counts for each topic
      const topicsWithCounts = await Promise.all(
        filteredTopics.map(async (topic) => {
          const { count: postCount } = await supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .eq('is_deleted', false)

          const { count: replyCount } = await supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id)
            .eq('is_deleted', false)
            .not('parent_post_id', 'is', null)

          return {
            ...topic,
            post_count: postCount || 0,
            replies: replyCount || 0
          }
        })
      )

      return topicsWithCounts
    } catch (error) {
      console.error('Failed to get topics:', error)
      return []
    }
  }

  /**
   * Get posts for a topic
   */
  async getPosts(
    topicId: string, 
    page: number = 1, 
    limit: number = 20,
    userTier: string = 'NOMAD'
  ): Promise<{ posts: ForumPost[], totalCount: number }> {
    try {
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact' })
        .eq('topic_id', topicId)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        posts: data || [],
        totalCount: count || 0
      }
    } catch (error) {
      console.error('Failed to get posts:', error)
      return { posts: [], totalCount: 0 }
    }
  }

  /**
   * Create a new forum post
   */
  async createPost(
    authorAddress: string,
    postData: CreatePostData,
    userTier: string = 'NOMAD'
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Check if user has access to the topic
      const { data: topic } = await supabase
        .from('forum_topics')
        .select('access_level')
        .eq('id', postData.topic_id)
        .single()

      if (!topic) {
        return { success: false, error: 'Topic not found' }
      }

      if (!this.hasAccess(userTier, topic.access_level || 'ALL')) {
        return { success: false, error: 'Access denied to this topic' }
      }

      // Create the post
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          topic_id: postData.topic_id,
          author_address: authorAddress,
          title: postData.title,
          content: postData.content,
          content_type: postData.content_type || 'text'
        })
        .select('id')
        .single()

      if (error) throw error

      // Update topic post count
      const { data: currentTopic } = await supabase
        .from('forum_topics')
        .select('post_count')
        .eq('id', postData.topic_id)
        .single()

      const { error: updateError } = await supabase
        .from('forum_topics')
        .update({
          post_count: (currentTopic?.post_count || 0) + 1,
          last_post_at: new Date().toISOString(),
          last_post_by: authorAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', postData.topic_id)

      if (updateError) {
        console.error('Failed to update topic stats:', updateError)
      }

      return { success: true, postId: data.id }
    } catch (error) {
      console.error('Failed to create post:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}

export const forumService = new ForumService()
