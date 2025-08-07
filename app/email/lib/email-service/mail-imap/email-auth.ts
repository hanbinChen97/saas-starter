'use server';

import { ImapEmailService } from './email-service';
import { EmailConnectionConfig, EmailMessage } from './types';

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
  emails?: EmailMessage[];
}

/**
 * 一次性邮件同步：登录并获取邮件，然后立即断开连接
 * 不管理session，每次都是全新的连接
 */
export async function authenticateAndSyncEmails(
  credentials: EmailAuthCredentials, 
  options: { 
    folder?: string; 
    limit?: number; 
    unreadOnly?: boolean;
  } = {}
): Promise<EmailAuthResult> {
  let emailService: ImapEmailService | null = null;
  
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

    console.log('[OneTimeSync] Creating email service for:', credentials.username);
    emailService = new ImapEmailService(config);

    // Connect and test
    console.log('[OneTimeSync] Connecting to IMAP server...');
    await emailService.connect();
    console.log('[OneTimeSync] Connected successfully');

    // Fetch emails immediately
    const fetchOptions = {
      folder: options.folder || 'INBOX',
      limit: options.limit || 50,
      unreadOnly: options.unreadOnly || false
    };
    
    console.log('[OneTimeSync] Fetching emails with options:', fetchOptions);
    const emails = await emailService.fetchEmails(fetchOptions);
    console.log(`[OneTimeSync] Fetched ${emails.length} emails`);

    // Disconnect immediately after fetching
    console.log('[OneTimeSync] Disconnecting...');
    await emailService.disconnect();
    console.log('[OneTimeSync] Disconnected successfully');

    return {
      success: true,
      emails
    };
  } catch (error) {
    console.error('[OneTimeSync] Error:', error);
    
    // Ensure cleanup on error
    if (emailService) {
      try {
        await emailService.disconnect();
      } catch (cleanupError) {
        console.error('[OneTimeSync] Cleanup error:', cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email sync failed'
    };
  }
}

/**
 * 一次性邮件操作：连接、执行操作、断开
 */
export async function executeEmailOperation(
  credentials: EmailAuthCredentials,
  operation: 'markAsRead' | 'markAsFlagged' | 'deleteEmail' | 'fetchEmailBody',
  params: any
): Promise<{ success: boolean; error?: string; data?: any }> {
  let emailService: ImapEmailService | null = null;
  
  try {
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

    console.log(`[OneTimeOp] Executing ${operation} for:`, credentials.username);
    emailService = new ImapEmailService(config);
    await emailService.connect();

    let result;
    switch (operation) {
      case 'markAsRead':
        await emailService.markAsReadInFolder(params.folder, params.uid, params.isRead);
        result = null;
        break;
      case 'markAsFlagged':
        await emailService.markAsFlagged(params.folder, params.uid, params.isFlagged);
        result = null;
        break;
      case 'deleteEmail':
        await emailService.deleteEmailInFolder(params.folder, params.uid);
        result = null;
        break;
      case 'fetchEmailBody':
        result = await emailService.fetchEmailBody(params.folder, params.uid);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    await emailService.disconnect();
    console.log(`[OneTimeOp] ${operation} completed successfully`);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`[OneTimeOp] ${operation} error:`, error);
    
    if (emailService) {
      try {
        await emailService.disconnect();
      } catch (cleanupError) {
        console.error('[OneTimeOp] Cleanup error:', cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `${operation} failed`
    };
  }
}

/**
 * 验证邮件凭据（仅测试连接，不获取邮件）
 */
export async function validateEmailCredentials(credentials: EmailAuthCredentials): Promise<EmailAuthResult> {
  let emailService: ImapEmailService | null = null;
  
  try {
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

    console.log('[Validate] Testing credentials for:', credentials.username);
    emailService = new ImapEmailService(config);
    await emailService.connect();
    await emailService.disconnect();
    console.log('[Validate] Credentials valid');

    return {
      success: true
    };
  } catch (error) {
    console.error('[Validate] Invalid credentials:', error);
    
    if (emailService) {
      try {
        await emailService.disconnect();
      } catch (cleanupError) {
        console.error('[Validate] Cleanup error:', cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Credential validation failed'
    };
  }
}