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

// UPDATE post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { title, content, isPinned, userAddress } = body

    console.log('🔄 API: Updating post:', { postId, userAddress, title })

    // First verify ownership
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('forum_posts')
      .select('author_address, creator_id')
      .eq('id', postId)
      .single()

    if (fetchError || !existingPost) {
      console.error('❌ API: Post not found:', fetchError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPost.author_address !== userAddress && existingPost.creator_id !== userAddress) {
      console.error('❌ API: User does not own this post')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the post
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (isPinned !== undefined) updateData.is_pinned = isPinned

    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('forum_posts')
      .update(updateData)
      .eq('id', postId)
      .select()

    if (updateError) {
      console.error('❌ API: Failed to update post:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('✅ API: Post updated successfully:', updatedPost)
    return NextResponse.json({ success: true, post: updatedPost[0] })

  } catch (error) {
    console.error('❌ API: Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    console.log('🗑️ API: Deleting post:', { postId, userAddress })

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 })
    }

    // First verify ownership
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('forum_posts')
      .select('author_address, creator_id')
      .eq('id', postId)
      .single()

    if (fetchError || !existingPost) {
      console.error('❌ API: Post not found:', fetchError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPost.author_address !== userAddress && existingPost.creator_id !== userAddress) {
      console.error('❌ API: User does not own this post')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete the post
    const { data: deletedPost, error: deleteError } = await supabaseAdmin
      .from('forum_posts')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()

    if (deleteError) {
      console.error('❌ API: Failed to delete post:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('✅ API: Post deleted successfully:', deletedPost)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ API: Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
