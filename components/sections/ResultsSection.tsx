'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/ResultsTable';
import { FilteredOutTable } from '@/components/FilteredOutTable';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { exportResults, exportFilteredOut } from '@/lib/export';
import { Download, Table2 } from 'lucide-react';

type ViewMode = 'eligible' | 'ineligible';

export function ResultsSection() {
  const { state, filteredResults } = useAnalyzer();
  const [viewMode, setViewMode] = useState<ViewMode>('eligible');

  const hasResults = state.results && state.results.length > 0;
  const hasFilteredOut = state.filteredOutResults && state.filteredOutResults.length > 0;

  const handleExport = () => {
    if (viewMode === 'eligible' && filteredResults) {
      exportResults(filteredResults, state.filter);
    } else if (viewMode === 'ineligible' && state.filteredOutResults) {
      exportFilteredOut(state.filteredOutResults);
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
          ) : hasFilteredOut ? (
            <FilteredOutTable data={state.filteredOutResults!} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No filtered out items
            </div>
          )
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Run an analysis to see results
          </div>
        )}
      </CardContent>
    </Card>
  );
}
