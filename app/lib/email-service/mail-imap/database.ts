import Dexie, { type EntityTable } from 'dexie';
import { EmailMessage, EmailFolder } from './types';

// Extended interfaces for database storage
export interface CachedEmailMessage extends Omit<EmailMessage, 'date'> {
  date: string; // Store as ISO string for indexing
  cachedAt: string; // When this email was cached
  folder: string; // Which folder this email belongs to
  bodyLoaded: boolean; // Whether full body is loaded
}

export interface CachedEmailBody {
  id: string; // email ID
  uid: number; // email UID
  text?: string;
  html?: string;
  cachedAt: string;
}

export interface SyncInfo {
  id: string; // 'sync_info'
  lastSyncTime: string;
  lastUid: number; // Highest UID seen
  folder: string;
}

export interface CachedFolder {
  path: string;
  name: string;
  delimiter: string;
  attributes: string[];
  flags: string[];
  cachedAt: string;
}

// Dexie database class
class EmailDatabase extends Dexie {
  emails!: EntityTable<CachedEmailMessage, 'id'>;
  emailBodies!: EntityTable<CachedEmailBody, 'id'>;
  folders!: EntityTable<CachedFolder, 'path'>;
  syncInfo!: EntityTable<SyncInfo, 'id'>;

  constructor() {
    super('EmailDatabase');

    this.version(1).stores({
      emails: 'id, uid, date, folder, from.address, to, subject, isRead, isFlagged, cachedAt',
      emailBodies: 'id, uid, cachedAt',
      folders: 'path, name, cachedAt',
      syncInfo: 'id, folder, lastSyncTime, lastUid'
    });
  }
}

// Create database instance with error handling
let emailDB: EmailDatabase;
try {
  emailDB = new EmailDatabase();
} catch (error) {
  console.error('Failed to initialize email database:', error);
  // Create a fallback that doesn't crash the app
  emailDB = {} as EmailDatabase;
}

export { emailDB };

// Database utility functions
export class EmailCache {
  
  // Cache emails with metadata
  static async cacheEmails(emails: EmailMessage[], folder: string): Promise<void> {
    try {
      if (!emailDB.emails) {
        console.warn('Email database not available, skipping cache operation');
        return;
      }

      const cachedEmails: CachedEmailMessage[] = emails.map(email => ({
        ...email,
        date: (email.date instanceof Date ? email.date : new Date(email.date)).toISOString(),
        cachedAt: new Date().toISOString(),
        folder,
        bodyLoaded: !!email.html || !!email.text
      }));

      await emailDB.emails.bulkPut(cachedEmails);
    } catch (error) {
      console.error('Failed to cache emails:', error);
      // Don't throw - caching is not critical for functionality
    }
  }

  // Get cached emails for a folder
  static async getCachedEmails(folder: string, limit?: number): Promise<EmailMessage[]> {
    try {
      if (!emailDB.emails) {
        console.warn('Email database not available, returning empty list');
        return [];
      }

      let collection = emailDB.emails
        .where('folder')
        .equals(folder);

      // Get all emails and sort by date (newest first)
      const cachedEmails = await collection.toArray();
      const sortedEmails = cachedEmails.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const finalEmails = limit ? sortedEmails.slice(0, limit) : sortedEmails;
      
      return finalEmails.map(cached => ({
        ...cached,
        date: new Date(cached.date)
      }));
    } catch (error) {
      console.error('Failed to get cached emails:', error);
      return [];
    }
  }

  // Cache email body separately for performance
  static async cacheEmailBody(emailId: string, uid: number, text?: string, html?: string): Promise<void> {
    const body: CachedEmailBody = {
      id: emailId,
      uid,
      text,
      html,
      cachedAt: new Date().toISOString()
    };

    await emailDB.emailBodies.put(body);
    
    // Update email to mark body as loaded
    await emailDB.emails.update(emailId, { bodyLoaded: true });
  }

  // Get cached email body
  static async getCachedEmailBody(emailId: string): Promise<CachedEmailBody | undefined> {
    return await emailDB.emailBodies.get(emailId);
  }

  // Cache folders
  static async cacheFolders(folders: EmailFolder[]): Promise<void> {
    const cachedFolders: CachedFolder[] = folders.map(folder => ({
      ...folder,
      cachedAt: new Date().toISOString()
    }));

    await emailDB.folders.bulkPut(cachedFolders);
  }

  // Get cached folders
  static async getCachedFolders(): Promise<EmailFolder[]> {
    const cached = await emailDB.folders.toArray();
    return cached.map(({ cachedAt, ...folder }) => folder);
  }

  // Update sync info
  static async updateSyncInfo(folder: string, lastUid: number): Promise<void> {
    try {
      if (!emailDB.syncInfo) {
        console.warn('Email database not available, skipping sync info update');
        return;
      }

      const syncInfo: SyncInfo = {
        id: `sync_${folder}`,
        folder,
        lastSyncTime: new Date().toISOString(),
        lastUid
      };

      await emailDB.syncInfo.put(syncInfo);
    } catch (error) {
      console.error('Failed to update sync info:', error);
    }
  }

  // Get sync info for incremental sync
  static async getSyncInfo(folder: string): Promise<SyncInfo | undefined> {
    try {
      if (!emailDB.syncInfo) {
        console.warn('Email database not available, returning no sync info');
        return undefined;
      }
      return await emailDB.syncInfo.get(`sync_${folder}`);
    } catch (error) {
      console.error('Failed to get sync info:', error);
      return undefined;
    }
  }

  // Clear old cache (cleanup)
  static async clearOldCache(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    // Clear old emails
    await emailDB.emails.where('cachedAt').below(cutoffISO).delete();
    
    // Clear old email bodies
    await emailDB.emailBodies.where('cachedAt').below(cutoffISO).delete();
    
    // Clear old folders
    await emailDB.folders.where('cachedAt').below(cutoffISO).delete();
  }

  // Get cache statistics
  static async getCacheStats(): Promise<{
    totalEmails: number;
    totalBodies: number;
    totalFolders: number;
    oldestEmail?: string;
    newestEmail?: string;
  }> {
    const [totalEmails, totalBodies, totalFolders] = await Promise.all([
      emailDB.emails.count(),
      emailDB.emailBodies.count(),
      emailDB.folders.count()
    ]);

    const emailsByDate = await emailDB.emails.toCollection().sortBy('cachedAt');
    const oldestEmail = emailsByDate[0];
    const newestEmail = emailsByDate[emailsByDate.length - 1];

    return {
      totalEmails,
      totalBodies,
      totalFolders,
      oldestEmail: oldestEmail?.cachedAt,
      newestEmail: newestEmail?.cachedAt
    };
  }

  // Check if email exists in cache
  static async emailExists(emailId: string): Promise<boolean> {
    const count = await emailDB.emails.where('id').equals(emailId).count();
    return count > 0;
  }

  // Get emails newer than a specific UID (for incremental sync)
  static async getEmailsNewerThan(folder: string, uid: number): Promise<EmailMessage[]> {
    const cachedEmails = await emailDB.emails
      .where('folder')
      .equals(folder)
      .and(email => email.uid > uid)
      .toArray();

    return cachedEmails.map(cached => ({
      ...cached,
      date: new Date(cached.date)
    }));
  }

  // Delete email from cache
  static async deleteEmail(emailId: string): Promise<void> {
    await emailDB.transaction('rw', [emailDB.emails, emailDB.emailBodies], async () => {
      await emailDB.emails.delete(emailId);
      await emailDB.emailBodies.delete(emailId);
    });
  }

  // Update email flags (read/unread, flagged, etc.)
  static async updateEmailFlags(emailId: string, updates: Partial<Pick<EmailMessage, 'isRead' | 'isFlagged' | 'isAnswered'>>): Promise<void> {
    await emailDB.emails.update(emailId, updates);
  }
}