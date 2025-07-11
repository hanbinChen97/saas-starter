'use client';

import { useState, useEffect } from 'react';
import { useMailCache } from '@/app/hooks/useMailCache';
import { EmailList } from '@/app/components/email/EmailList';
import { EmailView } from '@/app/components/email/EmailView';
import { EmailMessage } from '@/app/lib/email/types';
import { EmailCache } from '@/app/lib/email/database';

export default function EmailsPage() {
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isEmailListCollapsed, setIsEmailListCollapsed] = useState(false);

  const { 
    emails, 
    folders, 
    loading, 
    syncing, 
    error,
    hasMore,
    refreshEmails, 
    syncEmails, 
    loadMoreEmails,
    markAsRead,
    markAsFlagged,
    deleteEmail,
    getCacheStats,
    smartSync
  } = useMailCache({ 
    folder: currentFolder, 
    limit: 50,
    autoSync: true,
    syncInterval: 2 * 60 * 1000 // 2 minutes
  });

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
    // Auto-collapse email list when replying
    if (isReplying) {
      setIsEmailListCollapsed(true);
    }
  };

  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder);
    setSelectedEmail(null); // Clear selection when changing folders
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Center</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {currentFolder} ({filteredEmails.length})
              </span>
              {folders.length > 0 && (
                <select
                  value={currentFolder}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {folders.map((folder) => (
                    <option key={folder.path} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={handleUnreadOnlyToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show unread only</span>
            </label>
          </div>
          
          {/* Sync Status */}
          <div className="flex items-center gap-3">
            {syncing && (
              <div className="flex items-center gap-2 px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                Syncing...
              </div>
            )}
            <div className="text-sm text-gray-500">
              {emails.length} emails
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Email List Sidebar */}
        <div className={`${isEmailListCollapsed ? 'w-12' : 'w-1/3'} border-r border-gray-200 bg-white flex flex-col min-h-0 transition-all duration-300`}>
          {/* Collapse Toggle Button */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            {!isEmailListCollapsed && (
              <span className="text-sm font-medium text-gray-700">Email List</span>
            )}
            <button
              onClick={() => setIsEmailListCollapsed(!isEmailListCollapsed)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title={isEmailListCollapsed ? "Expand email list" : "Collapse email list"}
            >
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isEmailListCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Email List Content */}
          <div className={`flex-1 overflow-hidden ${isEmailListCollapsed ? 'hidden' : ''}`}>
            <EmailList
              emails={filteredEmails}
              loading={loading}
              error={error}
              selectedEmailId={selectedEmail?.id || null}
              onEmailSelect={handleEmailSelect}
              onUpdate={handleEmailUpdate}
              onLoadMore={loadMoreEmails}
              hasMore={hasMore}
            />
          </div>
        </div>

        {/* Email View Panel */}
        <div className="flex-1 overflow-auto email-list-scrollbar smooth-scroll scroll-performance">
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
          />
        </div>
      </div>
    </div>
  );
}