import { NextRequest, NextResponse } from 'next/server';
import { createEmailService, ImapEmailService } from '@/app/lib/email-imap/email-service';

let emailService: ImapEmailService | null = null;
let connectionPromise: Promise<ImapEmailService> | null = null;

async function getEmailService(): Promise<ImapEmailService> {
  if (emailService && emailService.getConnectionStatus().connected) {
    return emailService;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const service = createEmailService();
      await service.connect();
      console.log('IMAP service connected successfully');
      emailService = service;
      return service;
    } catch (error) {
      console.error('Failed to connect to IMAP service:', error);
      emailService = null;
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();
  return connectionPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, folder = 'INBOX', limit = 50, uid } = body;

    const service = await getEmailService();

    switch (action) {
      case 'getEmails':
        const emails = await service.fetchEmails({ folder, limit });
        return NextResponse.json({ success: true, data: emails });

      case 'getEmailsNewerThan':
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });
        }
        const newerEmails = await service.fetchEmailsNewerThan(folder, uid);
        return NextResponse.json({ success: true, data: newerEmails });

      case 'getFolders':
        const folders = await service.listFolders();
        return NextResponse.json({ success: true, data: folders });

      case 'getEmailBody':
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });
        }
        const emailBody = await service.fetchEmailBody(folder, uid);
        return NextResponse.json({ success: true, data: emailBody });

      case 'markAsRead':
        if (!uid || typeof body.isRead !== 'boolean') {
          return NextResponse.json({ success: false, error: 'UID and isRead required' }, { status: 400 });
        }
        await service.markAsReadInFolder(folder, uid, body.isRead);
        return NextResponse.json({ success: true });

      case 'markAsFlagged':
        if (!uid || typeof body.isFlagged !== 'boolean') {
          return NextResponse.json({ success: false, error: 'UID and isFlagged required' }, { status: 400 });
        }
        await service.markAsFlagged(folder, uid, body.isFlagged);
        return NextResponse.json({ success: true });

      case 'deleteEmail':
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });
        }
        await service.deleteEmailInFolder(folder, uid);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}