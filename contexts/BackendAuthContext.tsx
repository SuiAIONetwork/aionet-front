'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api-client';

interface BackendAuthContextType {
  token: string | null;
  userAddress: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const BackendAuthContext = createContext<BackendAuthContextType | undefined>(undefined);

interface BackendAuthProviderProps {
  children: ReactNode;
}

export function BackendAuthProvider({ children }: BackendAuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!userAddress;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedAddress = localStorage.getItem('user_address');

        if (storedToken && storedAddress) {
          // Verify token with backend
          try {
            await api.auth.verify();
            setToken(storedToken);
            setUserAddress(storedAddress);
          } catch (error) {
            console.warn('Token verification failed, clearing auth:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_address');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (walletAddress: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🔄 Backend login attempt for:', walletAddress);

      const response = await api.auth.login(walletAddress);
      console.log('🔄 Backend login response:', response);

      if (response && (response as any)?.token) {
        // Handle direct token response
        setToken((response as any).token);
        setUserAddress(walletAddress);

        // Store in localStorage
        localStorage.setItem('auth_token', (response as any).token);
        localStorage.setItem('user_address', walletAddress);

        console.log('✅ Backend login successful');
        return { success: true };
      } else if (response && (response as any)?.success && (response as any)?.data) {
        // Handle wrapped response
        const { token: newToken, user } = (response as any).data;

        setToken(newToken);
        setUserAddress(user?.address || walletAddress);

        // Store in localStorage
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user_address', user?.address || walletAddress);

        console.log('✅ Backend login successful');
        return { success: true };
      } else {
        const errorMsg = (response as any)?.error || (response as any)?.message || 'Login failed';
        console.error('❌ Backend login failed:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('❌ Backend login error:', error);

      // Handle different error types
      let errorMessage = 'Login failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUserAddress(null);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_address');
    
    // Optional: Call backend logout endpoint
    try {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': userAddress || '',
        },
      }).catch(() => {
        // Ignore errors for logout endpoint
      });
    } catch (error) {
      // Ignore errors
    }
  };

  const refreshToken = async () => {
    try {
      if (!token || !userAddress) return;

      const response = await api.auth.refresh();
      
      if ((response as any)?.success) {
        const { token: newToken } = (response as any).data;
        
        setToken(newToken);
        localStorage.setItem('auth_token', newToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Clear invalid auth state
    }
  };

  // Auto-refresh token before expiry (optional)
  useEffect(() => {
    if (!token) return;

    // Refresh token every 6 days (tokens expire in 7 days)
    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 6 * 24 * 60 * 60 * 1000); // 6 days

    return () => clearInterval(refreshInterval);
  }, [token]);

  const value: BackendAuthContextType = {
    token,
    userAddress,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  );
}

export function useBackendAuth() {
  const context = useContext(BackendAuthContext);
  if (context === undefined) {
    throw new Error('useBackendAuth must be used within a BackendAuthProvider');
  }
  return context;
}

// Hook for components that need authentication
export function useRequireAuth() {
  const auth = useBackendAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login or show login modal
      console.warn('Authentication required');
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}

export default BackendAuthContext;
