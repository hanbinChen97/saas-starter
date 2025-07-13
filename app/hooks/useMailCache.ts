'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailMessage, EmailFolder } from '@/app/lib/email-imap/types';
import { EmailCache, emailDB } from '@/app/lib/email-imap/database';
import { emailApi } from '@/app/lib/email-imap/api-client';

interface UseMailCacheOptions {
  folder?: string;
  limit?: number;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  isAuthenticated?: boolean;
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
  smartSync: () => Promise<void>;
}

export function useMailCache(options: UseMailCacheOptions = {}): UseMailCacheReturn {
  const {
    folder = 'INBOX',
    limit = 50,
    autoSync = true,
    syncInterval = 2 * 60 * 1000, // 2 minutes
    isAuthenticated = false
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
        console.log(`[Sync] Incremental sync from UID ${syncInfo.lastUid} for folder ${folder}`);
        console.log(`[Sync] Last sync time: ${syncInfo.lastSyncTime}`);
        try {
          newEmails = await emailApi.getEmailsNewerThan(folder, syncInfo.lastUid);
          console.log(`[Sync] Found ${newEmails.length} new emails`);
        } catch (actionError) {
          console.error('[Sync] API error, falling back to full sync:', actionError);
          newEmails = await emailApi.getEmails(folder, currentLimit);
          console.log(`[Sync] Fallback: Retrieved ${newEmails.length} emails`);
        }
        
        // If no new emails found, let's also try a different approach
        if (newEmails.length === 0) {
          console.log(`[Sync] No new emails with UID approach, trying recent emails check`);
          try {
            // Get a few recent emails to compare
            const recentEmails = await emailApi.getEmails(folder, 10);
            
            // Check if any of these emails are not in our cache
            const uncachedEmails = [];
            for (const email of recentEmails) {
              const exists = await EmailCache.emailExists(email.id);
              if (!exists) {
                uncachedEmails.push(email);
              }
            }
            
            if (uncachedEmails.length > 0) {
              console.log(`[Sync] Found ${uncachedEmails.length} uncached emails`);
              newEmails = uncachedEmails;
            }
          } catch (fallbackError) {
            console.error('[Sync] Fallback approach also failed:', fallbackError);
          }
        }
      } else {
        // Full sync: get all emails
        console.log(`[Sync] Full sync for folder ${folder}`);
        newEmails = await emailApi.getEmails(folder, currentLimit);
        console.log(`[Sync] Retrieved ${newEmails.length} emails`);
      }

      if (newEmails.length > 0) {
        // Cache new emails
        await EmailCache.cacheEmails(newEmails, folder);
        
        // Update sync info with highest UID
        const highestUid = Math.max(...newEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);
        console.log(`[Sync] Updated sync info with UID ${highestUid}`);

        // Reload emails from cache to get updated list (sorted by date)
        const updatedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        setEmails(updatedEmails);
        console.log(`[Sync] Updated email list with ${updatedEmails.length} total emails`);
        
        // Update hasMoreEmails flag based on whether we got the full limit
        setHasMoreEmails(updatedEmails.length >= currentLimit);
      } else {
        console.log(`[Sync] No new emails found after all checks`);
        // Even if no new emails, we might need to update hasMoreEmails
        const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        setHasMoreEmails(cachedEmails.length >= currentLimit);
      }
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
        const serverEmails = await emailApi.getEmails(folder, newLimit);
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
      const serverFolders = await emailApi.getFolders();
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
      const body = await emailApi.getEmailBody(folder, uid);
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
      await emailApi.markAsRead(folder, uid, isRead);
      
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
      await emailApi.markAsFlagged(folder, uid, isFlagged);
      
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
      await emailApi.deleteEmail(folder, uid);
      
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
    try {
      setLoading(true);
      setError(null);
      setCurrentLimit(limit);
      
      // Force a full reload from server (no cache, no incremental)
      const freshEmails = await emailApi.getEmails(folder, limit);
      
      if (freshEmails.length > 0) {
        // Clear old emails from cache for this folder first
        await emailDB.emails.where('folder').equals(folder).delete();
        
        // Cache the fresh emails
        await EmailCache.cacheEmails(freshEmails, folder);
        
        // Update sync info with the highest UID from fresh emails
        const highestUid = Math.max(...freshEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);
        
        // Update state with fresh emails
        setEmails(freshEmails);
        setHasMoreEmails(freshEmails.length === limit);
      } else {
        // If no emails returned, clear the local state
        setEmails([]);
        setHasMoreEmails(false);
      }
    } catch (err) {
      console.error('Error refreshing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh emails');
    } finally {
      setLoading(false);
    }
  }, [folder, limit]);

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

  // Smart sync: compares recent emails with cache
  const smartSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      
      console.log(`[SmartSync] Starting smart sync for folder ${folder}`);
      
      // Get the 20 most recent emails from server
      let recentServerEmails: EmailMessage[] = [];
      try {
        recentServerEmails = await emailApi.getEmails(folder, 20);
        console.log(`[SmartSync] Retrieved ${recentServerEmails.length} recent emails from server`);
      } catch (actionError) {
        console.error('[SmartSync] Server Action error:', actionError);
        throw actionError;
      }
      
      // Get cached emails
      const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
      
      // Find emails that are on server but not in cache
      const newEmails = recentServerEmails.filter(serverEmail => 
        !cachedEmails.some(cachedEmail => cachedEmail.id === serverEmail.id)
      );
      
      console.log(`[SmartSync] Found ${newEmails.length} new emails not in cache`);
      
      if (newEmails.length > 0) {
        // Cache the new emails
        await EmailCache.cacheEmails(newEmails, folder);
        
        // Update sync info with the highest UID from all server emails
        const highestUid = Math.max(...recentServerEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);
        
        // Reload emails from cache
        const updatedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        setEmails(updatedEmails);
        
        console.log(`[SmartSync] Updated cache with ${newEmails.length} new emails`);
        console.log(`[SmartSync] Total emails now: ${updatedEmails.length}`);
      } else {
        console.log(`[SmartSync] No new emails found`);
      }
      
    } catch (err) {
      console.error('Error in smart sync:', err);
      setError(err instanceof Error ? err.message : 'Failed to smart sync emails');
    } finally {
      setSyncing(false);
    }
  }, [folder, currentLimit]);

  // Initialize and setup auto-sync
  useEffect(() => {
    // Only load emails and folders if authenticated
    if (isAuthenticated) {
      loadEmails();
      loadFolders();
    } else {
      // Clear state when not authenticated
      setEmails([]);
      setFolders([]);
      setLoading(false);
    }

    // Setup auto-sync interval
    let syncIntervalId: NodeJS.Timeout | null = null;
    if (autoSync && syncInterval > 0 && isAuthenticated) {
      console.log(`[AutoSync] Setting up auto-sync every ${syncInterval / 1000} seconds`);
      syncIntervalId = setInterval(() => {
        console.log(`[AutoSync] Running scheduled sync for folder ${folder}`);
        syncEmails();
      }, syncInterval);
    }

    return () => {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
    };
  }, [folder, isAuthenticated]); // Re-run when folder or authentication changes

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
    getCacheStats,
    smartSync
  };
}