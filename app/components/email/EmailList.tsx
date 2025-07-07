'use client';

import { EmailListItem } from './EmailListItem';
import { EmailMessage } from '@/app/lib/email/types';

interface EmailListProps {
  emails: EmailMessage[];
  loading: boolean;
  error: string | null;
  selectedEmailId: string | null;
  onEmailSelect: (email: EmailMessage) => void;
  onUpdate?: () => void;
}

export function EmailList({ emails, loading, error, selectedEmailId, onEmailSelect, onUpdate }: EmailListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-200">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="ml-4">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Error loading emails</div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button
          onClick={onUpdate}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-4">📧</div>
        <div className="text-gray-600 font-medium mb-1">No emails</div>
        <div className="text-gray-500 text-sm">No emails found in this folder</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          isSelected={selectedEmailId === email.id}
          onClick={() => onEmailSelect(email)}
        />
      ))}
    </div>
  );
}