// TypeScript interfaces for PLU Analyzer

export interface PlantRecord {
  SITE_NUMBER: string;
  REGION: string;
  ORGANIZATION_NUMBER: string;
  OPEN_DATE: string | number | null;
  CLOSE_DATE: string | number | null;
  SITE_DESCRIPTION?: string;
}

export interface InventoryRecord {
  sku: string;
  availableQuantity: number;
  'supplyChannel.key': string;
}

export interface StatusRecord {
  key: string;
  published: boolean | string;
}

export interface ProductRecord {
  SKU_NUMBER: string;
  STATUS_IN_SAP: string;
  SKU_DESCRIPTION?: string;
  AVAILABLE_IN_CHANNEL?: string;
}

export interface AnalysisResult {
  PLU: string;
  Description: string;
  'SAP Status': string;
  Published: boolean;
  'Inventory %': number;
  'Stores w/ Inventory': number;
  'Total Active Stores': number;
  'Inv 9801': number;
  'Inv 9803': number;
  Recommendation: 'Publish' | 'Publish - TEMP' | 'Unpublish' | 'No Action';
}

export interface FilteredOutResult {
  PLU: string;
  Description: string;
  'SAP Status': string;
  Published: boolean;
  'Inventory %': number;
  'Available In Channel': string;
  'Would Recommend': 'Publish' | 'Publish - TEMP' | 'Unpublish';
}

export interface AnalysisSummary {
  total_plus: number;
  to_publish: number;
  to_publish_temp: number;
  to_unpublish: number;
  no_action: number;
  active_stores: number;
  error?: string;
}

export interface PlantMetadata {
  last_updated: string;
  source_file: string;
}

export interface FileUploadStatus {
  loaded: boolean;
  rowCount: number;
  error?: string;
  fileName?: string;
}

export type RecommendationFilter = 'All' | 'Action' | 'Publish' | 'Publish - TEMP' | 'Unpublish' | 'No Action';

export interface AnalyzerState {
  // Plant data (persistent)
  plantData: PlantRecord[] | null;
  plantMetadata: PlantMetadata | null;
  activeStores: string[];

  // Session files
  inventoryData: InventoryRecord[] | null;
  statusData: StatusRecord[] | null;
  productData: ProductRecord[] | null;

  // File upload statuses
  plantStatus: FileUploadStatus;
  inventoryStatus: FileUploadStatus;
  statusStatus: FileUploadStatus;
  productStatus: FileUploadStatus;

  // Analysis
  isAnalyzing: boolean;
  results: AnalysisResult[] | null;
  filteredOutResults: FilteredOutResult[] | null;
  summary: AnalysisSummary | null;

  // Filter
  filter: RecommendationFilter;
}

export type AnalyzerAction =
  | { type: 'SET_PLANT_DATA'; payload: { data: PlantRecord[]; metadata: PlantMetadata; activeStores: string[]; fileName: string } }
  | { type: 'CLEAR_PLANT_DATA' }
  | { type: 'SET_INVENTORY_DATA'; payload: { data: InventoryRecord[]; fileName: string } }
  | { type: 'SET_STATUS_DATA'; payload: { data: StatusRecord[]; fileName: string } }
  | { type: 'SET_PRODUCT_DATA'; payload: { data: ProductRecord[]; fileName: string } }
  | { type: 'SET_FILE_ERROR'; payload: { fileType: 'plant' | 'inventory' | 'status' | 'product'; error: string } }
  | { type: 'DISMISS_FILE_STATUS'; payload: { fileType: 'plant' | 'inventory' | 'status' | 'product' } }
  | { type: 'RUN_ANALYSIS' }
  | { type: 'ANALYSIS_COMPLETE'; payload: { results: AnalysisResult[]; filteredOutResults: FilteredOutResult[]; summary: AnalysisSummary } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_FILTER'; payload: RecommendationFilter }
  | { type: 'LOAD_FROM_STORAGE'; payload: { plantData: PlantRecord[]; metadata: PlantMetadata; activeStores: string[] } };
