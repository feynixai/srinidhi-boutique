import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Custom middleware that accepts either NextAuth session OR JWT token
export default function middleware(req: NextRequest) {
  // Check for JWT token in cookie (set by client-side login)
  const adminToken = req.cookies.get('admin_token')?.value;

  // If there's a JWT token cookie, let the request through
  // (The actual token verification happens on the API side)
  if (adminToken) {
    return NextResponse.next();
  }

  // Fall back to NextAuth session check
  // We need to check if next-auth session cookie exists
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (sessionToken) {
    return NextResponse.next();
  }

  // No auth found — redirect to login
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
