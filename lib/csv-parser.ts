// CSV parsing utilities using PapaParse

import Papa from 'papaparse';
import { REQUIRED_COLUMNS } from './constants';
import type { PlantRecord, InventoryRecord, StatusRecord, ProductRecord } from './types';

interface ParseResult<T> {
  data: T[] | null;
  error: string | null;
  rowCount: number;
}

function validateColumns(headers: string[], requiredColumns: readonly string[]): string[] {
  const missing: string[] = [];
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      missing.push(col);
    }
  }
  return missing;
}

async function parseCSV<T>(file: File, requiredColumns: readonly string[]): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(file, {
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

        resolve({
          data: results.data,
          error: null,
          rowCount: results.data.length,
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
