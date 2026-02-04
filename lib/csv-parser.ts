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
 * Case-insensitive column validation.
 * Returns missing columns (using expected case for error messages).
 */
function validateColumns(headers: string[], requiredColumns: readonly string[]): string[] {
  const headersLower = headers.map((h) => h.toLowerCase());
  const missing: string[] = [];
  for (const col of requiredColumns) {
    if (!headersLower.includes(col.toLowerCase())) {
      missing.push(col);
    }
  }
  return missing;
}

/**
 * Creates a mapping from lowercase header names to their expected column names.
 * This allows us to normalize CSV headers to the expected case.
 */
function createColumnMapping(
  headers: string[],
  requiredColumns: readonly string[]
): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const required of requiredColumns) {
    // Find the actual header that matches (case-insensitive)
    const actualHeader = headers.find(
      (h) => h.toLowerCase() === required.toLowerCase()
    );
    if (actualHeader) {
      mapping.set(actualHeader, required);
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

async function parseCSV<T>(file: File, requiredColumns: readonly string[]): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            data: null,
            error: `Parse error: ${results.errors[0].message}`,
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
        const missingColumns = validateColumns(headers, requiredColumns);

        if (missingColumns.length > 0) {
          resolve({
            data: null,
            error: `Missing required columns: ${missingColumns.join(', ')}`,
            rowCount: 0,
          });
          return;
        }

        // Create mapping from actual headers to expected column names
        const columnMapping = createColumnMapping(headers, requiredColumns);

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
  return parseCSV<PlantRecord>(file, REQUIRED_COLUMNS.plant);
}

export async function parseInventoryCSV(file: File): Promise<ParseResult<InventoryRecord>> {
  const result = await parseCSV<InventoryRecord>(file, REQUIRED_COLUMNS.inventory);

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
  const result = await parseCSV<StatusRecord>(file, REQUIRED_COLUMNS.status);

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
  return parseCSV<ProductRecord>(file, REQUIRED_COLUMNS.product);
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}
