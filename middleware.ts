import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, refreshAccessToken } from '@/app/lib/auth/tokens';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // If no access token, check if we have a refresh token
  if (!accessToken) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // Try to refresh the access token
    const response = NextResponse.next();
    
    try {
      // We can't call our own API during middleware, so we'll handle this in the app
      // Just redirect to sign-in for now if no access token
      return NextResponse.redirect(new URL('/sign-in', request.url));
    } catch (error) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Verify the access token
  const tokenData = await verifyAccessToken(accessToken);
  if (!tokenData) {
    // Access token is invalid/expired, try to refresh
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // For middleware, we can't refresh the token here directly
    // The client will need to handle the refresh
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Token is valid, continue
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
