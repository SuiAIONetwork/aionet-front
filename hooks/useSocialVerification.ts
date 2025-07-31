'use client';

import { useState, useEffect } from 'react';
import { useBackendAPI } from './useBackendIntegration';
import { api } from '@/lib/api-client';

/**
 * Social Verification Hook
 * Provides easy access to social verification functionality
 */
export function useSocialVerification() {
  const backendAPI = useBackendAPI();
  const [verifications, setVerifications] = useState<any>(null);
  const [supportedPlatforms, setSupportedPlatforms] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's verifications
  const fetchVerifications = async () => {
    if (!backendAPI.isFullyAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.getSocialVerifications();
    
    if (result.error) {
      setError(result.error);
    } else {
      setVerifications(result.data);
    }
    
    setLoading(false);
  };

  // Fetch supported platforms
  const fetchSupportedPlatforms = async () => {
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.social.getSupportedPlatforms(),
      false // Public endpoint
    );
    
    if (result.error) {
      setError(result.error);
    } else {
      setSupportedPlatforms(result.data);
    }
  };

  // Fetch verification stats
  const fetchStats = async () => {
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.social.getStats(),
      false // Public endpoint
    );
    
    if (result.error) {
      setError(result.error);
    } else {
      setStats(result.data);
    }
  };

  // Verify Twitter follow
  const verifyTwitter = async (username: string, targetAccount?: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.verifySocialTwitter(username, targetAccount);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh verifications
      await fetchVerifications();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Verify Discord membership
  const verifyDiscord = async (userId: string, serverId: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.verifySocialDiscord(userId, serverId);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh verifications
      await fetchVerifications();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Verify Telegram membership
  const verifyTelegram = async (userId: string, channelId: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.verifySocialTelegram(userId, channelId);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh verifications
      await fetchVerifications();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Bulk verify multiple platforms
  const bulkVerify = async (verificationRequests: Array<{
    platform: string;
    username?: string;
    user_id?: string;
    server_id?: string;
    channel_id?: string;
    target?: string;
  }>) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.bulkVerifySocial(verificationRequests);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh verifications
      await fetchVerifications();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Remove verification for a platform
  const removeVerification = async (platform: string) => {
    if (!backendAPI.isFullyAuthenticated) {
      setError('Authentication required');
      return { success: false, error: 'Authentication required' };
    }
    
    setLoading(true);
    setError(null);
    
    const result = await backendAPI.makeAuthenticatedCall(
      () => api.social.removeVerification(platform)
    );
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    } else {
      // Refresh verifications
      await fetchVerifications();
      setLoading(false);
      return { success: true, data: result.data };
    }
  };

  // Check if platform is verified
  const isVerified = (platform: string) => {
    return verifications?.verifications?.[platform]?.length > 0 || false;
  };

  // Get verification for specific platform
  const getVerification = (platform: string) => {
    return verifications?.verifications?.[platform]?.[0] || null;
  };

  // Auto-fetch data when authenticated
  useEffect(() => {
    fetchSupportedPlatforms();
    fetchStats();
    
    if (backendAPI.isFullyAuthenticated) {
      fetchVerifications();
    }
  }, [backendAPI.isFullyAuthenticated]);

  return {
    // Data
    verifications,
    supportedPlatforms,
    stats,
    loading,
    error,
    
    // Status helpers
    totalVerifications: verifications?.total_verifications || 0,
    verifiedPlatforms: verifications?.platforms_verified || [],
    isTwitterVerified: isVerified('twitter'),
    isDiscordVerified: isVerified('discord'),
    isTelegramVerified: isVerified('telegram'),
    
    // Actions
    verifyTwitter,
    verifyDiscord,
    verifyTelegram,
    bulkVerify,
    removeVerification,
    
    // Query helpers
    isVerified,
    getVerification,
    
    // Refresh methods
    refreshVerifications: fetchVerifications,
    refreshSupportedPlatforms: fetchSupportedPlatforms,
    refreshStats: fetchStats,
    
    // Clear error
    clearError: () => setError(null),
    
    // Authentication status
    isAuthenticated: backendAPI.isFullyAuthenticated,
  };
}

/**
 * Hook for specific platform verification
 */
export function usePlatformVerification(platform: string) {
  const { 
    isVerified, 
    getVerification, 
    verifyTwitter, 
    verifyDiscord, 
    verifyTelegram,
    removeVerification,
    loading,
    error 
  } = useSocialVerification();

  const verify = async (data: any) => {
    switch (platform) {
      case 'twitter':
        return verifyTwitter(data.username, data.target_account);
      case 'discord':
        return verifyDiscord(data.user_id, data.server_id);
      case 'telegram':
        return verifyTelegram(data.user_id, data.channel_id);
      default:
        return { success: false, error: `Unsupported platform: ${platform}` };
    }
  };

  return {
    isVerified: isVerified(platform),
    verification: getVerification(platform),
    verify,
    remove: () => removeVerification(platform),
    loading,
    error,
  };
}
