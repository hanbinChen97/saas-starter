import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/tokens';
import { 
  storeEmailCredentials, 
  getEmailCredentials, 
  removeEmailCredentials,
  hasValidEmailCredentials 
} from '@/app/lib/auth/email-credentials';
import { validateEmailCredentials } from '@/app/lib/email-service/mail-imap/email-auth';

/**
 * POST /api/auth/email-credentials - Store email credentials
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { username, password, emailAddress, host, port, encryption } = body;

    // Validate required fields
    if (!username || !password || !emailAddress || !host) {
      return NextResponse.json({ 
        success: false, 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    const credentials = {
      username,
      password,
      emailAddress,
      host,
      port: port || 993,
      encryption: encryption || 'SSL'
    };

    // Validate credentials by testing the connection
    console.log('[Email Credentials] Validating credentials for:', username);
    const validationResult = await validateEmailCredentials({
      username: credentials.username,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      encryption: credentials.encryption
    });

    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: validationResult.error || 'Invalid email credentials' 
      }, { status: 400 });
    }

    // Store encrypted credentials
    const stored = await storeEmailCredentials(user.id, credentials);
    
    if (stored) {
      return NextResponse.json({ 
        success: true,
        message: 'Email credentials stored successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to store email credentials' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Email Credentials] Store error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to store email credentials' 
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/email-credentials - Get stored email credentials status
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const hasCredentials = await hasValidEmailCredentials(user.id);
    
    if (hasCredentials) {
      const credentials = await getEmailCredentials(user.id);
      return NextResponse.json({ 
        success: true,
        hasCredentials: true,
        credentials: credentials ? {
          username: credentials.username,
          emailAddress: credentials.emailAddress,
          host: credentials.host,
          port: credentials.port,
          encryption: credentials.encryption
          // Note: password is never returned
        } : null
      });
    } else {
      return NextResponse.json({ 
        success: true,
        hasCredentials: false,
        credentials: null
      });
    }
  } catch (error) {
    console.error('[Email Credentials] Get error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve email credentials status' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/email-credentials - Remove stored email credentials
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const removed = await removeEmailCredentials(user.id);
    
    if (removed) {
      return NextResponse.json({ 
        success: true,
        message: 'Email credentials removed successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to remove email credentials' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Email Credentials] Delete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove email credentials' 
    }, { status: 500 });
  }
}