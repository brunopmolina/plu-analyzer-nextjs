'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AnalyzerState, AnalyzerAction, PlantRecord, PlantMetadata, InventoryRecord, StatusRecord, ProductRecord, RecommendationFilter } from '@/lib/types';
import { loadPlantData, savePlantData, clearPlantData } from '@/lib/storage';
import { getActiveStores } from '@/lib/store-filter';
import { analyzePLUs } from '@/lib/analyzer';

const initialState: AnalyzerState = {
  plantData: null,
  plantMetadata: null,
  activeStores: [],

  inventoryData: null,
  statusData: null,
  productData: null,

  plantStatus: { loaded: false, rowCount: 0 },
  inventoryStatus: { loaded: false, rowCount: 0 },
  statusStatus: { loaded: false, rowCount: 0 },
  productStatus: { loaded: false, rowCount: 0 },

  isAnalyzing: false,
  results: null,
  filteredOutResults: null,
  summary: null,

  filter: 'Action',
};

function analyzerReducer(state: AnalyzerState, action: AnalyzerAction): AnalyzerState {
  switch (action.type) {
    case 'SET_PLANT_DATA': {
      const { data, metadata, activeStores, fileName } = action.payload;
      return {
        ...state,
        plantData: data,
        plantMetadata: metadata,
        activeStores,
        plantStatus: {
          loaded: true,
          rowCount: data.length,
          fileName,
        },
      };
    }

    case 'CLEAR_PLANT_DATA':
      return {
        ...state,
        plantData: null,
        plantMetadata: null,
        activeStores: [],
        plantStatus: { loaded: false, rowCount: 0 },
      };

    case 'SET_INVENTORY_DATA':
      return {
        ...state,
        inventoryData: action.payload.data,
        inventoryStatus: {
          loaded: true,
          rowCount: action.payload.data.length,
          fileName: action.payload.fileName,
        },
        // Clear results when new data is loaded
        results: null,
        filteredOutResults: null,
        summary: null,
      };

    case 'SET_STATUS_DATA':
      return {
        ...state,
        statusData: action.payload.data,
        statusStatus: {
          loaded: true,
          rowCount: action.payload.data.length,
          fileName: action.payload.fileName,
        },
        results: null,
        filteredOutResults: null,
        summary: null,
      };

    case 'SET_PRODUCT_DATA':
      return {
        ...state,
        productData: action.payload.data,
        productStatus: {
          loaded: true,
          rowCount: action.payload.data.length,
          fileName: action.payload.fileName,
        },
        results: null,
        filteredOutResults: null,
        summary: null,
      };

    case 'SET_FILE_ERROR': {
      const statusKey = `${action.payload.fileType}Status` as keyof AnalyzerState;
      return {
        ...state,
        [statusKey]: {
          loaded: false,
          rowCount: 0,
          error: action.payload.error,
        },
      };
    }

    case 'DISMISS_FILE_STATUS': {
      const statusKey = `${action.payload.fileType}Status` as keyof AnalyzerState;
      return {
        ...state,
        [statusKey]: {
          loaded: false,
          rowCount: 0,
        },
      };
    }

    case 'RUN_ANALYSIS':
      return {
        ...state,
        isAnalyzing: true,
      };

    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        isAnalyzing: false,
        results: action.payload.results,
        filteredOutResults: action.payload.filteredOutResults,
        summary: action.payload.summary,
      };

    case 'CLEAR_SESSION':
      return {
        ...state,
        inventoryData: null,
        statusData: null,
        productData: null,
        inventoryStatus: { loaded: false, rowCount: 0 },
        statusStatus: { loaded: false, rowCount: 0 },
        productStatus: { loaded: false, rowCount: 0 },
        results: null,
        filteredOutResults: null,
        summary: null,
        filter: 'Action',
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        plantData: action.payload.plantData,
        plantMetadata: action.payload.metadata,
        activeStores: action.payload.activeStores,
        plantStatus: {
          loaded: true,
          rowCount: action.payload.plantData.length,
          fileName: action.payload.metadata.source_file,
        },
      };

    default:
      return state;
  }
}

interface AnalyzerContextValue {
  state: AnalyzerState;
  dispatch: React.Dispatch<AnalyzerAction>;
  setPlantData: (data: PlantRecord[], fileName: string) => void;
  clearStoredPlantData: () => void;
  setInventoryData: (data: InventoryRecord[], fileName: string) => void;
  setStatusData: (data: StatusRecord[], fileName: string) => void;
  setProductData: (data: ProductRecord[], fileName: string) => void;
  setFileError: (fileType: 'plant' | 'inventory' | 'status' | 'product', error: string) => void;
  dismissFileStatus: (fileType: 'plant' | 'inventory' | 'status' | 'product') => void;
  runAnalysis: () => void;
  clearSession: () => void;
  setFilter: (filter: RecommendationFilter) => void;
  canRunAnalysis: boolean;
  filteredResults: typeof initialState.results;
}

const AnalyzerContext = createContext<AnalyzerContextValue | null>(null);

export function AnalyzerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(analyzerReducer, initialState);

  // Load plant data from localStorage on mount
  useEffect(() => {
    const stored = loadPlantData();
    if (stored) {
      const activeStores = getActiveStores(stored.data);
      dispatch({
        type: 'LOAD_FROM_STORAGE',
        payload: {
          plantData: stored.data,
          metadata: stored.metadata,
          activeStores,
        },
      });
    }
  }, []);

  const setPlantData = useCallback((data: PlantRecord[], fileName: string) => {
    const activeStores = getActiveStores(data);
    const metadata: PlantMetadata = {
      last_updated: new Date().toISOString(),
      source_file: fileName,
    };
    savePlantData(data, metadata);
    dispatch({
      type: 'SET_PLANT_DATA',
      payload: { data, metadata, activeStores, fileName },
    });
  }, []);

  const clearStoredPlantData = useCallback(() => {
    clearPlantData();
    dispatch({ type: 'CLEAR_PLANT_DATA' });
  }, []);

  const setInventoryData = useCallback((data: InventoryRecord[], fileName: string) => {
    dispatch({ type: 'SET_INVENTORY_DATA', payload: { data, fileName } });
  }, []);

  const setStatusData = useCallback((data: StatusRecord[], fileName: string) => {
    dispatch({ type: 'SET_STATUS_DATA', payload: { data, fileName } });
  }, []);

  const setProductData = useCallback((data: ProductRecord[], fileName: string) => {
    dispatch({ type: 'SET_PRODUCT_DATA', payload: { data, fileName } });
  }, []);

  const setFileError = useCallback((fileType: 'plant' | 'inventory' | 'status' | 'product', error: string) => {
    dispatch({ type: 'SET_FILE_ERROR', payload: { fileType, error } });
  }, []);

  const dismissFileStatus = useCallback((fileType: 'plant' | 'inventory' | 'status' | 'product') => {
    dispatch({ type: 'DISMISS_FILE_STATUS', payload: { fileType } });
  }, []);

  const canRunAnalysis = Boolean(
    state.plantData &&
    state.activeStores.length > 0 &&
    state.inventoryData &&
    state.statusData &&
    state.productData
  );

  const runAnalysis = useCallback(() => {
    if (!canRunAnalysis) return;

    dispatch({ type: 'RUN_ANALYSIS' });

    // Run analysis (synchronous but we use setTimeout to allow UI to update)
    setTimeout(() => {
      const { results, filteredOutResults, summary } = analyzePLUs(
        state.inventoryData!,
        state.statusData!,
        state.productData!,
        state.activeStores
      );
      dispatch({ type: 'ANALYSIS_COMPLETE', payload: { results, filteredOutResults, summary } });
    }, 0);
  }, [canRunAnalysis, state.inventoryData, state.statusData, state.productData, state.activeStores]);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const setFilter = useCallback((filter: RecommendationFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const filteredResults = useMemo(() => {
    if (!state.results) return null;
    if (state.filter === 'All') return state.results;
    if (state.filter === 'Action') {
      return state.results.filter((r) => r.Recommendation === 'Publish' || r.Recommendation === 'Publish - TEMP' || r.Recommendation === 'Unpublish');
    }
    return state.results.filter((r) => r.Recommendation === state.filter);
  }, [state.results, state.filter]);

  const value: AnalyzerContextValue = {
    state,
    dispatch,
    setPlantData,
    clearStoredPlantData,
    setInventoryData,
    setStatusData,
    setProductData,
    setFileError,
    dismissFileStatus,
    runAnalysis,
    clearSession,
    setFilter,
    canRunAnalysis,
    filteredResults,
  };

  return (
    <AnalyzerContext.Provider value={value}>
      {children}
    </AnalyzerContext.Provider>
  );
}

export function useAnalyzer() {
  const context = useContext(AnalyzerContext);
  if (!context) {
    throw new Error('useAnalyzer must be used within an AnalyzerProvider');
  }
  return context;
}
