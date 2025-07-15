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

// Create database instance (only on client side)
let emailDB: EmailDatabase | null = null;

function getEmailDB(): EmailDatabase {
  if (typeof window === 'undefined') {
    throw new Error('EmailDatabase can only be used on the client side');
  }
  
  if (!emailDB) {
    emailDB = new EmailDatabase();
  }
  
  return emailDB;
}

export { getEmailDB };

// Database utility functions
export class EmailCache {
  
  // Cache emails with metadata
  static async cacheEmails(emails: EmailMessage[], folder: string): Promise<void> {
    const cachedEmails: CachedEmailMessage[] = emails.map(email => ({
      ...email,
      date: (email.date instanceof Date ? email.date : new Date(email.date)).toISOString(),
      cachedAt: new Date().toISOString(),
      folder,
      bodyLoaded: !!email.html || !!email.text
    }));

    await getEmailDB().emails.bulkPut(cachedEmails);
  }

  // Get cached emails for a folder
  static async getCachedEmails(folder: string, limit?: number): Promise<EmailMessage[]> {
    let collection = getEmailDB().emails
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

    await getEmailDB().emailBodies.put(body);
    
    // Update email to mark body as loaded
    await getEmailDB().emails.update(emailId, { bodyLoaded: true });
  }

  // Get cached email body
  static async getCachedEmailBody(emailId: string): Promise<CachedEmailBody | undefined> {
    return await getEmailDB().emailBodies.get(emailId);
  }

  // Cache folders
  static async cacheFolders(folders: EmailFolder[]): Promise<void> {
    const cachedFolders: CachedFolder[] = folders.map(folder => ({
      ...folder,
      cachedAt: new Date().toISOString()
    }));

    await getEmailDB().folders.bulkPut(cachedFolders);
  }

  // Get cached folders
  static async getCachedFolders(): Promise<EmailFolder[]> {
    const cached = await getEmailDB().folders.toArray();
    return cached.map(({ cachedAt, ...folder }) => folder);
  }

  // Update sync info
  static async updateSyncInfo(folder: string, lastUid: number): Promise<void> {
    const syncInfo: SyncInfo = {
      id: `sync_${folder}`,
      folder,
      lastSyncTime: new Date().toISOString(),
      lastUid
    };

    await getEmailDB().syncInfo.put(syncInfo);
  }

  // Get sync info for incremental sync
  static async getSyncInfo(folder: string): Promise<SyncInfo | undefined> {
    return await getEmailDB().syncInfo.get(`sync_${folder}`);
  }

  // Clear old cache (cleanup)
  static async clearOldCache(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    // Clear old emails
    await getEmailDB().emails.where('cachedAt').below(cutoffISO).delete();
    
    // Clear old email bodies
    await getEmailDB().emailBodies.where('cachedAt').below(cutoffISO).delete();
    
    // Clear old folders
    await getEmailDB().folders.where('cachedAt').below(cutoffISO).delete();
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
      getEmailDB().emails.count(),
      getEmailDB().emailBodies.count(),
      getEmailDB().folders.count()
    ]);

    const emailsByDate = await getEmailDB().emails.toCollection().sortBy('cachedAt');
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
    const count = await getEmailDB().emails.where('id').equals(emailId).count();
    return count > 0;
  }

  // Get emails newer than a specific UID (for incremental sync)
  static async getEmailsNewerThan(folder: string, uid: number): Promise<EmailMessage[]> {
    const cachedEmails = await getEmailDB().emails
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
    await getEmailDB().transaction('rw', [getEmailDB().emails, getEmailDB().emailBodies], async () => {
      await getEmailDB().emails.delete(emailId);
      await getEmailDB().emailBodies.delete(emailId);
    });
  }

  // Update email flags (read/unread, flagged, etc.)
  static async updateEmailFlags(emailId: string, updates: Partial<Pick<EmailMessage, 'isRead' | 'isFlagged' | 'isAnswered'>>): Promise<void> {
    await getEmailDB().emails.update(emailId, updates);
  }
}