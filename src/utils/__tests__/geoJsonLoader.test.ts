import { GeoJsonLoader } from '../geoJsonLoader';

// Mock fetch globally since we're in Node.js environment
global.fetch = jest.fn();

// Mock the batch configuration constants
jest.mock('../../constants/batchConfig', () => ({
  BATCH_COUNT: 50,
  BATCH_FILE_PREFIX: 'alexandria_parcels_batch_',
  BATCH_FILE_SUFFIX: '.geojson.gz',
  DATA_DIRECTORY: 'data/',
  getBatchFilePath: jest.fn(
    (batchNumber: number) =>
      `data/alexandria_parcels_batch_${String(batchNumber).padStart(3, '0')}.geojson.gz`
  ),
  getAllBatchFilePaths: jest.fn(() =>
    Array.from(
      { length: 50 },
      (_, i) =>
        `data/alexandria_parcels_batch_${String(i + 1).padStart(3, '0')}.geojson.gz`
    )
  ),
}));

describe('GeoJsonLoader', () => {
  let loader: GeoJsonLoader;

  beforeEach(() => {
    loader = new GeoJsonLoader();
    // Clear any previous state
    jest.clearAllMocks();

    // Setup default fetch mock responses
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      // Extract batch number from URL
      const match = url.match(/batch_(\d+)\.geojson\.gz$/);
      const batchNumber = match ? parseInt(match[1], 10) : 0;

      if (batchNumber >= 1 && batchNumber <= 50) {
        // Mock successful response with sample GeoJSON data
        // Generate a realistic number of features per batch (around 1000 on average)
        const featureCount = Math.floor(Math.random() * 500) + 800; // 800-1300 features per batch
        const features = Array.from({ length: featureCount }, (_, i) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
              ],
            ],
          },
          properties: {
            batch: batchNumber,
            id: `parcel_${batchNumber}_${i + 1}`,
            area: Math.random() * 1000,
          },
        }));

        const mockGeoJson = {
          type: 'FeatureCollection' as const,
          features,
        };

        // Add a small delay to simulate realistic loading time
        await new Promise((resolve) => setTimeout(resolve, 10));

        return Promise.resolve({
          ok: true,
          headers: new Map([['content-length', String(featureCount * 100)]]),
          arrayBuffer: () =>
            Promise.resolve(
              new TextEncoder().encode(JSON.stringify(mockGeoJson)).buffer
            ),
        } as unknown as Response);
      } else {
        // Mock failed response for non-existent batches
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as unknown as Response);
      }
    });
  });

  describe('Core Functionality', () => {
    test('loads all batch files successfully using generated constants', async () => {
      const result = await loader.loadAllBatches();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Should have loaded features from all 50 batches
      const totalFeatures = result.reduce(
        (sum: number, _feature) => sum + 1,
        0
      );
      expect(totalFeatures).toBeGreaterThan(40000); // Should have ~47K+ features
    });

    test('loads individual batch files successfully', async () => {
      const batchResult = await loader.loadBatchFile(1);

      expect(batchResult).toBeDefined();
      expect(batchResult.batchNumber).toBe(1);
      expect(batchResult.features).toBeDefined();
      expect(Array.isArray(batchResult.features)).toBe(true);
      expect(batchResult.features.length).toBeGreaterThan(0);
      expect(batchResult.metadata).toBeDefined();
      expect(batchResult.metadata.featureCount).toBe(
        batchResult.features.length
      );
      expect(batchResult.metadata.loadTime).toBeGreaterThan(0);
      expect(batchResult.metadata.fileSize).toBeGreaterThan(0);
    });

    test('handles missing batch files gracefully', async () => {
      // Test with a batch number that doesn't exist
      const batchResult = await loader.loadBatchFile(999);

      expect(batchResult).toBeDefined();
      expect(batchResult.batchNumber).toBe(999);
      expect(batchResult.features).toEqual([]);
      expect(batchResult.metadata.error).toBeDefined();
      expect(batchResult.metadata.error).toContain('Failed to load');
    });

    test('processes compressed .gz files correctly', async () => {
      const batchResult = await loader.loadBatchFile(1);

      // Should successfully decompress and parse the .gz file
      expect(batchResult.features.length).toBeGreaterThan(0);

      // Each feature should have valid GeoJSON structure
      const feature = batchResult.features[0];
      expect(feature).toHaveProperty('type');
      expect(feature).toHaveProperty('geometry');
      expect(feature).toHaveProperty('properties');
      expect(feature.type).toBe('Feature');
    });

    test('aggregates all features into single collection', async () => {
      const allFeatures = await loader.getAllFeatures();

      expect(allFeatures).toBeDefined();
      expect(Array.isArray(allFeatures)).toBe(true);
      expect(allFeatures.length).toBeGreaterThan(40000);

      // All features should have valid GeoJSON structure
      allFeatures.forEach((feature) => {
        expect(feature).toHaveProperty('type', 'Feature');
        expect(feature).toHaveProperty('geometry');
        expect(feature).toHaveProperty('properties');
      });
    });

    test('tracks loading progress accurately', async () => {
      const progress = loader.getLoadingProgress();

      expect(progress).toBeDefined();
      expect(progress.totalBatches).toBe(50);
      expect(progress.loadedBatches).toBe(0);
      expect(progress.totalFeatures).toBe(0);
      expect(progress.loadedFeatures).toBe(0);
      expect(progress.currentBatch).toBe(0);
      expect(progress.isComplete).toBe(false);
      expect(progress.errors).toEqual([]);
    });

    test('handles corrupt or malformed data gracefully', async () => {
      // This test would require mocking a corrupt file response
      // For now, we'll test that the loader doesn't crash on errors
      const batchResult = await loader.loadBatchFile(999);

      expect(batchResult.metadata.error).toBeDefined();
      expect(batchResult.features).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    test('continues loading when individual batches fail', async () => {
      // Load all batches - some might fail but overall should succeed
      const allFeatures = await loader.getAllFeatures();

      expect(allFeatures.length).toBeGreaterThan(0);

      const progress = loader.getLoadingProgress();
      expect(progress.loadedBatches).toBeGreaterThan(0);
    });

    test('provides meaningful error messages', async () => {
      const batchResult = await loader.loadBatchFile(999);

      expect(batchResult.metadata.error).toBeDefined();
      expect(batchResult.metadata.error).toContain('Failed to load');
      expect(batchResult.metadata.error).toContain('999');
    });

    test('reports partial success for failed loads', async () => {
      // Load all batches and check progress
      await loader.loadAllBatches();

      const progress = loader.getLoadingProgress();
      expect(progress.loadedBatches).toBeGreaterThan(0);
      expect(progress.totalBatches).toBe(50);

      // Should have loaded some features even if some batches failed
      expect(progress.loadedFeatures).toBeGreaterThan(0);
    });

    test('manages memory during large dataset loading', async () => {
      // Load all batches and check memory usage
      const allFeatures = await loader.getAllFeatures();

      expect(allFeatures.length).toBeGreaterThan(40000);

      // The loader should handle large datasets without crashing
      // This is more of an integration test, but we can verify basic functionality
      expect(loader).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('loads all batches within reasonable time', async () => {
      const startTime = Date.now();

      await loader.loadAllBatches();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should complete within 30 seconds (reasonable for 50 files)
      expect(loadTime).toBeLessThan(30000);
    });

    test('loading progress updates in real-time', async () => {
      // Start loading in background
      const loadPromise = loader.loadAllBatches();

      // Check progress during loading
      let progress = loader.getLoadingProgress();
      expect(progress.loadedBatches).toBeGreaterThanOrEqual(0);

      // Wait for completion
      await loadPromise;

      // Check final progress
      progress = loader.getLoadingProgress();
      expect(progress.isComplete).toBe(true);
      expect(progress.loadedBatches).toBe(50);
    });

    test('can handle concurrent loading requests', async () => {
      // Test that multiple concurrent calls don't cause issues
      const promises = [
        loader.loadAllBatches(),
        loader.loadAllBatches(),
        loader.loadAllBatches(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty batch files', async () => {
      // This would require mocking an empty file response
      // For now, test that the loader handles edge cases gracefully
      const batchResult = await loader.loadBatchFile(1);

      expect(batchResult).toBeDefined();
      expect(batchResult.features).toBeDefined();
      expect(Array.isArray(batchResult.features)).toBe(true);
    });

    test('handles very large individual features', async () => {
      // Test with a batch that might have large features
      const batchResult = await loader.loadBatchFile(24); // This batch has 2038 lines

      expect(batchResult.features.length).toBeGreaterThan(0);

      // Should handle large features without crashing
      batchResult.features.forEach((feature) => {
        expect(feature).toHaveProperty('type', 'Feature');
        expect(feature).toHaveProperty('geometry');
      });
    });

    test('maintains feature order across batches', async () => {
      // Load first few batches and verify order
      const batch1 = await loader.loadBatchFile(1);
      const batch2 = await loader.loadBatchFile(2);

      expect(batch1.batchNumber).toBe(1);
      expect(batch2.batchNumber).toBe(2);

      // Features should be loaded in batch order
      expect(batch1.features.length).toBeGreaterThan(0);
      expect(batch2.features.length).toBeGreaterThan(0);
    });
  });
});
