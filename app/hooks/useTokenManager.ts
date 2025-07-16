'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TokenRefreshResult {
  success: boolean;
  error?: string;
}

export interface UseTokenManagerReturn {
  isAuthenticated: boolean;
  isRefreshing: boolean;
  refreshToken: () => Promise<TokenRefreshResult>;
  setupAutoRefresh: () => void;
  clearAutoRefresh: () => void;
}

const REFRESH_ENDPOINT = '/api/auth/refresh';
const REFRESH_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes
const REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

export function useTokenManager(): UseTokenManagerReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Assume authenticated initially
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // Function to refresh the access token
  const refreshToken = useCallback(async (): Promise<TokenRefreshResult> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing) {
      return { success: false, error: 'Refresh already in progress' };
    }

    // Rate limiting: don't refresh more than once per minute
    const now = Date.now();
    if (now - lastRefreshRef.current < 60 * 1000) {
      return { success: true }; // Skip refresh, too recent
    }

    setIsRefreshing(true);
    lastRefreshRef.current = now;

    try {
      const response = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setIsAuthenticated(false);
        console.error('Token refresh failed:', data.error);
        return { success: false, error: data.error || 'Token refresh failed' };
      }
    } catch (error) {
      setIsAuthenticated(false);
      const errorMessage = error instanceof Error ? error.message : 'Network error during token refresh';
      console.error('Token refresh error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Setup automatic token refresh
  const setupAutoRefresh = useCallback(() => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        if (typeof window !== 'undefined') {
          // Check if the page is visible before refreshing
          if (!document.hidden) {
            const result = await refreshToken();
            if (result.success) {
              scheduleRefresh(); // Schedule next refresh
            } else {
              // If refresh fails, redirect to login
              window.location.href = '/sign-in';
            }
          } else {
            // If page is hidden, try again later
            scheduleRefresh();
          }
        }
      }, REFRESH_INTERVAL);
    };

    scheduleRefresh();
  }, [refreshToken]);

  // Clear automatic refresh
  const clearAutoRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Handle token refresh when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof window !== 'undefined' && !document.hidden && isAuthenticated) {
        // Refresh token when page becomes visible (in case it expired while hidden)
        refreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshToken, isAuthenticated]);

  // Handle network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated) {
        refreshToken();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshToken, isAuthenticated]);

  // Setup auto-refresh on mount
  useEffect(() => {
    if (isAuthenticated) {
      setupAutoRefresh();
    } else {
      clearAutoRefresh();
    }

    return () => clearAutoRefresh();
  }, [isAuthenticated, setupAutoRefresh, clearAutoRefresh]);

  // Check for refresh requirement header on failed requests
  useEffect(() => {
    const handleFetchResponse = (response: Response) => {
      if (response.headers.get('X-Token-Refresh-Required') === 'true') {
        refreshToken();
      }
    };

    // Intercept fetch requests to check for refresh requirements
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      handleFetchResponse(response);
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [refreshToken]);

  return {
    isAuthenticated,
    isRefreshing,
    refreshToken,
    setupAutoRefresh,
    clearAutoRefresh,
  };
}