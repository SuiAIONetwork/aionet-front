'use client';

import { useState, useEffect } from 'react';
import { useBackendAPI } from './useBackendIntegration';
import { api } from '@/lib/api-client';

/**
 * Governance Hook
 * Provides easy access to governance functionality
 */
export function useGovernance() {
  const backendAPI = useBackendAPI();
  const [proposals, setProposals] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [votingPower, setVotingPower] = useState<number>(1);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch proposals
  const fetchProposals = async (filters?: any) => {
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getGovernanceProposals(filters);
    
    if (result.error) {
      setError(result.error);
    } else {
      setProposals((result.data as any[]) || []);
    }
    
    setLoading(false);
  };

  // Fetch user's votes
  const fetchUserVotes = async () => {
    if (!backendAPI.isFullyAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getUserVotes();
    
    if (result.error) {
      setError(result.error);
    } else {
      setUserVotes((result.data as any[]) || []);
    }
    
    setLoading(false);
  };

  // Fetch voting power
  const fetchVotingPower = async () => {
    if (!backendAPI.isFullyAuthenticated) return;
    
    const result = await backendAPI.getVotingPower();
    
    if (result.error) {
      setError(result.error);
    } else {
      setVotingPower((result.data as any)?.voting_power || 1);
    }
  };

  // Fetch governance stats
  const fetchStats = async () => {
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.governance.getStats(),
      false // Public endpoint
    );
    
    if (result.error) {
      setError(result.error);
    } else {
      setStats(result.data);
    }
  };

  // Create a new proposal
  const createProposal = async (proposalData: {
    title: string;
    description: string;
    category: string;
    options?: string[];
    metadata?: any;
  }) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.createProposal(proposalData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh proposals
      await fetchProposals();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Vote on a proposal
  const vote = async (proposalId: string, option: string, reasoning?: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.voteOnProposal(proposalId, option, reasoning);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh user votes and proposals
      await Promise.all([fetchUserVotes(), fetchProposals()]);
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Get single proposal
  const getProposal = async (proposalId: string) => {
    setError(null);
    
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.governance.getProposal(proposalId),
      false // Public endpoint
    );
    
    if (result.error) {
      setError(result.error);
      return null;
    }
    
    return result.data;
  };

  // Check if user has voted on a proposal
  const hasVoted = (proposalId: string) => {
    return userVotes.some(vote => vote.proposal_id === proposalId);
  };

  // Get user's vote on a proposal
  const getUserVote = (proposalId: string) => {
    return userVotes.find(vote => vote.proposal_id === proposalId);
  };

  // Auto-fetch data when authenticated
  useEffect(() => {
    fetchProposals();
    fetchStats();
    
    if (backendAPI.isFullyAuthenticated) {
      fetchUserVotes();
      fetchVotingPower();
    }
  }, [backendAPI.isFullyAuthenticated]);

  return {
    // Data
    proposals,
    userVotes,
    votingPower,
    stats,
    loading,
    error,
    
    // Status helpers
    canCreateProposal: votingPower >= 3, // PRO tier required
    totalProposals: proposals.length,
    activeProposals: proposals.filter(p => p.is_active).length,
    userVoteCount: userVotes.length,
    
    // Actions
    createProposal,
    vote,
    getProposal,
    
    // Query helpers
    hasVoted,
    getUserVote,
    
    // Refresh methods
    refreshProposals: fetchProposals,
    refreshUserVotes: fetchUserVotes,
    refreshVotingPower: fetchVotingPower,
    refreshStats: fetchStats,
    
    // Clear error
    clearError: () => setError(null),
    
    // Authentication status
    isAuthenticated: backendAPI.isFullyAuthenticated,
  };
}

/**
 * Hook for a specific proposal
 */
export function useProposal(proposalId: string) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { vote, hasVoted, getUserVote } = useGovernance();

  const fetchProposal = async () => {
    if (!proposalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/governance/proposals/${proposalId}`);
      const data = await result.json();
      
      if (data.success) {
        setProposal(data.data);
      } else {
        setError(data.error || 'Failed to fetch proposal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch proposal');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  return {
    proposal,
    loading,
    error,
    hasVoted: hasVoted(proposalId),
    userVote: getUserVote(proposalId),
    vote: (option: string, reasoning?: string) => vote(proposalId, option, reasoning),
    refresh: fetchProposal,
  };
}
