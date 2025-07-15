'use client';

import { useState, useCallback, useEffect } from 'react';
import { emailApi, EmailCredentials, AuthResult } from '@/app/lib/email-service/mail-imap/api-client';

interface UseEmailAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  authenticate: (credentials: EmailCredentials) => Promise<AuthResult>;
  logout: () => void;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const authenticate = useCallback(async (credentials: EmailCredentials): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await emailApi.authenticate(credentials);
      
      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(result.error || 'Authentication failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    emailApi.logout();
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  // Initialize authentication state on client side with proper hydration handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use a small delay to ensure complete hydration
      const initializeAuth = () => {
        try {
          const authState = emailApi.isAuthenticated();
          setIsAuthenticated(authState);
        } catch (error) {
          console.warn('Error checking authentication state:', error);
          setIsAuthenticated(false);
        } finally {
          setIsInitialized(true);
        }
      };

      // Initialize immediately if DOM is ready, otherwise wait for next tick
      if (document.readyState === 'complete') {
        initializeAuth();
      } else {
        setTimeout(initializeAuth, 0);
      }
    }
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    logout
  };
}