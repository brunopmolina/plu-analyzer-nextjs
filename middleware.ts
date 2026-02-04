import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

const PUBLIC_PATHS = ['/login'];
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2'];

function getEnvVar(name: string): string | undefined {
  try {
    const ctx = getRequestContext();
    return (ctx.env as Record<string, string>)[name] ?? process.env[name];
  } catch {
    return process.env[name];
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const sessionCookie = request.cookies.get('auth_session')?.value;
  const secret = getEnvVar('AUTH_SECRET');

  if (!secret) {
    console.error('AUTH_SECRET environment variable is not set');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validate session
  const isValid = await validateSession(sessionCookie, secret);

  if (!isValid) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
