'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCTFetch } from '@/hooks/useCTFetch';
import { CloudDownload, Loader2, X, AlertCircle, RefreshCw } from 'lucide-react';
import type { InventoryRecord, StatusRecord } from '@/lib/types';

interface CTFetchButtonProps {
  onComplete: (inventory: InventoryRecord[], status: StatusRecord[]) => void;
}

export function CTFetchButton({ onComplete }: CTFetchButtonProps) {
  const {
    isConfigured,
    isFetching,
    progress,
    error,
    startFetch,
    cancelFetch,
  } = useCTFetch({
    onComplete,
  });

  // Don't render if not configured or still checking
  if (isConfigured === null || isConfigured === false) {
    return null;
  }

  // Wrapper with label text
  const wrapper = (content: React.ReactNode) => (
    <div className="pt-3 border-t mt-3">
      <p className="text-xs text-muted-foreground mb-2">Or fetch Inventory & Status Automatically:</p>
      {content}
    </div>
  );

  // Error state
  if (error) {
    return wrapper(
      <div className="inline-flex flex-col gap-0.5">
        <Button
          variant="default"
          size="sm"
          onClick={startFetch}
          className="h-8 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="ml-1.5">Retry Fetch</span>
        </Button>
        <div className="text-xs text-red-500 leading-tight">{error}</div>
      </div>
    );
  }

  // Fetching state
  if (isFetching && progress) {
    return wrapper(
      <div className="inline-flex flex-col gap-0.5 min-w-[200px]">
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="h-8 text-xs"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-1.5">Fetching from CT...</span>
        </Button>
        <div className="flex items-center gap-2">
          <Progress value={progress.percent} className="h-1.5 flex-1" />
          <button
            type="button"
            onClick={cancelFetch}
            className="p-0.5 hover:bg-muted rounded shrink-0 opacity-60 hover:opacity-100"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground leading-tight truncate">
          {progress.message}
        </div>
      </div>
    );
  }

  // Idle state
  return wrapper(
    <Button
      variant="default"
      size="sm"
      onClick={startFetch}
      className="h-8 text-xs"
    >
      <CloudDownload className="h-4 w-4" />
      <span className="ml-1.5">Fetch from CommerceTools</span>
    </Button>
  );
}
