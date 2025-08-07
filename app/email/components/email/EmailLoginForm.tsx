'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';

interface EmailLoginFormProps {
  onLogin: (credentials: EmailCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  connectingStatus?: string; // 新增连接状态
}

export interface EmailCredentials {
  username: string;
  password: string;
  emailAddress: string; // Actual email address for sending emails
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export function EmailLoginForm({ onLogin, isLoading = false, error, connectingStatus }: EmailLoginFormProps) {
  const [credentials, setCredentials] = useState<EmailCredentials>({
    username: '',
    password: '',
    emailAddress: '',
    host: 'mail.rwth-aachen.de',
    port: 993,
    encryption: 'SSL'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.username && credentials.password && credentials.emailAddress) {
      await onLogin(credentials);
    }
  };

  const handleInputChange = (field: keyof EmailCredentials, value: string | number) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">EmAilX Login</CardTitle>
          <CardDescription>
            Enter your email credentials to connect to your mailbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {connectingStatus && (
              <div className="p-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  {connectingStatus}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Login Username （ab123456@rwth-aachen.de）</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="ab123456@rwth-aachen.de"
                required
                disabled={isLoading || !!connectingStatus}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading || !!connectingStatus}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAddress">Your Email Address *</Label>
              <Input
                id="emailAddress"
                type="email"
                value={credentials.emailAddress}
                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                placeholder="max.mustermann@rwth-aachen.de"
                required
                disabled={isLoading || !!connectingStatus}
              />
              <p className="text-xs text-gray-500">This will be used as the sender address for outgoing emails</p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !!connectingStatus || !credentials.username || !credentials.password || !credentials.emailAddress}
            >
              {isLoading || connectingStatus ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {connectingStatus || 'Connecting...'}
                </div>
              ) : (
                'Connect to Email'
              )}
            </Button>
          </form>

          <div className="mt-4 p-3 text-xs text-gray-600 bg-gray-50 rounded-md">
            <p className="font-medium mb-1">Connection Settings:</p>
            <p>• Server: mail.rwth-aachen.de:993 (SSL)</p>
            <p>• Preconfigured for RWTH Aachen University</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}