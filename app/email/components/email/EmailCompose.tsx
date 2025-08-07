'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { sendEmailAction } from '@/app/email/lib/email-service/mail-smtp/actions';
import type { SMTPAuthRequest, SMTPSendOptions } from '@/app/email/lib/email-service/mail-smtp/types';
import { emailApi } from '@/app/email/lib/email-service/mail-imap/api-client';

interface EmailComposeProps {
  onClose?: () => void;
  onEmailSent?: () => void;
  replyTo?: {
    to: string;
    subject: string;
    originalMessage?: string;
  };
}

export function EmailCompose({ onClose, onEmailSent, replyTo }: EmailComposeProps) {
  const [formData, setFormData] = useState({
    to: replyTo?.to || '',
    cc: '',
    bcc: '',
    subject: replyTo?.subject || '',
    text: '',
    html: '',
  });
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    senderEmail: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load credentials from active IMAP session
  useEffect(() => {
    try {
      // Get current credentials from IMAP client (includes password from active session)
      const currentCredentials = emailApi.getCurrentCredentials();
      if (currentCredentials && currentCredentials.password) {
        setCredentials({
          username: currentCredentials.username,
          password: currentCredentials.password,
          senderEmail: currentCredentials.emailAddress,
        });
      } else {
        setError('Email session not active. Please login first.');
      }
    } catch (err) {
      console.error('Failed to load email credentials:', err);
      setError('Failed to load email credentials. Please login again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    if (!credentials) {
      setError('Email credentials not available. Please login first.');
      setSending(false);
      return;
    }

    try {
      const smtpAuthConfig: SMTPAuthRequest = {
        username: credentials.username,
        password: credentials.password,
        host: 'mail.rwth-aachen.de',
        port: 587,
        secure: false,
        senderEmail: credentials.senderEmail,
      };

      const emailOptions: SMTPSendOptions = {
        password: credentials.password,
        to: formData.to.split(',').map(email => email.trim()).filter(Boolean),
        cc: formData.cc ? formData.cc.split(',').map(email => email.trim()).filter(Boolean) : undefined,
        bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()).filter(Boolean) : undefined,
        subject: formData.subject,
        text: formData.text,
        html: formData.html || undefined,
      };

      const result = await sendEmailAction(smtpAuthConfig, emailOptions);

      if (result.success) {
        setSuccess(true);
        onEmailSent?.();
        setTimeout(() => {
          onClose?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="text-green-600 text-lg font-medium">Email sent successfully!</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{replyTo ? 'Reply to Email' : 'Compose Email'}</span>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
        </CardTitle>
        {credentials && (
          <div className="text-sm text-gray-600">
            Sending from: {credentials.senderEmail}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="recipient@example.com (separate multiple emails with commas)"
              required
            />
          </div>

          <div>
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              type="email"
              value={formData.cc}
              onChange={(e) => handleInputChange('cc', e.target.value)}
              placeholder="cc@example.com (optional)"
            />
          </div>

          <div>
            <Label htmlFor="bcc">BCC</Label>
            <Input
              id="bcc"
              type="email"
              value={formData.bcc}
              onChange={(e) => handleInputChange('bcc', e.target.value)}
              placeholder="bcc@example.com (optional)"
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <Label htmlFor="text">Message *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              placeholder="Type your message here..."
              rows={8}
              required
            />
          </div>


          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={sending || !credentials}>
              {sending ? 'Sending...' : !credentials ? 'Loading credentials...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}