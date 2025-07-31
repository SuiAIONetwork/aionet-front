import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
// Type definition for GovernanceProposal
interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voting_status: string;
  created_at: string;
  voting_deadline: string;
  votes: any[];
  total_votes: number;
  votes_for: number;
  votes_against: number;
  for_percentage: number;
  against_percentage: number;
  royal_voters: number;
  pro_voters: number;
  seconds_remaining: number;
  royal_vote_weight: number;
  pro_vote_weight: number;
}
import { toast } from 'sonner'

// Type definitions for Supabase realtime payloads
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Record<string, any>
  old?: Record<string, any>
  errors?: any[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UseGovernanceRealtimeProps {
  onProposalUpdate?: (proposal: GovernanceProposal) => void
  onVoteUpdate?: (proposalId: string, voteData: RealtimePayload) => void
  onNewProposal?: (proposal: GovernanceProposal) => void
  enabled?: boolean
}

export function useGovernanceRealtime({
  onProposalUpdate,
  onVoteUpdate,
  onNewProposal,
  enabled = true
}: UseGovernanceRealtimeProps) {
  const subscriptionRef = useRef<any>(null)
  const voteSubscriptionRef = useRef<any>(null)

  // Subscribe to proposal changes
  const subscribeToProposals = useCallback(() => {
    if (!enabled) return

    // Subscribe to proposal updates
    subscriptionRef.current = supabase
      .channel('governance_proposals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_proposals'
        },
        (payload: RealtimePayload) => {
          console.log('Proposal change detected:', payload)

          switch (payload.eventType) {
            case 'INSERT':
              if (onNewProposal && payload.new) {
                onNewProposal(payload.new as GovernanceProposal)
                toast.info('New governance proposal created!', {
                  description: payload.new.title
                })
              }
              break
              
            case 'UPDATE':
              if (onProposalUpdate && payload.new) {
                onProposalUpdate(payload.new as GovernanceProposal)

                // Show notification for status changes
                if (payload.old && payload.old.status !== payload.new.status) {
                  const statusMessages = {
                    closed: 'Proposal has been closed',
                    cancelled: 'Proposal has been cancelled',
                    active: 'Proposal has been reactivated'
                  }

                  toast.info(statusMessages[payload.new.status as keyof typeof statusMessages] || 'Proposal updated', {
                    description: payload.new.title
                  })
                }
              }
              break
              
            case 'DELETE':
              if (payload.old) {
                toast.info('Proposal has been deleted', {
                  description: payload.old.title
                })
              }
              break
          }
        }
      )
      .subscribe()

    console.log('✅ Subscribed to governance proposals')
  }, [enabled, onProposalUpdate, onNewProposal])

  // Subscribe to vote changes
  const subscribeToVotes = useCallback(() => {
    if (!enabled) return

    // Subscribe to vote updates
    voteSubscriptionRef.current = supabase
      .channel('governance_votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_votes'
        },
        (payload: RealtimePayload) => {
          console.log('Vote change detected:', payload)

          if (onVoteUpdate) {
            const proposalId = payload.new?.proposal_id || payload.old?.proposal_id
            onVoteUpdate(proposalId, payload)
          }
          
          // Show notification for new votes (but not for the current user's votes to avoid spam)
          if (payload.eventType === 'INSERT' && payload.new) {
            // We could add user filtering here if needed
            console.log('New vote cast on proposal:', payload.new.proposal_id)
          }
        }
      )
      .subscribe()

    console.log('✅ Subscribed to governance votes')
  }, [enabled, onVoteUpdate])

  // Cleanup subscriptions
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      console.log('🧹 Cleaned up proposal subscription')
    }
    
    if (voteSubscriptionRef.current) {
      supabase.removeChannel(voteSubscriptionRef.current)
      voteSubscriptionRef.current = null
      console.log('🧹 Cleaned up vote subscription')
    }
  }, [])

  // Setup subscriptions
  useEffect(() => {
    if (enabled) {
      subscribeToProposals()
      subscribeToVotes()
    }

    return cleanup
  }, [enabled, subscribeToProposals, subscribeToVotes, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    cleanup
  }
}

// Hook for real-time proposal statistics
export function useProposalStats(proposalId: string, enabled = true) {
  const subscriptionRef = useRef<any>(null)

  const subscribeToStats = useCallback(() => {
    if (!enabled || !proposalId) return

    // Subscribe to the proposal stats view for real-time vote count updates
    subscriptionRef.current = supabase
      .channel(`proposal_stats_${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'governance_proposals',
          filter: `id=eq.${proposalId}`
        },
        (payload: RealtimePayload) => {
          console.log('Proposal stats updated:', payload.new)
          // The parent component can listen to this via the main governance hook
        }
      )
      .subscribe()

    console.log(`✅ Subscribed to stats for proposal ${proposalId}`)
  }, [enabled, proposalId])

  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      console.log(`🧹 Cleaned up stats subscription for proposal ${proposalId}`)
    }
  }, [proposalId])

  useEffect(() => {
    if (enabled && proposalId) {
      subscribeToStats()
    }

    return cleanup
  }, [enabled, proposalId, subscribeToStats, cleanup])

  return { cleanup }
}

// Utility function to manually refresh proposal data
export async function refreshProposalData(proposalId?: string) {
  try {
    if (proposalId) {
      // Refresh specific proposal
      const { data, error } = await supabase
        .from('governance_proposal_stats')
        .select('*')
        .eq('id', proposalId)
        .single()

      if (error) throw error
      return data
    } else {
      // Refresh all active proposals
      const { data, error } = await supabase
        .from('governance_proposal_stats')
        .select('*')
        .eq('status', 'active')
        .gt('voting_deadline', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Error refreshing proposal data:', error)
    throw error
  }
}

// Utility function to check if user has voted on a proposal
export async function checkUserVote(userAddress: string, proposalId: string) {
  try {
    const { data, error } = await supabase
      .from('governance_votes')
      .select('vote_choice, vote_weight, created_at')
      .eq('voter_address', userAddress)
      .eq('proposal_id', proposalId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error checking user vote:', error)
    return null
  }
}
