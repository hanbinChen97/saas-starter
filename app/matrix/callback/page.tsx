'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

function MatrixCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const loginToken = searchParams.get('loginToken');
        
        if (!loginToken) {
          throw new Error('No login token received');
        }

        const homeserverUrl = process.env.NEXT_PUBLIC_MATRIX_HS_URL || 'https://matrix.dbis.rwth-aachen.de';
        
        // Exchange loginToken for access token
        const response = await fetch(`${homeserverUrl}/_matrix/client/v3/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'm.login.token',
            token: loginToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Login failed: ${response.statusText}`);
        }

        const loginData = await response.json();
        
        // Store the access token and user info
        const tokenData = {
          accessToken: loginData.access_token,
          userId: loginData.user_id,
          deviceId: loginData.device_id,
          homeserverUrl: homeserverUrl,
          timestamp: Date.now(),
        };

        // Store in localStorage
        localStorage.setItem('matrix_auth', JSON.stringify(tokenData));
        
        setStatus('success');
        
        // Redirect to chat page after a brief delay
        setTimeout(() => {
          router.push('/chat');
        }, 2000);

      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleRetryLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Processing Login...'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Login Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Exchanging your login token for access credentials...'}
            {status === 'success' && 'Redirecting you to the chat interface...'}
            {status === 'error' && 'There was an issue completing your login.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Authentication successful! You will be redirected to the chat interface shortly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              
              <Button onClick={handleRetryLogin} className="w-full">
                Try Login Again
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                If you continue to have issues, please contact support or try logging in again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MatrixCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
            <CardDescription>Initializing callback handler...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </CardContent>
        </Card>
      </div>
    }>
      <MatrixCallbackContent />
    </Suspense>
  );
}