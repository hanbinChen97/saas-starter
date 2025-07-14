'use server';

import { EmailFetchOptions, EmailMessage } from './types';

// All legacy email service functions have been disabled for security
// Email operations now require user authentication through the UI

export async function getEmails(options: EmailFetchOptions = {}): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function getEmailFolders(): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function getEmailConnectionStatus(): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function markEmailAsRead(uid: number): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function markEmailAsUnread(uid: number): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function deleteEmail(uid: number): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}

export async function sendReply(originalEmail: EmailMessage, replyText: string, isHtml: boolean = false, sessionId?: string) {
  try {
    // Only allow session-based email service for security
    if (!sessionId) {
      return {
        success: false,
        error: 'Email authentication required. Please log in with your email credentials.'
      };
    }

    const { getEmailService: getSessionEmailService } = await import('./email-auth');
    const emailService = await getSessionEmailService(sessionId);
    if (!emailService) {
      return {
        success: false,
        error: 'Email session expired. Please log in again.'
      };
    }
    
    // Generate Message-ID for threading
    const messageId = `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${originalEmail.from.address.split('@')[1]}>`;
    
    // Build References header for email threading
    const references = originalEmail.id ? 
      (originalEmail.id.includes('References:') ? 
        originalEmail.id + ' ' + messageId : 
        originalEmail.id + ' ' + messageId) : 
      messageId;

    await emailService.sendEmail({
      to: [originalEmail.from],
      subject: originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`,
      text: isHtml ? undefined : replyText,
      html: isHtml ? replyText : undefined,
      inReplyTo: originalEmail.id,
      references: references,
    });
    
    return {
      success: true,
      message: 'Reply sent successfully'
    };
  } catch (error) {
    console.error('Error sending reply:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reply'
    };
  }
}