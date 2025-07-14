import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailAddress, EmailConnectionConfig, SendEmailOptions } from '../mail-imap/types';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string; // Login username (e.g., ab123456@rwth-aachen.de)
  password: string;
  senderEmail?: string; // Actual email address for sending (e.g., max.mustermann@rwth-aachen.de)
}

export class SMTPService {
  private transporter: Transporter | null = null;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: false, // false for port 587 with STARTTLS
        auth: {
          user: this.config.username,
          pass: this.config.password,
        },
        debug: true,
        logger: true,
      });

      // Verify connection
      await this.transporter.verify();
    } catch (error) {
      throw new Error(`Failed to connect to SMTP server: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP service not connected');
    }

    console.log('Sending email with username:', this.config.username);
    console.log('Raw senderEmail config:', this.config.senderEmail);
    console.log('Using sender email:', this.config.senderEmail || this.config.username);
    
    // Use senderEmail if provided, otherwise fall back to username
    const senderAddress = this.config.senderEmail || this.config.username;
    console.log('Final senderAddress:', senderAddress);
    
    // Make sure we're using the senderEmail when it's provided
    if (!this.config.senderEmail) {
      console.warn('WARNING: No senderEmail provided, using username as sender which may cause permission errors');
    }
    
    // Extract pure email address for envelope (remove display name if present)
    const extractEmailAddress = (emailString: string): string => {
      const match = emailString.match(/<([^>]+)>/);
      return match ? match[1] : emailString;
    };
    
    const pureEmailAddress = extractEmailAddress(senderAddress);
    
    // Use proper sender format
    const fromFormat = senderAddress.includes('<') ? senderAddress : `Max Mustermann <${senderAddress}>`;
    const envelopeFrom = extractEmailAddress(fromFormat);
    
    const mailOptions = {
      // Use the sender email address format
      from: fromFormat,
      to: options.to.map(addr => this.formatEmailAddress(addr)).join(', '),
      cc: options.cc?.map(addr => this.formatEmailAddress(addr)).join(', '),
      bcc: options.bcc?.map(addr => this.formatEmailAddress(addr)).join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo ? this.formatEmailAddress(options.replyTo) : undefined,
      inReplyTo: options.inReplyTo,
      references: options.references,
      // Envelope MUST use pure email address without display name
      envelope: {
        from: envelopeFrom,
        to: options.to.map(addr => addr.address)
      }
    };

    // Debug: Output the complete email format being sent
    console.log('=== DEBUG: Complete mailOptions object ===');
    console.log(JSON.stringify(mailOptions, null, 2));
    console.log('=== DEBUG: SMTP Auth Config ===');
    console.log({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      username: this.config.username,
      passwordLength: this.config.password.length
    });
    console.log('=== DEBUG: Individual Field Values ===');
    console.log('From object:', mailOptions.from);
    console.log('Envelope from:', mailOptions.envelope.from);
    console.log('Envelope to:', mailOptions.envelope.to);
    console.log('To field:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('=== END DEBUG ===');

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  private formatEmailAddress(addr: EmailAddress): string {
    return addr.name ? `"${addr.name}" <${addr.address}>` : addr.address;
  }

  isConnected(): boolean {
    return this.transporter !== null;
  }
}