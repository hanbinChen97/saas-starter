'use client';

import { EmailMessage, EmailFolder } from './types';

class EmailApiClient {
  private async makeRequest(action: string, params: any = {}) {
    const response = await fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    return result.data;
  }

  async getEmails(folder: string = 'INBOX', limit: number = 50): Promise<EmailMessage[]> {
    return this.makeRequest('getEmails', { folder, limit });
  }

  async getEmailsNewerThan(folder: string, uid: number): Promise<EmailMessage[]> {
    return this.makeRequest('getEmailsNewerThan', { folder, uid });
  }

  async getFolders(): Promise<EmailFolder[]> {
    return this.makeRequest('getFolders');
  }

  async getEmailBody(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
    return this.makeRequest('getEmailBody', { folder, uid });
  }

  async markAsRead(folder: string, uid: number, isRead: boolean): Promise<void> {
    await this.makeRequest('markAsRead', { folder, uid, isRead });
  }

  async markAsFlagged(folder: string, uid: number, isFlagged: boolean): Promise<void> {
    await this.makeRequest('markAsFlagged', { folder, uid, isFlagged });
  }

  async deleteEmail(folder: string, uid: number): Promise<void> {
    await this.makeRequest('deleteEmail', { folder, uid });
  }
}

export const emailApi = new EmailApiClient();