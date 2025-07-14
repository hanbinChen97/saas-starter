'use server';

import { ImapEmailService } from './email-service';
import { EmailConnectionConfig } from './types';

export interface EmailAuthCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface EmailAuthResult {
  success: boolean;
  error?: string;
  sessionId?: string;
}

// Store active email services per session
const emailSessions = new Map<string, ImapEmailService>();

export async function authenticateEmail(credentials: EmailAuthCredentials): Promise<EmailAuthResult> {
  try {
    // Validate credentials
    if (!credentials.username || !credentials.password || !credentials.host) {
      return {
        success: false,
        error: 'All fields are required'
      };
    }

    // Create email service configuration
    const config: EmailConnectionConfig = {
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      tls: credentials.encryption === 'SSL',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 15000,
    };

    // Create email service instance
    const emailService = new ImapEmailService(config);

    // Test connection
    await emailService.connect();

    // Generate session ID and store the service
    const sessionId = `email_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    emailSessions.set(sessionId, emailService);

    // Clean up old sessions (older than 1 hour)
    cleanupOldSessions();

    return {
      success: true,
      sessionId
    };
  } catch (error) {
    console.error('Email authentication failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

export async function getEmailService(sessionId: string): Promise<ImapEmailService | null> {
  const service = emailSessions.get(sessionId);
  if (!service) {
    return null;
  }

  // Check if connection is still active
  const status = service.getConnectionStatus();
  if (!status.connected) {
    // Try to reconnect
    try {
      await service.connect();
    } catch (error) {
      // Remove failed session
      emailSessions.delete(sessionId);
      return null;
    }
  }

  return service;
}

export async function disconnectEmailSession(sessionId: string): Promise<void> {
  const service = emailSessions.get(sessionId);
  if (service) {
    try {
      await service.disconnect();
    } catch (error) {
      console.error('Error disconnecting email service:', error);
    }
    emailSessions.delete(sessionId);
  }
}

function cleanupOldSessions(): void {
  // This is a simple cleanup - in production, you'd want to track session timestamps
  // and clean up based on actual age
  if (emailSessions.size > 10) {
    const sessionsToRemove = Array.from(emailSessions.keys()).slice(0, 5);
    for (const sessionId of sessionsToRemove) {
      const service = emailSessions.get(sessionId);
      if (service) {
        service.disconnect().catch(console.error);
        emailSessions.delete(sessionId);
      }
    }
  }
}