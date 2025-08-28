import { FeatureSplitter, SplitterConfig } from '../utils/feature-splitter';

describe('Feature Splitting Logic Tests', () => {
  // Mock data for testing
  const mockFeatures = Array.from({ length: 2500 }, (_, i) => ({
    type: 'Feature',
    properties: {
      OBJECTID: i + 1,
      PID_RE: `PID_${i + 1}`,
      ADDRESS_GIS: `Address ${i + 1}`,
      ZONING: 'R-5',
      LAND_SF: 5000 + (i * 100)
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-77.123456789012345 + (i * 0.000001), 38.987654321098765 + (i * 0.000001)],
        [-77.123456789012345 + (i * 0.000001), 38.987654321098765 + (i * 0.000002)],
        [-77.123456789012345 + (i * 0.000002), 38.987654321098765 + (i * 0.000002)],
        [-77.123456789012345 + (i * 0.000002), 38.987654321098765 + (i * 0.000001)],
        [-77.123456789012345 + (i * 0.000001), 38.987654321098765 + (i * 0.000001)]
      ]]
    }
  }));

  describe('Core Splitting Functionality', () => {
    test('Test 3.1: Verify `splitFeaturesIntoBatches` function creates correct number of batches', () => {
      const config: SplitterConfig = {
        inputFile: 'rawdata/Alexandria_Parcels.geojson',
        outputDir: 'data/',
        batchSize: 1000,
        coordinatePrecision: 6,
        clearOutput: false
      };
      
      const splitter = new FeatureSplitter(config);
      
      // Test with 2500 features, batch size 1000
      const batches = splitter.splitFeaturesIntoBatches(mockFeatures);
      
      // Should create 3 batches: 1000, 1000, 500
      expect(batches.length).toBe(3);
      expect(batches[0].length).toBe(1000); // First batch: 1000 features
      expect(batches[1].length).toBe(1000); // Second batch: 1000 features
      expect(batches[2].length).toBe(500);  // Third batch: 500 features
    });

    test('Test 3.2: Verify `splitFeaturesIntoBatches` maintains feature order within batches', () => {
      const config: SplitterConfig = {
        inputFile: 'rawdata/Alexandria_Parcels.geojson',
        outputDir: 'data/',
        batchSize: 1000,
        coordinatePrecision: 6,
        clearOutput: false
      };
      
      const splitter = new FeatureSplitter(config);
      
      const batches = splitter.splitFeaturesIntoBatches(mockFeatures);
      
      // Verify first batch maintains order
      expect(batches[0][0].properties.OBJECTID).toBe(1);
      expect(batches[0][999].properties.OBJECTID).toBe(1000);
      
      // Verify second batch maintains order
      expect(batches[1][0].properties.OBJECTID).toBe(1001);
      expect(batches[1][999].properties.OBJECTID).toBe(2000);
      
      // Verify third batch maintains order
      expect(batches[2][0].properties.OBJECTID).toBe(2001);
      expect(batches[2][499].properties.OBJECTID).toBe(2500);
      
      // Verify sequential order within each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        for (let j = 1; j < batch.length; j++) {
          expect(batch[j].properties.OBJECTID).toBe(batch[j-1].properties.OBJECTID + 1);
        }
      }
    });

    test('Test 3.3: Verify `splitFeaturesIntoBatches` distributes features evenly (1000 per batch)', () => {
      const config: SplitterConfig = {
        inputFile: 'rawdata/Alexandria_Parcels.geojson',
        outputDir: 'data/',
        batchSize: 1000,
        coordinatePrecision: 6,
        clearOutput: false
      };
      
      const splitter = new FeatureSplitter(config);
      
      const batches = splitter.splitFeaturesIntoBatches(mockFeatures);
      
      // Verify all full batches have exactly 1000 features
      for (let i = 0; i < batches.length - 1; i++) {
        expect(batches[i].length).toBe(1000);
      }
      
      // Verify last batch has remaining features (500 in this case)
      const lastBatch = batches[batches.length - 1];
      expect(lastBatch.length).toBe(500);
      
      // Verify total features across all batches equals input
      const totalFeaturesInBatches = batches.reduce((sum, batch) => sum + batch.length, 0);
      expect(totalFeaturesInBatches).toBe(mockFeatures.length);
    });
  });
});
