'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useSuiAuth } from '@/contexts/sui-auth-context';
import { api } from '@/lib/api-client';

/**
 * Backend Integration Hook
 * Connects your existing Sui wallet authentication with the backend
 * Supports both traditional wallets and zkLogin
 */
export function useBackendIntegration() {
  const currentAccount = useCurrentAccount();
  const { user } = useSuiAuth();
  const backendAuth = useBackendAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user address from either traditional wallet or zkLogin
  const userAddress = user?.address || currentAccount?.address;

  // Auto-login to backend when any wallet is connected (traditional or zkLogin)
  useEffect(() => {
    const initializeBackendAuth = async () => {
      if (!userAddress) {
        // If no wallet connected, logout from backend
        if (backendAuth.isAuthenticated) {
          backendAuth.logout();
        }
        setIsInitialized(true);
        return;
      }

      // If wallet is connected but backend is not authenticated
      if (userAddress && !backendAuth.isAuthenticated && !backendAuth.isLoading) {
        try {
          setError(null);
          console.log('🔄 Authenticating with backend...', userAddress);

          // Ensure we have a valid address format
          if (!userAddress || !userAddress.startsWith('0x')) {
            throw new Error('Invalid wallet address format');
          }

          const result = await backendAuth.login(userAddress);

          if (result.success) {
            console.log('✅ Backend authentication successful');
          } else {
            console.warn('❌ Backend authentication failed:', result.error);
            setError(result.error || 'Backend authentication failed');
          }
        } catch (err: any) {
          console.error('Backend authentication error:', err);
          setError(err.message || 'Authentication error');
        }
      }

      setIsInitialized(true);
    };

    initializeBackendAuth();
  }, [userAddress]); // Remove auth state from dependencies to prevent infinite loops

  // Sync logout: if wallet disconnects, logout from backend
  useEffect(() => {
    if (!userAddress && backendAuth.isAuthenticated) {
      console.log('🔄 Wallet disconnected, logging out from backend');
      backendAuth.logout();
    }
  }, [userAddress]); // Only depend on userAddress to prevent loops

  return {
    // Wallet state (traditional or zkLogin)
    wallet: {
      isConnected: !!userAddress,
      address: userAddress,
      type: user?.connectionType || (currentAccount ? 'wallet' : null),
    },

    // Backend auth state
    backend: {
      isAuthenticated: backendAuth.isAuthenticated,
      isLoading: backendAuth.isLoading,
      token: backendAuth.token,
      userAddress: backendAuth.userAddress,
    },

    // Combined state
    isFullyAuthenticated: !!userAddress && backendAuth.isAuthenticated,
    isInitialized,
    error,

    // Actions
    refreshBackendAuth: backendAuth.refreshToken,
    logoutFromBackend: backendAuth.logout,

    // Clear error
    clearError: () => setError(null),
  };
}

/**
 * Hook for components that need both Sui wallet and backend authentication
 */
export function useRequireFullAuth() {
  const integration = useBackendIntegration();
  
  useEffect(() => {
    if (integration.isInitialized && !integration.isFullyAuthenticated) {
      console.warn('Full authentication required but not available');
      // You could redirect to login page or show a modal here
    }
  }, [integration.isInitialized, integration.isFullyAuthenticated]);

  return integration;
}

/**
 * Hook for making authenticated API calls
 */
export function useBackendAPI() {
  const integration = useBackendIntegration();

  const makeAuthenticatedCall = async <T>(
    apiCall: () => Promise<T>,
    requireAuth = true
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      if (requireAuth && !integration.isFullyAuthenticated) {
        return {
          data: null,
          error: 'Authentication required'
        };
      }

      const data = await apiCall();
      return { data, error: null };
    } catch (error: any) {
      console.error('API call failed:', error);
      
      // Handle specific error cases
      if (error.message?.includes('401')) {
        // Token expired, try to refresh
        try {
          await integration.refreshBackendAuth();
          const data = await apiCall();
          return { data, error: null };
        } catch (refreshError) {
          return {
            data: null,
            error: 'Authentication expired. Please reconnect your wallet.'
          };
        }
      }
      
      return {
        data: null,
        error: error.message || 'API call failed'
      };
    }
  };

  return {
    ...integration,
    makeAuthenticatedCall,
    
    // Convenience methods for common API calls
    getPaionBalance: () => makeAuthenticatedCall(() => api.payments.paion.getBalance()),
    getTradingStats: () => makeAuthenticatedCall(() => api.trading.getStats()),
    getNFTTier: () => makeAuthenticatedCall(() => api.nft.getTier(), false), // Public endpoint
    getNotifications: () => makeAuthenticatedCall(() => api.notifications.get()),

    // Affiliate methods
    getAffiliatePricing: () => makeAuthenticatedCall(() => api.affiliate.getPricing(), false),
    getAffiliateSubscription: () => makeAuthenticatedCall(() => api.affiliate.getSubscription()),
    subscribeAffiliate: (duration: number, paymentData: any) =>
      makeAuthenticatedCall(() => api.affiliate.subscribe(duration, paymentData)),
    getAffiliateStats: () => makeAuthenticatedCall(() => api.affiliate.getStats()),

    // Governance methods
    getGovernanceProposals: (filters?: any) =>
      makeAuthenticatedCall(() => api.governance.getProposals(filters), false),
    createProposal: (proposalData: any) =>
      makeAuthenticatedCall(() => api.governance.createProposal(proposalData)),
    voteOnProposal: (proposalId: string, option: string, reasoning?: string) =>
      makeAuthenticatedCall(() => api.governance.vote(proposalId, option, reasoning)),
    getUserVotes: () => makeAuthenticatedCall(() => api.governance.getUserVotes()),
    getVotingPower: () => makeAuthenticatedCall(() => api.governance.getVotingPower()),

    // Social verification methods
    verifySocialTwitter: (username: string, targetAccount?: string) =>
      makeAuthenticatedCall(() => api.social.verifyTwitter(username, targetAccount)),
    verifySocialDiscord: (userId: string, serverId: string) =>
      makeAuthenticatedCall(() => api.social.verifyDiscord(userId, serverId)),
    verifySocialTelegram: (userId: string, channelId: string) =>
      makeAuthenticatedCall(() => api.social.verifyTelegram(userId, channelId)),
    getSocialVerifications: () => makeAuthenticatedCall(() => api.social.getVerifications()),
    bulkVerifySocial: (verifications: any[]) =>
      makeAuthenticatedCall(() => api.social.bulkVerify(verifications)),
  };
}
