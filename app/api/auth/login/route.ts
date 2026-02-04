import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

function getEnvVar(name: string): string | undefined {
  try {
    const ctx = getRequestContext();
    return (ctx.env as Record<string, string>)[name] ?? process.env[name];
  } catch {
    return process.env[name];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const expectedPassword = getEnvVar('AUTH_PASSWORD');
    const secret = getEnvVar('AUTH_SECRET');

    if (!expectedPassword || !secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session token (7 day expiry)
    const sessionToken = await createSession(secret, 7);

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
