'use client';

import { useState, useCallback } from 'react';
import { emailApi, EmailCredentials, AuthResult } from '@/app/lib/email-imap/api-client';

interface UseEmailAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  authenticate: (credentials: EmailCredentials) => Promise<AuthResult>;
  logout: () => void;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(emailApi.isAuthenticated());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  return {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    logout
  };
}