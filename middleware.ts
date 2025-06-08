import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/api/v1/login',
  '/api/v1/register',
  '/api/v1/password_recovery',
  '/api/v1/verify_username',
  '/api/webhooks',
];

// Routes that require client key
const clientKeyRoutes = [
  '/api/v1/login',
  '/api/v1/register',
  '/api/v1/verify_username',
  '/api/v1/contact'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route requires client key
  if (clientKeyRoutes.some(route => pathname.startsWith(route))) {
    const clientKey = request.headers.get('key');
    
    if (!clientKey) {
      return NextResponse.json(
        { success: false, message: 'Client key required' },
        { status: 401 }
      );
    }
  }

  // Check if route requires authentication
  if (pathname.startsWith('/api/v1/') && 
      !publicRoutes.some(route => pathname.startsWith(route))) {
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/management') && !pathname.includes('/login')) {
    const sessionCookie = request.cookies.get('admin-session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/management/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/management/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 