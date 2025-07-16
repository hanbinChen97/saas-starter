'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useTokenManager() {
  const router = useRouter();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Failed to refresh token:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const scheduleTokenRefresh = () => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh 2 minutes before access token expires (13 minutes)
    refreshTimeoutRef.current = setTimeout(async () => {
      const success = await refreshToken();
      if (success) {
        // Schedule next refresh
        scheduleTokenRefresh();
      } else {
        // Refresh failed, redirect to sign-in
        router.push('/sign-in');
      }
    }, 13 * 60 * 1000); // 13 minutes in milliseconds
  };

  const handleApiResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401) {
      // Token might be expired, try to refresh
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        // Refresh failed, redirect to sign-in
        router.push('/sign-in');
        throw new Error('Authentication failed');
      }
      // If refresh succeeded, the caller should retry the original request
    }
    return response;
  };

  useEffect(() => {
    // Start token refresh scheduling
    scheduleTokenRefresh();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    refreshToken,
    handleApiResponse,
  };
}