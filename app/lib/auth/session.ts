import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/app/lib/db/schema';
import { 
  setAuthCookies, 
  clearAuthCookies, 
  getCurrentUser,
  refreshAccessToken 
} from './tokens';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// Legacy session types for backward compatibility
type LegacySessionData = {
  user: { id: number };
  expires: string;
};

// Legacy JWT functions for backward compatibility
export async function signToken(payload: LegacySessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as LegacySessionData;
}

/**
 * Get current user session (supports both new and legacy tokens)
 */
export async function getSession() {
  // Try new token system first
  const user = await getCurrentUser();
  if (user) {
    return {
      user,
      expires: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
    };
  }

  // Fall back to legacy session cookie
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  
  try {
    return await verifyToken(session);
  } catch {
    return null;
  }
}

/**
 * Set user session using new token system
 */
export async function setSession(user: NewUser) {
  if (!user.id) {
    throw new Error('User ID is required for setting session');
  }

  await setAuthCookies(user.id);
}

/**
 * Legacy setSession for backward compatibility
 */
export async function setLegacySession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: LegacySessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  const cookieStore = await cookies();
  cookieStore.set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/**
 * Clear all session data
 */
export async function clearSession() {
  await clearAuthCookies();
}

/**
 * Attempt to refresh the current session
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const newAccessToken = await refreshAccessToken();
    return !!newAccessToken;
  } catch {
    return false;
  }
}
