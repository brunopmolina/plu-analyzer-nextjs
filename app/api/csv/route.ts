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

export async function GET(request: Request) {
  const { env } = getRequestContext<Env>();
  const url = new URL(request.url);
  const filename = url.searchParams.get('file');

  if (!filename) {
    return new Response('Missing file parameter', { status: 400 });
  }

  const object = await env.CSV_BUCKET.get(filename);

  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  const csvText = await object.text();

  return new Response(csvText, {
    headers: {
      'Content-Type': 'text/csv',
      'Cache-Control': 'public, max-age=300', // 5 min cache
    },
  });
}
