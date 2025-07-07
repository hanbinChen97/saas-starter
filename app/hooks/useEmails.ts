'use client';

import { useState, useEffect, useRef } from 'react';
import { EmailMessage, EmailFetchOptions, EmailFolder } from '@/app/lib/email/types';
import { getEmails, getEmailConnectionStatus, getEmailFolders } from '@/app/lib/email/actions';

interface UseEmailsReturn {
  emails: EmailMessage[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
  connectionStatus: {
    connected: boolean;
    serverInfo: { host: string; port: number; username: string };
  } | null;
  folders: EmailFolder[];
}

const EMAIL_CACHE_EXPIRATION_MINUTES = 5;
const FOLDER_CACHE_EXPIRATION_MINUTES = 60 * 24;
const CONNECTION_STATUS_CACHE_EXPIRATION_MINUTES = 1;
const POLLING_INTERVAL_MILLISECONDS = 5 * 60 * 1000;

export function useEmails(options: EmailFetchOptions = {}): UseEmailsReturn {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    serverInfo: { host: string; port: number; username: string };
  } | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>([]);

  const fetchEmails = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await getEmails(options);
      if (result.success) {
        setEmails(result.data.emails);
        setTotal(result.data.total);
      } else {
        setError(result.error || 'Failed to fetch emails');
        setEmails([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setEmails([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      const result = await getEmailConnectionStatus();
      if (result.success) {
        setConnectionStatus(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch connection status:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const result = await getEmailFolders();
      if (result.success && result.data.folders) {
        setFolders(result.data.folders);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchEmails();
      fetchConnectionStatus();
      fetchFolders();
    }

    // Set up polling for new emails (optional - can be disabled for performance)
    const intervalId = setInterval(() => {
      fetchEmails();
      fetchConnectionStatus();
    }, POLLING_INTERVAL_MILLISECONDS);

    return () => clearInterval(intervalId);
  }, [options.folder, options.limit, options.offset, options.unreadOnly]);

  const refetch = async () => {
    await fetchEmails();
    await fetchConnectionStatus();
    await fetchFolders();
  };

  return {
    emails,
    loading,
    error,
    total,
    refetch,
    connectionStatus,
    folders,
  };
}