import { ParsedMail } from 'mailparser';
import { EmailMessage } from './types';

export class EmailParser {
  static parseEmail(parsed: ParsedMail, attrs: any): EmailMessage {
    // Handle from field
    const from = (parsed.from as any)?.value?.[0] || parsed.from;
    const fromAddress = typeof from === 'object' && from && 'address' in from ? {
      name: (from as any).name || '',
      address: (from as any).address || ''
    } : {
      name: '',
      address: typeof parsed.from === 'string' ? parsed.from : ''
    };

    // Handle to field
    const toAddresses = (parsed.to as any)?.value || (Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : []);
    const toList = toAddresses.map((addr: any) => ({
      name: addr.name || '',
      address: addr.address || (typeof addr === 'string' ? addr : '')
    }));

    // Handle cc field
    const ccAddresses = (parsed.cc as any)?.value || (Array.isArray(parsed.cc) ? parsed.cc : parsed.cc ? [parsed.cc] : []);
    const ccList = ccAddresses.map((addr: any) => ({
      name: addr.name || '',
      address: addr.address || (typeof addr === 'string' ? addr : '')
    }));

    // Handle attachments
    const attachments = (parsed.attachments || []).map((a: any) => ({
      filename: a.filename || 'untitled',
      contentType: a.contentType || 'application/octet-stream',
      size: a.size || 0,
    }));

    return {
      id: parsed.messageId || `uid-${attrs.uid}`,
      uid: attrs.uid,
      subject: parsed.subject || '(No Subject)',
      from: fromAddress,
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      date: parsed.date || new Date(),
      text: parsed.text || '',
      html: typeof parsed.html === 'string' ? parsed.html : (parsed.html ? String(parsed.html) : undefined),
      attachments,
      flags: attrs.flags || [],
      isRead: (attrs.flags || []).includes('\\Seen'),
      isFlagged: (attrs.flags || []).includes('\\Flagged'),
      isAnswered: (attrs.flags || []).includes('\\Answered'),
      isDeleted: (attrs.flags || []).includes('\\Deleted'),
    };
  }

  static getEmailPreview(email: EmailMessage): string {
    const text = email.text || '';
    // Remove extra whitespace and newlines for preview
    const cleanText = text.replace(/\s+/g, ' ').trim();
    return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
  }
}