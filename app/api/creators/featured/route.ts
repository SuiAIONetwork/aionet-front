import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface FeaturedChannel {
  id: string
  creatorAddress: string
  name: string
  username: string
  avatar: string
  coverImage?: string
  role: string
  tier: 'PRO' | 'ROYAL'
  category: string
  categories: string[]
  channels: Array<{
    id: string
    name: string
    type: string
    description: string
    price: number
    subscribers: number
    channelAvatar?: string
    channelCover?: string
  }>
  bannerColor: string
  verified: boolean
  // Performance metrics
  subscriberCount: number
  postCount: number
  replyCount: number
  compositeScore: number
  position: number
}

/**
 * GET /api/creators/featured
 * Get top 5 featured channels based on composite performance score
 */
export async function GET(request: NextRequest) {
  try {

    // Get all creators with their channels data
    const { data: creators, error: creatorsError } = await supabaseAdmin
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })

    if (creatorsError) {
      console.error('❌ API: Error fetching creators:', creatorsError)
      return NextResponse.json(
        { error: creatorsError.message },
        { status: 500 }
      )
    }

    if (!creators || creators.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No creators found'
      })
    }

    // Calculate performance metrics for each channel
    const channelPerformanceData: FeaturedChannel[] = []

    for (const creator of creators) {
      const channelsData = creator.channels_data || []
      
      for (const channel of channelsData) {
        try {
          // Get subscriber count for this specific channel
          const { count: subscriberCount } = await supabaseAdmin
            .from('channel_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_address', creator.creator_address)
            .eq('channel_id', channel.id)
            .eq('subscription_status', 'active')

          // Get post count by this creator for this channel
          const { count: postCount } = await supabaseAdmin
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_address', creator.creator_address)
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .eq('post_type', 'creator_post')

          // Get reply count - count user replies to creator posts in this channel
          // First get all creator posts in this channel
          const { data: creatorPosts } = await supabaseAdmin
            .from('forum_posts')
            .select('id')
            .eq('author_address', creator.creator_address)
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .eq('post_type', 'creator_post')

          let replyCount = 0
          if (creatorPosts && creatorPosts.length > 0) {
            // Get all topics that contain these creator posts
            const { data: topics } = await supabaseAdmin
              .from('forum_topics')
              .select('id')
              .eq('creator_id', creator.creator_address)
              .eq('channel_id', channel.id)

            if (topics && topics.length > 0) {
              const topicIds = topics.map(t => t.id)

              // Count user replies in these topics
              const { count: userReplies } = await supabaseAdmin
                .from('forum_posts')
                .select('*', { count: 'exact', head: true })
                .in('topic_id', topicIds)
                .eq('is_deleted', false)
                .eq('post_type', 'user_reply')

              replyCount = userReplies || 0
            }
          }

          // Calculate composite score
          // Weight: subscribers (40%), posts (30%), replies (30%)
          const normalizedSubscribers = Math.min(subscriberCount || 0, 100) // Cap at 100 for normalization
          const normalizedPosts = Math.min(postCount || 0, 50) // Cap at 50 for normalization
          const normalizedReplies = Math.min(replyCount, 100) // Cap at 100 for normalization
          
          const compositeScore = 
            (normalizedSubscribers * 0.4) + 
            (normalizedPosts * 0.3) + 
            (normalizedReplies * 0.3)

          // Only include channels with some activity
          if (compositeScore > 0) {
            channelPerformanceData.push({
              id: `${creator.id}_${channel.id}`,
              creatorAddress: creator.creator_address,
              name: channel.name,
              username: creator.username,
              avatar: channel.channelAvatar || creator.avatar,
              coverImage: channel.channelCover || creator.cover_image,
              role: creator.role,
              tier: creator.tier,
              category: creator.category,
              categories: creator.categories || [creator.category],
              channels: [channel],
              bannerColor: creator.banner_color || '#4DA2FF',
              verified: creator.verified || false,
              subscriberCount: subscriberCount || 0,
              postCount: postCount || 0,
              replyCount: replyCount || 0,
              compositeScore,
              position: 0 // Will be set after sorting
            })
          }
        } catch (error) {
          console.error(`❌ Error calculating metrics for channel ${channel.id}:`, error)
          continue
        }
      }
    }

    // Sort by composite score and take top 5
    const topChannels = channelPerformanceData
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 5)
      .map((channel, index) => ({
        ...channel,
        position: index + 1
      }))

    return NextResponse.json({
      success: true,
      data: topChannels,
      count: topChannels.length
    })

  } catch (error) {
    console.error('❌ API: Error in featured channels endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
