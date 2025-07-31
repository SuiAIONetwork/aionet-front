import { useState, useEffect, useCallback } from 'react'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { useProfile } from '@/contexts/profile-context'
import { useGovernance as useGovernanceHook } from '@/hooks/useGovernance'

// Type definitions
interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  endDate: string;
  votes: any[];
}

interface UserVotingStatus {
  hasVoted: boolean;
  votingPower: number;
  canVote: boolean;
}
import { toast } from 'sonner'

export interface UseGovernanceReturn {
  // Data
  proposals: GovernanceProposal[]
  userStatuses: Record<string, UserVotingStatus>
  
  // Loading states
  isLoading: boolean
  isVoting: boolean
  isCreatingProposal: boolean
  
  // User info
  userTier: 'NOMAD' | 'PRO' | 'ROYAL'
  voteWeight: number
  canVote: boolean
  hasGovernanceAccess: boolean
  
  // Actions
  loadProposals: () => Promise<void>
  submitVote: (proposalId: string, choice: 'for' | 'against') => Promise<boolean>
  removeVote: (proposalId: string) => Promise<boolean>
  createProposal: (title: string, description: string, deadline: Date) => Promise<boolean>
  
  // Validation
  validateVote: (proposalId: string) => { valid: boolean; error?: string }
  getProposalStatus: (proposalId: string) => 'can_vote' | 'already_voted' | 'expired' | 'no_access'
}

export function useGovernance(): UseGovernanceReturn {
  const { isSignedIn, user } = useSuiAuth()
  const { profile } = useProfile()
  
  // State
  const [proposals, setProposals] = useState<GovernanceProposal[]>([])
  const [userStatuses, setUserStatuses] = useState<Record<string, UserVotingStatus>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)

  // User info
  const userTier = profile?.role_tier || 'NOMAD'
  const voteWeight = userTier === 'ROYAL' ? 5 : userTier === 'PRO' ? 3 : 1 // Simple vote weight calculation
  const canVote = voteWeight > 0
  const hasGovernanceAccess = userTier === 'PRO' || userTier === 'ROYAL'

  // Load proposals and user voting statuses
  const loadProposals = useCallback(async () => {
    if (!isSignedIn || !user?.address) return

    try {
      setIsLoading(true)
      
      // Load active proposals
      // TODO: Migrate to backend API
      const activeProposals: any[] = []
      setProposals(activeProposals)

      // Load user voting statuses
      // TODO: Migrate to backend API
      const statuses = {}
      setUserStatuses(statuses)
      
    } catch (error) {
      console.error('Error loading governance data:', error)
      toast.error('Failed to load governance data')
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, user?.address])

  // Submit a vote
  const submitVote = useCallback(async (proposalId: string, choice: 'for' | 'against'): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please sign in to vote')
      return false
    }

    // Validate vote
    const validation = validateVote(proposalId)
    if (!validation.valid) {
      toast.error(validation.error)
      return false
    }

    try {
      setIsVoting(true)

      // TODO: Migrate to backend API
      const result = { success: false, message: 'Voting not yet implemented' }
      
      if (result.success) {
        toast.success(`Vote submitted successfully!`, {
          description: `You voted ${choice.toUpperCase()} with weight ${voteWeight}`
        })
        
        // Reload data to reflect changes
        await loadProposals()
        return true
      } else {
        toast.error('Failed to submit vote', {
          description: result.message
        })
        return false
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
      return false
    } finally {
      setIsVoting(false)
    }
  }, [user?.address, voteWeight, loadProposals])

  // Remove a vote
  const removeVote = useCallback(async (proposalId: string): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please sign in to remove vote')
      return false
    }

    try {
      setIsVoting(true)

      // TODO: Migrate to backend API
      const result = { success: false, message: 'Vote removal not yet implemented' }
      
      if (result.success) {
        toast.success('Vote removed successfully')
        
        // Reload data to reflect changes
        await loadProposals()
        return true
      } else {
        toast.error('Failed to remove vote', {
          description: result.message
        })
        return false
      }
    } catch (error) {
      console.error('Error removing vote:', error)
      toast.error('Failed to remove vote')
      return false
    } finally {
      setIsVoting(false)
    }
  }, [user?.address, loadProposals])

  // Create a new proposal (admin only)
  const createProposal = useCallback(async (
    title: string, 
    description: string, 
    deadline: Date
  ): Promise<boolean> => {
    if (!user?.address) {
      toast.error('Please sign in to create proposal')
      return false
    }

    // Basic validation
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields')
      return false
    }

    if (deadline <= new Date()) {
      toast.error('Voting deadline must be in the future')
      return false
    }

    try {
      setIsCreatingProposal(true)
      
      const response = await fetch(`/api/governance/proposals?admin_address=${user.address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          voting_deadline: deadline.toISOString(),
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Proposal created successfully!')
        await loadProposals()
        return true
      } else {
        toast.error(data.error || 'Failed to create proposal')
        return false
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      toast.error('Failed to create proposal')
      return false
    } finally {
      setIsCreatingProposal(false)
    }
  }, [user?.address, loadProposals])

  // Validate if user can vote on a proposal
  const validateVote = useCallback((proposalId: string): { valid: boolean; error?: string } => {
    // Check if user has governance access
    if (!hasGovernanceAccess) {
      return {
        valid: false,
        error: 'NOMAD tier users cannot vote. Upgrade to PRO or ROYAL tier to participate in governance.'
      }
    }

    // Check if proposal exists
    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) {
      return { valid: false, error: 'Proposal not found' }
    }

    // Check if proposal is active
    if (proposal.status !== 'active') {
      return { valid: false, error: 'Proposal is not active for voting' }
    }

    // Check if voting deadline has passed
    if (new Date(proposal.endDate) <= new Date()) {
      return { valid: false, error: 'Voting deadline has passed' }
    }

    // Check if user has already voted
    const userStatus = userStatuses[proposalId]
    if (userStatus?.hasVoted) {
      return { valid: false, error: 'You have already voted on this proposal' }
    }

    return { valid: true }
  }, [hasGovernanceAccess, proposals, userStatuses])

  // Get proposal status for user
  const getProposalStatus = useCallback((proposalId: string): 'can_vote' | 'already_voted' | 'expired' | 'no_access' => {
    if (!hasGovernanceAccess) return 'no_access'
    
    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) return 'no_access'
    
    const userStatus = userStatuses[proposalId]
    if (userStatus?.hasVoted) return 'already_voted'
    
    if (proposal.status !== 'active' || new Date(proposal.endDate) <= new Date()) {
      return 'expired'
    }
    
    return 'can_vote'
  }, [hasGovernanceAccess, proposals, userStatuses])

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (isSignedIn && user?.address && hasGovernanceAccess) {
      loadProposals()
    }
  }, [isSignedIn, user?.address, hasGovernanceAccess, loadProposals])

  return {
    // Data
    proposals,
    userStatuses,
    
    // Loading states
    isLoading,
    isVoting,
    isCreatingProposal,
    
    // User info
    userTier,
    voteWeight,
    canVote,
    hasGovernanceAccess,
    
    // Actions
    loadProposals,
    submitVote,
    removeVote,
    createProposal,
    
    // Validation
    validateVote,
    getProposalStatus,
  }
}
