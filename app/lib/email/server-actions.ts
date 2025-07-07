'use server';

import { createEmailService } from './email-service';
import { EmailMessage, EmailFolder } from './types';

let emailService: any = null;

async function getEmailService() {
  if (!emailService) {
    emailService = createEmailService();
    await emailService.connect();
  }
  return emailService;
}

export async function getFoldersAction(): Promise<EmailFolder[]> {
  try {
    const service = await getEmailService();
    return await service.listFolders();
  } catch (error) {
    console.error('Error getting folders:', error);
    throw error;
  }
}

export async function getEmailsAction(folder: string = 'INBOX', limit: number = 50): Promise<EmailMessage[]> {
  try {
    const service = await getEmailService();
    return await service.fetchEmails({ folder, limit });
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
}

export async function getEmailsNewerThanAction(folder: string, uid: number): Promise<EmailMessage[]> {
  try {
    const service = await getEmailService();
    return await service.fetchEmailsNewerThan(folder, uid);
  } catch (error) {
    console.error('Error getting newer emails:', error);
    throw error;
  }
}

export async function getEmailBodyAction(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
  try {
    const service = await getEmailService();
    return await service.fetchEmailBody(folder, uid);
  } catch (error) {
    console.error('Error getting email body:', error);
    throw error;
  }
}

export async function markAsReadAction(folder: string, uid: number, isRead: boolean): Promise<void> {
  try {
    const service = await getEmailService();
    return await service.markAsReadInFolder(folder, uid, isRead);
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}

export async function markAsFlaggedAction(folder: string, uid: number, isFlagged: boolean): Promise<void> {
  try {
    const service = await getEmailService();
    return await service.markAsFlagged(folder, uid, isFlagged);
  } catch (error) {
    console.error('Error marking email as flagged:', error);
    throw error;
  }
}

export async function deleteEmailAction(folder: string, uid: number): Promise<void> {
  try {
    const service = await getEmailService();
    return await service.deleteEmailInFolder(folder, uid);
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}