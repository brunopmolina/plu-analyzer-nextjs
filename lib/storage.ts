// localStorage utilities for persistent plant data

import { STORAGE_KEYS } from './constants';
import type { PlantRecord, PlantMetadata } from './types';

/**
 * Save plant data to localStorage.
 */
export function savePlantData(data: PlantRecord[], metadata: PlantMetadata): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANT_DATA, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.PLANT_METADATA, JSON.stringify(metadata));
    return true;
  } catch (error) {
    console.error('Error saving plant data to localStorage:', error);
    return false;
  }
}

/**
 * Load plant data from localStorage.
 */
export function loadPlantData(): { data: PlantRecord[]; metadata: PlantMetadata } | null {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.PLANT_DATA);
    const metadataStr = localStorage.getItem(STORAGE_KEYS.PLANT_METADATA);

    if (!dataStr || !metadataStr) {
      return null;
    }

    return {
      data: JSON.parse(dataStr) as PlantRecord[],
      metadata: JSON.parse(metadataStr) as PlantMetadata,
    };
  } catch (error) {
    console.error('Error loading plant data from localStorage:', error);
    return null;
  }
}

/**
 * Clear plant data from localStorage.
 */
export function clearPlantData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLANT_DATA);
    localStorage.removeItem(STORAGE_KEYS.PLANT_METADATA);
    return true;
  } catch (error) {
    console.error('Error clearing plant data from localStorage:', error);
    return false;
  }
}

/**
 * Check if plant data exists in localStorage.
 */
export function hasStoredPlantData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLANT_DATA) !== null;
  } catch {
    return false;
  }
}
