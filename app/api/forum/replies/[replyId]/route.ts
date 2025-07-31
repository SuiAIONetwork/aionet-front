import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// DELETE reply (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const { replyId } = params
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creatorAddress')

    console.log('🗑️ API: Deleting reply:', { replyId, creatorAddress })

    if (!creatorAddress) {
      return NextResponse.json({ error: 'Creator address required' }, { status: 400 })
    }

    // First verify the reply exists and get topic information
    const { data: reply, error: fetchError } = await supabaseAdmin
      .from('forum_posts')
      .select(`
        id,
        topic_id,
        author_address,
        title,
        post_type,
        forum_topics!inner(creator_id, channel_id)
      `)
      .eq('id', replyId)
      .single()

    if (fetchError || !reply) {
      console.error('❌ API: Reply not found:', fetchError)
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Verify this is actually a reply (not a main post)
    if (!reply.title?.startsWith('Re:') && reply.post_type !== 'user_reply') {
      console.error('❌ API: Not a reply:', reply)
      return NextResponse.json({ error: 'This is not a reply' }, { status: 400 })
    }

    // Check if the requesting user is the creator of the channel
    // Note: forum_topics is returned as an object, not an array, when using !inner join
    const topicCreatorId = (reply.forum_topics as any)?.creator_id
    console.log('🔍 API: Creator permission check (DELETE):', {
      topicCreatorId,
      creatorAddress,
      topicCreatorIdType: typeof topicCreatorId,
      creatorAddressType: typeof creatorAddress,
      topicCreatorIdLength: topicCreatorId?.length,
      creatorAddressLength: creatorAddress?.length,
      topicCreatorIdLower: topicCreatorId?.toLowerCase(),
      creatorAddressLower: creatorAddress?.toLowerCase(),
      match: topicCreatorId?.toLowerCase() === creatorAddress?.toLowerCase(),
      replyData: reply
    })

    if (!topicCreatorId || topicCreatorId.toLowerCase() !== creatorAddress.toLowerCase()) {
      console.error('❌ API: Not the channel creator:', {
        topicCreatorId,
        creatorAddress,
        match: topicCreatorId?.toLowerCase() === creatorAddress.toLowerCase()
      })
      return NextResponse.json({ error: 'Only channel creators can delete replies' }, { status: 403 })
    }

    // Soft delete the reply
    const { data: deletedReply, error: deleteError } = await supabaseAdmin
      .from('forum_posts')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', replyId)
      .select()

    if (deleteError) {
      console.error('❌ API: Failed to delete reply:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('✅ API: Reply deleted successfully:', deletedReply)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ API: Error deleting reply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create creator answer to a reply
export async function POST(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const { replyId } = params
    const body = await request.json()
    const { creatorAddress, content } = body

    console.log('💬 API: Creating creator answer:', {
      replyId,
      creatorAddress,
      creatorAddressType: typeof creatorAddress,
      creatorAddressLength: creatorAddress?.length,
      contentLength: content?.length
    })

    if (!creatorAddress || !content) {
      console.error('❌ API: Missing required fields:', { creatorAddress: !!creatorAddress, content: !!content })
      return NextResponse.json({ error: 'Creator address and content required' }, { status: 400 })
    }

    // First verify the original reply exists and get topic information
    const { data: originalReply, error: fetchError } = await supabaseAdmin
      .from('forum_posts')
      .select(`
        id,
        topic_id,
        author_address,
        title,
        post_type,
        forum_topics!inner(creator_id, channel_id)
      `)
      .eq('id', replyId)
      .single()

    console.log('🔍 API: Database query result:', {
      originalReply,
      fetchError,
      hasForumTopics: !!originalReply?.forum_topics,
      forumTopicsCount: (originalReply?.forum_topics as any)?.length
    })

    if (fetchError || !originalReply) {
      console.error('❌ API: Original reply not found:', {
        fetchError,
        originalReply,
        replyId
      })
      return NextResponse.json({ error: 'Original reply not found' }, { status: 404 })
    }

    console.log('📋 API: Original reply data:', {
      replyId: originalReply.id,
      topicId: originalReply.topic_id,
      title: originalReply.title,
      postType: originalReply.post_type,
      forumTopics: originalReply.forum_topics,
      forumTopicsLength: (originalReply.forum_topics as any)?.length
    })

    // Verify this is actually a reply (not a main post)
    if (!originalReply.title?.startsWith('Re:') && originalReply.post_type !== 'user_reply') {
      console.error('❌ API: Not a reply:', originalReply)
      return NextResponse.json({ error: 'This is not a reply' }, { status: 400 })
    }

    // Check if the requesting user is the creator of the channel
    // Note: forum_topics is returned as an object, not an array, when using !inner join
    const topicCreatorId = (originalReply.forum_topics as any)?.creator_id
    console.log('🔍 API: Creator permission check:', {
      topicCreatorId,
      creatorAddress,
      topicCreatorIdType: typeof topicCreatorId,
      creatorAddressType: typeof creatorAddress,
      topicCreatorIdLength: topicCreatorId?.length,
      creatorAddressLength: creatorAddress?.length,
      topicCreatorIdLower: topicCreatorId?.toLowerCase(),
      creatorAddressLower: creatorAddress?.toLowerCase(),
      match: topicCreatorId?.toLowerCase() === creatorAddress?.toLowerCase(),
      originalReplyData: originalReply
    })

    if (!topicCreatorId || topicCreatorId.toLowerCase() !== creatorAddress.toLowerCase()) {
      console.error('❌ API: Not the channel creator:', {
        topicCreatorId,
        creatorAddress,
        match: topicCreatorId?.toLowerCase() === creatorAddress.toLowerCase()
      })
      return NextResponse.json({ error: 'Only channel creators can answer replies' }, { status: 403 })
    }

    // Create the creator answer as a new reply
    // Use a unique title format that includes the original reply ID for precise matching
    const answerTitle = `Answer to ${replyId}: ${originalReply.title.replace('Re: ', '')}`

    const { data: creatorAnswer, error: createError } = await supabaseAdmin
      .from('forum_posts')
      .insert({
        topic_id: originalReply.topic_id,
        author_address: creatorAddress,
        title: answerTitle,
        content: content,
        post_type: 'user_reply', // Use the same post type as other replies
        creator_id: creatorAddress,
        channel_id: (originalReply.forum_topics as any).channel_id,
        content_type: 'html'
      })
      .select('id')
      .single()

    if (createError || !creatorAnswer) {
      console.error('❌ API: Failed to create creator answer:', createError)
      return NextResponse.json({ error: createError?.message || 'Failed to create answer' }, { status: 500 })
    }

    console.log('✅ API: Creator answer created successfully:', creatorAnswer)
    return NextResponse.json({ 
      success: true, 
      answerId: creatorAnswer.id 
    })

  } catch (error) {
    console.error('❌ API: Error creating creator answer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
