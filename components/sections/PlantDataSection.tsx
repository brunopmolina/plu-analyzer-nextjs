'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploadButton } from '@/components/FileUploadButton';
import { R2FetchButton } from '@/components/R2FetchButton';
import { useAnalyzer } from '@/context/AnalyzerContext';
import { parsePlantCSV } from '@/lib/csv-parser';
import { REQUIRED_COLUMNS } from '@/lib/constants';
import { Trash2, Store } from 'lucide-react';
import { StoreDescriptionsDialog } from '@/components/StoreDescriptionsDialog';
import { toast } from 'sonner';

export function PlantDataSection() {
  const { state, setPlantData, clearStoredPlantData, setFileError, dismissFileStatus } = useAnalyzer();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await parsePlantCSV(file);
      if (result.error) {
        setFileError('plant', result.error);
        toast.error('Invalid Plant Data File', {
          description: (
            <div className="mt-2">
              <p className="mb-2">{result.error}</p>
              <p className="font-medium">Expected columns:</p>
              <ul className="list-disc list-inside text-sm mt-1">
                {REQUIRED_COLUMNS.plant.map((col) => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 8000,
        });
      } else if (result.data) {
        setPlantData(result.data, file.name);
        toast.success('Plant data loaded', {
          description: `${result.data.length} rows loaded successfully`,
        });
      }
    } catch {
      setFileError('plant', 'Failed to parse file');
      toast.error('Failed to parse file', {
        description: 'Please ensure the file is a valid CSV.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="hidden md:block">
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="h-4 w-4" />
          Plant Data
        </CardTitle>
        <CardDescription className="text-xs">
          Persistent across sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3 pt-0">
        <FileUploadButton
          label="v_dim_plant.csv"
          status={state.plantStatus}
          onFileSelect={handleFileSelect}
          onDismissStatus={() => dismissFileStatus('plant')}
          isLoading={isLoading}
          helperText="You can Export from Snowflake"
        />
        <R2FetchButton
          filename="dim_plant.csv"
          label="Or Download from Snowflake:"
          onFetchedFile={handleFileSelect}
          disabled={isLoading}
        />

        {state.plantStatus.loaded && (
          <div className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted text-sm">
            <div>
              <p className="font-medium">{state.activeStores.length} active stores</p>
              {state.plantMetadata && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(state.plantMetadata.last_updated)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 [&_button]:w-full">
              <Button
                variant="destructive"
                size="sm"
                onClick={clearStoredPlantData}
                className="h-7 px-2"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <StoreDescriptionsDialog />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
