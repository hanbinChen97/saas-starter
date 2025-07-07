'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailMessage, EmailFolder } from '@/app/lib/email/types';
import { EmailCache } from '@/app/lib/email/database';
import { 
  getFoldersAction,
  getEmailsAction,
  getEmailsNewerThanAction,
  getEmailBodyAction,
  markAsReadAction,
  markAsFlaggedAction,
  deleteEmailAction
} from '@/app/lib/email/server-actions';

interface UseMailCacheOptions {
  folder?: string;
  limit?: number;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

interface UseMailCacheReturn {
  emails: EmailMessage[];
  folders: EmailFolder[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  refreshEmails: () => Promise<void>;
  syncEmails: () => Promise<void>;
  loadMoreEmails: () => Promise<void>;
  getEmailBody: (emailId: string, uid: number) => Promise<{ text?: string; html?: string } | null>;
  markAsRead: (emailId: string, uid: number, isRead: boolean) => Promise<void>;
  markAsFlagged: (emailId: string, uid: number, isFlagged: boolean) => Promise<void>;
  deleteEmail: (emailId: string, uid: number) => Promise<void>;
  
  // Cache utilities
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<{
    totalEmails: number;
    totalBodies: number;
    totalFolders: number;
    oldestEmail?: string;
    newestEmail?: string;
  }>;
}

export function useMailCache(options: UseMailCacheOptions = {}): UseMailCacheReturn {
  const {
    folder = 'INBOX',
    limit = 50,
    autoSync = true,
    syncInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(limit);

  // Load emails from cache first, then sync with server
  const loadEmails = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      if (useCache) {
        // Load from cache first for instant display
        const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        if (cachedEmails.length > 0) {
          setEmails(cachedEmails);
          setLoading(false);
        }
      }

      // Then sync with server in background
      if (autoSync) {
        await syncEmails();
      }
    } catch (err) {
      console.error('Error loading emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [folder, currentLimit, autoSync]);

  // Sync emails with server
  const syncEmails = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);

      // Get sync info for incremental sync
      const syncInfo = await EmailCache.getSyncInfo(folder);
      let newEmails: EmailMessage[] = [];

      if (syncInfo) {
        // Incremental sync: only get emails newer than last sync
        newEmails = await getEmailsNewerThanAction(folder, syncInfo.lastUid);
      } else {
        // Full sync: get all emails
        newEmails = await getEmailsAction(folder, currentLimit);
      }

      if (newEmails.length > 0) {
        // Cache new emails
        await EmailCache.cacheEmails(newEmails, folder);
        
        // Update sync info with highest UID
        const highestUid = Math.max(...newEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);

        // Reload emails from cache to get updated list
        const updatedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        setEmails(updatedEmails);
      }

      // Update hasMoreEmails flag
      setHasMoreEmails(newEmails.length === currentLimit);
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  }, [folder, currentLimit]);

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!hasMoreEmails || loading || syncing) return;

    try {
      setLoading(true);
      const newLimit = currentLimit + limit;
      setCurrentLimit(newLimit);

      // Try to load from cache first
      const cachedEmails = await EmailCache.getCachedEmails(folder, newLimit);
      setEmails(cachedEmails);

      // If we don't have enough cached emails, fetch from server
      if (cachedEmails.length < newLimit) {
        const serverEmails = await getEmailsAction(folder, newLimit);
        await EmailCache.cacheEmails(serverEmails, folder);
        
        const updatedEmails = await EmailCache.getCachedEmails(folder, newLimit);
        setEmails(updatedEmails);
        setHasMoreEmails(serverEmails.length === newLimit);
      }
    } catch (err) {
      console.error('Error loading more emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more emails');
    } finally {
      setLoading(false);
    }
  }, [folder, currentLimit, limit, hasMoreEmails, loading, syncing]);

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      // Load from cache first
      const cachedFolders = await EmailCache.getCachedFolders();
      if (cachedFolders.length > 0) {
        setFolders(cachedFolders);
      }

      // Sync with server
      const serverFolders = await getFoldersAction();
      await EmailCache.cacheFolders(serverFolders);
      setFolders(serverFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    }
  }, []);

  // Get email body (with caching)
  const getEmailBody = useCallback(async (emailId: string, uid: number) => {
    try {
      // Check cache first
      const cachedBody = await EmailCache.getCachedEmailBody(emailId);
      if (cachedBody) {
        return { text: cachedBody.text, html: cachedBody.html };
      }

      // Fetch from server and cache
      const body = await getEmailBodyAction(folder, uid);
      await EmailCache.cacheEmailBody(emailId, uid, body.text, body.html);
      
      return body;
    } catch (err) {
      console.error('Error getting email body:', err);
      throw err;
    }
  }, [folder]);

  // Mark email as read/unread
  const markAsRead = useCallback(async (emailId: string, uid: number, isRead: boolean) => {
    try {
      // Update on server
      await markAsReadAction(folder, uid, isRead);
      
      // Update cache
      await EmailCache.updateEmailFlags(emailId, { isRead });
      
      // Update local state
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead } : email
      ));
    } catch (err) {
      console.error('Error marking email as read:', err);
      throw err;
    }
  }, [folder]);

  // Mark email as flagged/unflagged
  const markAsFlagged = useCallback(async (emailId: string, uid: number, isFlagged: boolean) => {
    try {
      // Update on server
      await markAsFlaggedAction(folder, uid, isFlagged);
      
      // Update cache
      await EmailCache.updateEmailFlags(emailId, { isFlagged });
      
      // Update local state
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isFlagged } : email
      ));
    } catch (err) {
      console.error('Error marking email as flagged:', err);
      throw err;
    }
  }, [folder]);

  // Delete email
  const deleteEmail = useCallback(async (emailId: string, uid: number) => {
    try {
      // Delete on server
      await deleteEmailAction(folder, uid);
      
      // Delete from cache
      await EmailCache.deleteEmail(emailId);
      
      // Update local state
      setEmails(prev => prev.filter(email => email.id !== emailId));
    } catch (err) {
      console.error('Error deleting email:', err);
      throw err;
    }
  }, [folder]);

  // Refresh emails (force reload from server)
  const refreshEmails = useCallback(async () => {
    setCurrentLimit(limit);
    await loadEmails(false);
  }, [loadEmails, limit]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await EmailCache.clearOldCache(0); // Clear all cache
      setEmails([]);
      await loadEmails(false);
    } catch (err) {
      console.error('Error clearing cache:', err);
      throw err;
    }
  }, [loadEmails]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    return await EmailCache.getCacheStats();
  }, []);

  // Initialize and setup auto-sync
  useEffect(() => {
    loadEmails();
    loadFolders();

    // Setup auto-sync interval
    let syncIntervalId: NodeJS.Timeout | null = null;
    if (autoSync && syncInterval > 0) {
      syncIntervalId = setInterval(syncEmails, syncInterval);
    }

    return () => {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
    };
  }, [folder]); // Re-run when folder changes

  // Cleanup old cache periodically
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await EmailCache.clearOldCache(7); // Clear cache older than 7 days
      } catch (err) {
        console.error('Error cleaning up cache:', err);
      }
    }, 24 * 60 * 60 * 1000); // Once per day

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    emails,
    folders,
    loading,
    syncing,
    error,
    hasMore: hasMoreEmails,
    refreshEmails,
    syncEmails,
    loadMoreEmails,
    getEmailBody,
    markAsRead,
    markAsFlagged,
    deleteEmail,
    clearCache,
    getCacheStats
  };
}