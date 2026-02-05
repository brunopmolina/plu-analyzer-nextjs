'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { Play, Loader2, CheckCircle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import type { RecommendationFilter } from '@/lib/types';

export function AnalysisSection() {
  const { state, canRunAnalysis, runAnalysis, setFilter } = useAnalyzer();

  const getMissingFiles = () => {
    const missing: string[] = [];
    if (!state.plantStatus.loaded) missing.push('Plant data');
    if (!state.inventoryStatus.loaded) missing.push('Inventory');
    if (!state.statusStatus.loaded) missing.push('Status');
    if (!state.productStatus.loaded) missing.push('Product');
    return missing;
  };

  const missingFiles = getMissingFiles();

  const handleFilterClick = (filter: RecommendationFilter) => {
    setFilter(filter);
  };

  const isSelected = (filter: RecommendationFilter) => state.filter === filter;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 sm:gap-2 p-3 rounded-lg border bg-card">
      {/* Run button */}
      <Button
        onClick={runAnalysis}
        disabled={!canRunAnalysis || state.isAnalyzing}
        size="sm"
        className="w-full sm:w-auto shrink-0 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:translate-y-0"
      >
        {state.isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-1" />
            Analyze
          </>
        )}
      </Button>

      {!canRunAnalysis && missingFiles.length > 0 && (
        <span className="text-xs font-bold text-red-500 dark:text-red-400 text-center sm:text-left">
          Missing: {missingFiles.join(', ')}
        </span>
      )}

      {state.summary && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
          {/* Action Needed (Publish + Unpublish) - full width on mobile */}
          <button
            onClick={() => handleFilterClick('Action')}
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border-2 col-span-2 sm:col-span-1
              ${isSelected('Action') ? 'border-amber-500' : 'border-transparent'}`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="font-bold">{state.summary.to_publish + state.summary.to_unpublish}</span>
            <span className="text-xs opacity-75">Action Needed</span>
          </button>

          {/* To Publish */}
          <button
            onClick={() => handleFilterClick('Publish')}
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400 border-2
              ${isSelected('Publish') ? 'border-green-500' : 'border-transparent'}`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="font-bold">{state.summary.to_publish}</span>
            <span className="text-xs opacity-75">Publish</span>
          </button>

          {/* To Unpublish */}
          <button
            onClick={() => handleFilterClick('Unpublish')}
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-2
              ${isSelected('Unpublish') ? 'border-red-500' : 'border-transparent'}`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="font-bold">{state.summary.to_unpublish}</span>
            <span className="text-xs opacity-75">Unpublish</span>
          </button>

          {/* No Action */}
          <button
            onClick={() => handleFilterClick('No Action')}
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-2
              ${isSelected('No Action') ? 'border-gray-500' : 'border-transparent'}`}
          >
            <MinusCircle className="h-3.5 w-3.5" />
            <span className="font-bold">{state.summary.no_action}</span>
            <span className="text-xs opacity-75">No Action</span>
          </button>

          {/* All PLUs */}
          <button
            onClick={() => handleFilterClick('All')}
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-px active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-2
              ${isSelected('All') ? 'border-blue-500' : 'border-transparent'}`}
          >
            <span className="font-bold">{state.summary.total_plus}</span>
            <span className="text-xs opacity-75">All Items</span>
          </button>
        </div>
      )}
    </div>
  );
}
