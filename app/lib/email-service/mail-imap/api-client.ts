'use client';

import { EmailMessage, EmailFolder } from './types';

export interface EmailCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface AuthResult {
  success: boolean;
  error?: string;
  sessionId?: string;
}

class EmailApiClient {
  private sessionId: string | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Session will be initialized on client side
  }

  private initializeSession(): void {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      try {
        const storedSessionId = localStorage.getItem('email_session_id');
        if (storedSessionId) {
          this.sessionId = storedSessionId;
        }
      } catch (error) {
        // Handle cases where localStorage is not available or throws errors
        console.warn('Could not access localStorage for email session:', error);
      }
      this.isInitialized = true;
    }
  }

  private async makeRequest(action: string, params: any = {}) {
    this.initializeSession();
    
    const requestBody: any = { action, ...params };
    
    // Include sessionId if available
    if (this.sessionId) {
      requestBody.sessionId = this.sessionId;
    }

    const response = await fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    return result.data;
  }

  async authenticate(credentials: EmailCredentials): Promise<AuthResult> {
    const response = await fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'authenticate', credentials }),
    });

    const result = await response.json();
    
    if (result.success && result.sessionId) {
      this.sessionId = result.sessionId;
      // Persist session in localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('email_session_id', result.sessionId);
        } catch (error) {
          console.warn('Could not save email session to localStorage:', error);
        }
      }
    }
    
    return result;
  }

  isAuthenticated(): boolean {
    this.initializeSession();
    return this.sessionId !== null;
  }

  logout(): void {
    this.sessionId = null;
    this.isInitialized = false;
    // Clear session from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('email_session_id');
      } catch (error) {
        console.warn('Could not clear email session from localStorage:', error);
      }
    }
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