'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploadButton } from '@/components/FileUploadButton';
import { CTFetchButton } from '@/components/CTFetchButton';
import { R2FetchButton } from '@/components/R2FetchButton';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { parsePlantCSV, parseInventoryCSV, parseStatusCSV, parseProductCSV } from '@/lib/csv-parser';
import { REQUIRED_COLUMNS } from '@/lib/constants';
import { FolderOpen, Trash2, RefreshCw } from 'lucide-react';
import { StoreDescriptionsDialog } from '@/components/StoreDescriptionsDialog';
import { toast } from 'sonner';

export function MobileFilesSection() {
  const {
    state,
    setPlantData,
    clearStoredPlantData,
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

  const handlePlantSelect = async (file: File) => {
    setLoadingFile('plant');
    try {
      const result = await parsePlantCSV(file);
      if (result.error) {
        setFileError('plant', result.error);
        showFileError('Invalid Plant Data File', result.error, REQUIRED_COLUMNS.plant);
      } else if (result.data) {
        setPlantData(result.data, file.name);
        toast.success('Plant data loaded', {
          description: `${result.data.length} rows loaded successfully`,
        });
      }
    } catch {
      setFileError('plant', 'Failed to parse file');
      toast.error('Failed to parse file');
    } finally {
      setLoadingFile(null);
    }
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
    } finally {
      setLoadingFile(null);
    }
  };

  const hasAnySessionData =
    state.inventoryStatus.loaded ||
    state.statusStatus.loaded ||
    state.productStatus.loaded;

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="md:hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-4 w-4" />
          Data Files
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Plant Data */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Plant Data (persistent)</p>
          <FileUploadButton
            label="v_dim_plant.csv"
            status={state.plantStatus}
            onFileSelect={handlePlantSelect}
            onDismissStatus={() => dismissFileStatus('plant')}
            isLoading={loadingFile === 'plant'}
            helperText="You can Export from Snowflake"
          />
          <R2FetchButton
            filename="dim_plant.csv"
            label="Or Download from Snowflake:"
            onFetchedFile={handlePlantSelect}
            disabled={loadingFile !== null}
          />
          {state.plantStatus.loaded && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
              <div className="text-sm">
                <span className="font-medium">{state.activeStores.length} stores</span>
                {state.plantMetadata && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {formatDate(state.plantMetadata.last_updated)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StoreDescriptionsDialog />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearStoredPlantData}
                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Clear plant data"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Session Files */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Session Files</p>
            {hasAnySessionData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSession}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 min-[700px]:grid-cols-3 gap-2">
            <FileUploadButton
              label="Inventory in CT.csv"
              status={state.inventoryStatus}
              onFileSelect={handleInventorySelect}
              onDismissStatus={() => dismissFileStatus('inventory')}
              isLoading={loadingFile === 'inventory'}
              helperText="You can Export from CT"
            />
            <FileUploadButton
              label="Status in CT.csv"
              status={state.statusStatus}
              onFileSelect={handleStatusSelect}
              onDismissStatus={() => dismissFileStatus('status')}
              isLoading={loadingFile === 'status'}
              helperText="You can Export from CT"
            />
            <FileUploadButton
              label="v_dim_product.csv"
              status={state.productStatus}
              onFileSelect={handleProductSelect}
              onDismissStatus={() => dismissFileStatus('product')}
              isLoading={loadingFile === 'product'}
              helperText="You can Export from Snowflake"
            />
          </div>
          <R2FetchButton
            filename="dim_product.csv"
            label="Or Download Product Data from Snowflake:"
            onFetchedFile={handleProductSelect}
            disabled={loadingFile !== null}
          />
        </div>

        {/* CT Fetch section - only shows if configured */}
        <CTFetchButton
          onComplete={(inventory, status) => {
            setInventoryData(inventory, 'CommerceTools API');
            setStatusData(status, 'CommerceTools API');
            toast.success('Data loaded from CommerceTools', {
              description: `${inventory.length.toLocaleString()} inventory, ${status.length.toLocaleString()} status`,
            });
          }}
        />
      </CardContent>
    </Card>
  );
}
