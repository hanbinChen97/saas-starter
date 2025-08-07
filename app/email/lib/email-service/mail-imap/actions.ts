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

export async function sendReply(originalEmail: EmailMessage, replyText: string, isHtml: boolean = false, sessionId?: string): Promise<never> {
  throw new Error('Direct email access disabled. Please use the email interface with user authentication.');
}