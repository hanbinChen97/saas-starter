'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { EmailLoginForm, EmailCredentials } from '@/app/email/components/email/EmailLoginForm';
import { useEmailAuth } from '@/app/email/hooks/useEmailAuth';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function EmailImapLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthenticating, isValidating, authenticate, authError, logout } = useEmailAuth();
  const [connectingStatus, setConnectingStatus] = useState<string>('');

  // Check authentication and redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticating && !isValidating && isAuthenticated) {
      // If user is already authenticated, check if we have session info to redirect to specific email page
      if (typeof window !== 'undefined') {
        const storedSessionId = localStorage.getItem('email_session_id');
        const lastEmailId = localStorage.getItem('last_email_id');
        
        if (storedSessionId && lastEmailId) {
          // Redirect to the last used email page
          router.push(`/email/${lastEmailId}`);
        }
      }
    }
  }, [isAuthenticated, isAuthenticating, isValidating, router]);

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
          router.push(`/email/${emailId}`);
        }, 500);
      } else {
        setConnectingStatus('');
      }
    } catch (error) {
      setConnectingStatus('');
      console.error('Login error:', error);
    }
  };

  // Show loading while determining redirect
  if (isValidating || (isAuthenticated && isAuthenticating)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            {isValidating ? '正在验证会话...' : isAuthenticating ? '正在认证...' : '正在加载邮件系统...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/email" className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">EmAilX</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/email" className="text-sm text-gray-600 hover:text-gray-900">
              返回主页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">连接邮箱账户</h1>
          <p className="text-lg text-gray-600">输入您的邮箱账户信息，开始管理邮件</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Mail className="h-5 w-5 mr-2" />
              IMAP邮箱连接
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmailLoginForm 
              onLogin={handleLogin} 
              isLoading={isAuthenticating} 
              error={authError} 
              connectingStatus={connectingStatus}
            />
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="mb-2">支持的邮箱服务:</p>
          <div className="flex justify-center space-x-4 text-xs">
            <span>Gmail</span>
            <span>•</span>
            <span>Outlook</span>
            <span>•</span>
            <span>QQ邮箱</span>
            <span>•</span>
            <span>163邮箱</span>
            <span>•</span>
            <span>RWTH邮箱</span>
          </div>
        </div>
      </main>
    </div>
  );
}