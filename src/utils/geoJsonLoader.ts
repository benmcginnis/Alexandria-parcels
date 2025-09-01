import {
  BATCH_COUNT,
  getBatchFilePath,
  getAllBatchFilePaths,
} from '../constants/batchConfig';
import {
  Feature,
  FeatureCollection,
  BatchLoadResult,
  LoadingProgress,
} from '../types/geoJson';

// Export the types for use in tests and other modules
export type { BatchLoadResult, LoadingProgress } from '../types/geoJson';

export class GeoJsonLoader {
  private loadedBatches: Map<number, BatchLoadResult> = new Map();
  private loadingPromises: Map<number, Promise<BatchLoadResult>> = new Map();
  private progress: LoadingProgress;
  private allFeatures: Feature[] = [];

  constructor() {
    this.progress = {
      totalBatches: BATCH_COUNT,
      loadedBatches: 0,
      totalFeatures: 0,
      loadedFeatures: 0,
      currentBatch: 0,
      isComplete: false,
      errors: [],
    };
  }

  /**
   * Load a single batch file by batch number
   */
  async loadBatchFile(batchNumber: number): Promise<BatchLoadResult> {
    // Check if already loaded
    if (this.loadedBatches.has(batchNumber)) {
      return this.loadedBatches.get(batchNumber)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(batchNumber)) {
      return this.loadingPromises.get(batchNumber)!;
    }

    // Start loading
    const loadPromise = this.loadBatchFileInternal(batchNumber);
    this.loadingPromises.set(batchNumber, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedBatches.set(batchNumber, result);
      this.loadingPromises.delete(batchNumber);

      // Update progress
      this.updateProgress(result);

      return result;
    } catch (error) {
      this.loadingPromises.delete(batchNumber);
      throw error;
    }
  }

  /**
   * Internal method to load a batch file
   */
  private async loadBatchFileInternal(
    batchNumber: number
  ): Promise<BatchLoadResult> {
    const startTime = Date.now();
    const filePath = getBatchFilePath(batchNumber);

    try {
      // Fetch the compressed file
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get file size
      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

      // Decompress and parse the GeoJSON
      const arrayBuffer = await response.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);

      // Parse GeoJSON
      const geoJson: FeatureCollection = JSON.parse(text);

      if (!geoJson || !geoJson.features || !Array.isArray(geoJson.features)) {
        throw new Error('Invalid GeoJSON structure');
      }

      const loadTime = Date.now() - startTime;

      const result: BatchLoadResult = {
        batchNumber,
        features: geoJson.features,
        metadata: {
          featureCount: geoJson.features.length,
          loadTime,
          fileSize,
        },
      };

      return result;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const result: BatchLoadResult = {
        batchNumber,
        features: [],
        metadata: {
          featureCount: 0,
          loadTime,
          fileSize: 0,
          error: `Failed to load batch ${batchNumber}: ${errorMessage}`,
        },
      };

      // Add to errors list
      this.progress.errors.push(`Batch ${batchNumber}: ${errorMessage}`);

      return result;
    }
  }

  /**
   * Load all batch files sequentially
   */
  async loadAllBatches(): Promise<Feature[]> {
    if (this.progress.isComplete) {
      return this.allFeatures;
    }

    this.progress.currentBatch = 1;
    this.allFeatures = [];

    for (let i = 1; i <= BATCH_COUNT; i++) {
      try {
        this.progress.currentBatch = i;
        const batchResult = await this.loadBatchFile(i);

        if (batchResult.features.length > 0) {
          this.allFeatures.push(...batchResult.features);
        }

        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        this.progress.errors.push(`Batch ${i}: ${error}`);
      }
    }

    this.progress.isComplete = true;
    this.progress.currentBatch = BATCH_COUNT;

    return this.allFeatures;
  }

  /**
   * Get all loaded features
   */
  async getAllFeatures(): Promise<Feature[]> {
    if (this.progress.isComplete) {
      return this.allFeatures;
    }

    return this.loadAllBatches();
  }

  /**
   * Get current loading progress
   */
  getLoadingProgress(): LoadingProgress {
    return { ...this.progress };
  }

  /**
   * Update progress after loading a batch
   */
  private updateProgress(result: BatchLoadResult): void {
    this.progress.loadedBatches++;
    this.progress.loadedFeatures += result.features.length;

    if (result.metadata.error) {
      this.progress.errors.push(result.metadata.error);
    }

    // Update total features count
    this.progress.totalFeatures = this.progress.loadedFeatures;
  }

  /**
   * Reset the loader state
   */
  reset(): void {
    this.loadedBatches.clear();
    this.loadingPromises.clear();
    this.allFeatures = [];
    this.progress = {
      totalBatches: BATCH_COUNT,
      loadedBatches: 0,
      totalFeatures: 0,
      loadedFeatures: 0,
      currentBatch: 0,
      isComplete: false,
      errors: [],
    };
  }

  /**
   * Get batch file paths for debugging
   */
  getBatchFilePaths(): string[] {
    return getAllBatchFilePaths();
  }

  /**
   * Check if a specific batch is loaded
   */
  isBatchLoaded(batchNumber: number): boolean {
    return this.loadedBatches.has(batchNumber);
  }

  /**
   * Get loaded batch count
   */
  getLoadedBatchCount(): number {
    return this.progress.loadedBatches;
  }

  /**
   * Get total feature count
   */
  getTotalFeatureCount(): number {
    return this.progress.loadedFeatures;
  }
}
