'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailLoginForm, EmailCredentials } from '@/app/components/email/EmailLoginForm';
import { useEmailAuth } from '@/app/hooks/useEmailAuth';

export default function MailLoginPage() {
  const router = useRouter();
  const { authenticate, isAuthenticating, authError } = useEmailAuth();

  const handleLogin = async (credentials: EmailCredentials) => {
    const result = await authenticate(credentials);
    if (result.success) {
      // Encode email address for URL: remove @ and . to create safe ID
      const emailId = credentials.emailAddress.split('@')[0].replace(/\./g, '');
      router.push(`/dashboard/mail/${emailId}`);
    }
  };

  return (
    <div className="h-full">
      <EmailLoginForm 
        onLogin={handleLogin} 
        isLoading={isAuthenticating} 
        error={authError} 
      />
    </div>
  );
}