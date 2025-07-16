'use client';

import { useState, useEffect, useCallback } from 'react';

export interface EmailCredentials {
  username: string;
  password: string;
  emailAddress: string;
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface StoredEmailCredentials {
  username: string;
  emailAddress: string;
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface EmailCredentialsStatus {
  hasCredentials: boolean;
  credentials: StoredEmailCredentials | null;
}

export interface UseEmailCredentialsReturn {
  credentialsStatus: EmailCredentialsStatus | null;
  isLoading: boolean;
  isStoring: boolean;
  error: string | null;
  storeCredentials: (credentials: EmailCredentials) => Promise<boolean>;
  removeCredentials: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

const EMAIL_CREDENTIALS_ENDPOINT = '/api/auth/email-credentials';

export function useEmailCredentials(): UseEmailCredentialsReturn {
  const [credentialsStatus, setCredentialsStatus] = useState<EmailCredentialsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoring, setIsStoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current credentials status
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(EMAIL_CREDENTIALS_ENDPOINT, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCredentialsStatus({
          hasCredentials: data.hasCredentials,
          credentials: data.credentials,
        });
      } else {
        setError(data.error || 'Failed to fetch credentials status');
        setCredentialsStatus({
          hasCredentials: false,
          credentials: null,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      setCredentialsStatus({
        hasCredentials: false,
        credentials: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Store new email credentials
  const storeCredentials = useCallback(async (credentials: EmailCredentials): Promise<boolean> => {
    try {
      setIsStoring(true);
      setError(null);

      const response = await fetch(EMAIL_CREDENTIALS_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh status after successful storage
        await refreshStatus();
        return true;
      } else {
        setError(data.error || 'Failed to store credentials');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [refreshStatus]);

  // Remove stored email credentials
  const removeCredentials = useCallback(async (): Promise<boolean> => {
    try {
      setIsStoring(true);
      setError(null);

      const response = await fetch(EMAIL_CREDENTIALS_ENDPOINT, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh status after successful removal
        await refreshStatus();
        return true;
      } else {
        setError(data.error || 'Failed to remove credentials');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [refreshStatus]);

  // Load credentials status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    credentialsStatus,
    isLoading,
    isStoring,
    error,
    storeCredentials,
    removeCredentials,
    refreshStatus,
  };
}