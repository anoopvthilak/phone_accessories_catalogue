import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth.js';

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internal assets, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isAuthenticated = !!session;

  // Check if current path is a public path
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // If user is already authenticated and visits /login, redirect to homepage / catalogue
  if (pathname === '/login' && isAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/';
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // Allow unauthenticated access only to public routes
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If unauthenticated, redirect to /login or return 401 for API routes
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required to access this resource' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection: /admin routes require ADMIN role, except product management (add/edit) which STAFF can also perform per specifications
  const isProductManageRoute = pathname.startsWith('/admin/products');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute && !isProductManageRoute && session.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator privileges required' },
        { status: 403 }
      );
    }
    // Redirect unauthorized staff members to catalogue
    return NextResponse.redirect(new URL('/?error=forbidden', request.url));
  }

  // Forward user details in request headers for upstream components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.sub || '');
  requestHeaders.set('x-user-role', session.role || '');
  requestHeaders.set('x-user-username', session.username || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except _next/static, _next/image, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
