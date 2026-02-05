import { getAccessToken, getProjectKey, getApiUrl } from './auth';
import type { CTProductPagedResult, CTProductInfo } from './types';

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

export interface FetchProductsProgress {
  fetched: number;
  total: number;
}

export async function fetchUSProducts(
  onProgress?: (progress: FetchProductsProgress) => void
): Promise<CTProductInfo[]> {
  const projectKey = getProjectKey();
  const apiUrl = getApiUrl();
  const accessToken = await getAccessToken();

  const products: CTProductInfo[] = [];
  let offset = 0;
  const limit = 500; // Max allowed by CommerceTools
  let total = 0;

  do {
    const params = new URLSearchParams({
      where: 'variants(attributes(name="country" and value(key="US"))) or masterVariant(attributes(name="country" and value(key="US")))',
      limit: String(limit),
      offset: String(offset),
      staged: 'true', // Include staged (unpublished) products
    });

    const url = `https://${apiUrl}/${projectKey}/product-projections?${params}`;

    const data = await fetchWithRetry<CTProductPagedResult>(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    total = data.total;

    for (const product of data.results) {
      // Get product name (first available locale)
      const name = Object.values(product.name)[0] || 'Unknown';

      // Process master variant
      if (product.masterVariant.sku) {
        products.push({
          sku: product.masterVariant.sku,
          name,
          published: product.published,
        });
      }

      // Process other variants
      for (const variant of product.variants) {
        if (variant.sku) {
          // Check if this variant also has country=US
          const countryAttr = variant.attributes?.find(
            attr => attr.name === 'country' && (attr.value as { key?: string })?.key === 'US'
          );
          if (countryAttr || variant.attributes === undefined) {
            products.push({
              sku: variant.sku,
              name,
              published: product.published,
            });
          }
        }
      }
    }

    offset += data.results.length;
    onProgress?.({ fetched: offset, total });
  } while (offset < total);

  return products;
}

export function getSkusFromProducts(products: CTProductInfo[]): string[] {
  return products.map(p => p.sku);
}
