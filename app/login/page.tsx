'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMatrixLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const homeserverUrl = process.env.NEXT_PUBLIC_MATRIX_HS_URL || 'https://matrix.dbis.rwth-aachen.de';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/matrix/callback`;
      
      const ssoUrl = `${homeserverUrl}/_matrix/client/v3/login/sso/redirect?redirectUrl=${encodeURIComponent(redirectUrl)}`;
      
      // Redirect to Matrix SSO
      window.location.href = ssoUrl;
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Matrix Chat Login</CardTitle>
          <CardDescription>
            Sign in with your Matrix account via SSO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleMatrixLogin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting...
              </>
            ) : (
              'Sign in with Matrix SSO'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}