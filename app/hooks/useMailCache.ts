'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailMessage, EmailFolder } from '@/app/lib/email-service/mail-imap/types';
import { EmailCache, emailDB } from '@/app/lib/email-service/mail-imap/database';
import { emailApi } from '@/app/lib/email-service/mail-imap/api-client';

interface UseMailCacheOptions {
  folder?: string;
  limit?: number;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  isAuthenticated?: boolean;
  progressiveLoading?: boolean; // 是否启用渐进式加载
}

interface UseMailCacheReturn {
  emails: EmailMessage[];
  folders: EmailFolder[];
  loading: boolean;
  syncing: boolean;
  backgroundLoading: boolean; // 后台加载状态
  initialLoaded: boolean; // 首批邮件是否已加载
  loadingProgress: string; // 加载进度描述
  connectionError: boolean; // 连接错误状态
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
  retryConnection: () => Promise<void>; // 重试连接
  
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
    limit = 200,
    autoSync = true,
    syncInterval = 2 * 60 * 1000, // 2 minutes
    isAuthenticated = false,
    progressiveLoading = true // 默认启用渐进式加载
  } = options;

  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('初始化中...');
  const [connectionError, setConnectionError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(limit);

  // 渐进式加载邮件：先加载20封快速显示，后台继续加载到目标数量
  const progressiveLoadEmails = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      setEmails([]);
      return;
    }

    try {
      setError(null);
      setConnectionError(false);
      setLoading(true);
      setLoadingProgress('检查缓存中...');

      // Step 1: 检查缓存，如果有足够邮件就快速显示
      const cachedEmails = await EmailCache.getCachedEmails(folder, limit);
      if (cachedEmails.length >= 20) {
        setEmails(cachedEmails);
        setInitialLoaded(true);
        setLoading(false);
        setLoadingProgress('显示缓存邮件');
        console.log(`[Progressive] 显示 ${cachedEmails.length} 封缓存邮件`);
        
        // 后台智能同步检查更新
        setTimeout(async () => {
          try {
            await smartSync();
          } catch (err) {
            console.error('[Progressive] 后台同步失败:', err);
          }
        }, 1000);
        return;
      }

      // Step 2: 快速加载前20封邮件
      setLoadingProgress('快速加载前20封邮件...');
      console.log('[Progressive] 快速加载前20封邮件');
      
      const initialEmails = await emailApi.syncEmails(folder, 20);
      if (initialEmails.length > 0) {
        setEmails(initialEmails);
        setInitialLoaded(true);
        setLoading(false);
        await EmailCache.cacheEmails(initialEmails, folder);
        console.log(`[Progressive] 快速显示 ${initialEmails.length} 封邮件`);
      }

      // Step 3: 后台继续加载到目标数量
      if (limit > 20) {
        setBackgroundLoading(true);
        setLoadingProgress(`后台加载更多邮件 (目标 ${limit} 封)...`);
        console.log(`[Progressive] 后台加载至 ${limit} 封邮件`);
        
        setTimeout(async () => {
          try {
            const fullEmails = await emailApi.syncEmails(folder, limit);
            if (fullEmails.length > initialEmails.length) {
              setEmails(fullEmails);
              await EmailCache.cacheEmails(fullEmails, folder);
              setHasMoreEmails(fullEmails.length >= limit);
              console.log(`[Progressive] 后台加载完成：${fullEmails.length} 封邮件`);
            }
          } catch (err) {
            console.error('[Progressive] 后台加载失败:', err);
            // 后台加载失败不影响已显示的邮件
          } finally {
            setBackgroundLoading(false);
            setLoadingProgress('加载完成');
          }
        }, 500); // 500ms后开始后台加载
      }

    } catch (err) {
      console.error('[Progressive] 加载失败:', err);
      setError(err instanceof Error ? err.message : '邮件加载失败');
      setLoading(false);
      setBackgroundLoading(false);
      
      // 检查是否为连接错误
      if (err instanceof Error && (
        err.message.includes('connection') || 
        err.message.includes('timeout') || 
        err.message.includes('IMAP') ||
        err.message.includes('session expired') ||
        err.message.includes('Authentication') ||
        err.message.includes('login')
      )) {
        setConnectionError(true);
        setLoadingProgress('连接已断开，请重新登录');
      }
    }
  }, [folder, limit, isAuthenticated]);

  // 重试连接
  const retryConnection = useCallback(async () => {
    console.log('[Connection] 重试连接');
    setConnectionError(false);
    setError(null);
    await progressiveLoadEmails();
  }, [progressiveLoadEmails]);

  // 修改原有的loadEmails函数
  const loadEmails = useCallback(async (useCache = true) => {
    if (progressiveLoading) {
      return progressiveLoadEmails();
    }
    
    // 原有的加载逻辑保持不变（作为备选方案）
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      setEmails([]);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      let hasCache = false;
      
      if (useCache) {
        const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
        if (cachedEmails.length > 0) {
          setEmails(cachedEmails);
          hasCache = true;
          console.log(`[LoadEmails] Loaded ${cachedEmails.length} emails from cache`);
        }
      }

      if (isAuthenticated) {
        console.log(`[LoadEmails] Starting server sync (hasCache: ${hasCache})`);
        await syncEmails();
        console.log(`[LoadEmails] Server sync completed`);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setLoading(false);
    }
  }, [folder, currentLimit, autoSync, isAuthenticated, progressiveLoading, progressiveLoadEmails]);

  // Sync emails with server (simplified one-time sync)
  const syncEmails = useCallback(async () => {
    // Don't sync if not authenticated
    if (!isAuthenticated) {
      console.log('[Sync] Skipping sync - user not authenticated');
      return;
    }

    try {
      setSyncing(true);
      setError(null);

      console.log(`[Sync] One-time sync for folder ${folder}, limit ${currentLimit}`);
      
      // Use the simplified sync API (connect, fetch, disconnect)
      const newEmails = await emailApi.syncEmails(folder, currentLimit);
      console.log(`[Sync] Retrieved ${newEmails.length} emails`);

      if (newEmails.length > 0) {
        // Cache the emails
        await EmailCache.cacheEmails(newEmails, folder);
        
        // Update sync info with highest UID for future reference
        const highestUid = Math.max(...newEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);
        console.log(`[Sync] Updated sync info with UID ${highestUid}`);

        // Update local state with the synced emails
        setEmails(newEmails);
        console.log(`[Sync] Updated email list with ${newEmails.length} emails`);
        
        // Update hasMoreEmails flag
        setHasMoreEmails(newEmails.length >= currentLimit);
      } else {
        console.log(`[Sync] No emails retrieved`);
        setEmails([]);
        setHasMoreEmails(false);
      }
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
      throw err; // Re-throw so loadEmails can catch it
    } finally {
      setSyncing(false);
    }
  }, [folder, currentLimit, isAuthenticated]);

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!hasMoreEmails || loading || syncing || !isAuthenticated) return;

    try {
      setLoading(true);
      const newLimit = currentLimit + 50; // 每次加载更多50封
      setCurrentLimit(newLimit);

      // Try to load from cache first
      const cachedEmails = await EmailCache.getCachedEmails(folder, newLimit);
      setEmails(cachedEmails);

      // If we don't have enough cached emails, sync from server
      if (cachedEmails.length < newLimit) {
        const serverEmails = await emailApi.syncEmails(folder, newLimit);
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
  }, [folder, currentLimit, hasMoreEmails, loading, syncing, isAuthenticated]);

  // Load folders (simplified - only support INBOX for now)
  const loadFolders = useCallback(async () => {
    // In simplified mode, we only support INBOX
    const defaultFolders = [
      { name: 'INBOX', path: 'INBOX', delimiter: '/', attributes: [], flags: [] }
    ];
    setFolders(defaultFolders);
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
      setCurrentLimit(20); // 重置为20封邮件
      
      // Force a full reload from server (no cache, no incremental)
      const freshEmails = await emailApi.syncEmails(folder, 20);
      
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
        setHasMoreEmails(freshEmails.length === 20);
        setInitialLoaded(true);
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
  }, [folder]);

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
        recentServerEmails = await emailApi.syncEmails(folder, 20);
        console.log(`[SmartSync] Retrieved ${recentServerEmails.length} recent emails from server`);
      } catch (actionError) {
        console.error('[SmartSync] Server sync error:', actionError);
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
      loadEmails(); // This now handles both cache loading and server sync
      loadFolders();
    } else {
      // Clear state when not authenticated
      setEmails([]);
      setFolders([]);
      setLoading(false);
    }

    // Setup auto-sync interval for periodic updates (not initial load)
    let syncIntervalId: NodeJS.Timeout | null = null;
    if (autoSync && syncInterval > 0 && isAuthenticated) {
      console.log(`[AutoSync] Setting up auto-sync every ${syncInterval / 1000} seconds`);
      syncIntervalId = setInterval(() => {
        console.log(`[AutoSync] Running scheduled sync for folder ${folder}`);
        // Use smartSync for periodic updates to avoid replacing cache unnecessarily
        smartSync();
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
    backgroundLoading,
    initialLoaded,
    loadingProgress,
    connectionError,
    error,
    hasMore: hasMoreEmails,
    refreshEmails,
    syncEmails,
    loadMoreEmails,
    getEmailBody,
    markAsRead,
    markAsFlagged,
    deleteEmail,
    retryConnection,
    clearCache,
    getCacheStats,
    smartSync
  };
}