// PLU Analyzer constants and thresholds

// Threshold for recommending publish (>= 90% inventory coverage)
export const PUBLISH_THRESHOLD = 90;

// Threshold for recommending unpublish (>= 50% out of stock)
export const UNPUBLISH_THRESHOLD = 50;

// Status values that indicate a product should be unpublished
export const INACTIVE_STATUSES = ['Inactive', 'Discontinued'];

// Site numbers to exclude from active store count
export const EXCLUDED_SITE_NUMBERS = ['9011'];

// Required columns for each file type
export const REQUIRED_COLUMNS = {
  plant: ['SITE_NUMBER', 'REGION', 'ORGANIZATION_NUMBER', 'OPEN_DATE', 'CLOSE_DATE'],
  inventory: ['sku', 'availableQuantity', 'supplyChannel.key'],
  status: ['key', 'published'],
  product: ['SKU_NUMBER', 'STATUS_IN_SAP', 'AVAILABLE_IN_CHANNEL'],
} as const;

// localStorage keys
export const STORAGE_KEYS = {
  PLANT_DATA: 'plu_analyzer_plant_data',
  PLANT_METADATA: 'plu_analyzer_plant_metadata',
} as const;
