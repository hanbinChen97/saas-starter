'use client';

import { EmailMessage } from '@/app/lib/email/types';
import { EmailParser } from '@/app/lib/email/email-parser';
import { useState, useEffect } from 'react';
import { useMailCache } from '@/app/hooks/useMailCache';

interface EmailViewProps {
  email: EmailMessage | null;
  onUpdate?: () => void;
  onMarkAsRead?: (isRead: boolean) => Promise<void>;
  onMarkAsFlagged?: (isFlagged: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onReplyToggle?: (isReplying: boolean) => void;
}

export function EmailView({ email, onUpdate, onMarkAsRead, onMarkAsFlagged, onDelete, onReplyToggle }: EmailViewProps) {
  const [emailBody, setEmailBody] = useState<{ text?: string; html?: string } | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { getEmailBody } = useMailCache();

  // Load email body when email changes
  useEffect(() => {
    if (email && (!email.html && !email.text)) {
      setLoadingBody(true);
      getEmailBody(email.id, email.uid)
        .then((body) => {
          setEmailBody(body);
        })
        .catch((error) => {
          console.error('Failed to load email body:', error);
        })
        .finally(() => {
          setLoadingBody(false);
        });
    } else {
      setEmailBody(null);
    }
  }, [email, getEmailBody]);
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No email selected</h3>
          <p className="text-sm text-gray-500">Select an email from the list to view its content</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(email.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleMarkAsRead = async () => {
    if (onMarkAsRead) {
      try {
        await onMarkAsRead(true);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  };

  const handleMarkAsUnread = async () => {
    if (onMarkAsRead) {
      try {
        await onMarkAsRead(false);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to mark email as unread:', error);
      }
    }
  };

  const handleMarkAsFlagged = async () => {
    if (onMarkAsFlagged) {
      try {
        await onMarkAsFlagged(!email.isFlagged);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to toggle flag:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete();
        onUpdate?.();
      } catch (error) {
        console.error('Failed to delete email:', error);
      }
    }
  };

  // Get the email content to display
  const getEmailContent = () => {
    if (email.html || email.text) {
      return { html: email.html, text: email.text };
    }
    return emailBody;
  };

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Title */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex-1">
            {email.subject}
          </h1>
          <div className="flex items-center gap-2 ml-4">
            {!email.isRead && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Unread
              </span>
            )}
            {email.isFlagged && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⭐ Flagged
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reply Box */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <button
          onClick={() => {
            const newShowReply = !showReply;
            setShowReply(newShowReply);
            onReplyToggle?.(newShowReply);
          }}
          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded font-medium transition-colors"
        >
          {showReply ? 'Hide Reply' : 'Reply'}
        </button>
      </div>

      {/* Reply Interface */}
      {showReply && (
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex gap-6 h-96">
            {/* Reply Box - Left Half */}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reply</h3>
              <div className="border border-gray-300 rounded-lg h-full flex flex-col">
                {/* Reply Header */}
                <div className="border-b border-gray-200 p-3 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    <div className="mb-1">
                      <span className="font-medium">To:</span> {email.from.name || email.from.address}
                    </div>
                    <div>
                      <span className="font-medium">Subject:</span> Re: {email.subject}
                    </div>
                  </div>
                </div>
                
                {/* Reply Content */}
                <div className="flex-1 p-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full h-full resize-none border-none outline-none text-sm"
                  />
                </div>
                
                {/* Reply Actions */}
                <div className="border-t border-gray-200 p-3 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                      Send
                    </button>
                    <button 
                      onClick={() => setShowReply(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Press Ctrl+Enter to send
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Placeholder - Right Half */}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chat</h3>
              <div className="border border-gray-300 rounded-lg h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Chat functionality coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mail View */}
      <div className="flex-1">
        {/* Email Header Information */}
        <div className="border-b border-gray-200 p-6 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 w-16">From:</span>
              <span className="text-gray-900">{email.from.name || email.from.address}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 w-16">Date:</span>
              <span className="text-gray-900">{formattedDate}</span>
            </div>
            <div className="flex items-start text-sm">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">To:</span>
              <span className="text-gray-900">
                {email.to.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
              </span>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div className="flex items-start text-sm">
                <span className="font-medium text-gray-700 w-16 flex-shrink-0">CC:</span>
                <span className="text-gray-900">
                  {email.cc.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Email Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={email.isRead ? handleMarkAsUnread : handleMarkAsRead}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium transition-colors"
            >
              {email.isRead ? 'Mark as unread' : 'Mark as read'}
            </button>
            <button
              onClick={handleMarkAsFlagged}
              className="px-3 py-1 text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded font-medium transition-colors"
            >
              {email.isFlagged ? 'Unflag' : 'Flag'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Email Content */}
        <div className="p-6">
        {loadingBody ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading email content...</div>
          </div>
        ) : (
          <div className="prose max-w-none">
            {(() => {
              const content = getEmailContent();
              if (content?.html) {
                return <div dangerouslySetInnerHTML={{ __html: content.html }} />;
              } else if (content?.text) {
                return (
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                    {content.text}
                  </pre>
                );
              } else {
                return (
                  <div className="text-gray-500 text-center py-8">
                    No content available for this email.
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Attachments ({email.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      📎
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}