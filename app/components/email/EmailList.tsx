'use client';

import { EmailListItem } from './EmailListItem';
import { EmailMessage } from '@/app/lib/email-service/mail-imap/types';
import { useEffect, useRef, useCallback } from 'react';

interface EmailListProps {
  emails: EmailMessage[];
  loading: boolean;
  error: string | null;
  selectedEmailId: string | null;
  onEmailSelect: (email: EmailMessage) => void;
  onUpdate?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function EmailList({ emails, loading, error, selectedEmailId, onEmailSelect, onUpdate, onLoadMore, hasMore = true }: EmailListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Scroll to top when emails list changes significantly (like refresh)
  useEffect(() => {
    if (containerRef.current && !loading && emails.length > 0) {
      // Only scroll to top if we're not just adding more emails (infinite scroll)
      const isInitialLoad = containerRef.current.scrollTop === 0;
      if (isInitialLoad || emails.length <= 50) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [emails.length, loading]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const option = {
      root: containerRef.current,
      rootMargin: '50px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    if (loadingRef.current) observer.observe(loadingRef.current);
    
    return () => observer.disconnect();
  }, [handleObserver]);
  if (loading && emails.length === 0) {
    return (
      <div className="divide-y divide-gray-200">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="p-2 animate-pulse">
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
      <div className="p-3 text-center">
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
      <div className="p-4 text-center">
        <div className="text-2xl mb-2">📧</div>
        <div className="text-gray-600 text-sm font-medium mb-1">No emails</div>
        <div className="text-gray-500 text-xs">No emails found in this folder</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full overflow-y-auto overflow-x-hidden bg-white"
      style={{
        scrollBehavior: 'smooth'
      }}
    >
      <div className="divide-y divide-gray-200">
        {emails.map((email) => (
          <EmailListItem
            key={email.id}
            email={email}
            isSelected={selectedEmailId === email.id}
            onClick={() => onEmailSelect(email)}
          />
        ))}
        
        {/* Loading indicator for infinite scroll */}
        {hasMore && onLoadMore && (
          <div ref={loadingRef} className="p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">正在加载更多邮件...</span>
              </div>
            ) : (
              <div className="text-center">
                <button 
                  onClick={onLoadMore}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                >
                  加载更多邮件
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && emails.length > 0 && (
          <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              所有邮件已加载完成 ({emails.length} 封)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}