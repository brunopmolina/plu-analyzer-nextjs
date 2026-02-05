'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloudDownload, Loader2, RefreshCw } from 'lucide-react';

interface R2FetchButtonProps {
  filename: string;
  label: string;
  onFetchedFile: (file: File) => Promise<void>;
  disabled?: boolean;
  noWrapper?: boolean;
  inlineLabel?: string;
}

export function R2FetchButton({ filename, label, onFetchedFile, disabled, noWrapper, inlineLabel }: R2FetchButtonProps) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setStatus('fetching');
    setError(null);
    try {
      const res = await fetch(`/api/csv?file=${encodeURIComponent(filename)}`);
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }
      const csvText = await res.text();
      const file = new File([csvText], filename, { type: 'text/csv' });
      await onFetchedFile(file);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setStatus('error');
    }
  };

  const wrapper = (content: React.ReactNode) => {
    if (noWrapper) {
      if (inlineLabel) {
        return (
          <div className="inline-flex flex-col gap-1">
            {content}
            <p className="text-xs text-muted-foreground">{inlineLabel}</p>
          </div>
        );
      }
      return content;
    }
    return (
      <div className="pt-3 border-t mt-3">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {content}
      </div>
    );
  };

  if (status === 'error') {
    return wrapper(
      <div className="inline-flex flex-col gap-0.5">
        <Button
          variant="default"
          size="sm"
          onClick={handleFetch}
          disabled={disabled}
          className="h-8 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="ml-1.5">Retry Download</span>
        </Button>
        <div className="text-xs text-red-500 leading-tight">{error}</div>
      </div>
    );
  }

  if (status === 'fetching') {
    return wrapper(
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="h-8 text-xs"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-1.5">Downloading from Snowflake...</span>
      </Button>
    );
  }

  return wrapper(
    <Button
      variant="default"
      size="sm"
      onClick={handleFetch}
      disabled={disabled}
      className="h-8 text-xs"
    >
      <CloudDownload className="h-4 w-4" />
      <span className="ml-1.5">Download from Snowflake</span>
    </Button>
  );
}
