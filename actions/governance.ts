'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentUser, requireAuth, requireAdmin } from '@/data/auth'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Input validation schemas
const VoteSchema = z.object({
  proposalId: z.string().uuid('Invalid proposal ID'),
  choice: z.enum(['yes', 'no'], {
    required_error: 'Vote choice is required',
    invalid_type_error: 'Vote choice must be yes or no'
  }),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
})

const CreateProposalSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  votingDeadline: z.string().datetime('Invalid voting deadline format')
})

// Server Action: Submit a vote on a governance proposal
export async function submitVote(formData: FormData) {
  try {
    // Get and validate user
    const user = await requireAuth()
    
    // Extract and validate form data
    const rawData = {
      proposalId: formData.get('proposalId'),
      choice: formData.get('choice'),
      reason: formData.get('reason')
    }

    const validatedData = VoteSchema.parse(rawData)
    
    // Check if proposal exists and is active
    const { data: proposal, error: proposalError } = await supabaseServer
      .from('governance_proposals')
      .select('id, status, voting_deadline')
      .eq('id', validatedData.proposalId)
      .single()

    if (proposalError || !proposal) {
      throw new Error('Proposal not found')
    }

    if (proposal.status !== 'active') {
      throw new Error('Proposal is not active')
    }

    if (new Date(proposal.voting_deadline) < new Date()) {
      throw new Error('Voting deadline has passed')
    }

    // Check if user has already voted
    const { data: existingVote } = await supabaseServer
      .from('governance_votes')
      .select('id')
      .eq('proposal_id', validatedData.proposalId)
      .eq('user_address', user.address)
      .single()

    if (existingVote) {
      throw new Error('You have already voted on this proposal')
    }

    // Calculate voting power based on user's role
    const votingPower = calculateVotingPower(user)

    // Insert the vote
    const { error: voteError } = await supabaseServer
      .from('governance_votes')
      .insert({
        proposal_id: validatedData.proposalId,
        user_address: user.address,
        vote_option: validatedData.choice,
        voting_power: votingPower,
        reason: validatedData.reason,
        created_at: new Date().toISOString()
      })

    if (voteError) {
      throw new Error('Failed to submit vote')
    }

    // Update proposal vote counts
    const voteField = validatedData.choice === 'yes' ? 'yes_votes' : 'no_votes'
    const { error: updateError } = await supabaseServer
      .rpc('increment_vote_count', {
        proposal_id: validatedData.proposalId,
        vote_field: voteField,
        vote_power: votingPower
      })

    if (updateError) {
      console.error('Failed to update vote counts:', updateError)
      // Don't throw here as the vote was recorded successfully
    }

    // Revalidate the governance pages
    revalidatePath('/governance')
    revalidatePath(`/governance/${validatedData.proposalId}`)

    return { success: true, message: 'Vote submitted successfully' }
  } catch (error) {
    console.error('Error submitting vote:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit vote'
    }
  }
}

// Server Action: Create a new governance proposal (Admin only)
export async function createProposal(formData: FormData) {
  try {
    // Require admin access
    const user = await requireAdmin()
    
    // Extract and validate form data
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      votingDeadline: formData.get('votingDeadline')
    }

    const validatedData = CreateProposalSchema.parse(rawData)
    
    // Ensure voting deadline is in the future
    const deadline = new Date(validatedData.votingDeadline)
    if (deadline <= new Date()) {
      throw new Error('Voting deadline must be in the future')
    }

    // Create the proposal
    const { data: proposal, error } = await supabaseServer
      .from('governance_proposals')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        voting_deadline: validatedData.votingDeadline,
        created_by: user.address,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error || !proposal) {
      throw new Error('Failed to create proposal')
    }

    // Revalidate governance pages
    revalidatePath('/governance')
    revalidatePath('/admin-dashboard')

    return { 
      success: true, 
      message: 'Proposal created successfully',
      proposalId: proposal.id
    }
  } catch (error) {
    console.error('Error creating proposal:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(e => e.message).join(', ')
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create proposal'
    }
  }
}

// Server Action: Update proposal status (Admin only)
export async function updateProposalStatus(proposalId: string, status: 'active' | 'passed' | 'rejected' | 'expired') {
  try {
    // Require admin access
    const user = await requireAdmin()
    
    // Validate inputs
    if (!proposalId || !z.string().uuid().safeParse(proposalId).success) {
      throw new Error('Invalid proposal ID')
    }

    if (!['active', 'passed', 'rejected', 'expired'].includes(status)) {
      throw new Error('Invalid status')
    }

    // Update the proposal
    const { error } = await supabaseServer
      .from('governance_proposals')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)

    if (error) {
      throw new Error('Failed to update proposal status')
    }

    // Revalidate governance pages
    revalidatePath('/governance')
    revalidatePath(`/governance/${proposalId}`)
    revalidatePath('/admin-dashboard')

    return { success: true, message: 'Proposal status updated successfully' }
  } catch (error) {
    console.error('Error updating proposal status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update proposal status'
    }
  }
}

// Server Action: Delete proposal (Admin only)
export async function deleteProposal(proposalId: string) {
  try {
    // Require admin access
    const user = await requireAdmin()
    
    // Validate input
    if (!proposalId || !z.string().uuid().safeParse(proposalId).success) {
      throw new Error('Invalid proposal ID')
    }

    // Delete associated votes first
    await supabaseServer
      .from('governance_votes')
      .delete()
      .eq('proposal_id', proposalId)

    // Delete the proposal
    const { error } = await supabaseServer
      .from('governance_proposals')
      .delete()
      .eq('id', proposalId)

    if (error) {
      throw new Error('Failed to delete proposal')
    }

    // Revalidate governance pages
    revalidatePath('/governance')
    revalidatePath('/admin-dashboard')

    return { success: true, message: 'Proposal deleted successfully' }
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete proposal'
    }
  }
}

// Helper function to calculate voting power
function calculateVotingPower(user: any): number {
  switch (user.role) {
    case 'ROYAL':
      return 10
    case 'PRO':
      return 5
    case 'NOMAD':
      return 1
    default:
      return 1
  }
}
