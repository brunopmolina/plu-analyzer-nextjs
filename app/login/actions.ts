'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession } from '@/lib/auth';

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const password = formData.get('password') as string;

  const expectedPassword = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expectedPassword || !secret) {
    return { error: 'Server configuration error' };
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
    secure: process.env.NODE_ENV === 'production',
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
