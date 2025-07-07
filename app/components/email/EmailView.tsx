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
}

export function EmailView({ email, onUpdate, onMarkAsRead, onMarkAsFlagged, onDelete }: EmailViewProps) {
  const [emailBody, setEmailBody] = useState<{ text?: string; html?: string } | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
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
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Email Header */}
      <div className="border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {email.subject}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">From:</span> {email.from.name || email.from.address}
              </div>
              <div>
                <span className="font-medium">Date:</span> {formattedDate}
              </div>
            </div>
          </div>
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

        {/* Email Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={email.isRead ? handleMarkAsUnread : handleMarkAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {email.isRead ? 'Mark as unread' : 'Mark as read'}
          </button>
          <button
            onClick={handleMarkAsFlagged}
            className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
          >
            {email.isFlagged ? 'Unflag' : 'Flag'}
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>

        {/* Email Details */}
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">To:</span>
            <span className="ml-2 text-gray-900">
              {email.to.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
            </span>
          </div>
          {email.cc && email.cc.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">CC:</span>
              <span className="ml-2 text-gray-900">
                {email.cc.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-auto p-6 email-list-scrollbar smooth-scroll scroll-performance">
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
  );
}