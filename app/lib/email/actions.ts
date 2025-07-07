'use server';

import { createEmailService } from './email-service';
import { EmailFetchOptions } from './types';

let emailServiceInstance: any = null;

async function getEmailService() {
  if (!emailServiceInstance) {
    emailServiceInstance = createEmailService();
    await emailServiceInstance.connect();
  }
  return emailServiceInstance;
}

export async function getEmails(options: EmailFetchOptions = {}) {
  try {
    const emailService = await getEmailService();
    const emails = await emailService.fetchEmails(options);
    
    return {
      success: true,
      data: {
        emails,
        total: emails.length
      }
    };
  } catch (error) {
    console.error('Error fetching emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch emails',
      data: { emails: [], total: 0 }
    };
  }
}

export async function getEmailFolders() {
  try {
    const emailService = await getEmailService();
    const folders = await emailService.listFolders();
    
    return {
      success: true,
      data: { folders }
    };
  } catch (error) {
    console.error('Error fetching folders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch folders',
      data: { folders: [] }
    };
  }
}

export async function getEmailConnectionStatus() {
  try {
    const emailService = await getEmailService();
    const status = emailService.getConnectionStatus();
    
    return {
      success: true,
      data: status
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connection status',
      data: {
        connected: false,
        serverInfo: { host: '', port: 0, username: '' }
      }
    };
  }
}

export async function markEmailAsRead(uid: number) {
  try {
    const emailService = await getEmailService();
    await emailService.markAsRead(uid);
    
    return {
      success: true,
      message: 'Email marked as read'
    };
  } catch (error) {
    console.error('Error marking email as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark email as read'
    };
  }
}

export async function markEmailAsUnread(uid: number) {
  try {
    const emailService = await getEmailService();
    await emailService.markAsUnread(uid);
    
    return {
      success: true,
      message: 'Email marked as unread'
    };
  } catch (error) {
    console.error('Error marking email as unread:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark email as unread'
    };
  }
}

export async function deleteEmail(uid: number) {
  try {
    const emailService = await getEmailService();
    await emailService.deleteEmail(uid);
    
    return {
      success: true,
      message: 'Email deleted'
    };
  } catch (error) {
    console.error('Error deleting email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete email'
    };
  }
}