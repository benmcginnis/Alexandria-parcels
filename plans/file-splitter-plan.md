# **Alexandria Parcels Data Splitting Specification (TypeScript)**

## **Overview**
Split the 130MB Alexandria_Parcels.geojson file into manageable chunks for GitHub storage while preserving all data integrity and enabling efficient client-side processing.

## **Input Data**
- **Source File**: `rawdata/Alexandria_Parcels.geojson`
- **Total Features**: ~47,181 parcel features
- **File Size**: ~130MB
- **Coordinate Precision**: 15 decimal places (to be reduced to 6)
- **Properties**: All 30+ properties preserved

## **Splitting Strategy**

### **A. Feature-Based Splitting**
- **Split Method**: Count-based division (not geographic)
- **Target Size**: ~1000 features per file
- **File Count**: 48 files (47 batches of 1000 + 1 batch of remaining features)
- **Naming Convention**: `alexandria_parcels_batch_{001-048}.geojson`

### **B. File Structure**
```
data/
├── alexandria_parcels_batch_001.geojson  (features 1-1000)
├── alexandria_parcels_batch_002.geojson  (features 1001-2000)
├── ...
├── alexandria_parcels_batch_047.geojson  (features 46001-47000)
├── alexandria_parcels_batch_048.geojson  (features 47001-47181)
└── batches_index.json
```

## **Data Processing Requirements**

### **A. Coordinate Precision Reduction**
- **Input Precision**: 15 decimal places
- **Output Precision**: 6 decimal places
- **Example**: 
  - Input: `-77.048491481513807`
  - Output: `-77.048491`
- **Justification**: 6 decimal places provide ~1 meter precision (sufficient for parcel boundaries)

### **B. Data Integrity**
- **Preserve All Properties**: No property filtering or removal
- **Maintain Geometry**: No polygon simplification or modification
- **Keep Feature Order**: Maintain original OBJECTID sequence
- **Preserve Null Values**: Don't convert nulls to empty strings or other defaults

### **C. File Format Standards**
- **Output Format**: Valid GeoJSON FeatureCollection
- **Coordinate System**: WGS84 (EPSG:4326) - maintain CRS84 specification
- **Encoding**: UTF-8
- **Line Endings**: Unix (LF) for consistency

## **TypeScript Implementation Requirements**

### **A. Project Setup**
```json
{
  "name": "alexandria-parcels-splitter",
  "version": "1.0.0",
  "description": "Split Alexandria Parcels GeoJSON into manageable batches",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@types/node": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "ts-node": "^10.9.0",
    "@types/node": "^18.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### **B. TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **C. Core Data Structures**
```typescript
interface GeoJSON {
  type: string;
  name: string;
  crs: CRS;
  features: Feature[];
}

interface Feature {
  type: string;
  properties: {
    OBJECTID: number;
    PARCELTYPE: string | null;
    PID_RE: string;
    MAP: string;
    BLOCK: string;
    LOT_GIS: string;
    LOT_RE: string;
    ACCOUNTNO: string;
    ADDRESS_GIS: string | null;
    ST_NUM: string | null;
    ST_ALPHA: string | null;
    ST_DIR: string | null;
    ST_NAME: string | null;
    ST_TYPE: string | null;
    UNIT: string | null;
    PLAT: string | null;
    LEGAL_LOT: string | null;
    STATUS: string | null;
    LANDCODE: string;
    LANDDESC: string;
    PRP_NAME: string;
    ZONING: string;
    NEIGHBORHO: string | null;
    LAND_SF: number;
    OWN_NAME: string;
    OWNERNAME2: string | null;
    OWN_ADD: string;
    OWN_ADD2: string | null;
    OWN_CITY: string;
    OWN_STAT: string;
    INSTRUMENT: string | null;
    OWN_ZIP: string;
    SHAPE__Area: number;
    SHAPE__Length: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface CRS {
  type: string;
  properties: Record<string, any>;
}

interface BatchInfo {
  batch_id: string;
  filename: string;
  feature_count: number;
  objectid_range: [number, number];
  file_size_mb: number;
  coordinate_bounds: {
    min_lon: number;
    max_lon: number;
    min_lat: number;
    max_lat: number;
  };
}

interface BatchIndex {
  dataset: string;
  total_features: number;
  total_batches: number;
  coordinate_precision: number;
  last_updated: string;
  batches: BatchInfo[];
}
```

### **D. Core Functions**
```typescript
// Coordinate rounding function
function roundCoordinate(coord: number): number {
  return Math.round(coord * 1000000) / 1000000;
}

// Process coordinates in geometry
function processCoordinates(coords: number[][][]): number[][][] {
  return coords.map(ring => 
    ring.map(point => [
      roundCoordinate(point[0]),
      roundCoordinate(point[1])
    ])
  );
}

// Split features into batches
function splitFeatures(features: Feature[], batchSize: number): Feature[][] {
  const batches: Feature[][] = [];
  for (let i = 0; i < features.length; i += batchSize) {
    const end = Math.min(i + batchSize, features.length);
    batches.push(features.slice(i, end));
  }
  return batches;
}

// Calculate coordinate bounds for a batch
function calculateBounds(features: Feature[]): {
  min_lon: number;
  max_lon: number;
  min_lat: number;
  max_lat: number;
} {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  features.forEach(feature => {
    feature.geometry.coordinates.forEach(ring => {
      ring.forEach(point => {
        minLon = Math.min(minLon, point[0]);
        maxLon = Math.max(maxLon, point[0]);
        minLat = Math.min(minLat, point[1]);
        maxLat = Math.max(maxLat, point[1]);
      });
    });
  });

  return { min_lon: minLon, max_lon: maxLon, min_lat: minLat, max_lat: maxLat };
}

// Validate GeoJSON structure
function validateGeoJSON(geojson: any): geojson is GeoJSON {
  return (
    geojson.type === 'FeatureCollection' &&
    Array.isArray(geojson.features) &&
    geojson.features.length > 0 &&
    geojson.features.every((f: any) => 
      f.type === 'Feature' && 
      f.properties && 
      f.geometry
    )
  );
}
```

### **E. Main Processing Function**
```typescript
import * as fs from 'fs';
import * as path from 'path';

async function main(): Promise<void> {
  try {
    console.log('Starting Alexandria Parcels data processing...');
    
    // Read input file
    console.log('Reading input file...');
    const data = fs.readFileSync('rawdata/Alexandria_Parcels.geojson', 'utf8');
    const geojson: GeoJSON = JSON.parse(data);
    
    if (!validateGeoJSON(geojson)) {
      throw new Error('Invalid GeoJSON structure');
    }
    
    console.log(`Loaded ${geojson.features.length} features`);

    // Process coordinates
    console.log('Processing coordinates...');
    geojson.features.forEach((feature, index) => {
      feature.geometry.coordinates = processCoordinates(feature.geometry.coordinates);
      if (index % 5000 === 0) {
        console.log(`Processed ${index} features...`);
      }
    });

    // Split into batches
    console.log('Splitting features into batches...');
    const batches = splitFeatures(geojson.features, 1000);
    console.log(`Created ${batches.length} batches`);
    
    // Generate batch files and metadata
    await generateBatches(geojson, batches);
    
    console.log(`Successfully processed ${geojson.features.length} features into ${batches.length} batches`);
  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

// Generate individual batch files
async function generateBatches(geojson: GeoJSON, batches: Feature[][]): Promise<void> {
  const batchInfos: BatchInfo[] = [];
  const outputDir = './data';

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log('Generating batch files...');
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNum = (i + 1).toString().padStart(3, '0');
    const filename = `alexandria_parcels_batch_${batchNum}.geojson`;
    const filepath = path.join(outputDir, filename);

    console.log(`Processing batch ${batchNum} (${batch.length} features)...`);

    // Create batch GeoJSON
    const batchGeoJSON: GeoJSON = {
      type: 'FeatureCollection',
      name: `Alexandria_Parcels_Batch_${batchNum}`,
      crs: geojson.crs,
      features: batch
    };

    // Write batch file
    const batchData = JSON.stringify(batchGeoJSON, null, 2);
    fs.writeFileSync(filepath, batchData);

    // Calculate file size and bounds
    const stats = fs.statSync(filepath);
    const bounds = calculateBounds(batch);
    const objectIDRange: [number, number] = [
      batch[0].properties.OBJECTID,
      batch[batch.length - 1].properties.OBJECTID
    ];

    batchInfos.push({
      batch_id: batchNum,
      filename,
      feature_count: batch.length,
      objectid_range: objectIDRange,
      file_size_mb: Math.round((stats.size / (1024 * 1024)) * 100) / 100,
      coordinate_bounds: bounds
    });
  }

  // Generate index file
  console.log('Generating batch index...');
  const indexData: BatchIndex = {
    dataset: 'Alexandria_Parcels',
    total_features: geojson.features.length,
    total_batches: batches.length,
    coordinate_precision: 6,
    last_updated: new Date().toISOString().split('T')[0],
    batches: batchInfos
  };

  fs.writeFileSync(
    path.join(outputDir, 'batches_index.json'),
    JSON.stringify(indexData, null, 2)
  );
  
  console.log('Batch index generated successfully');
}
```

## **Output Files Specification**

### **A. Individual Batch Files**
```json
{
  "type": "FeatureCollection",
  "name": "Alexandria_Parcels_Batch_001",
  "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
  "features": [
    // 1000 features with 6-decimal precision coordinates
  ]
}
```

### **B. Batch Index File**
```json
{
  "dataset": "Alexandria_Parcels",
  "total_features": 47181,
  "total_batches": 48,
  "coordinate_precision": 6,
  "last_updated": "2024-01-XX",
  "batches": [
    {
      "batch_id": "001",
      "filename": "alexandria_parcels_batch_001.geojson",
      "feature_count": 1000,
      "objectid_range": [1, 1000],
      "file_size_mb": 2.7,
      "coordinate_bounds": {
        "min_lon": -77.123456,
        "max_lon": -77.098765,
        "min_lat": 38.789012,
        "max_lat": 38.823456
      }
    }
    // ... additional batches
  ]
}
```

## **Performance Requirements**

### **A. Processing Time**
- **Target**: Process entire dataset in <5 minutes
- **Memory Usage**: <2GB RAM during processing
- **Output Generation**: All 48 files + index in single run

### **B. File Size Targets**
- **Individual Batches**: 2-4MB each
- **Total Output**: <150MB (all batches + index)
- **Compression**: Consider gzip compression for GitHub storage

## **Error Handling**

### **A. Validation Checks**
- **Input File**: Verify source file is valid GeoJSON
- **Feature Count**: Confirm expected vs actual feature counts
- **Coordinate Validation**: Check for invalid coordinate values
- **File Writing**: Verify all output files are written successfully

### **B. Logging**
- **Progress Tracking**: Log processing progress every 1000 features
- **Error Reporting**: Detailed error messages for failed operations
- **Summary Report**: Final processing statistics and validation results

## **Client-Side Integration**

### **A. Batch Loading Strategy**
- **Sequential Loading**: Load all 48 batches from `data/` directory on app startup
- **Progress Tracking**: Show loading progress to users
- **Error Recovery**: Handle failed batch loads gracefully
- **Caching**: Store all batches in IndexedDB after successful load

### **B. Data Assembly**
- **Feature Reconstruction**: Combine all batches into single dataset
- **Index Building**: Create RxDB indices on assembled data
- **Memory Management**: Efficient storage of 47K+ features

## **Testing Requirements**

### **A. Validation Tests**
- **Feature Count**: Total features in all batches = 47,181
- **Coordinate Precision**: All coordinates have exactly 6 decimal places
- **Property Integrity**: All properties preserved with original values
- **Geometry Validity**: All polygons are valid and renderable

### **B. Performance Tests**
- **File Sizes**: Individual batches under 10MB
- **Loading Time**: All batches load in <30 seconds on modern hardware
- **Memory Usage**: Peak memory usage under 2GB during processing

## **Deliverables**

1. **48 Batch Files**: `data/alexandria_parcels_batch_001.geojson` through `data/alexandria_parcels_batch_048.geojson`
2. **Index File**: `data/batches_index.json` with complete metadata
3. **Processing Script**: TypeScript script for reproducible data splitting
4. **Validation Report**: Summary of processing results and data integrity checks
5. **Documentation**: README with usage instructions and file specifications

## **Usage Instructions**

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the splitter
npm start

# Or run directly with ts-node
npm run dev
```

## **Directory Structure**

```
cursor-test/
├── rawdata/                          # Git ignored - contains source files
│   └── Alexandria_Parcels.geojson   # 130MB source file
├── data/                             # Git tracked - contains processed batches
│   ├── alexandria_parcels_batch_001.geojson
│   ├── alexandria_parcels_batch_002.geojson
│   ├── ...
│   ├── alexandria_parcels_batch_048.geojson
│   └── batches_index.json
├── plans/
│   └── file-splitter-plan.md
└── .gitignore                        # Ignores rawdata/* directory
```

This TypeScript specification ensures the data is split efficiently while maintaining all data integrity and enabling smooth client-side processing with RxDB.
