// Core analysis logic - ported from Python analyzer.py

import { PUBLISH_THRESHOLD, UNPUBLISH_THRESHOLD, INACTIVE_STATUSES } from './constants';
import type { InventoryRecord, StatusRecord, ProductRecord, AnalysisResult, AnalysisSummary } from './types';

interface AnalysisOutput {
  results: AnalysisResult[];
  summary: AnalysisSummary;
}

/**
 * Check if a PLU is exactly 4 digits.
 */
function isValidPLU(plu: string): boolean {
  return /^\d{4}$/.test(plu);
}

/**
 * Determine the publish/unpublish recommendation for a PLU.
 *
 * Rules:
 * - Publish: NOT published + status NOT in [Inactive, Discontinued] + >=90% inventory
 * - Unpublish: IS published + status IN [Inactive, Discontinued] + >=50% out of stock
 * - No Action: Everything else
 */
function determineRecommendation(
  isPublished: boolean,
  sapStatus: string,
  inventoryPct: number
): 'Publish' | 'Unpublish' | 'No Action' {
  const isInactive = INACTIVE_STATUSES.includes(sapStatus);
  const outOfStockPct = 100 - inventoryPct;

  // Publish criteria
  if (!isPublished && !isInactive && inventoryPct >= PUBLISH_THRESHOLD) {
    return 'Publish';
  }

  // Unpublish criteria
  if (isPublished && isInactive && outOfStockPct >= UNPUBLISH_THRESHOLD) {
    return 'Unpublish';
  }

  return 'No Action';
}

/**
 * Analyze PLUs and determine publish/unpublish recommendations.
 */
export function analyzePLUs(
  inventoryData: InventoryRecord[],
  statusData: StatusRecord[],
  productData: ProductRecord[],
  activeStores: string[]
): AnalysisOutput {
  const totalActiveStores = activeStores.length;

  if (totalActiveStores === 0) {
    return {
      results: [],
      summary: {
        total_plus: 0,
        to_publish: 0,
        to_unpublish: 0,
        no_action: 0,
        active_stores: 0,
        error: 'No active stores found',
      },
    };
  }

  // Create lookup maps for faster access
  const activeStoresSet = new Set(activeStores);

  // Filter inventory to only active stores
  const activeInventory = inventoryData.filter((row) =>
    activeStoresSet.has(String(row['supplyChannel.key']))
  );

  // Create status lookup map (key -> published)
  const statusMap = new Map<string, boolean>();
  for (const row of statusData) {
    statusMap.set(String(row.key), Boolean(row.published));
  }

  // Create inventory lookup: PLU -> Set of stores with inventory > 0
  const inventoryByPLU = new Map<string, Set<string>>();
  for (const row of activeInventory) {
    const sku = String(row.sku);
    const storeKey = String(row['supplyChannel.key']);
    const qty = Number(row.availableQuantity) || 0;

    if (qty > 0) {
      if (!inventoryByPLU.has(sku)) {
        inventoryByPLU.set(sku, new Set());
      }
      inventoryByPLU.get(sku)!.add(storeKey);
    }
  }

  // Get unique PLUs from product master
  const processedPLUs = new Set<string>();
  const results: AnalysisResult[] = [];

  for (const productRow of productData) {
    const plu = String(productRow.SKU_NUMBER);

    // Skip PLUs that aren't exactly 4 digits
    if (!isValidPLU(plu)) {
      continue;
    }

    // Skip if already processed (handle duplicates)
    if (processedPLUs.has(plu)) {
      continue;
    }
    processedPLUs.add(plu);

    const sapStatus = productRow.STATUS_IN_SAP ?? '';

    // Get description from SKU_DESCRIPTION field
    const description = productRow.SKU_DESCRIPTION ?? '';

    // Get published status
    const isPublished = statusMap.get(plu) ?? false;

    // Calculate inventory coverage
    const storesWithInventory = inventoryByPLU.get(plu)?.size ?? 0;
    const inventoryPct = (storesWithInventory / totalActiveStores) * 100;

    // Determine recommendation
    const recommendation = determineRecommendation(isPublished, sapStatus, inventoryPct);

    results.push({
      PLU: plu,
      Description: description,
      'SAP Status': sapStatus,
      Published: isPublished,
      'Inventory %': Math.round(inventoryPct * 10) / 10, // Round to 1 decimal
      'Stores w/ Inventory': storesWithInventory,
      'Total Active Stores': totalActiveStores,
      Recommendation: recommendation,
    });
  }

  // Calculate summary
  const summary: AnalysisSummary = {
    total_plus: results.length,
    to_publish: results.filter((r) => r.Recommendation === 'Publish').length,
    to_unpublish: results.filter((r) => r.Recommendation === 'Unpublish').length,
    no_action: results.filter((r) => r.Recommendation === 'No Action').length,
    active_stores: totalActiveStores,
  };

  return { results, summary };
}
