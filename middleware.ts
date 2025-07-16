import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/app/lib/auth/tokens';
import { verifyToken } from '@/app/lib/auth/session';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Try new token system first
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  let res = NextResponse.next();

  if (accessToken) {
    // Verify access token
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      // Valid access token, continue
      return res;
    }
  }

  // Access token invalid/missing, check if refresh token exists
  if (refreshToken) {
    // Let the client handle the refresh by redirecting to a refresh endpoint
    // This avoids complex token refresh logic in middleware
    res.headers.set('X-Token-Refresh-Required', 'true');
    return res;
  }

  // Fall back to legacy session token
  const sessionCookie = request.cookies.get('session');
  if (sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      if (parsed && new Date(parsed.expires) > new Date()) {
        // Valid legacy session, continue
        return res;
      }
    } catch (error) {
      console.error('Legacy session verification failed:', error);
    }
  }

  // No valid tokens found, redirect to sign-in
  return NextResponse.redirect(new URL('/sign-in', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
