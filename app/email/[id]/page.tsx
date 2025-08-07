'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMailCache } from '@/app/email/hooks/useMailCache';
import { useEmailAuth } from '@/app/email/hooks/useEmailAuth';
import { EmailList } from '@/app/email/components/email/EmailList';
import { EmailView } from '@/app/email/components/email/EmailView';
import { EmailMessage } from '@/app/email/lib/email-service/mail-imap/types';
import { Button } from '@/app/components/ui/button';
import { EmailCompose } from '@/app/email/components/email/EmailCompose';
import { EmailComposeSimple } from '@/app/email/components/email/EmailComposeSimple';
import { getSMTPConfig } from '@/app/email/hooks/useSMTPConfig';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/app/components/ui/dialog';
import { emailDB } from '@/app/email/lib/email-service/mail-imap/database';
import { emailApi } from '@/app/email/lib/email-service/mail-imap/api-client';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;
  
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isEmailListCollapsed, setIsEmailListCollapsed] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeReplyTo, setComposeReplyTo] = useState<{ to: string; subject: string; originalMessage?: string } | undefined>();

  // Email authentication
  const { 
    isAuthenticated, 
    isAuthenticating,
    isValidating,
    authError, 
    logout 
  } = useEmailAuth();

  // Hydration fix: wait for client-side initialization
  const [isClient, setIsClient] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState<{ 
    username: string;      // Login username (e.g., yw612241@rwth-aachen.de)
    emailAddress: string;  // Display email address (e.g., hanbin.chen@rwth-aachen.de)
  } | null>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (isClient && !isAuthenticated && !isAuthenticating && !isValidating) {
      router.push('/email/imaplogin');
    }
  }, [isClient, isAuthenticated, isAuthenticating, isValidating, router]);

  const { 
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
    markAsRead,
    markAsFlagged,
    deleteEmail,
    retryConnection,
    getCacheStats,
    smartSync
  } = useMailCache({ 
    folder: currentFolder, 
    limit: 50, // Start with 50, will auto-load to 200 in background
    autoSync: isAuthenticated && !isValidating, // Only auto-sync when authenticated and not validating
    syncInterval: 2 * 60 * 1000, // 2 minutes
    isAuthenticated: isAuthenticated && isClient && !isValidating, // Pass authentication state
    progressiveLoading: true // 启用渐进式加载
  });

  // Decode user credentials from URL ID
  const decodeUserCredentials = (id: string): { username: string; emailAddress: string } => {
    // Map URL ID to both login username and display email address
    // This mapping should be maintained for each user
    
    if (id === 'hanbinchen') {
      return {
        username: 'yw612241@rwth-aachen.de',        // Login username
        emailAddress: 'hanbin.chen@rwth-aachen.de'  // Display email address
      };
    }
    
    // For other users, you would add similar mappings
    // For example:
    // if (id === 'johndoe') {
    //   return {
    //     username: 'jd123456@rwth-aachen.de',
    //     emailAddress: 'john.doe@rwth-aachen.de'
    //   };
    // }
    
    // Fallback: assume the ID is already a proper username
    return {
      username: `${id}@rwth-aachen.de`,
      emailAddress: `${id}@rwth-aachen.de`
    };
  };

  // Set email credentials based on URL ID
  useEffect(() => {
    if (isClient && isAuthenticated && emailId) {
      const credentials = decodeUserCredentials(emailId);
      console.log('=== Email Credentials Debug ===');
      console.log('Original emailId from URL:', emailId);
      console.log('Login username:', credentials.username);
      console.log('Display email address:', credentials.emailAddress);
      console.log('=== End Debug ===');
      
      // Check if emailApi has valid credentials including password in memory
      const hasValidSession = emailApi.isAuthenticated();
      const storedCreds = emailApi.getStoredCredentials();
      
      if (!hasValidSession || !storedCreds || storedCreds.username !== credentials.username) {
        console.log('[EmailPage] 密码未在内存中找到或会话无效，重定向到登录页面');
        console.log('[EmailPage] hasValidSession:', hasValidSession);
        console.log('[EmailPage] storedCreds:', storedCreds);
        logout(); // Clear any invalid state
        router.push('/email/imaplogin');
        return;
      }
      
      console.log('[EmailPage] 找到有效会话，密码已在内存中:', credentials.username);
      setEmailCredentials({
        username: credentials.username,        // Login username for authentication
        emailAddress: credentials.emailAddress // Display email address for sending
      });
    }
  }, [isClient, isAuthenticated, emailId, router]);

  // Filter emails based on unread only setting
  const filteredEmails = showUnreadOnly ? emails.filter(email => !email.isRead) : emails;

  const handleUnreadOnlyToggle = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const handleEmailSelect = async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // Mark as read when selecting
    if (!email.isRead) {
      try {
        await markAsRead(email.id, email.uid, true);
      } catch (err) {
        console.error('Failed to mark email as read:', err);
      }
    }
  };

  const handleEmailUpdate = () => {
    // Update selected email if it's still in the list
    if (selectedEmail) {
      const updatedEmail = filteredEmails.find(email => email.id === selectedEmail.id);
      if (updatedEmail) {
        setSelectedEmail(updatedEmail);
      }
    }
  };

  const handleReplyToggle = (isReplying: boolean) => {
    // Auto-collapse email list when replying, expand when not replying
    setIsEmailListCollapsed(isReplying);
  };

  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder);
    setSelectedEmail(null); // Clear selection when changing folders
  };

  const handleLogout = () => {
    logout();
    router.push('/email/imaplogin');
  };

  const handleClearIndexedDB = async () => {
    try {
      // Clear all IndexedDB data
      await emailDB.emails.clear();
      await emailDB.emailBodies.clear();
      await emailDB.folders.clear();
      await emailDB.syncInfo.clear();
      
      // Clear local state
      setSelectedEmail(null);
      
      // Show success message
      alert('IndexedDB数据已清除');
      
      // Reload emails from server
      await refreshEmails();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      alert('清除IndexedDB数据失败');
    }
  };

  // Show loading during hydration, validation, or initial email loading
  if (!isClient || isValidating || (loading && !initialLoaded)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            {!isClient ? '正在初始化...' : 
             isValidating ? '正在验证会话...' : 
             loadingProgress}
          </p>
          {loading && !initialLoaded && (
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">
                {backgroundLoading ? '后台无感知加载中 (目标 200 封)...' : '快速加载前 50 封邮件'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: backgroundLoading ? '75%' : '50%'}}
                ></div>
              </div>
            </div>
          )}
          {connectionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm mb-2">连接已断开，请重新登录</p>
              <button
                onClick={retryConnection}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                重试连接
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If not authenticated, redirect is handled by useEffect
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 fixed inset-0">
      {/* Header */}
      <div className="border-b border-gray-200 p-3 bg-white flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/email/imaplogin" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">EmAilX Center</h1>
              <p className="text-xs text-gray-500">{decodeUserCredentials(emailId).emailAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700">
                {currentFolder} ({filteredEmails.length})
              </span>
              {folders.length > 0 && (
                <select
                  value={currentFolder}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="px-2 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {folders.map((folder) => (
                    <option key={folder.path} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={handleUnreadOnlyToggle}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Unread only</span>
            </label>
          </div>
          
          {/* Compose and Status */}
          <div className="flex items-center gap-2">
            <Dialog open={showCompose} onOpenChange={setShowCompose}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs"
                  title="Compose new email"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">
                  {composeReplyTo ? 'Reply to Email' : 'Compose New Email'}
                </DialogTitle>
                {emailCredentials && isAuthenticated ? (
                  <EmailCompose
                    replyTo={composeReplyTo}
                    onClose={() => {
                      setShowCompose(false);
                      setComposeReplyTo(undefined);
                    }}
                    onEmailSent={() => {
                      setShowCompose(false);
                      setComposeReplyTo(undefined);
                    }}
                  />
                ) : (
                  <EmailComposeSimple
                    replyTo={composeReplyTo}
                    onClose={() => {
                      setShowCompose(false);
                      setComposeReplyTo(undefined);
                    }}
                    onEmailSent={() => {
                      setShowCompose(false);
                      setComposeReplyTo(undefined);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            {/* 后台加载状态 */}
            {backgroundLoading && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                后台加载中
              </div>
            )}
            
            {/* 同步状态 */}
            {syncing && !backgroundLoading && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                同步中
              </div>
            )}
            
            {/* 连接错误状态 */}
            {connectionError && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                连接断开
                <button
                  onClick={retryConnection}
                  className="ml-1 px-1 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  重试
                </button>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              {emails.length} 封邮件
              {backgroundLoading && (
                <span className="text-green-600 ml-1">(后台加载中...)</span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearIndexedDB}
              className="text-xs"
              title="Clear IndexedDB cache"
            >
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded border border-red-300"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex-1 flex min-h-0" style={{height: 'calc(100vh - 80px)'}}>
        {/* Email List Sidebar */}
        <div className={`${isEmailListCollapsed ? 'w-12' : 'w-full md:w-80 lg:w-96'} border-r border-gray-200 bg-white flex flex-col transition-all duration-300 min-h-0 flex-shrink-0`}>
          {/* Collapse Toggle Button */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            {!isEmailListCollapsed && (
              <span className="text-xs font-medium text-gray-700">邮件列表</span>
            )}
            <button
              onClick={() => setIsEmailListCollapsed(!isEmailListCollapsed)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title={isEmailListCollapsed ? "展开邮件列表" : "收起邮件列表"}
            >
              <svg 
                className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isEmailListCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Email List Content */}
          <div className={`flex-1 min-h-0 ${isEmailListCollapsed ? 'hidden' : ''}`}>
            <EmailList
              emails={filteredEmails}
              loading={loading}
              error={error}
              selectedEmailId={selectedEmail?.id || null}
              onEmailSelect={handleEmailSelect}
              onUpdate={handleEmailUpdate}
              onLoadMore={loadMoreEmails}
              backgroundLoading={backgroundLoading}
              loadingProgress={loadingProgress}
            />
          </div>
        </div>

        {/* Email View Panel */}
        <div className={`flex-1 min-h-0 overflow-hidden bg-white ${selectedEmail ? 'block' : 'hidden md:block'}`}>
          <EmailView
            email={selectedEmail}
            onUpdate={handleEmailUpdate}
            onMarkAsRead={async (isRead) => {
              if (selectedEmail) {
                await markAsRead(selectedEmail.id, selectedEmail.uid, isRead);
              }
            }}
            onMarkAsFlagged={async (isFlagged) => {
              if (selectedEmail) {
                await markAsFlagged(selectedEmail.id, selectedEmail.uid, isFlagged);
              }
            }}
            onDelete={async () => {
              if (selectedEmail) {
                await deleteEmail(selectedEmail.id, selectedEmail.uid);
                setSelectedEmail(null);
              }
            }}
            onReplyToggle={handleReplyToggle}
            onBack={() => setSelectedEmail(null)}
            userCredentials={emailCredentials || undefined}
          />
        </div>
      </div>
    </div>
  );
}