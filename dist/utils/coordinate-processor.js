"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinateProcessor = void 0;
/**
 * Utility class for processing GeoJSON coordinates
 * Assumes input has already been validated by FileValidator
 */
class CoordinateProcessor {
    /**
     * Reduces coordinate precision to 6 decimal places
     * @param coordinates - Array of coordinate arrays [[lon, lat], [lon, lat], ...]
     * @returns New array with reduced precision coordinates
     */
    static reduceCoordinatePrecision(coordinates) {
        return coordinates.map(coord => [
            Math.round(coord[0] * 1000000) / 1000000,
            Math.round(coord[1] * 1000000) / 1000000
        ]);
    }
    /**
     * Reduces coordinate precision for a Polygon geometry
     * @param polygon - Polygon coordinates array
     * @returns New polygon with reduced precision coordinates
     */
    static reducePolygonPrecision(polygon) {
        return polygon.map(ring => this.reduceCoordinatePrecision(ring));
    }
    /**
     * Reduces coordinate precision for a MultiPolygon geometry
     * @param multiPolygon - MultiPolygon coordinates array
     * @returns New MultiPolygon with reduced precision coordinates
     */
    static reduceMultiPolygonPrecision(multiPolygon) {
        return multiPolygon.map(polygon => this.reducePolygonPrecision(polygon));
    }
}
exports.CoordinateProcessor = CoordinateProcessor;
