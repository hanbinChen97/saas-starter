import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/app/lib/db/schema';

// Re-export everything from the new tokens module for backward compatibility
export {
  hashPassword,
  comparePasswords,
  setSession,
  getSession,
  verifyToken,
  signToken,
  setTokens,
  clearTokens,
  refreshAccessToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
} from './tokens';

// Keep the old implementation as a fallback
const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPasswordLegacy(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswordsLegacy(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signTokenLegacy(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyTokenLegacy(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSessionLegacy() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyTokenLegacy(session);
}

export async function setSessionLegacy(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signTokenLegacy(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}
