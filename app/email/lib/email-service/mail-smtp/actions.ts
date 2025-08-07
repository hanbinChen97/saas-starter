'use server';

import { SMTPService } from './smtp-service';
import type { SMTPAuthRequest, SMTPSendOptions } from './types';
import type { EmailAddress } from '../mail-imap/types';

export async function sendEmailAction(
  smtpConfig: SMTPAuthRequest,
  emailData: SMTPSendOptions
) {
  try {
    const smtpService = new SMTPService({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      username: smtpConfig.username,
      password: emailData.password,
      senderEmail: smtpConfig.senderEmail,
    });

    await smtpService.connect();

    // Convert string arrays to EmailAddress arrays
    const to: EmailAddress[] = emailData.to.map(email => ({ address: email }));
    const cc: EmailAddress[] | undefined = emailData.cc?.map(email => ({ address: email }));
    const bcc: EmailAddress[] | undefined = emailData.bcc?.map(email => ({ address: email }));
    const replyTo: EmailAddress | undefined = emailData.replyTo ? { address: emailData.replyTo } : undefined;

    await smtpService.sendEmail({
      to,
      cc,
      bcc,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      replyTo,
    });

    await smtpService.disconnect();

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function testSMTPConnection(config: SMTPAuthRequest) {
  try {
    const smtpService = new SMTPService({
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.password,
      senderEmail: config.senderEmail,
    });

    await smtpService.connect();
    await smtpService.disconnect();

    return { success: true, message: 'SMTP connection successful' };
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
}