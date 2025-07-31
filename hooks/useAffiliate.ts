'use client';

import { useState, useEffect } from 'react';
import { useBackendAPI } from './useBackendIntegration';
import { api } from '@/lib/api-client';

/**
 * Affiliate Subscription Hook
 * Provides easy access to affiliate subscription functionality
 */
export function useAffiliate() {
  const backendAPI = useBackendAPI();
  const [subscription, setSubscription] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status
  const fetchSubscription = async () => {
    if (!backendAPI.isFullyAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getAffiliateSubscription();
    
    if (result.error) {
      setError(result.error);
    } else {
      setSubscription(result.data);
    }
    
    setLoading(false);
  };

  // Fetch pricing
  const fetchPricing = async () => {
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getAffiliatePricing();
    
    if (result.error) {
      setError(result.error);
    } else {
      setPricing(result.data);
    }
    
    setLoading(false);
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!backendAPI.isFullyAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getAffiliateStats();
    
    if (result.error) {
      setError(result.error);
    } else {
      setStats(result.data);
    }
    
    setLoading(false);
  };

  // Subscribe to affiliate program
  const subscribe = async (duration: number, paymentData: any) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.subscribeAffiliate(duration, paymentData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh subscription data
      await fetchSubscription();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Get price quote
  const getQuote = async (duration: number) => {
    setError(null);
    
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.affiliate.getQuote(duration),
      false // Public endpoint
    );
    
    if (result.error) {
      setError(result.error);
      return null;
    }
    
    return result.data;
  };

  // Cancel subscription
  const cancelSubscription = async (reason?: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.affiliate.cancel(reason)
    );
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh subscription data
      await fetchSubscription();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Auto-fetch data when authenticated
  useEffect(() => {
    if (backendAPI.isFullyAuthenticated) {
      fetchSubscription();
      fetchStats();
    }
    fetchPricing(); // Public endpoint
  }, [backendAPI.isFullyAuthenticated]);

  return {
    // Data
    subscription,
    pricing,
    stats,
    loading,
    error,
    
    // Status helpers
    isSubscribed: subscription?.is_active || false,
    daysRemaining: subscription?.days_remaining || 0,
    subscriptionTier: subscription?.plan_duration || null,
    
    // Actions
    subscribe,
    cancelSubscription,
    getQuote,
    
    // Refresh methods
    refreshSubscription: fetchSubscription,
    refreshPricing: fetchPricing,
    refreshStats: fetchStats,
    
    // Clear error
    clearError: () => setError(null),
    
    // Authentication status
    isAuthenticated: backendAPI.isFullyAuthenticated,
  };
}

/**
 * Hook for components that need affiliate subscription status
 */
export function useAffiliateStatus() {
  const { subscription, isSubscribed, daysRemaining, loading } = useAffiliate();
  
  return {
    subscription,
    isSubscribed,
    daysRemaining,
    loading,
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
    isExpired: !isSubscribed && subscription !== null,
  };
}
