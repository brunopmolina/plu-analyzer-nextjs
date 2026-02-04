// CSV export utilities

import type { AnalysisResult, FilteredOutResult } from './types';

/**
 * Escape a value for CSV output.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
function escapeCSVValue(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert analysis results to CSV string.
 */
export function resultsToCSV(results: AnalysisResult[]): string {
  if (results.length === 0) {
    return '';
  }

  // Define columns in desired order
  const columns: (keyof AnalysisResult)[] = [
    'PLU',
    'Description',
    'SAP Status',
    'Published',
    'Inventory %',
    'Stores w/ Inventory',
    'Total Active Stores',
    'Recommendation',
  ];

  // Header row
  const header = columns.map(escapeCSVValue).join(',');

  // Data rows
  const rows = results.map((result) =>
    columns
      .map((col) => {
        const value = result[col];
        // Convert boolean Published to Yes/No for readability
        if (col === 'Published') {
          return escapeCSVValue(value ? 'Yes' : 'No');
        }
        return escapeCSVValue(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Trigger download of CSV content.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export analysis results to CSV file.
 */
export function exportResults(results: AnalysisResult[], filter?: string): void {
  const csv = resultsToCSV(results);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filterSuffix = filter && filter !== 'All' ? `_${filter.toLowerCase()}` : '';
  const filename = `plu_analysis_${timestamp}${filterSuffix}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Convert filtered out results to CSV string.
 */
export function filteredOutToCSV(results: FilteredOutResult[]): string {
  if (results.length === 0) {
    return '';
  }

  // Define columns in desired order
  const columns: (keyof FilteredOutResult)[] = [
    'PLU',
    'Description',
    'SAP Status',
    'Published',
    'Inventory %',
    'Available In Channel',
    'Would Recommend',
  ];

  // Header row
  const header = columns.map(escapeCSVValue).join(',');

  // Data rows
  const rows = results.map((result) =>
    columns
      .map((col) => {
        const value = result[col];
        // Convert boolean Published to Yes/No for readability
        if (col === 'Published') {
          return escapeCSVValue(value ? 'Yes' : 'No');
        }
        return escapeCSVValue(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Export filtered out results to CSV file.
 */
export function exportFilteredOut(results: FilteredOutResult[]): void {
  const csv = filteredOutToCSV(results);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `plu_ecom_ineligible_${timestamp}.csv`;
  downloadCSV(csv, filename);
}
