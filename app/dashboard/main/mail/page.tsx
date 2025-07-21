'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailLoginForm, EmailCredentials } from '@/app/components/email/EmailLoginForm';
import { useEmailAuth } from '@/app/hooks/useEmailAuth';

export default function MailLoginPage() {
  const router = useRouter();
  const { authenticate, isAuthenticating, authError } = useEmailAuth();
  const [connectingStatus, setConnectingStatus] = useState<string>('');

  const handleLogin = async (credentials: EmailCredentials) => {
    try {
      setConnectingStatus('正在验证凭据...');
      
      // 开始认证流程
      const result = await authenticate(credentials);
      
      if (result.success) {
        // IMAP连接成功，立即跳转到邮件页面
        setConnectingStatus('连接成功！正在进入邮件页面...');
        
        // Encode email address for URL: remove @ and . to create safe ID
        const emailId = credentials.emailAddress.split('@')[0].replace(/\./g, '');
        
        // Save the last email ID for future redirects
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_email_id', emailId);
        }
        
        // 给用户一点时间看到成功信息，然后立即跳转
        setTimeout(() => {
          router.push(`/dashboard/main/mail/${emailId}`);
        }, 500);
      } else {
        setConnectingStatus('');
      }
    } catch (error) {
      setConnectingStatus('');
      console.error('Login error:', error);
    }
  };

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