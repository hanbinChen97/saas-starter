'use client';

import { useState, useEffect } from 'react';
import { useMailCache } from '@/app/hooks/useMailCache';
import { EmailList } from '@/app/components/email/EmailList';
import { EmailView } from '@/app/components/email/EmailView';
import { EmailMessage } from '@/app/lib/email/types';

export default function EmailsPage() {
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

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
    getCacheStats
  } = useMailCache({ 
    folder: currentFolder, 
    limit: 50,
    autoSync: true,
    syncInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Filter emails based on unread only setting
  const filteredEmails = showUnreadOnly ? emails.filter(email => !email.isRead) : emails;

  const handleRefresh = () => {
    refreshEmails();
  };

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

  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder);
    setSelectedEmail(null); // Clear selection when changing folders
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
            <p className="text-gray-600 mt-1">View and manage all emails with caching</p>
          </div>
          
          {/* Sync Status */}
          <div className="flex items-center gap-3">
            {syncing && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                Syncing...
              </div>
            )}
            <div className="text-sm text-gray-500">
              {emails.length} emails loaded
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentFolder} ({filteredEmails.length})
              </h2>
              {folders.length > 0 && (
                <select
                  value={currentFolder}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <button 
            onClick={handleRefresh}
            disabled={loading || syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || syncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Email List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
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
        <div className="flex-1 flex min-h-0">
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
          />
        </div>
      </div>
    </div>
  );
}