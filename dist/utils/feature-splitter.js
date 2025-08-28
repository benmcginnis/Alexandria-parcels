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
exports.FeatureSplitter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const coordinate_processor_1 = require("./coordinate-processor");
class FeatureSplitter {
    constructor(config) {
        this.config = config;
    }
    /**
     * Main method to run the feature splitting process
     */
    async run() {
        const startTime = Date.now();
        try {
            // 1. Validate input
            await this.validateInput();
            // 2. Clear output directory if configured
            if (this.config.clearOutput) {
                await this.clearOutput();
            }
            // 3. Ensure output directory exists
            await this.ensureOutputDirectory();
            // 4. Read and parse input file
            const inputData = await this.readInputFile();
            // 5. Split features into batches
            const batches = this.splitFeaturesIntoBatches(inputData.features);
            // 6. Process each batch
            const batchResults = await this.processBatches(batches);
            const processingTime = Date.now() - startTime;
            return {
                totalFeatures: inputData.features.length,
                totalBatches: batches.length,
                batches: batchResults,
                processingTime
            };
        }
        catch (error) {
            throw new Error(`Feature splitting failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate input file exists and is valid
     */
    async validateInput() {
        if (!fs.existsSync(this.config.inputFile)) {
            throw new Error(`Input file not found: ${this.config.inputFile}`);
        }
        // Additional validation could be added here using FileValidator
    }
    /**
     * Clear output directory completely
     */
    async clearOutput() {
        if (fs.existsSync(this.config.outputDir)) {
            const files = fs.readdirSync(this.config.outputDir);
            for (const file of files) {
                fs.unlinkSync(path.join(this.config.outputDir, file));
            }
        }
    }
    /**
     * Ensure output directory exists
     */
    async ensureOutputDirectory() {
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }
    /**
     * Read and parse input GeoJSON file
     */
    async readInputFile() {
        const fileContent = fs.readFileSync(this.config.inputFile, 'utf8');
        return JSON.parse(fileContent);
    }
    /**
     * Split features into batches of specified size
     */
    splitFeaturesIntoBatches(features) {
        const batches = [];
        for (let i = 0; i < features.length; i += this.config.batchSize) {
            const batch = features.slice(i, i + this.config.batchSize);
            batches.push(batch);
        }
        return batches;
    }
    /**
     * Process a single batch of features
     */
    processBatch(features) {
        return features.map(feature => {
            // Create a deep copy to avoid mutating input
            const processedFeature = JSON.parse(JSON.stringify(feature));
            // Apply coordinate precision reduction
            if (processedFeature.geometry && processedFeature.geometry.coordinates) {
                if (processedFeature.geometry.type === 'Polygon') {
                    processedFeature.geometry.coordinates = coordinate_processor_1.CoordinateProcessor.reducePolygonPrecision(processedFeature.geometry.coordinates);
                }
                else if (processedFeature.geometry.type === 'MultiPolygon') {
                    processedFeature.geometry.coordinates = coordinate_processor_1.CoordinateProcessor.reduceMultiPolygonPrecision(processedFeature.geometry.coordinates);
                }
            }
            return processedFeature;
        });
    }
    /**
     * Process all batches and write output files
     */
    async processBatches(batches) {
        const results = [];
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const processedBatch = this.processBatch(batch);
            // Generate filename
            const batchId = i + 1;
            const filename = `alexandria_parcels_batch_${batchId.toString().padStart(3, '0')}.geojson`;
            // Write batch file
            const outputPath = path.join(this.config.outputDir, filename);
            const batchGeoJSON = {
                type: 'FeatureCollection',
                name: `Alexandria_Parcels_Batch_${batchId}`,
                crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
                features: processedBatch
            };
            fs.writeFileSync(outputPath, JSON.stringify(batchGeoJSON, null, 2));
            // Generate metadata
            const objectIds = processedBatch.map(f => f.properties.OBJECTID).sort((a, b) => a - b);
            const metadata = {
                batchId,
                featureCount: processedBatch.length,
                filename,
                objectIdRange: [objectIds[0], objectIds[objectIds.length - 1]]
            };
            results.push(metadata);
        }
        return results;
    }
}
exports.FeatureSplitter = FeatureSplitter;
