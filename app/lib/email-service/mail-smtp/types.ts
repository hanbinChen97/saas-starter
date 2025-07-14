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
  username: string; // Login username (e.g., ab123456@rwth-aachen.de)
  password: string;
  host: string;
  port: number;
  secure: boolean;
  senderEmail?: string; // Actual email address for sending (e.g., max.mustermann@rwth-aachen.de)
}