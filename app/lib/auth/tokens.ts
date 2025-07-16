import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { db } from '@/app/lib/db/drizzle';
import { refreshTokens, emailTokens, NewRefreshToken, NewEmailToken } from '@/app/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

const jwtSecret = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Long-lived refresh tokens
const EMAIL_TOKEN_EXPIRY_DAYS = 7; // Email credential tokens

export interface AccessTokenPayload {
  user: { id: number };
  type: 'access';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  user: { id: number };
  type: 'refresh';
  tokenId: string;
  iat: number;
  exp: number;
}

export interface EmailTokenPayload {
  user: { id: number };
  type: 'email';
  iat: number;
  exp: number;
}

/**
 * Generate a short-lived JWT access token
 */
export async function generateAccessToken(userId: number): Promise<string> {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    user: { id: userId },
    type: 'access'
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(jwtSecret);
}

/**
 * Generate a long-lived refresh token and store it in the database
 */
export async function generateRefreshToken(userId: number): Promise<string> {
  // Generate a unique token ID
  const tokenId = randomBytes(32).toString('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    user: { id: userId },
    type: 'refresh',
    tokenId
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_EXPIRY_DAYS}d`)
    .sign(jwtSecret);

  // Store the refresh token in database
  const newRefreshToken: NewRefreshToken = {
    userId,
    token: tokenId, // Store the token ID, not the full JWT
    expiresAt,
    isRevoked: 'false'
  };

  await db.insert(refreshTokens).values(newRefreshToken);

  return token;
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: ['HS256'],
    });
    
    // Validate payload structure
    if (
      typeof payload.type === 'string' && 
      payload.type === 'access' &&
      typeof payload.user === 'object' &&
      payload.user !== null &&
      typeof (payload.user as any).id === 'number'
    ) {
      return payload as unknown as AccessTokenPayload;
    } else {
      throw new Error('Invalid token payload structure');
    }
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: ['HS256'],
    });
    
    // Validate payload structure
    if (
      typeof payload.type === 'string' && 
      payload.type === 'refresh' &&
      typeof payload.user === 'object' &&
      payload.user !== null &&
      typeof (payload.user as any).id === 'number' &&
      typeof payload.tokenId === 'string'
    ) {
      const refreshPayload = payload as unknown as RefreshTokenPayload;

      // Check if the token exists and is not revoked in database
      const storedToken = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.token, refreshPayload.tokenId),
            eq(refreshTokens.userId, refreshPayload.user.id),
            eq(refreshTokens.isRevoked, 'false'),
            gt(refreshTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (storedToken.length === 0) {
        throw new Error('Refresh token not found or revoked');
      }

      return refreshPayload;
    } else {
      throw new Error('Invalid refresh token payload structure');
    }
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(tokenId: string, userId: number): Promise<boolean> {
  try {
    const result = await db
      .update(refreshTokens)
      .set({ 
        isRevoked: 'true',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(refreshTokens.token, tokenId),
          eq(refreshTokens.userId, userId)
        )
      );

    return true;
  } catch (error) {
    console.error('Failed to revoke refresh token:', error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user (useful for logout)
 */
export async function revokeAllRefreshTokens(userId: number): Promise<boolean> {
  try {
    await db
      .update(refreshTokens)
      .set({ 
        isRevoked: 'true',
        updatedAt: new Date()
      })
      .where(eq(refreshTokens.userId, userId));

    return true;
  } catch (error) {
    console.error('Failed to revoke all refresh tokens:', error);
    return false;
  }
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await db
      .update(refreshTokens)
      .set({ 
        isRevoked: 'true',
        updatedAt: new Date()
      })
      .where(lt(refreshTokens.expiresAt, new Date()));
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}

/**
 * Set authentication cookies (access token + refresh token)
 */
export async function setAuthCookies(userId: number): Promise<void> {
  const accessToken = await generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  const cookieStore = await cookies();

  // Set access token (shorter expiry, httpOnly)
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/'
  });

  // Set refresh token (longer expiry, httpOnly)
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // 30 days
    path: '/'
  });
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('session'); // Clear legacy session cookie if it exists
}

/**
 * Get current user from access token
 */
export async function getCurrentUser(): Promise<{ id: number } | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  const payload = await verifyAccessToken(accessToken);
  return payload?.user || null;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return null;
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  // Generate new access token
  const newAccessToken = await generateAccessToken(payload.user.id);

  // Update access token cookie
  cookieStore.set('access_token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/'
  });

  return newAccessToken;
}