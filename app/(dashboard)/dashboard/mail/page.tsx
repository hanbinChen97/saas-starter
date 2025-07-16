'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmailLoginForm, EmailCredentials } from '@/app/components/email/EmailLoginForm';
import { useEmailCredentials } from '@/app/hooks/useEmailCredentials';

export default function MailLoginPage() {
  const router = useRouter();
  const { credentialsStatus, isLoading, storeCredentials } = useEmailCredentials();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectingStatus, setConnectingStatus] = useState<string>('');

  // Check if user already has credentials stored and redirect
  useEffect(() => {
    if (credentialsStatus?.hasCredentials && credentialsStatus.credentials) {
      // User has stored credentials, redirect to their email
      const emailId = credentialsStatus.credentials.emailAddress.split('@')[0].replace(/\./g, '');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_email_id', emailId);
      }
      
      router.push(`/dashboard/mail/${emailId}`);
    }
  }, [credentialsStatus, router]);

  const handleLogin = async (credentials: EmailCredentials) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      setConnectingStatus('正在验证凭据...');
      
      // Store credentials (this will validate them first)
      const success = await storeCredentials(credentials);
      
      if (success) {
        // Credentials stored successfully
        setConnectingStatus('连接成功！正在进入邮件页面...');
        
        // Encode email address for URL: remove @ and . to create safe ID
        const emailId = credentials.emailAddress.split('@')[0].replace(/\./g, '');
        
        // Save the last email ID for future redirects
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_email_id', emailId);
        }
        
        // Give user a moment to see success message, then redirect
        setTimeout(() => {
          router.push(`/dashboard/mail/${emailId}`);
        }, 500);
      } else {
        setConnectingStatus('');
        setAuthError('Failed to store credentials. Please check your email settings.');
      }
    } catch (error) {
      setConnectingStatus('');
      setAuthError(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show loading state while checking existing credentials
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking email credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <EmailLoginForm 
        onLogin={handleLogin} 
        isLoading={isAuthenticating} 
        error={authError}
        connectingStatus={connectingStatus}
      />
    </div>
  );
}