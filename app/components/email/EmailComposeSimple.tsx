'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { sendEmailAction } from '@/app/lib/email-service/mail-smtp/actions';
import type { SMTPAuthRequest, SMTPSendOptions } from '@/app/lib/email-service/mail-smtp/types';

interface EmailComposeSimpleProps {
  onClose?: () => void;
  onEmailSent?: () => void;
  replyTo?: {
    to: string;
    subject: string;
    originalMessage?: string;
  };
}

export function EmailComposeSimple({ onClose, onEmailSent, replyTo }: EmailComposeSimpleProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    senderEmail: '',
    to: replyTo?.to || '',
    cc: '',
    bcc: '',
    subject: replyTo?.subject || '',
    text: '',
    html: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    if (!formData.senderEmail) {
      setError('Please enter your actual email address');
      return;
    }

    try {
      const smtpAuthConfig: SMTPAuthRequest = {
        username: formData.username,
        password: formData.password,
        host: 'mail.rwth-aachen.de',
        port: 587,
        secure: false, // Use STARTTLS for port 587
        senderEmail: formData.senderEmail,
      };

      const emailOptions: SMTPSendOptions = {
        password: formData.password,
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
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Login Username *</Label>
              <Input
                id="username"
                type="email"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="ab123456@rwth-aachen.de"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Email Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your email password"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="senderEmail">Your Actual Email Address *</Label>
            <Input
              id="senderEmail"
              type="email"
              value={formData.senderEmail}
              onChange={(e) => handleInputChange('senderEmail', e.target.value)}
              placeholder="max.mustermann@rwth-aachen.de (your real email address)"
              required
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <Label htmlFor="html">HTML Content (Optional)</Label>
            <Textarea
              id="html"
              value={formData.html}
              onChange={(e) => handleInputChange('html', e.target.value)}
              placeholder="<p>HTML version of your message (optional)</p>"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}