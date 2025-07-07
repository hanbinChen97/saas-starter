import { ImapEmailService, createEmailService } from './email-service';
import { EmailMessage, EmailFolder } from './types';

// Static wrapper class for email operations
export class EmailService {
  private static instance: ImapEmailService | null = null;

  private static async getInstance(): Promise<ImapEmailService> {
    if (!this.instance) {
      this.instance = createEmailService();
      await this.instance.connect();
    }
    return this.instance;
  }

  static async getFolders(): Promise<EmailFolder[]> {
    const service = await this.getInstance();
    return service.listFolders();
  }

  static async getEmails(folder: string = 'INBOX', limit: number = 50): Promise<EmailMessage[]> {
    const service = await this.getInstance();
    return service.fetchEmails({ folder, limit });
  }

  static async getEmailsNewerThan(folder: string, uid: number): Promise<EmailMessage[]> {
    const service = await this.getInstance();
    return service.fetchEmailsNewerThan(folder, uid);
  }

  static async getEmailBody(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
    const service = await this.getInstance();
    return service.fetchEmailBody(folder, uid);
  }

  static async markAsRead(folder: string, uid: number, isRead: boolean): Promise<void> {
    const service = await this.getInstance();
    return service.markAsReadInFolder(folder, uid, isRead);
  }

  static async markAsFlagged(folder: string, uid: number, isFlagged: boolean): Promise<void> {
    const service = await this.getInstance();
    return service.markAsFlagged(folder, uid, isFlagged);
  }

  static async deleteEmail(folder: string, uid: number): Promise<void> {
    const service = await this.getInstance();
    return service.deleteEmailInFolder(folder, uid);
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }

  static getConnectionStatus() {
    return this.instance?.getConnectionStatus() || { connected: false };
  }
}