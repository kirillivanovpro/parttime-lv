import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/profile', '/chat', '/listings/create'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtected) {
    // Supabase stores the session in a cookie named sb-<project>-auth-token.
    // A missing cookie means unauthenticated — redirect to /auth.
    // Full server-side session validation happens inside the page via getUser().
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.includes('-auth-token'));

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile', '/profile/:path*', '/chat', '/chat/:path*', '/listings/create'],
};
