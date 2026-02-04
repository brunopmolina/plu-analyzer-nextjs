const encoder = new TextEncoder();

export async function createSignature(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret);
  return signature === expectedSignature;
}

export interface SessionData {
  exp: number;
}

export function parseSession(cookie: string): { data: SessionData; signature: string } | null {
  const parts = cookie.split('.');
  if (parts.length !== 2) return null;

  try {
    const data = JSON.parse(atob(parts[0])) as SessionData;
    return { data, signature: parts[1] };
  } catch {
    return null;
  }
}

export async function validateSession(cookie: string, secret: string): Promise<boolean> {
  const parsed = parseSession(cookie);
  if (!parsed) return false;

  const { data, signature } = parsed;

  // Check expiration
  if (Date.now() > data.exp) return false;

  // Verify signature
  const isValid = await verifySignature(btoa(JSON.stringify(data)), signature, secret);
  return isValid;
}

export async function createSession(secret: string, expiryDays: number = 7): Promise<string> {
  const data: SessionData = {
    exp: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
  };

  const payload = btoa(JSON.stringify(data));
  const signature = await createSignature(payload, secret);

  return `${payload}.${signature}`;
}
