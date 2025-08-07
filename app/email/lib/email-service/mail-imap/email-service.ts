import Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailMessage, EmailFolder, EmailFetchOptions, EmailConnectionConfig, EmailService, SendEmailOptions } from './types';
import { EmailParser } from './email-parser';

export class ImapEmailService implements EmailService {
  private imap: Imap;
  private smtpTransporter: any;
  private config: EmailConnectionConfig;
  private isConnected = false;

  constructor(config: EmailConnectionConfig) {
    this.config = config;
    this.imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: config.tlsOptions || { 
        rejectUnauthorized: false,
        secureProtocol: 'TLSv1_2_method'
      },
      authTimeout: config.authTimeout || 3000,
      connTimeout: config.connTimeout || 10000,
      keepalive: false,
    });

    // SMTP transporter will be initialized when needed
    this.smtpTransporter = null;

    this.setupEventHandlers();
  }

  private async initSMTPTransporter(): Promise<void> {
    if (this.smtpTransporter) return;
    
    try {
      const nodemailer = require('nodemailer');
      
      // Use the correct function name: createTransport (not createTransporter)
      // Try SSL on port 465 first, fallback to STARTTLS on 587
      const smtpPort = this.config.smtpPort || 465;
      const useSSL = smtpPort === 465;
      
      this.smtpTransporter = nodemailer.createTransport({
        host: this.config.smtpHost || this.config.host,
        port: smtpPort,
        secure: useSSL, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: {
          user: this.config.username,
          pass: this.config.password,
        },
        tls: {
          rejectUnauthorized: false,
          servername: this.config.smtpHost || this.config.host,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        debug: true,
        logger: true,
      });
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      throw new Error(`Failed to initialize email sending: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupEventHandlers(): void {
    this.imap.once('ready', () => {
      console.log('IMAP connection ready');
      this.isConnected = true;
    });

    this.imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      console.log('IMAP connection ended');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      console.log(`Attempting IMAP connection to ${this.config.host}:${this.config.port} with user ${this.config.username}`);

      this.imap.once('ready', () => {
        console.log('IMAP connection ready');
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error during connect:', err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      this.imap.once('end', () => {
        this.isConnected = false;
        resolve();
      });

      this.imap.end();
    });
  }

  async listFolders(): Promise<EmailFolder[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const folders: EmailFolder[] = [];
        
        const parseBoxes = (boxList: any, prefix = '') => {
          for (const [name, box] of Object.entries(boxList)) {
            const boxData = box as any;
            const fullPath = prefix ? `${prefix}${boxData.delimiter}${name}` : name;
            
            folders.push({
              name,
              path: fullPath,
              delimiter: boxData.delimiter || '/',
              attributes: boxData.attribs || [],
              flags: []
            });

            if (boxData.children) {
              parseBoxes(boxData.children, fullPath);
            }
          }
        };

        parseBoxes(boxes);
        resolve(folders);
      });
    });
  }

  async fetchEmails(options: EmailFetchOptions = {}): Promise<EmailMessage[]> {
    const folder = options.folder || 'INBOX';
    const limit = options.limit || 20;
    const unreadOnly = options.unreadOnly || false;

    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        if (!box || box.messages.total === 0) {
          resolve([]);
          return;
        }

        let searchCriteria: any[] = ['ALL'];
        if (unreadOnly) {
          searchCriteria = ['UNSEEN'];
        }
        if (options.since) {
          searchCriteria.push(['SINCE', options.since]);
        }

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          // Get the most recent messages first
          const messageIds = results.slice(-limit).reverse();
          const emails: EmailMessage[] = [];
          let processedCount = 0;

          const fetch = this.imap.fetch(messageIds, {
            bodies: '',
            struct: true,
            envelope: true,
            markSeen: false
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let attrs: any;

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attributes) => {
              attrs = attributes;
            });

            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(buffer);
                const email = EmailParser.parseEmail(parsed, attrs);
                emails.push(email);
                processedCount++;

                if (processedCount === messageIds.length) {
                  // Sort by date descending (newest first)
                  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve(emails);
                }
              } catch (parseError) {
                console.error('Error parsing email:', parseError);
                processedCount++;
                if (processedCount === messageIds.length) {
                  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve(emails);
                }
              }
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            // This will be called when all messages are processed
            if (processedCount === 0) {
              resolve([]);
            }
          });
        });
      });
    });
  }

  async markAsRead(uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.addFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async markAsUnread(uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.delFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteEmail(uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.addFlags(uid, ['\\Deleted'], (err) => {
        if (err) {
          reject(err);
        } else {
          this.imap.expunge((expungeErr) => {
            if (expungeErr) {
              reject(expungeErr);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  async fetchEmailsNewerThan(folder: string, uid: number): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        if (!box || box.messages.total === 0) {
          resolve([]);
          return;
        }

        // Search for messages with UID greater than the specified UID
        this.imap.search([['UID', `${uid + 1}:*`]], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          const emails: EmailMessage[] = [];
          let processedCount = 0;

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true,
            envelope: true,
            markSeen: false
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let attrs: any;

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attributes) => {
              attrs = attributes;
            });

            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(buffer);
                const email = EmailParser.parseEmail(parsed, attrs);
                emails.push(email);
                processedCount++;

                if (processedCount === results.length) {
                  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve(emails);
                }
              } catch (parseError) {
                console.error('Error parsing email:', parseError);
                processedCount++;
                if (processedCount === results.length) {
                  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve(emails);
                }
              }
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            if (processedCount === 0) {
              resolve([]);
            }
          });
        });
      });
    });
  }

  async fetchEmailBody(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const fetch = this.imap.fetch([uid], {
          bodies: '',
          struct: true,
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', async () => {
            try {
              const parsed: ParsedMail = await simpleParser(buffer);
              resolve({
                text: parsed.text || undefined,
                html: parsed.html || undefined
              });
            } catch (parseError) {
              console.error('Error parsing email body:', parseError);
              reject(parseError);
            }
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });
      });
    });
  }

  async markAsFlagged(folder: string, uid: number, flagged: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const operation = flagged 
          ? this.imap.addFlags.bind(this.imap)
          : this.imap.delFlags.bind(this.imap);

        operation([uid], ['\\Flagged'], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async markAsReadInFolder(folder: string, uid: number, isRead: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const operation = isRead 
          ? this.imap.addFlags.bind(this.imap)
          : this.imap.delFlags.bind(this.imap);

        operation([uid], ['\\Seen'], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async deleteEmailInFolder(folder: string, uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IMAP server'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        this.imap.addFlags([uid], ['\\Deleted'], (err) => {
          if (err) {
            reject(err);
          } else {
            this.imap.expunge((expungeErr) => {
              if (expungeErr) {
                reject(expungeErr);
              } else {
                resolve();
              }
            });
          }
        });
      });
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    // Initialize SMTP transporter if not already done
    await this.initSMTPTransporter();

    const mailOptions = {
      from: {
        name: this.config.username.split('@')[0], // Use username part as display name
        address: this.config.username
      },
      to: options.to.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address),
      cc: options.cc?.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address),
      bcc: options.bcc?.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address),
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo ? (options.replyTo.name ? `${options.replyTo.name} <${options.replyTo.address}>` : options.replyTo.address) : this.config.username,
      inReplyTo: options.inReplyTo,
      references: options.references,
      envelope: {
        from: this.config.username, // Explicitly set envelope sender
        to: options.to.map(addr => addr.address)
      }
    };

    try {
      await this.smtpTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      serverInfo: {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username
      }
    };
  }
}

// Factory function to create email service instance with user credentials
export function createEmailService(username?: string, password?: string): ImapEmailService {
  // Only use environment variables for server configuration, never for user credentials
  const config: EmailConnectionConfig = {
    host: process.env.RWTH_MAIL_SERVER!,
    port: parseInt(process.env.RWTH_MAIL_SERVER_IMAP_PORT!),
    username: username || '', // User must provide username
    password: password || '', // User must provide password
    tls: process.env.RWTH_MAIL_SERVER_ENCRYPTION === 'SSL',
    tlsOptions: { 
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_2_method'
    },
    authTimeout: 10000,
    connTimeout: 15000,
    smtpHost: process.env.RWTH_MAIL_SERVER_SMTP_HOST || process.env.RWTH_MAIL_SERVER!,
    smtpPort: parseInt(process.env.RWTH_MAIL_SERVER_SMTP_PORT || '587'),
    smtpSecure: process.env.RWTH_MAIL_SERVER_SMTP_SECURE === 'true',
  };

  return new ImapEmailService(config);
}

// Legacy function for backward compatibility - throws error to enforce user login
export function createEmailServiceFromEnv(): never {
  throw new Error('User credentials must be provided through login form for security. Environment variable authentication is disabled.');
}