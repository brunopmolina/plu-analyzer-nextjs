// Active store filtering logic - ported from Python store_filter.py

import { EXCLUDED_SITE_NUMBERS } from './constants';
import type { PlantRecord } from './types';

/**
 * Convert Excel serial date number to JavaScript Date.
 * Excel serial dates are the number of days since 1899-12-30 (Windows format).
 */
export function excelSerialToDate(serial: string | number | null | undefined): Date | null {
  if (serial === null || serial === undefined || serial === '') {
    return null;
  }

  const serialNum = typeof serial === 'string' ? parseFloat(serial) : serial;

  if (isNaN(serialNum)) {
    return null;
  }

  // Excel epoch is December 30, 1899
  // We add the serial number as days to this epoch
  const excelEpoch = new Date(1899, 11, 30); // Month is 0-indexed
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serialNum * msPerDay);
}

/**
 * Filter v_dim_plant to get list of active store SITE_NUMBERs.
 *
 * Active store criteria:
 * - REGION != "Canada"
 * - ORGANIZATION_NUMBER == "9000"
 * - OPEN_DATE is not null AND before today
 * - CLOSE_DATE is null
 * - Not in EXCLUDED_SITE_NUMBERS
 */
export function getActiveStores(plantData: PlantRecord[]): string[] {
  const today = new Date();
  const activeStoresSet = new Set<string>();

  for (const row of plantData) {
    // Filter by region (not Canada)
    if (row.REGION === 'Canada') {
      continue;
    }

    // Filter by organization number (9000)
    const orgNum = String(row.ORGANIZATION_NUMBER);
    if (orgNum !== '9000') {
      continue;
    }

    // Convert dates
    const openDate = excelSerialToDate(row.OPEN_DATE);
    const closeDate = excelSerialToDate(row.CLOSE_DATE);

    // OPEN_DATE must exist and be before today
    if (openDate === null || openDate >= today) {
      continue;
    }

    // CLOSE_DATE must be null (store still open)
    if (closeDate !== null) {
      continue;
    }

    const siteNumber = String(row.SITE_NUMBER);

    // Skip manually excluded site numbers
    if (EXCLUDED_SITE_NUMBERS.includes(siteNumber)) {
      continue;
    }

    // Use Set to deduplicate (each store can have multiple rows for different channels)
    activeStoresSet.add(siteNumber);
  }

  return Array.from(activeStoresSet);
}

/**
 * Get count of active stores.
 */
export function getActiveStoreCount(plantData: PlantRecord[]): number {
  return getActiveStores(plantData).length;
}
