'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/ResultsTable';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { exportResults } from '@/lib/export';
import { Download, Table2 } from 'lucide-react';

export function ResultsSection() {
  const { state, filteredResults } = useAnalyzer();

  const hasResults = state.results && state.results.length > 0;

  const handleExport = () => {
    if (filteredResults) {
      exportResults(filteredResults, state.filter);
    }
  };

  const filterLabel = state.filter === 'All' ? 'all' : state.filter.toLowerCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            <CardTitle className="text-base">Results</CardTitle>
            {hasResults && (
              <CardDescription className="text-xs">
                {filteredResults?.length.toLocaleString() ?? 0} {filterLabel} PLUs
              </CardDescription>
            )}
          </div>
          {hasResults && (
            <Button onClick={handleExport} variant="outline" size="sm" className="h-7">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasResults ? (
          filteredResults && <ResultsTable data={filteredResults} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Run an analysis to see results
          </div>
        )}
      </CardContent>
    </Card>
  );
}
