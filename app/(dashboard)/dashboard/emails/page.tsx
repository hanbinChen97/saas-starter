'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEmailAuth } from '@/app/hooks/useEmailAuth';

export default function EmailsRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthenticating } = useEmailAuth();

  useEffect(() => {
    if (!isAuthenticating) {
      if (isAuthenticated) {
        // If user is already authenticated, check if we have session info to redirect to specific email page
        if (typeof window !== 'undefined') {
          const storedSessionId = localStorage.getItem('email_session_id');
          const lastEmailId = localStorage.getItem('last_email_id');
          
          if (storedSessionId && lastEmailId) {
            // Redirect to the last used email page
            router.push(`/dashboard/mail/${lastEmailId}`);
          } else {
            // Redirect to mail login to choose email account
            router.push('/dashboard/mail');
          }
        }
      } else {
        // User needs to authenticate first
        router.push('/dashboard/mail');
      }
    }
  }, [isAuthenticated, isAuthenticating, router]);

  // Show loading while determining redirect
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">正在加载邮件系统...</p>
      </div>
    </div>
  );
} 