'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploadButton } from '@/components/FileUploadButton';
import { CTFetchButton } from '@/components/CTFetchButton';
import { R2FetchButton } from '@/components/R2FetchButton';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { parseInventoryCSV, parseStatusCSV, parseProductCSV } from '@/lib/csv-parser';
import { REQUIRED_COLUMNS } from '@/lib/constants';
import { FileText, RefreshCw } from 'lucide-react';
import { downloadRecordsAsCSV } from '@/lib/export';
import { toast } from 'sonner';

export function SessionFilesSection() {
  const {
    state,
    setInventoryData,
    setStatusData,
    setProductData,
    setFileError,
    dismissFileStatus,
    clearSession,
  } = useAnalyzer();

  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const showFileError = (title: string, error: string, columns: readonly string[]) => {
    toast.error(title, {
      description: (
        <div className="mt-2">
          <p className="mb-2">{error}</p>
          <p className="font-medium">Expected columns:</p>
          <ul className="list-disc list-inside text-sm mt-1">
            {columns.map((col) => (
              <li key={col}>{col}</li>
            ))}
          </ul>
        </div>
      ),
      duration: 8000,
    });
  };

  const handleInventorySelect = async (file: File) => {
    setLoadingFile('inventory');
    try {
      const result = await parseInventoryCSV(file);
      if (result.error) {
        setFileError('inventory', result.error);
        showFileError('Invalid Inventory File', result.error, REQUIRED_COLUMNS.inventory);
      } else if (result.data) {
        setInventoryData(result.data, file.name);
        toast.success('Inventory data loaded', {
          description: `${result.data.length.toLocaleString()} rows loaded`,
        });
      }
    } catch {
      setFileError('inventory', 'Failed to parse file');
      toast.error('Failed to parse file', {
        description: 'Please ensure the file is a valid CSV.',
      });
    } finally {
      setLoadingFile(null);
    }
  };

  const handleStatusSelect = async (file: File) => {
    setLoadingFile('status');
    try {
      const result = await parseStatusCSV(file);
      if (result.error) {
        setFileError('status', result.error);
        showFileError('Invalid Status File', result.error, REQUIRED_COLUMNS.status);
      } else if (result.data) {
        setStatusData(result.data, file.name);
        toast.success('Status data loaded', {
          description: `${result.data.length.toLocaleString()} rows loaded`,
        });
      }
    } catch {
      setFileError('status', 'Failed to parse file');
      toast.error('Failed to parse file', {
        description: 'Please ensure the file is a valid CSV.',
      });
    } finally {
      setLoadingFile(null);
    }
  };

  const handleProductSelect = async (file: File) => {
    setLoadingFile('product');
    try {
      const result = await parseProductCSV(file);
      if (result.error) {
        setFileError('product', result.error);
        showFileError('Invalid Product File', result.error, REQUIRED_COLUMNS.product);
      } else if (result.data) {
        setProductData(result.data, file.name);
        toast.success('Product data loaded', {
          description: `${result.data.length.toLocaleString()} rows loaded`,
        });
      }
    } catch {
      setFileError('product', 'Failed to parse file');
      toast.error('Failed to parse file', {
        description: 'Please ensure the file is a valid CSV.',
      });
    } finally {
      setLoadingFile(null);
    }
  };

  const hasAnySessionData =
    state.inventoryStatus.loaded ||
    state.statusStatus.loaded ||
    state.productStatus.loaded;

  return (
    <Card className="hidden md:block h-full lg:flex-1">
      <CardHeader className="pb-2 lg:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <CardTitle className="text-base">Session Files</CardTitle>
          </div>
          {hasAnySessionData && (
            <Button variant="destructive" size="sm" onClick={clearSession} className="h-7 px-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 lg:gap-3 sm:grid-cols-3">
          <FileUploadButton
            label="Inventory in CT.csv"
            status={state.inventoryStatus}
            onFileSelect={handleInventorySelect}
            onDismissStatus={() => dismissFileStatus('inventory')}
            onDownload={() => {
              if (state.inventoryData) downloadRecordsAsCSV(state.inventoryData, state.inventoryStatus.fileName ?? 'inventory.csv');
            }}
            isLoading={loadingFile === 'inventory'}
            helperText="You can Export from CT"
          />
          <FileUploadButton
            label="Status in CT.csv"
            status={state.statusStatus}
            onFileSelect={handleStatusSelect}
            onDismissStatus={() => dismissFileStatus('status')}
            onDownload={() => {
              if (state.statusData) downloadRecordsAsCSV(state.statusData, state.statusStatus.fileName ?? 'status.csv');
            }}
            isLoading={loadingFile === 'status'}
            helperText="You can Export from CT"
          />
          <FileUploadButton
            label="v_dim_product.csv"
            status={state.productStatus}
            onFileSelect={handleProductSelect}
            onDismissStatus={() => dismissFileStatus('product')}
            onDownload={() => {
              if (state.productData) downloadRecordsAsCSV(state.productData, state.productStatus.fileName ?? 'v_dim_product.csv');
            }}
            isLoading={loadingFile === 'product'}
            helperText="You can Export from Snowflake"
          />
        </div>

        {/* Download buttons */}
        <div className="pt-3 border-t mt-3">
          <p className="text-xs text-muted-foreground mb-2">Or Download Automatically:</p>
          <div className="flex flex-wrap items-start gap-4">
            <CTFetchButton
              noWrapper
              inlineLabel="Download Inventory & Status Data from CT"
              onComplete={(inventory, status) => {
                setInventoryData(inventory, 'CommerceTools API');
                setStatusData(status, 'CommerceTools API');
                toast.success('Data loaded from CommerceTools', {
                  description: `${inventory.length.toLocaleString()} inventory records, ${status.length.toLocaleString()} status records`,
                });
              }}
            />
            <R2FetchButton
              filename="dim_product.csv"
              label=""
              onFetchedFile={handleProductSelect}
              disabled={loadingFile !== null}
              noWrapper
              inlineLabel="Download Product Data from Snowflake"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
