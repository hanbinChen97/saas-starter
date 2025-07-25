import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken, updateUserActivity, shouldRefreshSession } from '@/app/lib/auth/session';

const protectedRoutes = ['/', '/dashboard/main', '/superc/main', '/superc/profile'];

// Module-specific login routes mapping
const moduleLoginRoutes: Record<string, string> = {
  '/': '/sign-in',
  '/dashboard/main': '/dashboard/login',
  '/superc/main': '/superc/login',
  '/superc/profile': '/superc/login'
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  if (isProtectedRoute && !sessionCookie) {
    // Find the appropriate login route for the module
    const moduleRoute = Object.keys(moduleLoginRoutes).find(route => 
      route === '/' ? pathname === '/' : pathname.startsWith(route)
    );
    const loginRoute = moduleRoute ? moduleLoginRoutes[moduleRoute] : '/sign-in';
    
    // Add redirect parameter to preserve the original destination
    const redirectUrl = new URL(loginRoute, request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(redirectUrl);
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
