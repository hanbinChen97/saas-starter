import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { db } from '@/app/lib/db/drizzle';
import { emailTokens, NewEmailToken } from '@/app/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

const algorithm = 'aes-256-gcm';
const scryptAsync = promisify(scrypt);

export interface EmailCredentials {
  username: string;
  password: string;
  emailAddress: string;
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

/**
 * Derive encryption key from AUTH_SECRET and salt
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  
  return (await scryptAsync(secret, salt, 32)) as Buffer;
}

/**
 * Encrypt email credentials
 */
async function encryptCredentials(credentials: EmailCredentials): Promise<string> {
  try {
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    const key = await deriveKey(salt);
    
    const cipher = createCipheriv(algorithm, key, iv);
    
    const credentialsString = JSON.stringify(credentials);
    let encrypted = cipher.update(credentialsString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Failed to encrypt credentials:', error);
    throw new Error('Credential encryption failed');
  }
}

/**
 * Decrypt email credentials
 */
async function decryptCredentials(encryptedData: string): Promise<EmailCredentials> {
  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 32);
    const authTag = combined.subarray(32, 48);
    const encrypted = combined.subarray(48);
    
    const key = await deriveKey(salt);
    
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted) as EmailCredentials;
  } catch (error) {
    console.error('Failed to decrypt credentials:', error);
    throw new Error('Credential decryption failed');
  }
}

/**
 * Store encrypted email credentials for a user
 */
export async function storeEmailCredentials(
  userId: number, 
  credentials: EmailCredentials
): Promise<boolean> {
  try {
    // Remove any existing email tokens for this user
    await db
      .delete(emailTokens)
      .where(eq(emailTokens.userId, userId));

    const encryptedCredentials = await encryptCredentials(credentials);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const newEmailToken: NewEmailToken = {
      userId,
      encryptedCredentials,
      expiresAt
    };

    await db.insert(emailTokens).values(newEmailToken);
    return true;
  } catch (error) {
    console.error('Failed to store email credentials:', error);
    return false;
  }
}

/**
 * Retrieve and decrypt email credentials for a user
 */
export async function getEmailCredentials(userId: number): Promise<EmailCredentials | null> {
  try {
    const result = await db
      .select()
      .from(emailTokens)
      .where(
        and(
          eq(emailTokens.userId, userId),
          gt(emailTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return await decryptCredentials(result[0].encryptedCredentials);
  } catch (error) {
    console.error('Failed to retrieve email credentials:', error);
    return null;
  }
}

/**
 * Remove email credentials for a user
 */
export async function removeEmailCredentials(userId: number): Promise<boolean> {
  try {
    await db
      .delete(emailTokens)
      .where(eq(emailTokens.userId, userId));
    
    return true;
  } catch (error) {
    console.error('Failed to remove email credentials:', error);
    return false;
  }
}

/**
 * Check if user has valid email credentials stored
 */
export async function hasValidEmailCredentials(userId: number): Promise<boolean> {
  try {
    const result = await db
      .select({ id: emailTokens.id })
      .from(emailTokens)
      .where(
        and(
          eq(emailTokens.userId, userId),
          gt(emailTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Failed to check email credentials:', error);
    return false;
  }
}

/**
 * Refresh email credentials expiry
 */
export async function refreshEmailCredentials(userId: number): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Extend by 7 days

    const result = await db
      .update(emailTokens)
      .set({ 
        expiresAt,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(emailTokens.userId, userId),
          gt(emailTokens.expiresAt, new Date())
        )
      );

    return true;
  } catch (error) {
    console.error('Failed to refresh email credentials:', error);
    return false;
  }
}

/**
 * Clean up expired email tokens
 */
export async function cleanupExpiredEmailTokens(): Promise<void> {
  try {
    await db
      .delete(emailTokens)
      .where(lt(emailTokens.expiresAt, new Date()));
  } catch (error) {
    console.error('Failed to cleanup expired email tokens:', error);
  }
}