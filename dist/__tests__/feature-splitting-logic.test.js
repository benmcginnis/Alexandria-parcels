"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feature_splitter_1 = require("../utils/feature-splitter");
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
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Test with 2500 features, batch size 1000
            const batches = splitter.splitFeaturesIntoBatches(mockFeatures);
            // Should create 3 batches: 1000, 1000, 500
            expect(batches.length).toBe(3);
            expect(batches[0].length).toBe(1000); // First batch: 1000 features
            expect(batches[1].length).toBe(1000); // Second batch: 1000 features
            expect(batches[2].length).toBe(500); // Third batch: 500 features
        });
        test('Test 3.2: Verify `splitFeaturesIntoBatches` maintains feature order within batches', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
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
                    expect(batch[j].properties.OBJECTID).toBe(batch[j - 1].properties.OBJECTID + 1);
                }
            }
        });
        test('Test 3.3: Verify `splitFeaturesIntoBatches` distributes features evenly (1000 per batch)', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
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
        test('Test 3.4: Verify `processBatch` function correctly applies coordinate precision reduction to Polygon geometries', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Create test features with high precision coordinates
            const testFeatures = [
                {
                    type: 'Feature',
                    properties: { OBJECTID: 1, PID_RE: 'PID_1' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                                [-77.123456789012345, 38.987654321098765],
                                [-77.111111111111111, 38.888888888888888],
                                [-77.100000000000000, 38.900000000000000],
                                [-77.123456789012345, 38.987654321098765]
                            ]]
                    }
                }
            ];
            const processedFeatures = splitter.processBatch(testFeatures);
            // Verify feature structure is preserved
            expect(processedFeatures[0].type).toBe('Feature');
            expect(processedFeatures[0].properties.OBJECTID).toBe(1);
            expect(processedFeatures[0].geometry.type).toBe('Polygon');
            // Verify coordinates are reduced to 6 decimal places
            const coordinates = processedFeatures[0].geometry.coordinates[0];
            expect(coordinates[0][0]).toBe(-77.123457); // Rounded from -77.123456789012345
            expect(coordinates[0][1]).toBe(38.987654); // Rounded from 38.987654321098765
            expect(coordinates[1][0]).toBe(-77.111111); // Rounded from -77.111111111111111
            expect(coordinates[1][1]).toBe(38.888889); // Rounded from 38.888888888888888
            // Verify input features are not mutated
            expect(testFeatures[0].geometry.coordinates[0][0][0]).toBe(-77.123456789012345);
            expect(testFeatures[0].geometry.coordinates[0][0][1]).toBe(38.987654321098765);
        });
        test('Test 3.5: Verify `processBatch` function correctly handles MultiPolygon geometries', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Create test features with MultiPolygon geometry
            const testFeatures = [
                {
                    type: 'Feature',
                    properties: { OBJECTID: 1, PID_RE: 'PID_1' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-77.123456789012345, 38.987654321098765],
                                    [-77.111111111111111, 38.888888888888888],
                                    [-77.100000000000000, 38.900000000000000],
                                    [-77.123456789012345, 38.987654321098765]
                                ]
                            ],
                            [
                                [
                                    [-77.200000000000000, 38.800000000000000],
                                    [-77.199999999999999, 38.799999999999999],
                                    [-77.200000000000001, 38.800000000000001],
                                    [-77.200000000000000, 38.800000000000000]
                                ]
                            ]
                        ]
                    }
                }
            ];
            const processedFeatures = splitter.processBatch(testFeatures);
            // Verify feature structure is preserved
            expect(processedFeatures[0].type).toBe('Feature');
            expect(processedFeatures[0].properties.OBJECTID).toBe(1);
            expect(processedFeatures[0].geometry.type).toBe('MultiPolygon');
            expect(processedFeatures[0].geometry.coordinates.length).toBe(2); // Two polygons
            // Verify first polygon coordinates are reduced to 6 decimal places
            const firstPolygon = processedFeatures[0].geometry.coordinates[0][0];
            expect(firstPolygon[0][0]).toBe(-77.123457); // Rounded from -77.123456789012345
            expect(firstPolygon[0][1]).toBe(38.987654); // Rounded from 38.987654321098765
            expect(firstPolygon[1][0]).toBe(-77.111111); // Rounded from -77.111111111111111
            expect(firstPolygon[1][1]).toBe(38.888889); // Rounded from 38.888888888888888
            // Verify second polygon coordinates are reduced to 6 decimal places
            const secondPolygon = processedFeatures[0].geometry.coordinates[1][0];
            expect(secondPolygon[0][0]).toBe(-77.200000); // Rounded from -77.200000000000000
            expect(secondPolygon[1][0]).toBe(-77.200000); // Rounded from -77.199999999999999
            expect(secondPolygon[2][0]).toBe(-77.200000); // Rounded from -77.200000000000001
            // Verify input features are not mutated
            expect(testFeatures[0].geometry.coordinates[0][0][0][0]).toBe(-77.123456789012345);
            expect(testFeatures[0].geometry.coordinates[1][0][0][0]).toBe(-77.200000000000000);
        });
        test('Test 3.6: Verify `processBatch` function correctly handles features without geometry', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Create test features without geometry
            const testFeatures = [
                {
                    type: 'Feature',
                    properties: { OBJECTID: 1, PID_RE: 'PID_1', ADDRESS_GIS: 'Test Address' }
                    // No geometry property
                },
                {
                    type: 'Feature',
                    properties: { OBJECTID: 2, PID_RE: 'PID_2' },
                    geometry: null
                }
            ];
            const processedFeatures = splitter.processBatch(testFeatures);
            // Verify feature structure is preserved
            expect(processedFeatures[0].type).toBe('Feature');
            expect(processedFeatures[0].properties.OBJECTID).toBe(1);
            expect(processedFeatures[0].properties.ADDRESS_GIS).toBe('Test Address');
            expect(processedFeatures[0].geometry).toBeUndefined();
            expect(processedFeatures[1].type).toBe('Feature');
            expect(processedFeatures[1].properties.OBJECTID).toBe(2);
            expect(processedFeatures[1].geometry).toBeNull();
            // Verify input features are not mutated
            expect(testFeatures[0].geometry).toBeUndefined();
            expect(testFeatures[1].geometry).toBeNull();
        });
        test('Test 3.7: Verify `processBatch` function preserves all feature properties', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Create test features with various properties
            const testFeatures = [
                {
                    type: 'Feature',
                    properties: {
                        OBJECTID: 1,
                        PID_RE: 'PID_1',
                        ADDRESS_GIS: '123 Main St',
                        ZONING: 'R-5',
                        LAND_SF: 5000,
                        OWN_NAME: 'John Doe',
                        MAP: 'Sheet 1'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                                [-77.123456789012345, 38.987654321098765],
                                [-77.123456789012345, 38.987654321098766],
                                [-77.123456789012346, 38.987654321098766],
                                [-77.123456789012346, 38.987654321098765],
                                [-77.123456789012345, 38.987654321098765]
                            ]]
                    }
                }
            ];
            const processedFeatures = splitter.processBatch(testFeatures);
            // Verify all properties are preserved
            const processedFeature = processedFeatures[0];
            expect(processedFeature.properties.OBJECTID).toBe(1);
            expect(processedFeature.properties.PID_RE).toBe('PID_1');
            expect(processedFeature.properties.ADDRESS_GIS).toBe('123 Main St');
            expect(processedFeature.properties.ZONING).toBe('R-5');
            expect(processedFeature.properties.LAND_SF).toBe(5000);
            expect(processedFeature.properties.OWN_NAME).toBe('John Doe');
            expect(processedFeature.properties.MAP).toBe('Sheet 1');
            // Verify feature type is preserved
            expect(processedFeature.type).toBe('Feature');
            // Verify geometry type is preserved
            expect(processedFeature.geometry.type).toBe('Polygon');
            // Verify coordinates are processed (reduced precision)
            const coordinates = processedFeature.geometry.coordinates[0];
            expect(coordinates[0][0]).toBe(-77.123457); // Rounded from -77.123456789012345
            expect(coordinates[0][1]).toBe(38.987654); // Rounded from 38.987654321098765
            // Verify input features are not mutated
            expect(testFeatures[0].properties.OBJECTID).toBe(1);
            expect(testFeatures[0].properties.ADDRESS_GIS).toBe('123 Main St');
            expect(testFeatures[0].geometry.coordinates[0][0][0]).toBe(-77.123456789012345);
        });
        test('Test 3.8: Verify `splitFeaturesIntoBatches` handles different batch sizes correctly', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 500,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Test with 2500 features, batch size 500
            const batches = splitter.splitFeaturesIntoBatches(mockFeatures);
            // Should create 5 batches: 500, 500, 500, 500, 500
            expect(batches.length).toBe(5);
            // Verify all batches have exactly 500 features
            for (let i = 0; i < batches.length; i++) {
                expect(batches[i].length).toBe(500);
            }
            // Verify total features across all batches equals input
            const totalFeaturesInBatches = batches.reduce((sum, batch) => sum + batch.length, 0);
            expect(totalFeaturesInBatches).toBe(mockFeatures.length);
            // Verify first and last features in each batch
            expect(batches[0][0].properties.OBJECTID).toBe(1);
            expect(batches[0][499].properties.OBJECTID).toBe(500);
            expect(batches[1][0].properties.OBJECTID).toBe(501);
            expect(batches[1][499].properties.OBJECTID).toBe(1000);
            expect(batches[4][0].properties.OBJECTID).toBe(2001);
            expect(batches[4][499].properties.OBJECTID).toBe(2500);
        });
        test('Test 3.9: Verify `splitFeaturesIntoBatches` handles edge cases correctly', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Test with empty features array
            const emptyBatches = splitter.splitFeaturesIntoBatches([]);
            expect(emptyBatches.length).toBe(0);
            // Test with features count less than batch size
            const smallFeatures = mockFeatures.slice(0, 500); // 500 features
            const smallBatches = splitter.splitFeaturesIntoBatches(smallFeatures);
            expect(smallBatches.length).toBe(1);
            expect(smallBatches[0].length).toBe(500);
            // Test with features count exactly equal to batch size
            const exactFeatures = mockFeatures.slice(0, 1000); // 1000 features
            const exactBatches = splitter.splitFeaturesIntoBatches(exactFeatures);
            expect(exactBatches.length).toBe(1);
            expect(exactBatches[0].length).toBe(1000);
            // Test with features count one more than batch size
            const oneMoreFeatures = mockFeatures.slice(0, 1001); // 1001 features
            const oneMoreBatches = splitter.splitFeaturesIntoBatches(oneMoreFeatures);
            expect(oneMoreBatches.length).toBe(2);
            expect(oneMoreBatches[0].length).toBe(1000);
            expect(oneMoreBatches[1].length).toBe(1);
        });
        test('Test 3.10: Verify `processBatch` function handles mixed geometry types correctly', () => {
            const config = {
                inputFile: 'rawdata/Alexandria_Parcels.geojson',
                outputDir: 'data/',
                batchSize: 1000,
                coordinatePrecision: 6,
                clearOutput: false
            };
            const splitter = new feature_splitter_1.FeatureSplitter(config);
            // Create test features with mixed geometry types
            const testFeatures = [
                {
                    type: 'Feature',
                    properties: { OBJECTID: 1, PID_RE: 'PID_1' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                                [-77.123456789012345, 38.987654321098765],
                                [-77.123456789012346, 38.987654321098765],
                                [-77.123456789012346, 38.987654321098766],
                                [-77.123456789012345, 38.987654321098766],
                                [-77.123456789012345, 38.987654321098765]
                            ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: { OBJECTID: 2, PID_RE: 'PID_2' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-77.200000000000000, 38.800000000000000],
                                    [-77.200000000000001, 38.800000000000000],
                                    [-77.200000000000001, 38.800000000000001],
                                    [-77.200000000000000, 38.800000000000001],
                                    [-77.200000000000000, 38.800000000000000]
                                ]
                            ]
                        ]
                    }
                },
                {
                    type: 'Feature',
                    properties: { OBJECTID: 3, PID_RE: 'PID_3' }
                    // No geometry property
                }
            ];
            const processedFeatures = splitter.processBatch(testFeatures);
            // Verify all features are processed correctly
            expect(processedFeatures.length).toBe(3);
            // Verify Polygon feature
            expect(processedFeatures[0].geometry.type).toBe('Polygon');
            expect(processedFeatures[0].geometry.coordinates[0][0][0]).toBe(-77.123457); // Rounded
            expect(processedFeatures[0].geometry.coordinates[0][0][1]).toBe(38.987654); // Rounded
            // Verify MultiPolygon feature
            expect(processedFeatures[1].geometry.type).toBe('MultiPolygon');
            expect(processedFeatures[1].geometry.coordinates[0][0][0][0]).toBe(-77.200000); // Rounded
            expect(processedFeatures[1].geometry.coordinates[0][0][0][1]).toBe(38.800000); // Rounded
            // Verify feature without geometry
            expect(processedFeatures[2].geometry).toBeUndefined();
            // Verify input features are not mutated
            expect(testFeatures[0].geometry.coordinates[0][0][0]).toBe(-77.123456789012345);
            expect(testFeatures[1].geometry.coordinates[0][0][0][0]).toBe(-77.200000000000000);
            expect(testFeatures[2].geometry).toBeUndefined();
        });
    });
});
