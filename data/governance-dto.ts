import 'server-only'
import { getCurrentUser, User } from './auth'
import { createClient } from '@supabase/supabase-js'
// Note: experimental_taintObjectReference removed due to React version compatibility

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

// Data Transfer Objects
export interface GovernanceProposalDTO {
  id: string
  title: string
  description: string
  status: 'active' | 'passed' | 'rejected' | 'expired'
  votingDeadline: string
  createdAt: string
  createdBy: string
  yesVotes: number
  noVotes: number
  totalVotes: number
  userVote: 'yes' | 'no' | null
  canVote: boolean
  votingPower: number
}

export interface VotingStatsDTO {
  totalProposals: number
  activeProposals: number
  userVotingPower: number
  userVotesCount: number
  participationRate: number
}

// Permission checking functions
function canViewProposal(viewer: User | null, proposal: any): boolean {
  // All authenticated users can view proposals
  return viewer !== null
}

function canVoteOnProposal(viewer: User | null, proposal: any): boolean {
  if (!viewer) return false
  
  // Check if proposal is still active
  if (proposal.status !== 'active') return false
  
  // Check if voting deadline has passed
  if (new Date(proposal.voting_deadline) < new Date()) return false
  
  // All authenticated users can vote (you might want to add tier restrictions)
  return true
}

function canCreateProposal(viewer: User | null): boolean {
  // Only premium users or admins can create proposals
  return viewer?.canAccessPremiumFeatures() || viewer?.isAdmin === true
}

// Get all governance proposals
export async function getGovernanceProposalsDTO(): Promise<GovernanceProposalDTO[]> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return []
    }

    const { data: proposals, error } = await supabaseServer
      .from('governance_proposals')
      .select(`
        id,
        title,
        description,
        status,
        voting_deadline,
        created_at,
        created_by,
        yes_votes,
        no_votes,
        total_votes
      `)
      .order('created_at', { ascending: false })

    if (error || !proposals) {
      return []
    }

    // Get user's votes for these proposals
    const proposalIds = proposals.map(p => p.id)
    const { data: userVotes } = await supabaseServer
      .from('governance_votes')
      .select('proposal_id, vote_option')
      .eq('user_address', currentUser.address)
      .in('proposal_id', proposalIds)

    const userVoteMap = new Map(
      userVotes?.map(vote => [vote.proposal_id, vote.vote_option]) || []
    )

    // Calculate user's voting power
    const votingPower = calculateVotingPower(currentUser)

    return proposals
      .filter(proposal => canViewProposal(currentUser, proposal))
      .map(proposal => {
        // Security note: Ensure raw proposal data is not accidentally exposed to client
        // (experimental_taintObjectReference removed due to React version compatibility)

        return {
          id: proposal.id,
          title: proposal.title,
          description: proposal.description,
          status: proposal.status,
          votingDeadline: proposal.voting_deadline,
          createdAt: proposal.created_at,
          createdBy: proposal.created_by,
          yesVotes: proposal.yes_votes || 0,
          noVotes: proposal.no_votes || 0,
          totalVotes: proposal.total_votes || 0,
          userVote: userVoteMap.get(proposal.id) || null,
          canVote: canVoteOnProposal(currentUser, proposal),
          votingPower
        }
      })
  } catch (error) {
    console.error('Error fetching governance proposals:', error)
    return []
  }
}

// Get single governance proposal
export async function getGovernanceProposalDTO(proposalId: string): Promise<GovernanceProposalDTO | null> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return null
    }

    const { data: proposal, error } = await supabaseServer
      .from('governance_proposals')
      .select(`
        id,
        title,
        description,
        status,
        voting_deadline,
        created_at,
        created_by,
        yes_votes,
        no_votes,
        total_votes
      `)
      .eq('id', proposalId)
      .single()

    if (error || !proposal) {
      return null
    }

    if (!canViewProposal(currentUser, proposal)) {
      return null
    }

    // Get user's vote for this proposal
    const { data: userVote } = await supabaseServer
      .from('governance_votes')
      .select('vote_option')
      .eq('proposal_id', proposalId)
      .eq('user_address', currentUser.address)
      .single()

    // Security note: Ensure raw proposal data is not accidentally exposed to client
    // (experimental_taintObjectReference removed due to React version compatibility)

    const votingPower = calculateVotingPower(currentUser)

    return {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      votingDeadline: proposal.voting_deadline,
      createdAt: proposal.created_at,
      createdBy: proposal.created_by,
      yesVotes: proposal.yes_votes || 0,
      noVotes: proposal.no_votes || 0,
      totalVotes: proposal.total_votes || 0,
      userVote: userVote?.vote_option || null,
      canVote: canVoteOnProposal(currentUser, proposal),
      votingPower
    }
  } catch (error) {
    console.error('Error fetching governance proposal:', error)
    return null
  }
}

// Get voting statistics for current user
export async function getVotingStatsDTO(): Promise<VotingStatsDTO | null> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return null
    }

    // Get total proposals count
    const { count: totalProposals } = await supabaseServer
      .from('governance_proposals')
      .select('*', { count: 'exact', head: true })

    // Get active proposals count
    const { count: activeProposals } = await supabaseServer
      .from('governance_proposals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get user's votes count
    const { count: userVotesCount } = await supabaseServer
      .from('governance_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_address', currentUser.address)

    const votingPower = calculateVotingPower(currentUser)
    const participationRate = totalProposals ? (userVotesCount || 0) / totalProposals : 0

    return {
      totalProposals: totalProposals || 0,
      activeProposals: activeProposals || 0,
      userVotingPower: votingPower,
      userVotesCount: userVotesCount || 0,
      participationRate: Math.round(participationRate * 100)
    }
  } catch (error) {
    console.error('Error fetching voting stats:', error)
    return null
  }
}

// Calculate voting power based on user's role and NFT tier
function calculateVotingPower(user: User): number {
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

// Check if user can create proposals
export async function canUserCreateProposal(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser()
    return canCreateProposal(currentUser)
  } catch {
    return false
  }
}
