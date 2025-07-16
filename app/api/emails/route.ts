import { NextRequest, NextResponse } from 'next/server';
import { 
  authenticateAndSyncEmails, 
  executeEmailOperation, 
  validateEmailCredentials,
  EmailAuthCredentials 
} from '@/app/lib/email-service/mail-imap/email-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, folder = 'INBOX', limit = 50, uid, credentials } = body;

    // Validate credentials for all operations
    if (!credentials) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email credentials required for all operations' 
      }, { status: 400 });
    }

    // Validate credentials format
    if (!credentials.username || !credentials.password || !credentials.host) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username, password, and host are required' 
      }, { status: 400 });
    }

    const emailCredentials: EmailAuthCredentials = {
      username: credentials.username,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port || 993,
      encryption: credentials.encryption || 'SSL'
    };

    switch (action) {
      case 'authenticate':
        // Test credentials only (no email sync)
        console.log('[API] Validating credentials for:', emailCredentials.username);
        const authResult = await validateEmailCredentials(emailCredentials);
        return NextResponse.json(authResult);

      case 'syncEmails':
        // One-time sync: connect, fetch emails, disconnect
        console.log('[API] Syncing emails for:', emailCredentials.username);
        const syncOptions = {
          folder,
          limit,
          unreadOnly: body.unreadOnly || false
        };
        const syncResult = await authenticateAndSyncEmails(emailCredentials, syncOptions);
        return NextResponse.json({
          success: syncResult.success,
          data: syncResult.emails,
          error: syncResult.error
        });

      case 'getEmailBody':
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });
        }
        console.log('[API] Fetching email body for UID:', uid);
        const bodyResult = await executeEmailOperation(emailCredentials, 'fetchEmailBody', { folder, uid });
        return NextResponse.json(bodyResult);

      case 'markAsRead':
        if (!uid || typeof body.isRead !== 'boolean') {
          return NextResponse.json({ success: false, error: 'UID and isRead required' }, { status: 400 });
        }
        console.log('[API] Marking email as read:', uid, body.isRead);
        const readResult = await executeEmailOperation(emailCredentials, 'markAsRead', { 
          folder, uid, isRead: body.isRead 
        });
        return NextResponse.json(readResult);

      case 'markAsFlagged':
        if (!uid || typeof body.isFlagged !== 'boolean') {
          return NextResponse.json({ success: false, error: 'UID and isFlagged required' }, { status: 400 });
        }
        console.log('[API] Marking email as flagged:', uid, body.isFlagged);
        const flagResult = await executeEmailOperation(emailCredentials, 'markAsFlagged', { 
          folder, uid, isFlagged: body.isFlagged 
        });
        return NextResponse.json(flagResult);

      case 'deleteEmail':
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });
        }
        console.log('[API] Deleting email:', uid);
        const deleteResult = await executeEmailOperation(emailCredentials, 'deleteEmail', { folder, uid });
        return NextResponse.json(deleteResult);

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API] Email operation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}