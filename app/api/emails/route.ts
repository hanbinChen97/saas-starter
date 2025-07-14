import { NextRequest, NextResponse } from 'next/server';
import { createEmailService, ImapEmailService } from '@/app/lib/email-service/mail-imap/email-service';
import { getEmailService as getSessionEmailService, authenticateEmail } from '@/app/lib/email-service/mail-imap/email-auth';

// Removed global service variables to enforce session-based authentication

async function getEmailService(sessionId?: string): Promise<ImapEmailService> {
  // Always require session-based authentication for security
  if (!sessionId) {
    throw new Error('Email authentication required. Please login with your email credentials.');
  }

  const sessionService = await getSessionEmailService(sessionId);
  if (sessionService) {
    return sessionService;
  }

  // Session invalid or expired - require user to login again
  throw new Error('Email session expired. Please login again with your email credentials.');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, folder = 'INBOX', limit = 50, uid, sessionId, credentials } = body;

    // Handle authentication action
    if (action === 'authenticate') {
      if (!credentials) {
        return NextResponse.json({ success: false, error: 'Credentials required' }, { status: 400 });
      }
      const result = await authenticateEmail(credentials);
      return NextResponse.json(result);
    }

    const service = await getEmailService(sessionId);

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