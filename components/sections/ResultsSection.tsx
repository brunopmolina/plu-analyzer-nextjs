'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/ResultsTable';
import { FilteredOutTable } from '@/components/FilteredOutTable';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { exportResults, exportFilteredOut, exportPublishedIneligible } from '@/lib/export';
import { Download, Table2, AlertTriangle } from 'lucide-react';
import type { FilteredOutResult } from '@/lib/types';

type ViewMode = 'eligible' | 'ineligible' | 'publishedIneligible';

/**
 * Check if a PLU is exactly 4 digits.
 */
function isValidPLU(plu: string): boolean {
  return /^\d{4}$/.test(plu);
}

export function ResultsSection() {
  const { state, filteredResults } = useAnalyzer();
  const [viewMode, setViewMode] = useState<ViewMode>('eligible');

  const hasResults = state.results && state.results.length > 0;
  const hasFilteredOut = state.filteredOutResults && state.filteredOutResults.length > 0;

  // Compute audit results: Published items where Available In Channel is 'Store'
  // This is a separate analysis - recommendation is always 'Unpublish'
  const publishedIneligible = useMemo((): FilteredOutResult[] => {
    if (!state.productData || !state.statusData || !state.inventoryData || state.activeStores.length === 0) {
      return [];
    }

    const totalActiveStores = state.activeStores.length;
    const activeStoresSet = new Set(state.activeStores);

    // Create status lookup map (key -> published)
    const statusMap = new Map<string, boolean>();
    for (const row of state.statusData) {
      statusMap.set(String(row.key), Boolean(row.published));
    }

    // Filter inventory to only active stores
    const activeInventory = state.inventoryData.filter((row) =>
      activeStoresSet.has(String(row['supplyChannel.key']))
    );

    // Create inventory lookup: PLU -> Set of stores with inventory > 0
    const inventoryByPLU = new Map<string, Set<string>>();
    for (const row of activeInventory) {
      const sku = String(row.sku);
      const storeKey = String(row['supplyChannel.key']);
      const qty = Number(row.availableQuantity) || 0;

      if (qty > 0) {
        if (!inventoryByPLU.has(sku)) {
          inventoryByPLU.set(sku, new Set());
        }
        inventoryByPLU.get(sku)!.add(storeKey);
      }
    }

    const processedPLUs = new Set<string>();
    const results: FilteredOutResult[] = [];

    for (const productRow of state.productData) {
      const plu = String(productRow.SKU_NUMBER);

      // Skip PLUs that aren't exactly 4 digits
      if (!isValidPLU(plu)) continue;

      // Skip if already processed (handle duplicates)
      if (processedPLUs.has(plu)) continue;
      processedPLUs.add(plu);

      const channel = productRow.AVAILABLE_IN_CHANNEL ?? '';

      // Only include items where channel is 'Store'
      if (channel !== 'Store') continue;

      // Only include items that are published
      const isPublished = statusMap.get(plu) ?? false;
      if (!isPublished) continue;

      const sapStatus = productRow.STATUS_IN_SAP ?? '';
      const fullDesc = productRow.SKU_DESCRIPTION ?? '';
      const description = fullDesc.length > 7 ? fullDesc.substring(7).trim() : fullDesc;

      // Calculate inventory coverage
      const storesWithInventory = inventoryByPLU.get(plu)?.size ?? 0;
      const inventoryPct = (storesWithInventory / totalActiveStores) * 100;

      results.push({
        PLU: plu,
        Description: description,
        'SAP Status': sapStatus,
        Published: true,
        'Inventory %': Math.round(inventoryPct * 10) / 10,
        'Available In Channel': channel,
        'Would Recommend': 'Unpublish',
      });
    }

    return results;
  }, [state.productData, state.statusData, state.inventoryData, state.activeStores]);

  const handleExport = () => {
    if (viewMode === 'eligible' && filteredResults) {
      exportResults(filteredResults, state.filter);
    } else if (viewMode === 'ineligible' && state.filteredOutResults) {
      exportFilteredOut(state.filteredOutResults);
    } else if (viewMode === 'publishedIneligible' && publishedIneligible.length > 0) {
      exportPublishedIneligible(publishedIneligible);
    }
  };

  const filterLabel = state.filter === 'All' ? 'all' : state.filter.toLowerCase();

  const eligibleCount = filteredResults?.length ?? 0;
  const ineligibleCount = state.filteredOutResults?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 shrink-0" />
            <CardTitle className="text-base">Results</CardTitle>
            {hasResults && viewMode === 'eligible' && (
              <CardDescription className="text-xs">
                {eligibleCount.toLocaleString()} {filterLabel} PLUs
              </CardDescription>
            )}
            {hasFilteredOut && viewMode === 'ineligible' && (
              <CardDescription className="text-xs">
                {ineligibleCount.toLocaleString()} filtered PLUs
              </CardDescription>
            )}
            {viewMode === 'publishedIneligible' && (
              <CardDescription className="text-xs">
                {publishedIneligible.length.toLocaleString()} published ineligible PLUs
              </CardDescription>
            )}
          </div>
          {hasResults && (
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'eligible' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 rounded-r-none text-xs sm:text-sm"
                  onClick={() => setViewMode('eligible')}
                >
                  <span className="hidden sm:inline">Ecom </span>Eligible ({eligibleCount})
                </Button>
                <Button
                  variant={viewMode === 'ineligible' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 rounded-l-none border-l text-xs sm:text-sm"
                  onClick={() => setViewMode('ineligible')}
                  disabled={!hasFilteredOut}
                >
                  <span className="hidden sm:inline">Ecom </span>Ineligible ({ineligibleCount})
                </Button>
              </div>
              <Button
                variant={viewMode === 'publishedIneligible' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs sm:text-sm"
                onClick={() => setViewMode('publishedIneligible')}
                disabled={publishedIneligible.length === 0}
              >
                <AlertTriangle className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Audit ({publishedIneligible.length})</span>
                <span className="sm:hidden">{publishedIneligible.length}</span>
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="h-7">
                <Download className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasResults ? (
          viewMode === 'eligible' ? (
            filteredResults && <ResultsTable data={filteredResults} />
          ) : viewMode === 'ineligible' ? (
            hasFilteredOut ? (
              <FilteredOutTable data={state.filteredOutResults!} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No filtered out items
              </div>
            )
          ) : viewMode === 'publishedIneligible' ? (
            publishedIneligible.length > 0 ? (
              <FilteredOutTable data={publishedIneligible} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No published ineligible items
              </div>
            )
          ) : null
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Run an analysis to see results
          </div>
        )}
      </CardContent>
    </Card>
  );
}
