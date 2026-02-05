import { getAccessToken, getProjectKey, getApiUrl } from './auth';
import type { CTProductPagedResult, CTProductInfo } from './types';
import type { SubrequestLogger } from './logger';
import { fetchWithRetry } from './fetch';

export interface FetchProductsProgress {
  fetched: number;
  total: number;
}

export async function fetchUSProducts(
  logger: SubrequestLogger,
  onProgress?: (progress: FetchProductsProgress) => void
): Promise<CTProductInfo[]> {
  const projectKey = getProjectKey();
  const apiUrl = getApiUrl();
  const accessToken = await getAccessToken(logger);

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

    const data = await fetchWithRetry<CTProductPagedResult>(
      url,
      { headers: { 'Authorization': `Bearer ${accessToken}` } },
      logger,
      'products'
    );

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
