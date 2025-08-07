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
  private credentials: EmailCredentials | null = null;

  constructor() {
    // Load credentials from localStorage if available
    this.loadCredentials();
  }

  private loadCredentials(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('email_credentials');
      if (stored) {
        try {
          // Only load non-sensitive data
          const parsed = JSON.parse(stored);
          this.credentials = {
            username: parsed.username,
            password: '', // Never store password in localStorage
            emailAddress: parsed.emailAddress,
            host: parsed.host,
            port: parsed.port,
            encryption: parsed.encryption
          };
        } catch (error) {
          console.error('Failed to parse stored credentials:', error);
          localStorage.removeItem('email_credentials');
        }
      }
    }
  }

  private saveCredentials(credentials: EmailCredentials): void {
    if (typeof window !== 'undefined') {
      // Only save non-sensitive data
      const toStore = {
        username: credentials.username,
        emailAddress: credentials.emailAddress,
        host: credentials.host,
        port: credentials.port,
        encryption: credentials.encryption
      };
      localStorage.setItem('email_credentials', JSON.stringify(toStore));
    }
  }

  private async makeRequest(action: string, params: any = {}) {
    if (!this.credentials) {
      throw new Error('Email credentials not set. Please authenticate first.');
    }

    // Check if we have all required credentials
    if (!this.credentials.username || !this.credentials.password || !this.credentials.host) {
      throw new Error('Username, password, and host are required');
    }

    const requestBody = { 
      action, 
      credentials: this.credentials,
      ...params 
    };

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
    
    return result.data || result;
  }

  async authenticate(credentials: EmailCredentials): Promise<AuthResult> {
    // Store credentials for future requests (without password in localStorage)
    this.credentials = { ...credentials };
    this.saveCredentials(credentials);

    // Test credentials
    const response = await fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'authenticate', credentials }),
    });

    const result = await response.json();
    return result;
  }

  // Get current credentials (including password) for email sending
  getCurrentCredentials(): EmailCredentials | null {
    return this.credentials;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null && 
           !!this.credentials.username && 
           !!this.credentials.password && 
           !!this.credentials.host;
  }

  setPassword(password: string): void {
    if (this.credentials) {
      this.credentials.password = password;
    }
  }

  getStoredCredentials(): Omit<EmailCredentials, 'password'> | null {
    if (!this.credentials) return null;
    
    const { password, ...rest } = this.credentials;
    return rest;
  }

  logout(): void {
    this.credentials = null;
    // Clear credentials from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('email_credentials');
    }
  }

  async syncEmails(folder: string = 'INBOX', limit: number = 50, unreadOnly: boolean = false): Promise<EmailMessage[]> {
    const result = await this.makeRequest('syncEmails', { folder, limit, unreadOnly });
    return result.data || result;
  }

  async getEmailBody(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
    const result = await this.makeRequest('getEmailBody', { folder, uid });
    return result.data || result;
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