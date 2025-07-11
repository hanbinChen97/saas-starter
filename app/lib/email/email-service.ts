import Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailMessage, EmailFolder, EmailFetchOptions, EmailConnectionConfig, EmailService } from './types';
import { EmailParser } from './email-parser';

export { ImapEmailService };

export class ImapEmailService implements EmailService {
  private imap: Imap;
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
      tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
      authTimeout: config.authTimeout || 3000,
      connTimeout: config.connTimeout || 10000,
      keepalive: false,
    });

    this.setupEventHandlers();
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

      this.imap.once('ready', () => {
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err: Error) => {
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

// Factory function to create email service instance
export function createEmailService(): ImapEmailService {
  const config: EmailConnectionConfig = {
    host: process.env.RWTH_MAIL_SERVER!,
    port: parseInt(process.env.RWTH_MAIL_SERVER_PORT!),
    username: process.env.EXCHANGE_USERNAME!,
    password: process.env.EXCHANGE_PASSWORD!,
    tls: process.env.RWTH_MAIL_SERVER_ENCRYPTION === 'SSL',
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    connTimeout: 15000,
  };

  return new ImapEmailService(config);
}