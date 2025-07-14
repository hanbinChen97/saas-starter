'use client';

import { useMemo } from 'react';
import type { SMTPAuthRequest } from '@/app/lib/email-service/mail-smtp/types';

interface UseSMTPConfigProps {
  username?: string;
  emailAddress?: string;
}

export function useSMTPConfig({ username, emailAddress }: UseSMTPConfigProps = {}) {
  const smtpConfig = useMemo((): Omit<SMTPAuthRequest, 'password'> | null => {
    // Get SMTP configuration from environment variables (via client-side)
    // Note: These should be public environment variables prefixed with NEXT_PUBLIC_
    // or passed from server-side as props
    
    if (!username) {
      return null;
    }

    return {
      username,
      senderEmail: emailAddress,
      host: process.env.NEXT_PUBLIC_RWTH_MAIL_SERVER_SMTP_HOST || 'mail.rwth-aachen.de',
      port: parseInt(process.env.NEXT_PUBLIC_RWTH_MAIL_SERVER_SMTP_PORT || '587'),
      secure: process.env.NEXT_PUBLIC_RWTH_MAIL_SERVER_SMTP_SECURE === 'true',
    };
  }, [username, emailAddress]);

  return {
    smtpConfig,
    isConfigured: smtpConfig !== null,
  };
}

// Server-side function to get SMTP configuration
export function getSMTPConfig(username: string, emailAddress?: string): Omit<SMTPAuthRequest, 'password'> {
  return {
    username,
    senderEmail: emailAddress,
    host: process.env.RWTH_MAIL_SERVER_SMTP_HOST || 'mail.rwth-aachen.de',
    port: parseInt(process.env.RWTH_MAIL_SERVER_SMTP_PORT || '587'),
    secure: process.env.RWTH_MAIL_SERVER_SMTP_SECURE === 'true',
  };
}