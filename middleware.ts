import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken, updateUserActivity, shouldRefreshSession } from '@/app/lib/auth/session';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      
      // Update user activity for all requests to protected routes
      if (isProtectedRoute) {
        updateUserActivity(parsed.user.id);
      }
      
      // Only refresh session if it should be refreshed (smart refresh logic)
      if (shouldRefreshSession(parsed)) {
        console.log(`Refreshing session for user ${parsed.user.id}`);
        const expiresInOneHour = new Date(Date.now() + 60 * 60 * 1000);

        res.cookies.set({
          name: 'session',
          value: await signToken({
            ...parsed,
            expires: expiresInOneHour.toISOString()
          }),
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          expires: expiresInOneHour
        });
      }
    } catch (error) {
      console.error('Error processing session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
