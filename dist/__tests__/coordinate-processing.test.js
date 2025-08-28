"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coordinate_processor_1 = require("../utils/coordinate-processor");
describe('Coordinate Processing Tests', () => {
    describe('Coordinate Processing Functions', () => {
        test('Test 2.1: Verify `reduceCoordinatePrecision` function correctly rounds coordinates to 6 decimal places', () => {
            // Test coordinates with more than 6 decimal places
            const inputCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888]
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that coordinates are rounded to 6 decimal places
            expect(result[0][0]).toBe(-77.123457); // longitude rounded to 6 decimal places
            expect(result[0][1]).toBe(38.987654); // latitude rounded to 6 decimal places
            expect(result[1][0]).toBe(-77.111111); // longitude rounded to 6 decimal places
            expect(result[1][1]).toBe(38.888889); // latitude rounded to 6 decimal places
            // Check that input was not mutated
            expect(inputCoordinates[0][0]).toBe(-77.123456789012345);
            expect(inputCoordinates[0][1]).toBe(38.987654321098765);
        });
        test('Test 2.2: Verify `reduceCoordinatePrecision` preserves coordinate structure (rings and points)', () => {
            // Test that the function maintains the same array structure
            const inputCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888],
                [-77.123456789012345, 38.987654321098765] // closing point for polygon ring
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(Array.isArray(result[0])).toBe(true);
            expect(Array.isArray(result[1])).toBe(true);
            expect(Array.isArray(result[2])).toBe(true);
            expect(result[0].length).toBe(2); // [lon, lat]
            expect(result[1].length).toBe(2); // [lon, lat]
            expect(result[2].length).toBe(2); // [lon, lat]
        });
        test('Test 2.3: Verify `reduceCoordinatePrecision` handles both Polygon and MultiPolygon geometries', () => {
            // Test Polygon geometry (single ring)
            const polygonCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888],
                [-77.123456789012345, 38.987654321098765]
            ];
            const polygonResult = coordinate_processor_1.CoordinateProcessor.reducePolygonPrecision([polygonCoordinates]);
            // Check Polygon structure is preserved
            expect(Array.isArray(polygonResult)).toBe(true);
            expect(polygonResult.length).toBe(1); // single ring
            expect(Array.isArray(polygonResult[0])).toBe(true);
            expect(polygonResult[0].length).toBe(3); // 3 points in ring
            // Test MultiPolygon geometry (multiple rings)
            const multiPolygonCoordinates = [
                [
                    [-77.123456789012345, 38.987654321098765],
                    [-77.111111111111111, 38.888888888888888],
                    [-77.123456789012345, 38.987654321098765]
                ],
                [
                    [-77.222222222222222, 38.777777777777777],
                    [-77.333333333333333, 38.666666666666666],
                    [-77.222222222222222, 38.777777777777777]
                ]
            ];
            const multiPolygonResult = coordinate_processor_1.CoordinateProcessor.reduceMultiPolygonPrecision([multiPolygonCoordinates]);
            // Check MultiPolygon structure is preserved
            expect(Array.isArray(multiPolygonResult)).toBe(true);
            expect(multiPolygonResult.length).toBe(1); // single MultiPolygon
            expect(Array.isArray(multiPolygonResult[0])).toBe(true);
            expect(multiPolygonResult[0].length).toBe(2); // 2 polygons
            expect(Array.isArray(multiPolygonResult[0][0])).toBe(true);
            expect(Array.isArray(multiPolygonResult[0][1])).toBe(true);
        });
        test('Test 2.4: Verify `reduceCoordinatePrecision` maintains coordinate order within rings', () => {
            // Test that coordinate order is preserved exactly
            const inputCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888],
                [-77.000000000000000, 38.777777777777777],
                [-77.123456789012345, 38.987654321098765] // closing point (same as first)
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that order is preserved
            expect(result[0][0]).toBe(-77.123457); // first point longitude
            expect(result[0][1]).toBe(38.987654); // first point latitude
            expect(result[1][0]).toBe(-77.111111); // second point longitude
            expect(result[1][1]).toBe(38.888889); // second point latitude
            expect(result[2][0]).toBe(-77.000000); // third point longitude
            expect(result[2][1]).toBe(38.777778); // third point latitude
            expect(result[3][0]).toBe(-77.123457); // closing point longitude
            expect(result[3][1]).toBe(38.987654); // closing point latitude
            // Verify the order matches the input exactly
            for (let i = 0; i < inputCoordinates.length; i++) {
                expect(result[i][0]).toBeCloseTo(inputCoordinates[i][0], 6);
                expect(result[i][1]).toBeCloseTo(inputCoordinates[i][1], 6);
            }
        });
        test('Test 2.5: Verify `reduceCoordinatePrecision` returns new object without mutating input', () => {
            // Test that input arrays are not mutated
            const inputCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888]
            ];
            // Store original values
            const originalLon1 = inputCoordinates[0][0];
            const originalLat1 = inputCoordinates[0][1];
            const originalLon2 = inputCoordinates[1][0];
            const originalLat2 = inputCoordinates[1][1];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Verify result is a new array (not the same reference)
            expect(result).not.toBe(inputCoordinates);
            expect(result[0]).not.toBe(inputCoordinates[0]);
            expect(result[1]).not.toBe(inputCoordinates[1]);
            // Verify input coordinates were not changed
            expect(inputCoordinates[0][0]).toBe(originalLon1);
            expect(inputCoordinates[0][1]).toBe(originalLat1);
            expect(inputCoordinates[1][0]).toBe(originalLon2);
            expect(inputCoordinates[1][1]).toBe(originalLat2);
            // Verify result has correct rounded values
            expect(result[0][0]).toBe(-77.123457);
            expect(result[0][1]).toBe(38.987654);
            expect(result[1][0]).toBe(-77.111111);
            expect(result[1][1]).toBe(38.888889);
        });
    });
    describe('Coordinate Processing Edge Cases', () => {
        test('Test 2.6: Verify `reduceCoordinatePrecision` handles coordinates with no decimal places', () => {
            // Test coordinates with no decimal places
            const inputCoordinates = [
                [-77, 38],
                [0, 0],
                [100, -50]
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that coordinates are still processed correctly
            expect(result[0][0]).toBe(-77);
            expect(result[0][1]).toBe(38);
            expect(result[1][0]).toBe(0);
            expect(result[1][1]).toBe(0);
            expect(result[2][0]).toBe(100);
            expect(result[2][1]).toBe(-50);
            // Verify structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(Array.isArray(result[0])).toBe(true);
            expect(result[0].length).toBe(2);
        });
        test('Test 2.7: Verify `reduceCoordinatePrecision` handles coordinates with more than 6 decimal places', () => {
            // Test coordinates with more than 6 decimal places
            const inputCoordinates = [
                [-77.123456789012345, 38.987654321098765],
                [-77.111111111111111, 38.888888888888888],
                [-77.000000000000001, 38.999999999999999] // 15 decimal places
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that coordinates are reduced to exactly 6 decimal places
            expect(result[0][0]).toBe(-77.123457); // rounded to 6 decimal places
            expect(result[0][1]).toBe(38.987654); // rounded to 6 decimal places
            expect(result[1][0]).toBe(-77.111111); // rounded to 6 decimal places
            expect(result[1][1]).toBe(38.888889); // rounded to 6 decimal places
            expect(result[2][0]).toBe(-77.000000); // rounded to 6 decimal places
            expect(result[2][1]).toBe(39.000000); // rounded to 6 decimal places
            // Verify structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(Array.isArray(result[0])).toBe(true);
            expect(result[0].length).toBe(2);
        });
        test('Test 2.8: Verify `reduceCoordinatePrecision` handles negative coordinates correctly', () => {
            // Test negative coordinates
            const inputCoordinates = [
                [-77.123456789012345, -38.987654321098765],
                [-180.000000000000000, -90.000000000000000],
                [-0.000000000000001, -0.000000000000001] // very small negative values
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that negative coordinates are handled correctly
            expect(result[0][0]).toBe(-77.123457); // negative longitude
            expect(result[0][1]).toBe(-38.987654); // negative latitude
            expect(result[1][0]).toBe(-180.000000); // extreme negative longitude
            expect(result[1][1]).toBe(-90.000000); // extreme negative latitude
            expect(result[2][0]).toBe(-0.000000); // very small negative longitude
            expect(result[2][1]).toBe(-0.000000); // very small negative latitude
            // Verify structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
        });
        test('Test 2.9: Verify `reduceCoordinatePrecision` handles zero coordinates correctly', () => {
            // Test zero coordinates
            const inputCoordinates = [
                [0, 0],
                [0.000000000000001, 0],
                [0, 0.000000000000001],
                [-0.000000000000001, -0.000000000000001] // very small negative values
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that zero coordinates are handled correctly
            expect(result[0][0]).toBe(0);
            expect(result[0][1]).toBe(0);
            expect(result[1][0]).toBe(0.000000); // very small positive becomes 0
            expect(result[1][1]).toBe(0);
            expect(result[2][0]).toBe(0);
            expect(result[2][1]).toBe(0.000000); // very small positive becomes 0
            expect(result[3][0]).toBe(-0.000000); // very small negative becomes -0
            expect(result[3][1]).toBe(-0.000000); // very small negative becomes -0
            // Verify structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(4);
        });
        test('Test 2.10: Verify `reduceCoordinatePrecision` handles very small coordinate values correctly', () => {
            // Test very small coordinate values
            const inputCoordinates = [
                [0.000000000000001, 0.000000000000001],
                [-0.000000000000001, -0.000000000000001],
                [0.000000000000999, 0.000000000000999],
                [0.000000000001000, 0.000000000001000] // just at threshold
            ];
            const result = coordinate_processor_1.CoordinateProcessor.reduceCoordinatePrecision(inputCoordinates);
            // Check that very small values are handled correctly
            expect(result[0][0]).toBe(0.000000); // very small positive becomes 0
            expect(result[0][1]).toBe(0.000000); // very small positive becomes 0
            expect(result[1][0]).toBe(-0.000000); // very small negative becomes -0
            expect(result[1][1]).toBe(-0.000000); // very small negative becomes -0
            expect(result[2][0]).toBe(0.000000); // just under threshold becomes 0
            expect(result[2][1]).toBe(0.000000); // just under threshold becomes 0
            expect(result[3][0]).toBe(0.000000); // just at threshold also becomes 0 (due to rounding)
            expect(result[3][1]).toBe(0.000000); // just at threshold also becomes 0 (due to rounding)
            // Verify structure is preserved
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(4);
        });
    });
});
