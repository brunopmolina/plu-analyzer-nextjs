import { getAccessToken, getProjectKey, getApiUrl } from './auth';
import type { CTInventoryPagedResult, CTInventoryRecord, ChannelMap } from './types';
import type { SubrequestLogger } from './logger';
import { fetchWithRetry } from './fetch';

async function fetchInventoryBatch(
  skus: string[],
  projectKey: string,
  apiUrl: string,
  accessToken: string,
  channelMap: ChannelMap,
  logger: SubrequestLogger
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

    const data = await fetchWithRetry<CTInventoryPagedResult>(
      url,
      { headers: { 'Authorization': `Bearer ${accessToken}` } },
      logger,
      'inventory'
    );

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

// Process batches with concurrency limit
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;

  async function processNext(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const result = await processor(items[index], index);
      results[index] = result;
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);
  return results;
}

export interface FetchInventoryProgress {
  completedBatches: number;
  totalBatches: number;
}

export async function fetchInventoryForSkus(
  skus: string[],
  channelMap: ChannelMap,
  logger: SubrequestLogger,
  onProgress?: (progress: FetchInventoryProgress) => void
): Promise<CTInventoryRecord[]> {
  if (skus.length === 0) {
    return [];
  }

  const projectKey = getProjectKey();
  const apiUrl = getApiUrl();
  const accessToken = await getAccessToken(logger);

  // Batch SKUs - keep under 10k offset limit (SKUs × channels < 10,000)
  // With ~146 channels: 10,000 / 146 ≈ 68 max SKUs per batch, using 50 for safety
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < skus.length; i += batchSize) {
    batches.push(skus.slice(i, i + batchSize));
  }

  let completedBatches = 0;

  // Process batches in parallel (10 concurrent requests)
  const concurrency = 10;
  console.log(`[Inventory] Starting parallel fetch: ${batches.length} batches with concurrency ${concurrency}`);

  const batchResults = await processWithConcurrency(
    batches,
    concurrency,
    async (batchSkus) => {
      const results = await fetchInventoryBatch(
        batchSkus,
        projectKey,
        apiUrl,
        accessToken,
        channelMap,
        logger
      );
      completedBatches++;
      onProgress?.({ completedBatches, totalBatches: batches.length });
      return results;
    }
  );

  const summary = logger.getSummary();
  console.log(`[Inventory] Fetch complete. Total subrequests: ${summary.total}`, summary.byModule);

  return batchResults.flat();
}
