// Active store filtering logic - ported from Python store_filter.py

import { EXCLUDED_SITE_NUMBERS } from './constants';
import type { PlantRecord } from './types';

/**
 * Parse a date value that may be an Excel serial number or a date string.
 * Handles: Excel serial numbers, "MM/DD/YYYY", "YYYY-MM-DD", and ISO strings.
 */
export function excelSerialToDate(serial: string | number | null | undefined): Date | null {
  if (serial === null || serial === undefined || serial === '') {
    return null;
  }

  // Pure number — treat as Excel serial
  if (typeof serial === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + serial * msPerDay);
  }

  const trimmed = serial.trim();
  if (trimmed === '') return null;

  // If the string is purely numeric (no slashes, dashes, etc.), treat as Excel serial
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serialNum = parseFloat(trimmed);
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + serialNum * msPerDay);
  }

  // Otherwise try parsing as a date string (MM/DD/YYYY, YYYY-MM-DD, ISO, etc.)
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
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
