export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/ct/auth';

export async function GET() {
  return NextResponse.json({ configured: isConfigured() });
}
