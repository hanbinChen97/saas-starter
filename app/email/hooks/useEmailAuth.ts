'use client';

import { useState, useCallback, useEffect } from 'react';
import { emailApi, EmailCredentials, AuthResult } from '@/app/email/lib/email-service/mail-imap/api-client';

interface UseEmailAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isValidating: boolean;
  authError: string | null;
  credentials: Omit<EmailCredentials, 'password'> | null;
  authenticate: (credentials: EmailCredentials) => Promise<AuthResult>;
  setPassword: (password: string) => void;
  logout: () => void;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [credentials, setCredentials] = useState<Omit<EmailCredentials, 'password'> | null>(null);

  const authenticate = useCallback(async (emailCredentials: EmailCredentials): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      console.log('[Auth] Authenticating user:', emailCredentials.username);
      const result = await emailApi.authenticate(emailCredentials);
      
      if (result.success) {
        setIsAuthenticated(true);
        setCredentials(emailApi.getStoredCredentials());
        console.log('[Auth] Authentication successful');
      } else {
        setAuthError(result.error || 'Authentication failed');
        console.log('[Auth] Authentication failed:', result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      console.error('[Auth] Authentication error:', error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out user');
    emailApi.logout();
    setIsAuthenticated(false);
    setCredentials(null);
    setAuthError(null);
    setIsValidating(false);
  }, []);

  // Initialize authentication state on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[Auth] Initializing authentication state...');
      
      // Check if we have stored credentials (without password)
      const storedCredentials = emailApi.getStoredCredentials();
      const hasValidSession = emailApi.isAuthenticated(); // This now checks for password too
      
      if (hasValidSession && storedCredentials) {
        console.log('[Auth] 找到完整的会话（包含内存中的密码）:', storedCredentials.username);
        setIsAuthenticated(true);
        setCredentials(storedCredentials);
      } else {
        console.log('[Auth] 未找到完整的会话或密码不在内存中');
        console.log('[Auth] hasValidSession:', hasValidSession, 'storedCredentials:', !!storedCredentials);
        setIsAuthenticated(false);
      }
      
      setIsInitialized(true);
    }
  }, []);

  const setPassword = useCallback((password: string) => {
    emailApi.setPassword(password);
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    isValidating,
    authError,
    credentials,
    authenticate,
    setPassword,
    logout
  };
}