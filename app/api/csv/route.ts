import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Minimal R2 types for what we need
interface R2Object {
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
}

interface Env {
  CSV_BUCKET: R2Bucket;
  [key: string]: unknown;
}

function getEnvVar(name: string): string | undefined {
  try {
    const ctx = getRequestContext();
    return (ctx.env as Record<string, string>)[name] ?? process.env[name];
  } catch {
    return process.env[name];
  }
}

// --- Lightweight AWS Signature V4 for R2 (edge-compatible) ---

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  return hex(await crypto.subtle.digest('SHA-256', encoded));
}

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

async function fetchFromR2ViaS3(filename: string): Promise<string | null> {
  const accessKeyId = getEnvVar('R2_ACCESS_KEY_ID');
  const secretAccessKey = getEnvVar('R2_SECRET_ACCESS_KEY');
  const endpoint = getEnvVar('R2_ENDPOINT');
  const bucket = getEnvVar('R2_BUCKET_NAME');

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
    throw new Error('Missing R2 environment variables (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME)');
  }

  const url = new URL(`${endpoint}/${bucket}/${encodeURIComponent(filename)}`);
  const host = url.host;
  const region = 'auto';
  const service = 's3';

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256('');
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `GET\n/${bucket}/${encodeURIComponent(filename)}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = hex(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), new TextEncoder().encode(stringToSign)));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url.toString(), {
    headers: {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authHeader,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 S3 API error: ${response.status} ${await response.text()}`);
  }

  return response.text();
}

// --- Route handler ---

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('file');

  if (!filename) {
    return new Response('Missing file parameter', { status: 400 });
  }

  try {
    // Try Cloudflare Workers binding first (production)
    const { env } = getRequestContext<Env>();
    const object = await env.CSV_BUCKET.get(filename);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const csvText = await object.text();
    return new Response(csvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    // Fallback: fetch from R2 via S3 API (local dev)
    try {
      const csvText = await fetchFromR2ViaS3(filename);

      if (csvText === null) {
        return new Response('File not found', { status: 404 });
      }

      return new Response(csvText, {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(`Failed to fetch from R2: ${message}`, { status: 500 });
    }
  }
}
