'use client';

import { useState } from 'react';
import { useEmails } from '@/app/hooks/useEmails';
import { EmailList } from '@/app/components/email/EmailList';
import { EmailView } from '@/app/components/email/EmailView';
import { EmailFetchOptions, EmailMessage } from '@/app/lib/email/types';

export default function EmailsPage() {
  const [emailOptions, setEmailOptions] = useState<EmailFetchOptions>({
    folder: 'INBOX',
    limit: 20,
    unreadOnly: false,
  });
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  const { emails, loading, error, total, refetch, connectionStatus, folders } = useEmails(emailOptions);

  const handleRefresh = () => {
    refetch();
  };

  const handleUnreadOnlyToggle = () => {
    setEmailOptions(prev => ({
      ...prev,
      unreadOnly: !prev.unreadOnly,
    }));
  };

  const handleEmailSelect = (email: EmailMessage) => {
    setSelectedEmail(email);
  };

  const handleEmailUpdate = () => {
    refetch();
    // Update selected email if it's still in the list
    if (selectedEmail) {
      const updatedEmail = emails.find(email => email.id === selectedEmail.id);
      if (updatedEmail) {
        setSelectedEmail(updatedEmail);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
            <p className="text-gray-600 mt-1">View and manage all emails</p>
          </div>
          
          {/* Connection Status */}
          {connectionStatus && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-sm text-gray-500">
                {connectionStatus.serverInfo.host}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {emailOptions.folder} {total > 0 && `(${total})`}
              </h2>
              {folders.length > 0 && (
                <select
                  value={emailOptions.folder}
                  onChange={(e) => setEmailOptions(prev => ({ ...prev, folder: e.target.value }))}
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
                checked={emailOptions.unreadOnly}
                onChange={handleUnreadOnlyToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show unread only</span>
            </label>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          <div className="flex-1 overflow-auto">
            <EmailList
              emails={emails}
              loading={loading}
              error={error}
              selectedEmailId={selectedEmail?.id || null}
              onEmailSelect={handleEmailSelect}
              onUpdate={refetch}
            />
          </div>
        </div>

        {/* Email View Panel */}
        <div className="flex-1 flex">
          <EmailView
            email={selectedEmail}
            onUpdate={handleEmailUpdate}
          />
        </div>
      </div>
    </div>
  );
}