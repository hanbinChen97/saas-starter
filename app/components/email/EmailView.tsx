'use client';

import { EmailMessage } from '@/app/lib/email/types';
import { EmailParser } from '@/app/lib/email/email-parser';
import { markEmailAsRead, markEmailAsUnread, deleteEmail } from '@/app/lib/email/actions';

interface EmailViewProps {
  email: EmailMessage | null;
  onUpdate?: () => void;
}

export function EmailView({ email, onUpdate }: EmailViewProps) {
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
    try {
      const result = await markEmailAsRead(email.uid);
      if (result.success && onUpdate) {
        onUpdate();
      } else {
        console.error('Failed to mark email as read:', result.error);
      }
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const handleMarkAsUnread = async () => {
    try {
      const result = await markEmailAsUnread(email.uid);
      if (result.success && onUpdate) {
        onUpdate();
      } else {
        console.error('Failed to mark email as unread:', result.error);
      }
    } catch (error) {
      console.error('Failed to mark email as unread:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteEmail(email.uid);
      if (result.success && onUpdate) {
        onUpdate();
      } else {
        console.error('Failed to delete email:', result.error);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Email Header */}
      <div className="border-b border-gray-200 p-6">
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
                Flagged
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
      <div className="flex-1 overflow-auto p-6">
        <div className="prose max-w-none">
          {email.html ? (
            <div dangerouslySetInnerHTML={{ __html: email.html }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
              {email.text}
            </pre>
          )}
        </div>

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