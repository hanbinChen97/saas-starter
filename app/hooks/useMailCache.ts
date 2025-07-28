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
  fullSyncOnLogin: () => Promise<void>;
  smartRefreshIfNeeded: () => Promise<void>;
}

// Email list comparison function for intelligent UI refresh
const compareEmailLists = (current: EmailMessage[], latest: EmailMessage[]): boolean => {
  // Different lengths means there are changes
  if (current.length !== latest.length) return true;
  
  // Check each email's ID and important status fields
  for (let i = 0; i < current.length; i++) {
    const curr = current[i];
    const lat = latest[i];
    
    // Different ID means new emails were inserted
    if (curr.id !== lat.id) return true;
    
    // Check for important status changes
    if (curr.isRead !== lat.isRead) return true;
    if (curr.isFlagged !== lat.isFlagged) return true;
  }
  
  return false; // No changes detected
};

export function useMailCache(options: UseMailCacheOptions = {}): UseMailCacheReturn {
  const {
    folder = 'INBOX',
    limit = 50, // Start with 50 emails for faster response
    autoSync = true,
    syncInterval = 2 * 60 * 1000, // 2 minutes
    isAuthenticated = false,
    progressiveLoading = false // 已弃用复杂的3步加载策略
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
  const [currentLimit, setCurrentLimit] = useState(() => {
    // 从localStorage恢复用户的显示偏好，默认50封
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`emailDisplayLimit_${folder}`);
      return saved ? parseInt(saved, 10) : 50;
    }
    return 50;
  });
  // 移除复杂的后台状态变量

  // 【已弃用】复杂的3步加载策略 - 已移除

  // 【已弃用】loadEmails函数 - 使用简化的初始化逻辑

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
      } else {
        console.log(`[Sync] No emails retrieved`);
        setEmails([]);
      }
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
      throw err; // Re-throw so loadEmails can catch it
    } finally {
      setSyncing(false);
    }
  }, [folder, currentLimit, isAuthenticated]);

  // Load more emails (user-requested) - load from IndexedDB cache
  const loadMoreEmails = useCallback(async () => {
    if (loading || syncing) {
      console.log(`[LoadMore] Skipped - loading:${loading}, syncing:${syncing}`);
      return;
    }

    try {
      setLoading(true);
      setLoadingProgress('从缓存加载更多邮件...');
      
      const newLimit = currentLimit + 50; // 每次加载50封更多邮件
      console.log(`[LoadMore] 从IndexedDB加载更多邮件: 当前emails.length=${emails.length}, currentLimit=${currentLimit} -> 新目标${newLimit}`);
      
      // Load more emails from IndexedDB cache
      const cachedEmails = await EmailCache.getCachedEmails(folder, newLimit);
      
      console.log(`[LoadMore] IndexedDB返回: ${cachedEmails.length} 封邮件`);
      
      const oldCount = emails.length;
      const actualNewEmails = Math.max(0, cachedEmails.length - oldCount);
      
      if (actualNewEmails > 0) {
        // Update state with more emails from cache
        setEmails(cachedEmails);
        setCurrentLimit(cachedEmails.length);
        
        // 保存用户的显示偏好到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`emailDisplayLimit_${folder}`, cachedEmails.length.toString());
        }
        
        console.log(`[LoadMore] 更新状态: 总数 ${cachedEmails.length} 封, 新增 ${actualNewEmails} 封`);
        setLoadingProgress(`成功加载 ${actualNewEmails} 封邮件`);
      } else {
        // No more emails available in cache
        setLoadingProgress('没有更多邮件');
        console.log(`[LoadMore] 缓存中没有更多邮件`);
      }
      
    } catch (err) {
      console.error('Error loading more emails from cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more emails');
      setLoadingProgress('加载失败');
    } finally {
      setLoading(false);
      // Clear loading progress after a short delay
      setTimeout(() => {
        if (!error) {
          setLoadingProgress('加载完成');
        }
      }, 2000);
    }
  }, [folder, currentLimit, emails.length, loading, syncing, error]);

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

  // These functions will be defined after fullSyncOnLogin

  // Full sync on login: replaces all cached emails with latest 500 from server
  const fullSyncOnLogin = useCallback(async () => {
    try {
      setBackgroundLoading(true);
      setLoadingProgress('登录时全量同步中...');
      console.log('[FullSync] Starting full sync on login');
      
      // Get latest 500 emails from server
      const serverEmails = await emailApi.syncEmails(folder, 500);
      console.log(`[FullSync] Retrieved ${serverEmails.length} emails from server`);
      
      // Replace all emails in cache (clears old ones, saves new 500)
      await EmailCache.replaceAllEmails(serverEmails, folder);
      console.log(`[FullSync] Replaced all cached emails for folder ${folder}`);
      
      // Update sync info with highest UID
      if (serverEmails.length > 0) {
        const highestUid = Math.max(...serverEmails.map(email => email.uid));
        await EmailCache.updateSyncInfo(folder, highestUid);
      }
      
      // Smart refresh: 从DB取出currentLimit的email和UI显示的email对比，如果有更新才刷新UI
      console.log(`[FullSync] 全量更新后检查是否需要刷新UI - currentLimit=${currentLimit}`);
      const dbEmails = await EmailCache.getCachedEmails(folder, currentLimit);
      console.log(`[FullSync] 从DB获取了${dbEmails.length}封邮件`);
      
      // 获取当前UI显示的邮件
      const currentUIEmails = emails.slice(0, currentLimit);
      
      // 对比DB邮件和UI邮件
      const hasChanges = compareEmailLists(currentUIEmails, dbEmails.slice(0, currentLimit));
      
      if (hasChanges) {
        console.log('[FullSync] 检测到邮件变化，刷新UI');
        setEmails(dbEmails);
        setLoadingProgress('已更新邮件列表');
      } else {
        console.log('[FullSync] 邮件无变化，保持UI不变');
        setLoadingProgress('邮件已是最新');
      }
      
    } catch (error) {
      console.error('[FullSync] Full sync failed:', error);
      setError(error instanceof Error ? error.message : 'Full sync failed');
    } finally {
      setBackgroundLoading(false);
    }
  }, [folder, currentLimit, emails]);

  // Smart refresh: 每次全量更新后，从DB取出currentLimit的email和UI显示的email对比，如果有更新才刷新UI
  const smartRefreshIfNeeded = useCallback(async () => {
    try {
      console.log(`[SmartRefresh] 全量更新后检查是否需要刷新UI - currentLimit=${currentLimit}`);
      
      // 从DB取出currentLimit数量的邮件
      const dbEmails = await EmailCache.getCachedEmails(folder, currentLimit);
      console.log(`[SmartRefresh] 从DB获取了${dbEmails.length}封邮件`);
      
      // 获取当前UI显示的邮件
      const currentUIEmails = emails.slice(0, currentLimit);
      
      // 对比DB邮件和UI邮件
      const hasChanges = compareEmailLists(currentUIEmails, dbEmails.slice(0, currentLimit));
      
      if (hasChanges) {
        console.log('[SmartRefresh] 检测到邮件变化，刷新UI');
        setEmails(dbEmails);
        setLoadingProgress('已更新邮件列表');
      } else {
        console.log('[SmartRefresh] 邮件无变化，保持UI不变');
        setLoadingProgress('邮件已是最新');
      }
      
    } catch (error) {
      console.error('[SmartRefresh] Smart refresh failed:', error);
    }
  }, [folder, emails, currentLimit]);

  // 重试连接
  const retryConnection = useCallback(async () => {
    console.log('[Connection] 重试连接');
    setConnectionError(false);
    setError(null);
    // 直接重新初始化，从DB加载 + 全量同步
    const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
    setEmails(cachedEmails);
    await fullSyncOnLogin();
  }, [folder, currentLimit, fullSyncOnLogin]);

  // Refresh emails (force reload from server)
  const refreshEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // 重新进行全量同步
      await fullSyncOnLogin();
    } catch (err) {
      console.error('Error refreshing emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh emails');
    } finally {
      setLoading(false);
    }
  }, [fullSyncOnLogin]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await EmailCache.clearOldCache(0); // Clear all cache
      setEmails([]);
      // After clearing cache, load from DB and do full sync
      const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
      setEmails(cachedEmails);
      await fullSyncOnLogin();
    } catch (err) {
      console.error('Error clearing cache:', err);
      throw err;
    }
  }, [folder, currentLimit, fullSyncOnLogin]);

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
        console.warn('[SmartSync] IMAP同步失败，跳过智能同步:', actionError);
        // 如果IMAP同步失败，静默跳过而不是抛出错误
        return;
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

  // Initialize: load from DB and trigger full sync on login
  useEffect(() => {
    const initialize = async () => {
      if (!isAuthenticated) {
        // Clear state when not authenticated
        setEmails([]);
        setFolders([]);
        setLoading(false);
        return;
      }

      console.log('[Initialize] 开始初始化');
      
      // 1. 立即从DB加载邮件显示给用户
      setLoading(true);
      const cachedEmails = await EmailCache.getCachedEmails(folder, currentLimit);
      if (cachedEmails.length > 0) {
        setEmails(cachedEmails);
        setInitialLoaded(true);
        console.log(`[Initialize] 从DB加载了${cachedEmails.length}封邮件`);
      }
      setLoading(false);
      
      // 2. 登录后马上进行一次全量更新
      console.log('[Initialize] 开始全量更新');
      await fullSyncOnLogin();
      
      // Load folders
      loadFolders();
    };

    initialize();

    // Setup auto-sync interval for periodic updates
    let syncIntervalId: NodeJS.Timeout | null = null;
    if (autoSync && syncInterval > 0 && isAuthenticated) {
      console.log(`[AutoSync] 设置定时同步，每${syncInterval / 1000}秒`);
      syncIntervalId = setInterval(() => {
        console.log(`[AutoSync] 执行定时同步`);
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
    smartSync,
    fullSyncOnLogin,
    smartRefreshIfNeeded
  };
}