export const runtime = 'edge';

import { isConfigured } from '@/lib/ct/auth';
import { fetchSupplyChannels } from '@/lib/ct/channels';
import { fetchUSProducts, getSkusFromProducts } from '@/lib/ct/products';
import { fetchInventoryForSkus } from '@/lib/ct/inventory';
import { transformToStatusRecords, transformToInventoryRecords } from '@/lib/ct/transform';
import { createSubrequestLogger } from '@/lib/ct/logger';
import type { CTSSEEvent } from '@/lib/ct/types';

function sendSSE(controller: ReadableStreamDefaultController, event: CTSSEEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

export async function POST() {
  if (!isConfigured()) {
    return new Response(
      JSON.stringify({ error: 'CommerceTools credentials not configured' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create a new logger instance for this request to avoid cross-request data corruption
        const logger = createSubrequestLogger();
        console.log('[CT Fetch] Starting CommerceTools data fetch...');

        // Step 1: Authenticate
        sendSSE(controller, {
          type: 'progress',
          step: 'auth',
          message: 'Authenticating with CommerceTools...',
          percent: 5,
        });

        // Step 2: Fetch channels
        sendSSE(controller, {
          type: 'progress',
          step: 'channels',
          message: 'Fetching supply channels...',
          percent: 10,
        });
        const channelMap = await fetchSupplyChannels(logger);
        const channelCount = Object.keys(channelMap).length;
        sendSSE(controller, {
          type: 'progress',
          step: 'channels',
          message: `Found ${channelCount} supply channels`,
          percent: 15,
        });

        // Step 3: Fetch products
        sendSSE(controller, {
          type: 'progress',
          step: 'products',
          message: 'Fetching US products...',
          percent: 20,
        });
        const products = await fetchUSProducts(logger, (progress) => {
          const percent = 20 + Math.floor((progress.fetched / progress.total) * 30);
          sendSSE(controller, {
            type: 'progress',
            step: 'products',
            message: `Fetching products: ${progress.fetched.toLocaleString()}/${progress.total.toLocaleString()}`,
            percent: Math.min(percent, 50),
          });
        });
        sendSSE(controller, {
          type: 'progress',
          step: 'products',
          message: `Found ${products.length.toLocaleString()} US product SKUs`,
          percent: 50,
        });

        // Step 4: Fetch inventory
        const skus = getSkusFromProducts(products);
        sendSSE(controller, {
          type: 'progress',
          step: 'inventory',
          message: `Fetching inventory for ${skus.length.toLocaleString()} SKUs...`,
          percent: 55,
        });
        const inventory = await fetchInventoryForSkus(skus, channelMap, logger, (progress) => {
          const percent = 55 + Math.floor((progress.completedBatches / progress.totalBatches) * 40);
          sendSSE(controller, {
            type: 'progress',
            step: 'inventory',
            message: `Fetching inventory: batch ${progress.completedBatches}/${progress.totalBatches}`,
            percent: Math.min(percent, 95),
          });
        });

        // Transform data
        const statusRecords = transformToStatusRecords(products);
        const inventoryRecords = transformToInventoryRecords(inventory);

        // Get subrequest summary
        const subrequestSummary = logger.getSummary();
        console.log(`[CT Fetch] Complete. Total subrequests: ${subrequestSummary.total}`, subrequestSummary.byModule);

        // Send complete event with the data
        sendSSE(controller, {
          type: 'complete',
          data: {
            inventoryCount: inventoryRecords.length,
            statusCount: statusRecords.length,
            subrequests: subrequestSummary,
          },
        });

        // Send the actual data as a separate event
        const dataEvent = `data: ${JSON.stringify({
          type: 'data',
          inventory: inventoryRecords,
          status: statusRecords,
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(dataEvent));

        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        sendSSE(controller, {
          type: 'error',
          message,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
