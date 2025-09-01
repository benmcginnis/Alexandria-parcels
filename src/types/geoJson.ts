// GeoJSON Feature interface
export interface Feature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  properties: Record<string, unknown>;
}

// GeoJSON FeatureCollection interface
export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

// Batch loading result interface
export interface BatchLoadResult {
  batchNumber: number;
  features: Feature[];
  metadata: {
    featureCount: number;
    loadTime: number;
    fileSize: number;
    error?: string;
  };
}

// Loading progress interface
export interface LoadingProgress {
  totalBatches: number;
  loadedBatches: number;
  totalFeatures: number;
  loadedFeatures: number;
  currentBatch: number;
  isComplete: boolean;
  errors: string[];
}
