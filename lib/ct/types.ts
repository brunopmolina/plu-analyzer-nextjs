// CommerceTools API types

export interface CTTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export interface CTChannel {
  id: string;
  key?: string;
  name?: { [locale: string]: string };
  roles: string[];
}

export interface CTChannelPagedResult {
  limit: number;
  offset: number;
  count: number;
  total: number;
  results: CTChannel[];
}

export interface ChannelMap {
  [channelId: string]: string;
}

export interface CTAttribute {
  name: string;
  value: string | boolean | number | object;
}

export interface CTVariant {
  sku?: string;
  attributes?: CTAttribute[];
}

export interface CTProductProjection {
  id: string;
  name: { [locale: string]: string };
  published: boolean;
  masterVariant: CTVariant;
  variants: CTVariant[];
}

export interface CTProductPagedResult {
  limit: number;
  offset: number;
  count: number;
  total: number;
  results: CTProductProjection[];
}

export interface CTProductInfo {
  sku: string;
  name: string;
  published: boolean;
}

export interface CTInventoryEntry {
  id: string;
  sku: string;
  supplyChannel?: { id: string };
  quantityOnStock: number;
  availableQuantity: number;
}

export interface CTInventoryPagedResult {
  limit: number;
  offset: number;
  count: number;
  total: number;
  results: CTInventoryEntry[];
}

export interface CTInventoryRecord {
  sku: string;
  supplyChannel: string;
  quantityOnStock: number;
  availableQuantity: number;
}

// SSE event types for the fetch API
export type CTFetchStep = 'auth' | 'channels' | 'products' | 'inventory';

export interface CTProgressEvent {
  type: 'progress';
  step: CTFetchStep;
  message: string;
  percent?: number;
}

export interface SubrequestSummary {
  total: number;
  byModule: Record<string, number>;
}

export interface CTCompleteEvent {
  type: 'complete';
  data: {
    inventoryCount: number;
    statusCount: number;
    subrequests?: SubrequestSummary;
  };
}

export interface CTErrorEvent {
  type: 'error';
  message: string;
}

export type CTSSEEvent = CTProgressEvent | CTCompleteEvent | CTErrorEvent;
