'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getEnvVar(name: string): string | undefined {
  // Try Cloudflare's runtime context first, then fall back to process.env
  try {
    const ctx = getRequestContext();
    return (ctx.env as Record<string, string>)[name] ?? process.env[name];
  } catch {
    return process.env[name];
  }
}

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const password = formData.get('password') as string;

  const expectedPassword = getEnvVar('AUTH_PASSWORD');
  const secret = getEnvVar('AUTH_SECRET');

  if (!expectedPassword || !secret) {
    return { error: 'Server configuration error - check environment variables' };
  }

  if (password !== expectedPassword) {
    return { error: 'Invalid password' };
  }

  // Create session token (7 day expiry)
  const sessionToken = await createSession(secret, 7);

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set('auth_session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });

  redirect('/');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  redirect('/login');
}
