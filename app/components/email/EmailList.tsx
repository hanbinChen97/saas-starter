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
  backgroundLoading?: boolean;
  loadingProgress?: string;
}

export function EmailList({ emails, loading, error, selectedEmailId, onEmailSelect, onUpdate, onLoadMore, backgroundLoading = false, loadingProgress }: EmailListProps) {
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

  // Intersection Observer for showing request button - no auto-loading
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    // Just observe for visibility, don't auto-load
    // User must click the "Request More" button to load more emails
    if (target.isIntersecting && !loading) {
      console.log('[EmailList] Request more section is visible');
    }
  }, [loading]);

  useEffect(() => {
    const option = {
      root: containerRef.current,
      rootMargin: '20px', // Smaller margin for better detection
      threshold: 0.3 // Higher threshold
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
        
        {/* Pull-to-Load-More Section */}
        {onLoadMore && (
          <div 
            ref={loadingRef} 
            className="group cursor-pointer select-none"
            onClick={() => !loading && onLoadMore()}
          >
            {loading ? (
              <div className="p-6 bg-gradient-to-b from-blue-50 to-blue-100 border-t border-blue-200">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-blue-700 font-medium animate-pulse">正在加载更多邮件...</span>
                  <div className="text-xs text-blue-600">请稍候</div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 hover:from-blue-50 hover:to-blue-100 hover:border-blue-200 transition-all duration-300">
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-y-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-sm font-medium">点击加载更多邮件</span>
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-y-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span>已显示 {emails.length} 封邮件</span>
                    {backgroundLoading && (
                      <span className="text-green-600 animate-pulse">(同步中...)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                    从缓存中加载历史邮件
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}