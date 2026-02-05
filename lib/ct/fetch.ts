import type { SubrequestLogger } from './logger';

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  logger: SubrequestLogger,
  moduleName: string,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    logger.log(moduleName, `fetch_page${attempt > 1 ? `_retry${attempt}` : ''}`);

    if (response.ok) {
      return response.json();
    }

    const status = response.status;
    // Retry on 429 (rate limit) or 503 (service unavailable)
    if ((status === 429 || status === 503) && attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Request failed: ${errorData.message || response.statusText}`);
  }
  throw new Error('Max retries exceeded');
}
