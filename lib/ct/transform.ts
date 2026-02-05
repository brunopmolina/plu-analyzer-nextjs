import type { InventoryRecord, StatusRecord } from '@/lib/types';
import type { CTProductInfo, CTInventoryRecord } from './types';

/**
 * Transform CT product data to PLU Analyzer StatusRecord format
 * CT Output: { sku, name, published }
 * PLU Analyzer: { key: sku, published }
 */
export function transformToStatusRecords(products: CTProductInfo[]): StatusRecord[] {
  return products.map(product => ({
    key: product.sku,
    published: product.published,
  }));
}

/**
 * Transform CT inventory data to PLU Analyzer InventoryRecord format
 * CT Output: { sku, supplyChannel, availableQuantity }
 * PLU Analyzer: { sku, 'supplyChannel.key': supplyChannel, availableQuantity }
 */
export function transformToInventoryRecords(inventory: CTInventoryRecord[]): InventoryRecord[] {
  return inventory.map(entry => ({
    sku: entry.sku,
    'supplyChannel.key': entry.supplyChannel,
    availableQuantity: entry.availableQuantity,
  }));
}
