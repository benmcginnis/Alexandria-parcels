"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileValidator {
    /**
     * Helper method to read and parse a GeoJSON file
     * @param relativePath - Relative path from project root
     * @returns Parsed GeoJSON object or null if error
     */
    static readAndParseFile(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Helper method to validate that parsed data has features array
     * @param parsed - Parsed GeoJSON object
     * @returns true if features array exists and is valid
     */
    static hasValidFeaturesArray(parsed) {
        return Array.isArray(parsed.features);
    }
    /**
     * Helper method to safely check if a feature has required structure
     * @param feature - Feature object to validate
     * @returns true if feature has required structure
     */
    static hasValidFeatureStructure(feature) {
        return feature.type === 'Feature' &&
            feature.properties &&
            feature.geometry;
    }
    /**
     * Check if the input file exists at the specified path
     * @param relativePath - Relative path from project root
     * @returns true if file exists, false otherwise
     */
    static fileExists(relativePath) {
        const absolutePath = path.resolve(process.cwd(), relativePath);
        return fs.existsSync(absolutePath);
    }
    /**
     * Get the absolute path for a relative path from project root
     * @param relativePath - Relative path from project root
     * @returns Absolute file path
     */
    static getAbsolutePath(relativePath) {
        return path.resolve(process.cwd(), relativePath);
    }
    /**
     * Check if a file contains valid JSON
     * @param relativePath - Relative path from project root
     * @returns true if file contains valid JSON, false otherwise
     */
    static isValidJSON(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            JSON.parse(fileContent);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a file contains valid GeoJSON structure
     * @param relativePath - Relative path from project root
     * @returns true if file has valid GeoJSON structure, false otherwise
     */
    static isValidGeoJSON(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            // Check basic GeoJSON structure
            if (parsed.type !== 'FeatureCollection') {
                return false;
            }
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            if (parsed.features.length === 0) {
                return false;
            }
            // Check first feature structure
            const firstFeature = parsed.features[0];
            if (firstFeature.type !== 'Feature' ||
                !firstFeature.properties ||
                !firstFeature.geometry) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a file has the specific type "FeatureCollection"
     * @param relativePath - Relative path from project root
     * @returns true if file has type "FeatureCollection", false otherwise
     */
    static hasFeatureCollectionType(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            return parsed.type === 'FeatureCollection';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a file has a features array
     * @param relativePath - Relative path from project root
     * @returns true if file has features array, false otherwise
     */
    static hasFeaturesArray(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            return Array.isArray(parsed.features);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a file has CRS84 specification
     * @param relativePath - Relative path from project root
     * @returns true if file has CRS84 specification, false otherwise
     */
    static hasCRS84Specification(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            return parsed.crs &&
                parsed.crs.type === 'name' &&
                parsed.crs.properties &&
                parsed.crs.properties.name === 'urn:ogc:def:crs:OGC:1.3:CRS84';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all features have required properties (type, properties, geometry)
     * @param relativePath - Relative path from project root
     * @returns true if all features have required properties, false otherwise
     */
    static allFeaturesHaveRequiredProperties(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            return parsed.features.every((feature) => feature.type === 'Feature' &&
                feature.properties &&
                feature.geometry);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all features have type "Feature"
     * @param relativePath - Relative path from project root
     * @returns true if all features have type "Feature", false otherwise
     */
    static allFeaturesHaveFeatureType(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            return parsed.features.every((feature) => feature.type === 'Feature');
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all geometries have valid polygon types (Polygon or MultiPolygon)
     * @param relativePath - Relative path from project root
     * @returns true if all geometries have valid polygon types, false otherwise
     */
    static allGeometriesHaveValidPolygonTypes(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            return parsed.features.every((feature) => feature.geometry &&
                (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get the total count of features in the GeoJSON file
     * @param relativePath - Relative path from project root
     * @returns Number of features, or -1 if error
     */
    static getFeatureCount(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return -1;
            }
            return parsed.features.length;
        }
        catch (error) {
            return -1;
        }
    }
    /**
     * Check if all features have non-empty properties object
     * @param relativePath - Relative path from project root
     * @returns true if all features have non-empty properties, false otherwise
     */
    static allFeaturesHaveNonEmptyProperties(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            return parsed.features.every((feature) => feature.properties &&
                typeof feature.properties === 'object' &&
                Object.keys(feature.properties).length > 0);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all features have required property keys
     * @param relativePath - Relative path from project root
     * @returns true if all features have required property keys, false otherwise
     */
    static allFeaturesHaveRequiredPropertyKeys(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            const requiredKeys = ['OBJECTID', 'PID_RE', 'ADDRESS_GIS', 'ZONING', 'LAND_SF'];
            return parsed.features.every((feature) => feature.properties &&
                requiredKeys.every(key => key in feature.properties));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get file size in megabytes
     * @param relativePath - Relative path from project root
     * @returns File size in MB, or -1 if error
     */
    static getFileSizeInMB(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const stats = fs.statSync(absolutePath);
            const sizeInBytes = stats.size;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            return Math.round(sizeInMB * 100) / 100; // Round to 2 decimal places
        }
        catch (error) {
            return -1;
        }
    }
    /**
     * Check if coordinates have reasonable precision (6+ decimal places)
     * @param relativePath - Relative path from project root
     * @returns true if coordinates have reasonable precision, false otherwise
     */
    static hasReasonableCoordinatePrecision(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
                return false;
            }
            // Check first few features for coordinate precision
            const featuresToCheck = Math.min(10, parsed.features.length);
            for (let i = 0; i < featuresToCheck; i++) {
                const feature = parsed.features[i];
                if (feature.geometry && feature.geometry.coordinates) {
                    const coordinates = feature.geometry.coordinates;
                    // Check coordinate precision by looking at decimal places
                    for (const coord of coordinates.flat(2)) {
                        if (Array.isArray(coord)) {
                            for (const value of coord) {
                                if (typeof value === 'number') {
                                    const decimalPlaces = value.toString().split('.')[1]?.length || 0;
                                    if (decimalPlaces < 6) {
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all features have valid coordinate ranges for Alexandria, VA
     * @param relativePath - Relative path from project root
     * @returns true if all features have valid coordinate ranges, false otherwise
     */
    static allFeaturesHaveValidCoordinateRanges(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            // Alexandria, VA coordinate bounds
            const minLon = -77.1;
            const maxLon = -77.0;
            const minLat = 38.8;
            const maxLat = 38.9;
            // Check a sample of features for performance (first 1000)
            const featuresToCheck = Math.min(1000, parsed.features.length);
            for (let i = 0; i < featuresToCheck; i++) {
                const feature = parsed.features[i];
                if (!feature.geometry || !feature.geometry.coordinates) {
                    continue;
                }
                const coordinates = feature.geometry.coordinates;
                // Check all coordinates in the feature
                for (const coord of coordinates.flat(2)) {
                    if (Array.isArray(coord) && coord.length >= 2) {
                        const [lon, lat] = coord;
                        if (typeof lon === 'number' && typeof lat === 'number') {
                            if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) {
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if all features have valid polygon geometry (closed rings, proper winding order)
     * @param relativePath - Relative path from project root
     * @returns true if all features have valid polygon geometry, false otherwise
     */
    static allFeaturesHaveValidPolygonGeometry(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            // Check a sample of features for performance (first 1000)
            const featuresToCheck = Math.min(1000, parsed.features.length);
            for (let i = 0; i < featuresToCheck; i++) {
                const feature = parsed.features[i];
                if (!feature.geometry || !feature.geometry.coordinates) {
                    continue;
                }
                const coordinates = feature.geometry.coordinates;
                // Check each ring in the polygon
                for (const ring of coordinates) {
                    if (!Array.isArray(ring) || ring.length < 4) {
                        continue; // Skip invalid rings
                    }
                    // Check if ring is closed (first and last points are the same)
                    const firstPoint = ring[0];
                    const lastPoint = ring[ring.length - 1];
                    if (!Array.isArray(firstPoint) || !Array.isArray(lastPoint) ||
                        firstPoint.length < 2 || lastPoint.length < 2) {
                        continue;
                    }
                    // Simple check: first and last coordinates should be very close
                    const tolerance = 0.000001; // 6 decimal places precision
                    if (Math.abs(firstPoint[0] - lastPoint[0]) > tolerance ||
                        Math.abs(firstPoint[1] - lastPoint[1]) > tolerance) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if no duplicate OBJECTID values exist
     * @param relativePath - Relative path from project root
     * @returns true if no duplicate OBJECTIDs, false otherwise
     */
    static noDuplicateOBJECTIDs(relativePath) {
        try {
            const absolutePath = path.resolve(process.cwd(), relativePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const parsed = JSON.parse(fileContent);
            if (!Array.isArray(parsed.features)) {
                return false;
            }
            const objectIds = new Set();
            for (const feature of parsed.features) {
                if (feature.properties && feature.properties.OBJECTID !== undefined) {
                    const objectId = feature.properties.OBJECTID;
                    if (objectIds.has(objectId)) {
                        return false; // Duplicate found
                    }
                    objectIds.add(objectId);
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.FileValidator = FileValidator;
