'use client';

import { EmailMessage } from '@/app/email/lib/email-service/mail-imap/types';
import { EmailParser } from '@/app/email/lib/email-service/mail-imap/email-parser';

interface EmailListItemProps {
  email: EmailMessage;
  isSelected: boolean;
  onClick: () => void;
}

export function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  const preview = EmailParser.getEmailPreview(email);
  const formattedDate = new Date(email.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Check if email is from today
  const isToday = new Date(email.date).toDateString() === new Date().toDateString();
  const timeFormat = isToday ? {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  } : {
    month: 'short' as const,
    day: 'numeric' as const,
  };

  const displayTime = new Date(email.date).toLocaleString('en-US', timeFormat);

  return (
    <div
      onClick={onClick}
      className={`p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors will-change-transform ${
        isSelected ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
      } ${
        !email.isRead ? 'bg-blue-25 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-xs truncate ${
              !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            }`}>
              {email.from.name || email.from.address}
            </p>
            {!email.isRead && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
            {email.isFlagged && (
              <div className="text-yellow-500 text-xs">⭐</div>
            )}
            {email.attachments.length > 0 && (
              <div className="text-gray-400 text-xs">📎</div>
            )}
          </div>
          
          <h3 className={`text-xs mb-1 truncate ${
            !email.isRead ? 'font-semibold text-gray-900' : 'font-normal text-gray-800'
          }`}>
            {email.subject}
          </h3>
          
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {preview}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {displayTime}
          </span>
          {email.attachments.length > 0 && (
            <span className="text-xs text-gray-400">
              {email.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}