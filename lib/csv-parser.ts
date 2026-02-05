// CSV parsing utilities using PapaParse

import Papa from 'papaparse';
import { REQUIRED_COLUMNS } from './constants';
import type { PlantRecord, InventoryRecord, StatusRecord, ProductRecord } from './types';

interface ParseResult<T> {
  data: T[] | null;
  error: string | null;
  rowCount: number;
}

/**
 * Column aliases per file type: maps alternative column names to the canonical name.
 * Keys are lowercase for case-insensitive matching.
 */
const COLUMN_ALIASES: Record<string, Record<string, string>> = {
  plant: {
    'site_description': 'SITE_DESCRIPTION',
  },
  inventory: {
    'supplychannel': 'supplyChannel.key',
  },
  status: {
    'sku': 'key',
  },
};

/**
 * Finds the canonical column name, checking aliases for the specific file type.
 * Returns the canonical name if found, otherwise returns the original.
 */
function getCanonicalColumnName(header: string, fileType?: string): string {
  const lowerHeader = header.toLowerCase();
  const aliases = fileType ? COLUMN_ALIASES[fileType] : {};
  return aliases?.[lowerHeader] || header;
}

/**
 * Case-insensitive column validation with alias support.
 * Returns missing columns (using expected case for error messages).
 */
function validateColumns(
  headers: string[],
  requiredColumns: readonly string[],
  fileType?: string
): string[] {
  // Build a set of normalized header names (lowercase, with aliases resolved)
  const normalizedHeaders = new Set(
    headers.map((h) => getCanonicalColumnName(h, fileType).toLowerCase())
  );

  const missing: string[] = [];
  for (const col of requiredColumns) {
    if (!normalizedHeaders.has(col.toLowerCase())) {
      missing.push(col);
    }
  }
  return missing;
}

/**
 * Creates a mapping from actual header names to their expected column names.
 * Supports both case-insensitive matching and column aliases.
 * Also maps any columns that have aliases defined (even if not required).
 */
function createColumnMapping(
  headers: string[],
  requiredColumns: readonly string[],
  fileType?: string
): Map<string, string> {
  const mapping = new Map<string, string>();

  // Map required columns
  for (const required of requiredColumns) {
    // Find the actual header that matches (case-insensitive, with alias support)
    const actualHeader = headers.find((h) => {
      const canonical = getCanonicalColumnName(h, fileType);
      return canonical.toLowerCase() === required.toLowerCase();
    });
    if (actualHeader) {
      mapping.set(actualHeader, required);
    }
  }

  // Also map any columns that have aliases (for optional columns like SITE_DESCRIPTION)
  const aliases = fileType ? COLUMN_ALIASES[fileType] : {};
  if (aliases) {
    for (const header of headers) {
      const lowerHeader = header.toLowerCase();
      const canonical = aliases[lowerHeader];
      if (canonical && !mapping.has(header)) {
        mapping.set(header, canonical);
      }
    }
  }

  return mapping;
}

/**
 * Normalizes row keys to match expected column names (case-insensitive matching).
 */
function normalizeRowKeys<T>(
  row: Record<string, unknown>,
  columnMapping: Map<string, string>
): T {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    // Use the mapped column name if it exists, otherwise keep original
    const normalizedKey = columnMapping.get(key) || key;
    normalized[normalizedKey] = value;
  }

  return normalized as T;
}

async function parseCSV<T>(
  file: File,
  requiredColumns: readonly string[],
  fileType?: string
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out non-fatal field count mismatches (e.g. from embedded commas in Snowflake exports)
        const fatalErrors = results.errors.filter(
          (e) => e.type !== 'FieldMismatch'
        );
        if (fatalErrors.length > 0) {
          resolve({
            data: null,
            error: `Parse error: ${fatalErrors[0].message}`,
            rowCount: 0,
          });
          return;
        }

        if (results.data.length === 0) {
          resolve({
            data: null,
            error: 'File is empty',
            rowCount: 0,
          });
          return;
        }

        const headers = results.meta.fields || [];
        const missingColumns = validateColumns(headers, requiredColumns, fileType);

        if (missingColumns.length > 0) {
          resolve({
            data: null,
            error: `Missing required columns: ${missingColumns.join(', ')}`,
            rowCount: 0,
          });
          return;
        }

        // Create mapping from actual headers to expected column names
        const columnMapping = createColumnMapping(headers, requiredColumns, fileType);

        // Normalize all row keys to match expected column names
        const normalizedData = results.data.map((row) =>
          normalizeRowKeys<T>(row, columnMapping)
        );

        resolve({
          data: normalizedData,
          error: null,
          rowCount: normalizedData.length,
        });
      },
      error: (error) => {
        resolve({
          data: null,
          error: `Error reading file: ${error.message}`,
          rowCount: 0,
        });
      },
    });
  });
}

export async function parsePlantCSV(file: File): Promise<ParseResult<PlantRecord>> {
  return parseCSV<PlantRecord>(file, REQUIRED_COLUMNS.plant, 'plant');
}

export async function parseInventoryCSV(file: File): Promise<ParseResult<InventoryRecord>> {
  const result = await parseCSV<InventoryRecord>(file, REQUIRED_COLUMNS.inventory, 'inventory');

  // Convert availableQuantity to number
  if (result.data) {
    result.data = result.data.map((row) => ({
      ...row,
      availableQuantity: Number(row.availableQuantity) || 0,
    }));
  }

  return result;
}

export async function parseStatusCSV(file: File): Promise<ParseResult<StatusRecord>> {
  const result = await parseCSV<StatusRecord>(file, REQUIRED_COLUMNS.status, 'status');

  // Normalize published field to boolean
  if (result.data) {
    result.data = result.data.map((row) => ({
      ...row,
      published: normalizeBoolean(row.published),
    }));
  }

  return result;
}

export async function parseProductCSV(file: File): Promise<ParseResult<ProductRecord>> {
  return parseCSV<ProductRecord>(file, REQUIRED_COLUMNS.product, 'product');
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}
