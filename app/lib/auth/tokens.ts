import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser, RefreshToken, NewRefreshToken } from '@/app/lib/db/schema';
import { db } from '@/app/lib/db/drizzle';
import { refreshTokens } from '@/app/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// Types for tokens
type AccessTokenData = {
  user: { id: number };
  type: 'access';
  expires: string;
};

type RefreshTokenData = {
  user: { id: number };
  type: 'refresh';
  expires: string;
  jti: string; // JWT ID for refresh token tracking
};

export async function signAccessToken(userId: number): Promise<string> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const payload: AccessTokenData = {
    user: { id: userId },
    type: 'access',
    expires: expiresAt.toISOString(),
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(key);
}

export async function signRefreshToken(userId: number, deviceInfo?: string): Promise<{ token: string; dbToken: RefreshToken }> {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
  const jti = crypto.randomUUID();
  
  const payload: RefreshTokenData = {
    user: { id: userId },
    type: 'refresh',
    expires: expiresAt.toISOString(),
    jti,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setJti(jti)
    .sign(key);

  // Store refresh token in database
  const newRefreshToken: NewRefreshToken = {
    userId,
    token: jti, // Store only the JTI, not the full token
    expiresAt,
    deviceInfo: deviceInfo || 'Unknown device',
    isRevoked: false,
  };

  const [dbToken] = await db.insert(refreshTokens).values(newRefreshToken).returning();
  return { token, dbToken };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenData | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    
    const tokenData = payload as AccessTokenData;
    if (tokenData.type !== 'access') {
      return null;
    }
    
    return tokenData;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenData | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    
    const tokenData = payload as RefreshTokenData;
    if (tokenData.type !== 'refresh') {
      return null;
    }

    // Check if token exists in database and is not revoked
    const dbToken = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, tokenData.jti),
          eq(refreshTokens.userId, tokenData.user.id),
          eq(refreshTokens.isRevoked, false),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (dbToken.length === 0) {
      return null;
    }
    
    return tokenData;
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.token, jti));
}

export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.userId, userId));
}

export async function setTokens(user: NewUser, deviceInfo?: string) {
  const accessToken = await signAccessToken(user.id!);
  const { token: refreshToken } = await signRefreshToken(user.id!, deviceInfo);

  const cookieStore = await cookies();
  
  // Set access token (shorter expiration, httpOnly)
  cookieStore.set('access_token', accessToken, {
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Set refresh token (longer expiration, httpOnly)
  cookieStore.set('refresh_token', refreshToken, {
    expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<AccessTokenData | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    return null;
  }
  
  return await verifyAccessToken(accessToken);
}

export async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  if (!refreshToken) {
    return null;
  }
  
  const refreshTokenData = await verifyRefreshToken(refreshToken);
  if (!refreshTokenData) {
    return null;
  }
  
  // Generate new access token
  const newAccessToken = await signAccessToken(refreshTokenData.user.id);
  
  // Update access token cookie
  cookieStore.set('access_token', newAccessToken, {
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  return newAccessToken;
}

export async function clearTokens() {
  const cookieStore = await cookies();
  
  // Get refresh token to revoke it
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (refreshToken) {
    const refreshTokenData = await verifyRefreshToken(refreshToken);
    if (refreshTokenData) {
      await revokeRefreshToken(refreshTokenData.jti);
    }
  }
  
  // Clear cookies
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

// Legacy support - maintain backward compatibility
export async function setSession(user: NewUser) {
  return setTokens(user);
}

// Legacy support - this is now just verifyAccessToken but keeping for compatibility
export async function verifyToken(token: string) {
  return verifyAccessToken(token);
}

// Legacy support - this is now signAccessToken but keeping for compatibility  
export async function signToken(payload: any) {
  if (payload.user && payload.user.id) {
    return signAccessToken(payload.user.id);
  }
  throw new Error('Invalid payload for token signing');
}