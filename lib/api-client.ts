/**
 * API Client Configuration
 * Handles communication with Supabase Edge Functions
 */

// API Configuration - Use local backend URL for edge functions
const EDGE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:54321/functions/v1';

// Fallback to Next.js API routes if edge functions are not available
const API_BASE_URL = 'http://localhost:3000';

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string[];
}

// API Client class
export class ApiClient {
  private baseURL: string;
  private edgeFunctionsURL: string;
  private defaultHeaders: Record<string, string>;
  private useEdgeFunctions: boolean;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.edgeFunctionsURL = EDGE_FUNCTIONS_URL;
    this.useEdgeFunctions = process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS !== 'false';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const userAddress = typeof window !== 'undefined' ? localStorage.getItem('user_address') : null;

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userAddress) {
      headers['X-User-Address'] = userAddress;
    }

    // Add Supabase headers for edge functions
    if (this.useEdgeFunctions) {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (anonKey) {
        headers['apikey'] = anonKey;
      }
    }

    return headers;
  }

  /**
   * Get the appropriate base URL for the request
   */
  private getBaseURL(endpoint: string): string {
    if (this.useEdgeFunctions) {
      // Map API routes to edge function names
      const edgeFunctionName = this.mapEndpointToEdgeFunction(endpoint);
      return `${this.edgeFunctionsURL}/${edgeFunctionName}`;
    }
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Map API endpoint to edge function name
   */
  private mapEndpointToEdgeFunction(endpoint: string): string {
    // Remove /api prefix and convert to edge function name
    const cleanEndpoint = endpoint.replace(/^\/api\//, '');

    // Map specific endpoints to edge function names
    const mappings: Record<string, string> = {
      'auth/login': 'auth-login',
      'auth/verify': 'auth-verify',
      'auth/refresh': 'auth-refresh',
      'auth/me': 'auth-me',
      'trading/activities': 'trading-activities',
      'trading/stats': 'trading-stats',
      'trading/leaderboard': 'trading-leaderboard',
      'trading/analytics': 'trading-analytics',
      'trading/summary': 'trading-summary',
      'trading/performance': 'trading-performance',
      'blockchain/nft/tier': 'nft-tier',
      'blockchain/nft/list': 'nft-list',
      'blockchain/nft/pricing': 'nft-pricing',
      'blockchain/nft/mint': 'nft-mint',
      'payments/paion/balance': 'paion-balance',
      'payments/paion/transactions': 'paion-transactions',
      'payments/paion/transfer': 'paion-transfer',
      'payments/paion/stats': 'paion-stats',
      'affiliate/stats': 'affiliate-stats',
      'affiliate/subscription': 'affiliate-subscription',
      // 'affiliate/sponsor': 'affiliate-sponsor', // Use Next.js API route instead
      'notifications': 'notifications',
      'creators': 'creators',
      'profile': 'profile-search',
      'users/profile': 'users-profile',
      'social/stats': 'social-stats',
      'health': 'health'
    };

    return mappings[cleanEndpoint] || cleanEndpoint.replace(/\//g, '-');
  }

  /**
   * Make authenticated request to API (Edge Functions or Next.js API routes)
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getBaseURL(endpoint);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result.data || result;
    } catch (error) {
      console.error(`API request failed: ${endpoint} -> ${url}`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let fullEndpoint = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        fullEndpoint += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(fullEndpoint);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Public request (no authentication) to API
   */
  async publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.getBaseURL(endpoint);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        // Add Supabase anon key for edge functions but no auth token
        ...(this.useEdgeFunctions && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result.data || result;
    } catch (error) {
      console.error(`Public API request failed: ${endpoint} -> ${url}`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Convenience methods
export const api = {
  // Authentication
  auth: {
    login: (walletAddress: string) => 
      apiClient.publicRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ wallet_address: walletAddress })
      }),
    verify: () => apiClient.post('/api/auth/verify'),
    refresh: () => apiClient.post('/api/auth/refresh'),
    me: () => apiClient.get('/api/auth/me'),
  },

  // Trading
  trading: {
    getActivities: (params?: any) => apiClient.get('/api/trading/activities', params),
    recordActivity: (data: any) => apiClient.post('/api/trading/activities', data),
    getStats: (userAddress?: string) => apiClient.get('/api/trading/stats', userAddress ? { user_address: userAddress } : undefined),
    refreshStats: () => apiClient.post('/api/trading/stats/refresh'),
    getLeaderboard: (params?: any) => apiClient.get('/api/trading/leaderboard', params),
    getAnalytics: (params?: any) => apiClient.get('/api/trading/analytics', params),
    getSummary: () => apiClient.get('/api/trading/summary'),
    getPerformance: (params?: any) => apiClient.get('/api/trading/performance', params),
  },

  // NFT/Blockchain
  nft: {
    getTier: (address?: string) => apiClient.publicRequest(`/api/blockchain/nft/tier${address ? `/${address}` : ''}`),
    getNFTs: (address?: string) => apiClient.publicRequest(`/api/blockchain/nft/list${address ? `/${address}` : ''}`),
    hasTier: (tier: string, address?: string) => apiClient.publicRequest(`/api/blockchain/nft/has/${tier}${address ? `/${address}` : ''}`),
    createMintTransaction: (data: any) => apiClient.post('/api/blockchain/nft/mint/create-transaction', data),
    validateMinting: (data: any) => apiClient.post('/api/blockchain/nft/mint/validate', data),
    recordMint: (data: any) => apiClient.post('/api/blockchain/nft/mint/record', data),
    getPricing: () => apiClient.publicRequest('/api/blockchain/nft/pricing'),
    getStats: () => apiClient.publicRequest('/api/blockchain/nft/stats'),
    getHistory: (address?: string, params?: any) => apiClient.publicRequest(`/api/blockchain/nft/history${address ? `/${address}` : ''}`, params),
  },

  // Payments
  payments: {
    paion: {
      getBalance: () => apiClient.get('/api/payments/paion/balance'),
      getTransactions: (params?: any) => apiClient.get('/api/payments/paion/transactions', params),
      transfer: (data: any) => apiClient.post('/api/payments/paion/transfer', data),
      lock: (data: any) => apiClient.post('/api/payments/paion/lock', data),
      unlock: (data: any) => apiClient.post('/api/payments/paion/unlock', data),
      getStats: () => apiClient.publicRequest('/api/payments/paion/stats'),
      getEarningSources: () => apiClient.get('/api/payments/paion/earning-sources'),
    },
    sui: {
      getBalance: () => apiClient.get('/api/payments/sui/balance'),
    },
    getTransaction: (hash: string) => apiClient.publicRequest(`/api/payments/transaction/${hash}`),
    verifySubscription: (data: any) => apiClient.post('/api/payments/subscription/verify', data),
  },

  // Notifications
  notifications: {
    get: (params?: any) => apiClient.get('/api/notifications', params),
    create: (data: any) => apiClient.post('/api/notifications', data),
    update: (id: string, data: any) => apiClient.patch(`/api/notifications/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/notifications/${id}`),
    markAllRead: (data?: any) => apiClient.patch('/api/notifications/mark-all-read', data),
    getUnreadCount: () => apiClient.get('/api/notifications/unread-count'),
  },

  // Analytics
  analytics: {
    getCommunity: () => apiClient.publicRequest('/api/analytics/community'),
    getUser: (address?: string) => apiClient.publicRequest(`/api/analytics/user${address ? `/${address}` : ''}`),
    getLeaderboard: (params?: any) => apiClient.publicRequest('/api/analytics/leaderboard', params),
    getStats: () => apiClient.publicRequest('/api/analytics/stats'),
  },

  // Admin (requires admin access)
  admin: {
    getStats: () => apiClient.get('/api/admin/stats'),
    getPaionStats: () => apiClient.get('/api/admin/paion-stats'),
    getHealth: () => apiClient.get('/api/admin/health'),
    broadcast: (data: any) => apiClient.post('/api/admin/broadcast', data),
    getActivityLogs: (params?: any) => apiClient.get('/api/admin/activity-logs', params),
    addTokens: (data: any) => apiClient.post('/api/payments/paion/add', data),
    spendTokens: (data: any) => apiClient.post('/api/payments/paion/spend', data),
  },

  // Affiliate Subscriptions
  affiliate: {
    getPricing: () => apiClient.publicRequest('/api/affiliate/pricing'),
    getQuote: (duration: number) => apiClient.publicRequest('/api/affiliate/quote', {
      method: 'POST',
      body: JSON.stringify({ duration })
    }),
    subscribe: (duration: number, paymentData: any) => apiClient.post('/api/affiliate/subscribe', {
      duration,
      payment_data: paymentData
    }),
    getSubscription: () => apiClient.get('/api/affiliate/subscription'),
    verifyPayment: (transactionHash: string) => apiClient.post('/api/affiliate/verify-payment', {
      transaction_hash: transactionHash
    }),
    getStats: () => apiClient.get('/api/affiliate/stats'),
    cancel: (reason?: string) => apiClient.post('/api/affiliate/cancel', { reason }),
    getSponsor: () => apiClient.get('/api/affiliate/sponsor'),
    fixRelationship: () => apiClient.post('/api/affiliate/fix-relationship'),
  },

  // Governance
  governance: {
    createProposal: (proposalData: {
      title: string;
      description: string;
      category: string;
      options?: string[];
      metadata?: any;
    }) => apiClient.post('/api/governance/proposals', proposalData),
    getProposals: (filters?: {
      status?: string;
      category?: string;
      creator_address?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const queryParams = new URLSearchParams()
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.category) queryParams.append('category', filters.category)
      if (filters?.creator_address) queryParams.append('creator_address', filters.creator_address)
      if (filters?.limit) queryParams.append('limit', filters.limit.toString())
      if (filters?.offset) queryParams.append('offset', filters.offset.toString())
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

      const url = `/api/governance/proposals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      return apiClient.publicRequest(url)
    },
    getProposal: (id: string) => apiClient.publicRequest(`/api/governance/proposals/${id}`),
    vote: (proposalId: string, option: string, reasoning?: string) =>
      apiClient.post(`/api/governance/proposals/${proposalId}/vote`, { option, reasoning }),
    getUserVotes: (filters?: {
      proposal_id?: string;
      limit?: number;
      offset?: number;
    }) => apiClient.get('/api/governance/votes', filters),
    getStats: () => apiClient.publicRequest('/api/governance/stats'),
    getVotingPower: () => apiClient.get('/api/governance/voting-power'),
  },

  // Social Verification
  social: {
    verifyTwitter: (username: string, targetAccount?: string) =>
      apiClient.post('/api/social/verify/twitter', {
        username,
        target_account: targetAccount || 'AIONetworkAI'
      }),
    verifyDiscord: (userId: string, serverId: string) =>
      apiClient.post('/api/social/verify/discord', {
        user_id: userId,
        server_id: serverId
      }),
    verifyTelegram: (userId: string, channelId: string) =>
      apiClient.post('/api/social/verify/telegram', {
        user_id: userId,
        channel_id: channelId
      }),
    getVerifications: () => apiClient.get('/api/social/verifications'),
    bulkVerify: (verifications: Array<{
      platform: string;
      username?: string;
      user_id?: string;
      server_id?: string;
      channel_id?: string;
      target?: string;
    }>) => apiClient.post('/api/social/verify/bulk', { verifications }),
    getStats: () => apiClient.publicRequest('/api/social/stats'),
    removeVerification: (platform: string) =>
      apiClient.delete(`/api/social/verifications/${platform}`),
    getSupportedPlatforms: () => apiClient.publicRequest('/api/social/platforms'),
  },
};

export default apiClient;
