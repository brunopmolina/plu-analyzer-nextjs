import type { CTTokenResponse, CachedToken } from './types';
import { subrequestLogger } from './logger';

export function normalizeUrl(url: string): string {
  // Remove protocol prefix if present
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

let cachedToken: CachedToken | null = null;

export function isConfigured(): boolean {
  return Boolean(
    process.env.CTP_CLIENT_ID &&
    process.env.CTP_CLIENT_SECRET &&
    process.env.CTP_PROJECT_KEY &&
    process.env.CTP_AUTH_URL &&
    process.env.CTP_API_URL
  );
}

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.CTP_CLIENT_ID;
  const clientSecret = process.env.CTP_CLIENT_SECRET;
  const projectKey = process.env.CTP_PROJECT_KEY;
  const authBaseUrl = process.env.CTP_AUTH_URL;

  if (!clientId || !clientSecret || !projectKey || !authBaseUrl) {
    throw new Error('Missing required environment variables: CTP_CLIENT_ID, CTP_CLIENT_SECRET, CTP_PROJECT_KEY, CTP_AUTH_URL');
  }

  const authUrl = `https://${normalizeUrl(authBaseUrl)}/oauth/token`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Request only the scopes we need
  const scopes = [
    `view_products:${projectKey}`,
    `view_orders:${projectKey}`,
    `view_stores:${projectKey}`,
  ].join(' ');

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(scopes)}`,
  });
  subrequestLogger.log('auth', 'oauth_token');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Authentication failed: ${errorData.error_description || response.statusText}`);
  }

  const data: CTTokenResponse = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

export function getProjectKey(): string {
  const projectKey = process.env.CTP_PROJECT_KEY;
  if (!projectKey) {
    throw new Error('Missing required environment variable: CTP_PROJECT_KEY');
  }
  return projectKey;
}

export function getApiUrl(): string {
  const apiUrl = process.env.CTP_API_URL;
  if (!apiUrl) {
    throw new Error('Missing required environment variable: CTP_API_URL');
  }
  return normalizeUrl(apiUrl);
}
