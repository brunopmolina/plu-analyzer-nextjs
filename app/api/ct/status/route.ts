export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateApiSession } from '@/lib/auth';
import { isConfigured } from '@/lib/ct/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getEnvVar(name: string): string | undefined {
  try {
    const ctx = getRequestContext();
    return (ctx.env as Record<string, string>)[name] ?? process.env[name];
  } catch {
    return process.env[name];
  }
}

export async function GET() {
  // Validate session authentication
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  const secret = getEnvVar('AUTH_SECRET');

  if (!(await validateApiSession(sessionCookie, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ configured: isConfigured() });
}
