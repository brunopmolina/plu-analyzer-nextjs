'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { InventoryRecord, StatusRecord } from '@/lib/types';
import type { CTFetchStep } from '@/lib/ct/types';

export interface CTFetchProgress {
  step: CTFetchStep;
  message: string;
  percent: number;
}

interface UseCTFetchOptions {
  onComplete?: (inventory: InventoryRecord[], status: StatusRecord[]) => void;
  onError?: (error: string) => void;
}

interface UseCTFetchReturn {
  isConfigured: boolean | null;
  isFetching: boolean;
  progress: CTFetchProgress | null;
  error: string | null;
  startFetch: () => void;
  cancelFetch: () => void;
}

export function useCTFetch(options: UseCTFetchOptions = {}): UseCTFetchReturn {
  const { onComplete, onError } = options;
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState<CTFetchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if CT is configured on mount
  useEffect(() => {
    fetch('/api/ct/status')
      .then(res => res.json())
      .then(data => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const startFetch = useCallback(() => {
    if (isFetching) return;

    setIsFetching(true);
    setError(null);
    setProgress({ step: 'auth', message: 'Starting...', percent: 0 });

    abortControllerRef.current = new AbortController();

    fetch('/api/ct/fetch', {
      method: 'POST',
      signal: abortControllerRef.current.signal,
    })
      .then(async response => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch from CommerceTools');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'progress') {
                  setProgress({
                    step: event.step,
                    message: event.message,
                    percent: event.percent || 0,
                  });
                } else if (event.type === 'complete') {
                  setProgress({
                    step: 'inventory',
                    message: `Loaded ${event.data.inventoryCount.toLocaleString()} inventory records and ${event.data.statusCount.toLocaleString()} status records`,
                    percent: 100,
                  });
                } else if (event.type === 'data') {
                  onComplete?.(event.inventory, event.status);
                  setIsFetching(false);
                  setProgress(null);
                } else if (event.type === 'error') {
                  throw new Error(event.message);
                }
              } catch (e) {
                if (e instanceof SyntaxError) {
                  // Ignore JSON parse errors for partial data
                } else {
                  throw e;
                }
              }
            }
          }
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          setProgress(null);
        } else {
          const errorMessage = err.message || 'Failed to fetch from CommerceTools';
          setError(errorMessage);
          onError?.(errorMessage);
        }
        setIsFetching(false);
      });
  }, [isFetching, onComplete, onError]);

  const cancelFetch = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsFetching(false);
    setProgress(null);
  }, []);

  return {
    isConfigured,
    isFetching,
    progress,
    error,
    startFetch,
    cancelFetch,
  };
}
