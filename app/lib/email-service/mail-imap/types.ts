export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  
}

export interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  text?: string;
  html?: string;
  attachments: EmailAttachment[];
  flags: string[];
  isRead: boolean;
  isFlagged: boolean;
  isAnswered: boolean;
  isDeleted: boolean;
}

export interface EmailFolder {
  name: string;
  path: string;
  delimiter: string;
  attributes: string[];
  flags: string[];
}

export interface EmailConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
    secureProtocol?: string;
  };
  authTimeout?: number;
  connTimeout?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
}

export interface EmailFetchOptions {
  folder?: string;
  limit?: number;
  offset?: number;
  since?: Date;
  search?: string;
  unreadOnly?: boolean;
  startDate?: Date;
}

export interface SendEmailOptions {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: EmailAddress;
  inReplyTo?: string;
  references?: string;
}

export interface EmailService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listFolders(): Promise<EmailFolder[]>;
  fetchEmails(options?: EmailFetchOptions): Promise<EmailMessage[]>;
  markAsRead(uid: number): Promise<void>;
  markAsUnread(uid: number): Promise<void>;
  deleteEmail(uid: number): Promise<void>;
  sendEmail(options: SendEmailOptions): Promise<void>;
}