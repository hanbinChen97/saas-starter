export interface SMTPConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
}

export interface SMTPSendOptions {
  password: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SMTPAuthRequest {
  username: string; // SMTP login username (e.g., yw612241@rwth-aachen.de)
  password: string;
  host: string;
  port: number;
  secure: boolean;
  senderEmail?: string; // Display email address for From field (e.g., hanbin.chen@rwth-aachen.de)
}