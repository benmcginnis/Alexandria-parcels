import * as fs from 'fs';
import * as path from 'path';
import { CoordinateProcessor } from './coordinate-processor';

export interface SplitterConfig {
  inputFile: string;
  outputDir: string;
  batchSize: number;
  coordinatePrecision: number;
  clearOutput: boolean;
}

export interface BatchMetadata {
  batchId: number;
  featureCount: number;
  filename: string;
  objectIdRange: [number, number];
}

export interface SplitterResult {
  totalFeatures: number;
  totalBatches: number;
  batches: BatchMetadata[];
  processingTime: number;
}

export class FeatureSplitter {
  constructor(private config: SplitterConfig) {}

  /**
   * Main method to run the feature splitting process
   */
  async run(): Promise<SplitterResult> {
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
      
    } catch (error) {
      throw new Error(`Feature splitting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate input file exists and is valid
   */
  private async validateInput(): Promise<void> {
    if (!fs.existsSync(this.config.inputFile)) {
      throw new Error(`Input file not found: ${this.config.inputFile}`);
    }
    
    // Additional validation could be added here using FileValidator
  }

  /**
   * Clear output directory completely
   */
  private async clearOutput(): Promise<void> {
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
  private async ensureOutputDirectory(): Promise<void> {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Read and parse input GeoJSON file
   */
  private async readInputFile(): Promise<any> {
    const fileContent = fs.readFileSync(this.config.inputFile, 'utf8');
    return JSON.parse(fileContent);
  }

  /**
   * Split features into batches of specified size
   */
  splitFeaturesIntoBatches(features: any[]): any[][] {
    const batches: any[][] = [];
    
    for (let i = 0; i < features.length; i += this.config.batchSize) {
      const batch = features.slice(i, i + this.config.batchSize);
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Process a single batch of features
   */
  processBatch(features: any[]): any[] {
    return features.map(feature => {
      // Create a copy to avoid mutating input
      const processedFeature = { ...feature };
      
      // Apply coordinate precision reduction
      if (feature.geometry && feature.geometry.coordinates) {
        if (feature.geometry.type === 'Polygon') {
          processedFeature.geometry.coordinates = CoordinateProcessor.reducePolygonPrecision(feature.geometry.coordinates);
        } else if (feature.geometry.type === 'MultiPolygon') {
          processedFeature.geometry.coordinates = CoordinateProcessor.reduceMultiPolygonPrecision(feature.geometry.coordinates);
        }
      }
      
      return processedFeature;
    });
  }

  /**
   * Process all batches and write output files
   */
  private async processBatches(batches: any[][]): Promise<BatchMetadata[]> {
    const results: BatchMetadata[] = [];
    
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
      const metadata: BatchMetadata = {
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
