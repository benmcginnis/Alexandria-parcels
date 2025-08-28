"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_validator_1 = require("../utils/file-validator");
// Jest types are available globally in test files
describe('Input Validation Tests', () => {
    describe('File Structure Validation', () => {
        test('Test 1.1: Verify input file exists at rawdata/Alexandria_Parcels.geojson', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const fileExists = file_validator_1.FileValidator.fileExists(inputFilePath);
            expect(fileExists).toBe(true);
        });
        test('Test 1.2: Validate input file is valid JSON', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const isValidJSON = file_validator_1.FileValidator.isValidJSON(inputFilePath);
            expect(isValidJSON).toBe(true);
        });
        test('Test 1.3: Validate input file has correct GeoJSON structure', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const isValidGeoJSON = file_validator_1.FileValidator.isValidGeoJSON(inputFilePath);
            expect(isValidGeoJSON).toBe(true);
        });
        test('Test 1.4: Verify input file has type: "FeatureCollection"', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const hasFeatureCollectionType = file_validator_1.FileValidator.hasFeatureCollectionType(inputFilePath);
            expect(hasFeatureCollectionType).toBe(true);
        });
        test('Test 1.5: Verify input file has features array', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const hasFeaturesArray = file_validator_1.FileValidator.hasFeaturesArray(inputFilePath);
            expect(hasFeaturesArray).toBe(true);
        });
        test('Test 1.6: Verify input file has crs property with CRS84 specification', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const hasCRS84Specification = file_validator_1.FileValidator.hasCRS84Specification(inputFilePath);
            expect(hasCRS84Specification).toBe(true);
        });
        test('Test 1.7: Verify all features have required properties (type, properties, geometry)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveRequiredProperties = file_validator_1.FileValidator.allFeaturesHaveRequiredProperties(inputFilePath);
            expect(allFeaturesHaveRequiredProperties).toBe(true);
        });
        test('Test 1.8: Verify all features have type: "Feature"', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveFeatureType = file_validator_1.FileValidator.allFeaturesHaveFeatureType(inputFilePath);
            expect(allFeaturesHaveFeatureType).toBe(true);
        });
        test('Test 1.9: Verify all geometries have valid polygon types (Polygon or MultiPolygon)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allGeometriesHaveValidPolygonTypes = file_validator_1.FileValidator.allGeometriesHaveValidPolygonTypes(inputFilePath);
            expect(allGeometriesHaveValidPolygonTypes).toBe(true);
        });
        test('Test 1.10: Verify feature count matches expected total (~47,181 features)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const featureCount = file_validator_1.FileValidator.getFeatureCount(inputFilePath);
            expect(featureCount).toBeGreaterThan(47000);
            expect(featureCount).toBeLessThan(48000);
        });
        test('Test 1.11: Verify all features have non-empty properties object', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveNonEmptyProperties = file_validator_1.FileValidator.allFeaturesHaveNonEmptyProperties(inputFilePath);
            expect(allFeaturesHaveNonEmptyProperties).toBe(true);
        });
        test('Test 1.12: Verify all features have required property keys (OBJECTID, PID_RE, ADDRESS_GIS, ZONING, LAND_SF)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveRequiredPropertyKeys = file_validator_1.FileValidator.allFeaturesHaveRequiredPropertyKeys(inputFilePath);
            expect(allFeaturesHaveRequiredPropertyKeys).toBe(true);
        });
        test('Test 1.13: Verify file size is reasonable for the feature count (~130MB for ~47K features)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const fileSize = file_validator_1.FileValidator.getFileSizeInMB(inputFilePath);
            expect(fileSize).toBeGreaterThan(120);
            expect(fileSize).toBeLessThan(140);
        });
        test('Test 1.14: Verify coordinate precision is reasonable (6+ decimal places)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const hasReasonableCoordinatePrecision = file_validator_1.FileValidator.hasReasonableCoordinatePrecision(inputFilePath);
            expect(hasReasonableCoordinatePrecision).toBe(true);
        });
        test('Test 1.15: Verify all features have valid coordinate ranges (longitude: -77.1 to -77.0, latitude: 38.8 to 38.9)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveValidCoordinateRanges = file_validator_1.FileValidator.allFeaturesHaveValidCoordinateRanges(inputFilePath);
            expect(allFeaturesHaveValidCoordinateRanges).toBe(true);
        });
        test('Test 1.16: Verify all features have valid polygon geometry (closed rings, proper winding order)', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const allFeaturesHaveValidPolygonGeometry = file_validator_1.FileValidator.allFeaturesHaveValidPolygonGeometry(inputFilePath);
            expect(allFeaturesHaveValidPolygonGeometry).toBe(true);
        });
        test('Test 1.17: Verify no duplicate OBJECTID values exist', () => {
            const inputFilePath = 'rawdata/Alexandria_Parcels.geojson';
            const noDuplicateOBJECTIDs = file_validator_1.FileValidator.noDuplicateOBJECTIDs(inputFilePath);
            expect(noDuplicateOBJECTIDs).toBe(true);
        });
    });
});
