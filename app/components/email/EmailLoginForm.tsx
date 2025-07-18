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
              <Label htmlFor="emailAddress">Your Email Address （必填）</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">IMAP Server</Label>
                <Input
                  id="host"
                  type="text"
                  value={credentials.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="mail.server.com"
                  required
                  disabled={isLoading || !!connectingStatus}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={credentials.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 993)}
                  placeholder="993"
                  required
                  disabled={isLoading || !!connectingStatus}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryption">Encryption</Label>
              <select
                id="encryption"
                value={credentials.encryption}
                onChange={(e) => handleInputChange('encryption', e.target.value as 'SSL' | 'TLS' | 'NONE')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || !!connectingStatus}
              >
                <option value="SSL">SSL (Recommended)</option>
                <option value="TLS">TLS</option>
                <option value="NONE">None (Not Recommended)</option>
              </select>
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
            <p className="font-medium mb-1">Common IMAP Settings:</p>
            <p>• Gmail: imap.gmail.com:993 (SSL)</p>
            <p>• Outlook: outlook.office365.com:993 (SSL)</p>
            <p>• RWTH Aachen: mail.rwth-aachen.de:993 (SSL)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}