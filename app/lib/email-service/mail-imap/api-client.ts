'use client';

import { EmailMessage, EmailFolder } from './types';

export interface EmailCredentials {
  username: string;
  password: string;
  emailAddress: string; // 用于显示
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface AuthResult {
  success: boolean;
  error?: string;
  emails?: EmailMessage[];
}

class EmailApiClient {
  private hasStoredCredentials: boolean = false;

  constructor() {
    // Check if we have stored credentials on the server
    this.checkStoredCredentials();
  }

  private async checkStoredCredentials(): Promise<void> {
    try {
      const response = await fetch('/api/auth/email-credentials', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        this.hasStoredCredentials = data.success && data.hasCredentials;
      }
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      this.hasStoredCredentials = false;
    }
  }

  private async makeRequest(action: string, params: any = {}) {
    const requestBody = { 
      action, 
      ...params 
    };

    const response = await fetch('/api/emails', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    return result.data || result;
  }

  async authenticate(credentials: EmailCredentials): Promise<AuthResult> {
    try {
      // Store credentials on server first (this validates them)
      const storeResponse = await fetch('/api/auth/email-credentials', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const storeResult = await storeResponse.json();
      
      if (!storeResponse.ok || !storeResult.success) {
        return {
          success: false,
          error: storeResult.error || 'Failed to store credentials'
        };
      }

      this.hasStoredCredentials = true;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async syncEmails(folder: string = 'INBOX', limit: number = 50, unreadOnly: boolean = false): Promise<EmailMessage[]> {
    return await this.makeRequest('syncEmails', { folder, limit, unreadOnly });
  }

  async getEmailBody(folder: string = 'INBOX', uid: number): Promise<{ text?: string; html?: string }> {
    const result = await this.makeRequest('getEmailBody', { folder, uid });
    return result.data || result;
  }

  async markAsRead(folder: string = 'INBOX', uid: number, isRead: boolean): Promise<void> {
    await this.makeRequest('markAsRead', { folder, uid, isRead });
  }

  async markAsFlagged(folder: string = 'INBOX', uid: number, isFlagged: boolean): Promise<void> {
    await this.makeRequest('markAsFlagged', { folder, uid, isFlagged });
  }

  async deleteEmail(folder: string = 'INBOX', uid: number): Promise<void> {
    await this.makeRequest('deleteEmail', { folder, uid });
  }

  isAuthenticated(): boolean {
    return this.hasStoredCredentials;
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/email-credentials', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.hasStoredCredentials = false;
    }
  }

  // Legacy methods for backward compatibility
  getStoredCredentials(): any {
    // Since credentials are now stored server-side, we return null
    // Components should use the new useEmailCredentials hook instead
    return null;
  }

  setPassword(password: string): void {
    // No-op since passwords are stored server-side now
    console.warn('setPassword is deprecated. Use the new credential storage system.');
  }
}

export const emailApi = new EmailApiClient();