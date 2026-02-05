import { getAccessToken, getProjectKey, getApiUrl } from './auth';
import type { CTInventoryPagedResult, CTInventoryRecord, ChannelMap } from './types';

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

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

async function fetchInventoryBatch(
  skus: string[],
  projectKey: string,
  apiUrl: string,
  accessToken: string,
  channelMap: ChannelMap
): Promise<CTInventoryRecord[]> {
  const inventory: CTInventoryRecord[] = [];
  const skuList = skus.map(sku => `"${sku}"`).join(',');

  let offset = 0;
  const limit = 500;
  let total = 0;

  do {
    const params = new URLSearchParams({
      where: `sku in (${skuList})`,
      limit: String(limit),
      offset: String(offset),
    });

    const url = `https://${apiUrl}/${projectKey}/inventory?${params}`;

    const data = await fetchWithRetry<CTInventoryPagedResult>(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    total = data.total;

    for (const entry of data.results) {
      const supplyChannel = entry.supplyChannel
        ? channelMap[entry.supplyChannel.id] || entry.supplyChannel.id
        : 'No Channel';

      inventory.push({
        sku: entry.sku,
        supplyChannel,
        quantityOnStock: entry.quantityOnStock,
        availableQuantity: entry.availableQuantity,
      });
    }

    offset += data.results.length;
  } while (offset < total);

  return inventory;
}

export interface FetchInventoryProgress {
  completedBatches: number;
  totalBatches: number;
}

export async function fetchInventoryForSkus(
  skus: string[],
  channelMap: ChannelMap,
  onProgress?: (progress: FetchInventoryProgress) => void
): Promise<CTInventoryRecord[]> {
  if (skus.length === 0) {
    return [];
  }

  const projectKey = getProjectKey();
  const apiUrl = getApiUrl();
  const accessToken = await getAccessToken();

  // Batch SKUs - larger batches to reduce total requests for Cloudflare limits
  // Using 100 SKUs per batch to minimize subrequests
  const batchSize = 100;
  const batches: string[][] = [];
  for (let i = 0; i < skus.length; i += batchSize) {
    batches.push(skus.slice(i, i + batchSize));
  }

  // Process batches sequentially to avoid Cloudflare subrequest limits
  const allResults: CTInventoryRecord[] = [];
  for (let i = 0; i < batches.length; i++) {
    const results = await fetchInventoryBatch(
      batches[i],
      projectKey,
      apiUrl,
      accessToken,
      channelMap
    );
    allResults.push(...results);
    onProgress?.({ completedBatches: i + 1, totalBatches: batches.length });
  }

  return allResults;
}
