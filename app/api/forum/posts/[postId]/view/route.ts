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

// POST - Increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { userAddress } = body

    console.log('👁️ API: Incrementing view count for post:', { postId, userAddress })

    // Get current view count
    const { data: postData, error: fetchError } = await supabaseAdmin
      .from('forum_posts')
      .select('view_count')
      .eq('id', postId)
      .single()

    if (fetchError || !postData) {
      console.error('❌ API: Post not found for view increment:', fetchError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment view count
    const { error: updateError } = await supabaseAdmin
      .from('forum_posts')
      .update({ 
        view_count: (postData.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (updateError) {
      console.error('❌ API: Failed to increment view count:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Record user activity if user address is provided
    if (userAddress) {
      await supabaseAdmin
        .from('forum_user_activity')
        .insert({
          user_address: userAddress,
          activity_type: 'post_viewed',
          post_id: postId
        })
    }

    console.log('✅ API: View count incremented successfully')
    return NextResponse.json({ success: true, newViewCount: (postData.view_count || 0) + 1 })

  } catch (error) {
    console.error('❌ API: View increment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
