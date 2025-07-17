import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/app/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

// In-memory storage for user activity times
const userActivityMap = new Map<number, Date>();

// Activity timeout: 30 minutes
const ACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Session expiration: 1 hour
const SESSION_EXPIRATION = 60 * 60 * 1000;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 hour from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionData;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw error;
  }
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: NewUser) {
  const expiresInOneHour = new Date(Date.now() + SESSION_EXPIRATION);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneHour.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneHour,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  
  // Update user activity time
  updateUserActivity(user.id!);
}

// Update user activity time
export function updateUserActivity(userId: number) {
  userActivityMap.set(userId, new Date());
}

// Check if user is active within the activity timeout
export function isUserActive(userId: number): boolean {
  const lastActivity = userActivityMap.get(userId);
  if (!lastActivity) return false;
  
  const now = new Date();
  const timeSinceActivity = now.getTime() - lastActivity.getTime();
  return timeSinceActivity < ACTIVITY_TIMEOUT;
}

// Check if session should be refreshed
export function shouldRefreshSession(sessionData: SessionData): boolean {
  const userId = sessionData.user.id;
  const expiresAt = new Date(sessionData.expires);
  const now = new Date();
  
  // Check if session expires within 15 minutes
  const timeToExpiry = expiresAt.getTime() - now.getTime();
  const shouldRefreshByTime = timeToExpiry < 15 * 60 * 1000; // 15 minutes
  
  // Check if user is active
  const userIsActive = isUserActive(userId);
  
  return shouldRefreshByTime && userIsActive;
}
