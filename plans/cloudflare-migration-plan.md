# **Phase 3: Cloudflare Migration Plan**

## **Overview**
Migrate the existing Alexandria Parcels React + Mapbox application to Cloudflare Pages + Workers while maintaining identical user experience and functionality.

## **Current State**
- ✅ Phase 1: Enhanced File Splitter (Complete)
- ✅ Phase 2: React 19 + Mapbox Integration (Complete)
- 🔄 Phase 3: Cloudflare Migration (Starting)

## **Goals**
1. Deploy React app to Cloudflare Pages
2. Serve GeoJSON data via Cloudflare Workers + R2
3. Implement GitHub Actions for automated deployment
4. Maintain 100% identical user experience
5. A working web host that's as cheap as possible and allows for etags

## **Phase 3.1: Project Setup & Template Migration**

### **3.1.1: Initialize Cloudflare Vite Template**
```bash
# Install Cloudflare Vite plugin and dependencies
npm install @cloudflare/vite-plugin @cloudflare/workers-types wrangler
npm install -D @types/node
```

### **3.1.2: Add Worker Directory Structure**
```
# Add to existing project structure
src/
├── worker/                 # New Cloudflare Worker code
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── components/             # Existing
├── utils/                  # Existing  
├── types/                  # Existing
└── App.tsx                 # Will be updated
├── scripts/splitter/       # Existing
├── data/                   # Existing batch files
├── .github/workflows/      # New
└── wrangler.toml           # New
```

### **3.1.3: Update Configuration Files**

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getCloudflareDevProxy } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    getCloudflareDevProxy({
      '/data/*': 'http://localhost:8787'
    })
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        worker: resolve(__dirname, 'src/worker/index.ts')
      }
    }
  }
});
```

**wrangler.toml**
```toml
name = "alexandria-parcels-api"
main = "src/worker/index.ts"
compatibility_date = "2024-01-15"

[[r2_buckets]]
binding = "PARCEL_DATA_BUCKET"
bucket_name = "alexandria-parcels-data"

[[kv_namespaces]]
binding = "PARCEL_METADATA"
id = "your-kv-namespace-id"
```

### **3.1.4: Phase 3.1 Validation**
- [ ] `npm install` completes without errors
- [ ] `src/worker/` directory exists
- [ ] `wrangler.toml` file created
- [ ] `vite.config.ts` updated with Cloudflare plugin
- [ ] `package.json` includes new dependencies
- [ ] TypeScript compilation works: `npm run type-check`
- [ ] Wrangler config validation: `wrangler whoami` (authenticates and validates config)
- [ ] Worker syntax validation: `wrangler dev --dry-run` (validates worker code without running)
- [ ] Vite config validation: `npm run build:vite` (ensures Vite config works with Cloudflare plugin)
- [ ] Splitter build still works: `npm run build` (ensures existing functionality preserved)
- [ ] Cloudflare plugin validation: Check for any plugin errors in Vite build output

### **3.1.5: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: add Cloudflare infrastructure setup

- Install @cloudflare/vite-plugin and wrangler dependencies
- Add src/worker/ directory structure
- Create wrangler.toml configuration
- Update vite.config.ts with Cloudflare plugin
- Validate setup with Cloudflare CLI tools

Phase 3.1 complete: Project setup and template migration"
```

## **Phase 3.2: Worker Implementation**

### **3.2.1: Core Worker Code**

**src/worker/index.ts**
```typescript
export interface Env {
  PARCEL_DATA_BUCKET: R2Bucket;
  PARCEL_METADATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route handling
    if (path.startsWith('/data/')) {
      return handleDataRequest(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleDataRequest(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const fileName = url.pathname.split('/').pop();
  const cacheBypass = url.searchParams.get('cache-bypass') === 'true';
  
  if (!fileName) {
    return new Response('Invalid file name', { status: 400, headers: corsHeaders });
  }
  
  try {
    const object = await env.PARCEL_DATA_BUCKET.get(fileName);
    
    if (!object) {
      return new Response('File not found', { status: 404, headers: corsHeaders });
    }
    
    // Generate ETag
    const etag = object.httpEtag || `"${await generateETag(object)}"`;
    
    // Skip ETag validation if cache-bypass is requested
    if (!cacheBypass) {
      // Check if client has current version
      const clientETag = request.headers.get('if-none-match');
      if (clientETag === etag) {
        return new Response(null, { status: 304, headers: corsHeaders });
      }
    }
    
    // Return file with proper headers
    const cacheControl = cacheBypass 
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000';
    
    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        'ETag': etag,
        'Content-Type': 'application/gzip',
        'Content-Encoding': 'gzip',
        'Cache-Control': cacheControl,
        'Content-Length': object.size.toString()
      }
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

async function generateETag(object: R2Object): Promise<string> {
  // Use R2 object's etag if available, otherwise generate our own
  if (object.httpEtag) {
    return object.httpEtag;
  }
  
  // Generate SHA-256 hash of content
  const hash = await crypto.subtle.digest('SHA-256', await object.arrayBuffer());
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
```

### **3.2.2: Worker Types**

**src/worker/types.ts**
```typescript
export interface Env {
  PARCEL_DATA_BUCKET: R2Bucket;
  PARCEL_METADATA: KVNamespace;
}

export interface BatchMetadata {
  hash: string;
  size: number;
  modified: string;
  etag: string;
}

export interface Manifest {
  version: string;
  batches: Record<string, BatchMetadata>;
}
```

### **3.2.3: Worker Testing Implementation**

**src/worker/__tests__/index.test.ts**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockEnv } from './test-utils';

// Mock the worker
const worker = {
  async fetch(request: Request, env: any): Promise<Response> {
    // Import and test the actual worker logic
    const { default: workerHandler } = await import('../index');
    return workerHandler.fetch(request, env);
  }
};

describe('Cloudflare Worker', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests with CORS headers', async () => {
      const request = new Request('https://example.com/data/test.geojson.gz', {
        method: 'OPTIONS'
      });

      const response = await worker.fetch(request, mockEnv);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    });
  });

  describe('Data file serving', () => {
    it('should serve existing files with proper headers', async () => {
      // Mock R2 object
      mockEnv.PARCEL_DATA_BUCKET.get.mockResolvedValue({
        body: new ReadableStream(),
        size: 1024,
        httpEtag: '"abc123"'
      });

      const request = new Request('https://example.com/data/alexandria_parcels_batch_001.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/gzip');
      expect(response.headers.get('Content-Encoding')).toBe('gzip');
      expect(response.headers.get('ETag')).toBe('"abc123"');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000');
    });

    it('should return 404 for missing files', async () => {
      mockEnv.PARCEL_DATA_BUCKET.get.mockResolvedValue(null);

      const request = new Request('https://example.com/data/nonexistent.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
    });

    it('should handle ETag validation correctly', async () => {
      const etag = '"abc123"';
      mockEnv.PARCEL_DATA_BUCKET.get.mockResolvedValue({
        body: new ReadableStream(),
        size: 1024,
        httpEtag: etag
      });

      const request = new Request('https://example.com/data/test.geojson.gz', {
        headers: {
          'If-None-Match': etag
        }
      });

      const response = await worker.fetch(request, mockEnv);
      expect(response.status).toBe(304);
    });
  });

  describe('Error handling', () => {
    it('should handle R2 errors gracefully', async () => {
      mockEnv.PARCEL_DATA_BUCKET.get.mockRejectedValue(new Error('R2 error'));

      const request = new Request('https://example.com/data/test.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(500);
    });
  });
});
```

**src/worker/__tests__/test-utils.ts**
```typescript
export function createMockEnv() {
  return {
    PARCEL_DATA_BUCKET: {
      get: vi.fn()
    },
    PARCEL_METADATA: {
      get: vi.fn(),
      put: vi.fn()
    }
  };
}

export function createMockR2Object(content: string, etag?: string) {
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      }
    }),
    size: content.length,
    httpEtag: etag
  };
}
```

### **3.2.4: Phase 3.2 Validation**
- [ ] `src/worker/index.ts` compiles without TypeScript errors
- [ ] `src/worker/types.ts` defines all necessary interfaces
- [ ] Worker code includes proper CORS headers
- [ ] ETag generation logic implemented
- [ ] Error handling for missing files
- [ ] Cache-Control headers set correctly
- [ ] TypeScript compilation works: `npm run type-check`
- [ ] Worker tests pass: `npm test src/worker`
- [ ] CORS functionality tested
- [ ] File serving logic tested
- [ ] ETag validation tested
- [ ] Error handling tested

### **3.2.5: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: implement Cloudflare Worker for data serving

- Add core worker implementation with ETag support
- Implement CORS headers and error handling
- Add comprehensive worker tests
- Create worker types and utilities
- Validate worker functionality

Phase 3.2 complete: Worker implementation"
```

## **Phase 3.3: R2 Bucket Setup & GitHub Actions**

### **3.3.1: R2 Bucket Setup**
```bash
# Create R2 bucket
wrangler r2 bucket create alexandria-parcels-data
```

### **3.3.2: GitHub Actions Deployment**

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
          
      - name: Upload data to R2
        run: |
          # Upload manifest if it exists
          if [ -f "data/manifest.json" ]; then
            wrangler r2 object put PARCEL_DATA_BUCKET/manifest.json --file data/manifest.json
          fi
          
          # Upload all batch files using generated paths
          node -e "
            const { BATCH_FILE_PATHS } = require('./src/constants/dataPaths.ts');
            const { execSync } = require('child_process');
            
            BATCH_FILE_PATHS.forEach(fileName => {
              const filePath = \`data/\${fileName}\`;
              if (require('fs').existsSync(filePath)) {
                console.log(\`Uploading \${fileName}...\`);
                execSync(\`wrangler r2 object put PARCEL_DATA_BUCKET/\${fileName} --file \${filePath}\`);
              } else {
                console.error(\`File not found: \${filePath}\`);
                process.exit(1);
              }
            });
          "
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          
      - name: Deploy Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name alexandria-parcels
```

### **3.3.3: Phase 3.3 Validation**
- [ ] R2 bucket created successfully: `wrangler r2 bucket list`
- [ ] `.github/workflows/deploy.yml` file created
- [ ] GitHub secrets configured in repository settings
- [ ] Workflow runs successfully on push to main
- [ ] Worker deploys to Cloudflare without errors
- [ ] Data files upload to R2 successfully using generated paths
- [ ] Pages deploy to Cloudflare Pages
- [ ] Check deployment logs for any errors
- [ ] Create validation script to test R2 data availability
- [ ] Test that GitHub Actions uploads data correctly

### **3.3.4: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: add R2 bucket and GitHub Actions deployment

- Create R2 bucket for GeoJSON files
- Add automated deployment workflow
- Configure Cloudflare secrets
- Set up data upload automation using generated paths
- Deploy worker and pages automatically

Phase 3.3 complete: R2 bucket setup and GitHub Actions"
```

## **Phase 3.4: Data Migration & Loading Updates**

### **3.4.1: Update Data Loading**

**Enhanced File Splitter Output**
```typescript
// scripts/splitter/generate-paths.ts - Add to splitter
export function generateDataPaths() {
  const paths = [];
  for (let i = 1; i <= 50; i++) {
    const batchNum = String(i).padStart(3, '0');
    paths.push(`alexandria_parcels_batch_${batchNum}.geojson.gz`);
  }
  
  const tsContent = `// Auto-generated by file splitter
export const BATCH_FILE_PATHS = [
${paths.map(path => `  '${path}'`).join(',\n')}
] as const;

export const BATCH_COUNT = ${paths.length};
export const getBatchPath = (batchNumber: number): string => {
  if (batchNumber < 1 || batchNumber > ${paths.length}) {
    throw new Error(\`Invalid batch number: \${batchNumber}\`);
  }
  return BATCH_FILE_PATHS[batchNumber - 1];
};
`;
  
  fs.writeFileSync('src/constants/dataPaths.ts', tsContent);
}
```

**src/constants/dataPaths.ts** (Generated)
```typescript
// Auto-generated by file splitter
export const BATCH_FILE_PATHS = [
  'alexandria_parcels_batch_001.geojson.gz',
  'alexandria_parcels_batch_002.geojson.gz',
  // ... all 50 paths
  'alexandria_parcels_batch_050.geojson.gz'
] as const;

export const BATCH_COUNT = 50;
export const getBatchPath = (batchNumber: number): string => {
  if (batchNumber < 1 || batchNumber > 50) {
    throw new Error(`Invalid batch number: ${batchNumber}`);
  }
  return BATCH_FILE_PATHS[batchNumber - 1];
};
```

**src/utils/dataLoader.ts** (Updated)
```typescript
import { getBatchPath } from '../constants/dataPaths';

// Check for cache-bypass parameter
const getCacheBypassParam = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('cache-bypass') === 'true';
};

// Update to use generated paths and cache-bypass functionality
export const loadBatch = async (batchNumber: number): Promise<Feature[]> => {
  const batchFileName = getBatchPath(batchNumber);
  const cacheBypass = getCacheBypassParam();
  
  // Add cache-bypass parameter to URL if present
  const url = cacheBypass 
    ? `/data/${batchFileName}?cache-bypass=true&t=${Date.now()}`
    : `/data/${batchFileName}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to load batch ${batchNumber}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.features;
};
```

### **3.4.5: Phase 3.4 Validation**
- [ ] `src/utils/dataLoader.ts` updated to use `/data/` endpoints
- [ ] Cache-bypass functionality implemented in data loader
- [ ] Worker handles cache-bypass parameter correctly
- [ ] Data loading functions work with new endpoints
- [ ] No TypeScript errors in data loading code
- [ ] Test data loading: `npm run dev` and verify batches load
- [ ] Test cache-bypass: `npm run dev` and visit `/?cache-bypass=true`
- [ ] Validate data loading from R2 works correctly

### **3.4.6: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: update data loading for Cloudflare

- Update file splitter to generate TypeScript constants
- Update data loading to use generated paths
- Implement cache-bypass functionality
- Add R2 data validation script

Phase 3.4 complete: Data loading updates"
```

export const loadAllBatches = async (): Promise<Feature[]> => {
  const allFeatures: Feature[] = [];
  
  for (let i = 1; i <= 50; i++) {
    try {
      const batchFeatures = await loadBatch(i);
      allFeatures.push(...batchFeatures);
    } catch (error) {
      console.error(`Failed to load batch ${i}:`, error);
      // Continue loading other batches
    }
  }
  
  return allFeatures;
};
```

### **3.3.3: Update App Component**

**src/App.tsx**
```typescript
// Minimal changes - just update data loading calls
// Keep all existing functionality identical
```

## **Phase 3.5: R2 Data Validation**

### **3.5.1: R2 Data Validation Script**

**scripts/validate-r2-data.ts**
```typescript
import { execSync } from 'child_process';
import { BATCH_FILE_PATHS } from '../src/constants/dataPaths';

async function validateR2Data() {
  console.log('🔍 Validating R2 data availability...');
  
  try {
    // Check bucket exists
    console.log('📦 Checking R2 bucket...');
    const bucketList = execSync('wrangler r2 bucket list', { encoding: 'utf8' });
    if (!bucketList.includes('alexandria-parcels-data')) {
      throw new Error('R2 bucket not found');
    }
    console.log('✅ R2 bucket exists');

    // Check all batch files using generated paths
    console.log('📁 Checking batch files...');
    let missingFiles = [];
    
    BATCH_FILE_PATHS.forEach(fileName => {
      try {
        const result = execSync(`wrangler r2 object head PARCEL_DATA_BUCKET/${fileName}`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        console.log(`✅ ${fileName} - ${JSON.parse(result).size} bytes`);
      } catch (error) {
        missingFiles.push(fileName);
        console.log(`❌ ${fileName} - Missing`);
      }
    });

    if (missingFiles.length > 0) {
      throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }

    console.log('🎉 All batch files validated successfully!');
    
    // Test worker endpoint
    console.log('🌐 Testing worker endpoint...');
    const testResponse = await fetch('http://localhost:8787/data/alexandria_parcels_batch_001.geojson.gz');
    if (!testResponse.ok) {
      throw new Error(`Worker endpoint test failed: ${testResponse.status}`);
    }
    console.log('✅ Worker endpoint responding correctly');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateR2Data();
```

### **3.5.2: Phase 3.5 Validation**
- [ ] R2 bucket created successfully: `wrangler r2 bucket list`
- [ ] All batch files uploaded to R2: `npm run validate:r2`
- [ ] Data validation script passes: `ts-node scripts/validate-r2-data.ts`
- [ ] Worker endpoint responds: `curl http://localhost:8787/data/alexandria_parcels_batch_001.geojson.gz`
- [ ] `src/utils/dataLoader.ts` updated to use `/data/` endpoints
- [ ] Data loading functions work with new endpoints
- [ ] No TypeScript errors in data loading code
- [ ] Test data loading: `npm run dev` and verify batches load

### **3.5.3: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: add R2 data validation

- Create validation script for R2 data availability
- Verify all batch files uploaded correctly
- Test worker endpoints
- Validate data loading functionality

Phase 3.5 complete: R2 data validation"
```

## **Phase 3.6: Testing & Validation**

### **3.6.1: Local Testing**
```bash
# Test worker locally
wrangler dev

# Test client with worker (in separate terminal)
npm run dev

# Test full deployment
wrangler deploy
```

### **3.6.2: Phase 3.6 Validation**
- [ ] Local worker starts without errors: `wrangler dev`
- [ ] Local client connects to worker: `npm run dev`
- [ ] All batches load correctly from R2 using generated paths
- [ ] Map displays all 47,174 parcels
- [ ] Popup functionality works identically
- [ ] No changes to user experience
- [ ] Performance is same or better
- [ ] ETag caching works properly
- [ ] CORS headers are correct
- [ ] Error handling works

### **3.6.3: Playwright UI Validation Tests**

**tests/cloudflare-data-loading.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Cloudflare Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Start with fresh browser state
    await page.goto('/');
  });

  test('should load all parcels from Cloudflare R2', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    
    // Wait for data loading to complete
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Verify map has loaded with parcels
    const mapElement = page.locator('[data-testid="mapbox-map"]');
    await expect(mapElement).toBeVisible();

    // Check that parcels are rendered (Mapbox layers should be present)
    await page.waitForFunction(() => {
      const mapInstance = (window as any).mapboxMap;
      return mapInstance && mapInstance.getStyle() && mapInstance.isStyleLoaded();
    }, { timeout: 10000 });

    // Verify parcel count in console or via API
    const parcelCount = await page.evaluate(() => {
      const mapInstance = (window as any).mapboxMap;
      if (mapInstance && mapInstance.getStyle()) {
        const layers = mapInstance.getStyle().layers;
        const parcelLayers = layers.filter((layer: any) => 
          layer.id.includes('parcel') || layer.source?.includes('parcel')
        );
        return parcelLayers.length > 0;
      }
      return false;
    });
    
    expect(parcelCount).toBe(true);
  });

  test('should handle popup functionality with Cloudflare data', async ({ page }) => {
    // Wait for map and data to load
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Click on a parcel to trigger popup
    const mapElement = page.locator('[data-testid="mapbox-map"]');
    await mapElement.click({ position: { x: 400, y: 300 } });

    // Wait for popup to appear
    await page.waitForSelector('[data-testid="parcel-popup"]', { timeout: 5000 });
    
    // Verify popup content
    const popup = page.locator('[data-testid="parcel-popup"]');
    await expect(popup).toBeVisible();
    
    // Check that popup contains parcel data
    const popupContent = await popup.textContent();
    expect(popupContent).toContain('ACCOUNTNO');
    expect(popupContent).toContain('ADDRESS_GIS');
  });

  test('should handle cache-bypass parameter', async ({ page }) => {
    // Test with cache-bypass parameter
    await page.goto('/?cache-bypass=true');
    
    // Monitor network requests to ensure fresh data is fetched
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/data/')) {
        requests.push(request.url());
      }
    });

    // Wait for map to load
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Verify that data requests were made (not served from cache)
    expect(requests.length).toBeGreaterThan(0);
    
    // Verify map still works with fresh data
    const mapElement = page.locator('[data-testid="mapbox-map"]');
    await expect(mapElement).toBeVisible();
  });

  test('should handle ETag caching correctly', async ({ page }) => {
    // First load - should fetch data
    await page.goto('/');
    
    const firstLoadRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/data/')) {
        firstLoadRequests.push(request.url());
      }
    });

    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Second load - should use cache (304 responses)
    await page.reload();
    
    const secondLoadRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/data/')) {
        secondLoadRequests.push(request.url());
      }
    });

    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Both loads should have made requests, but second should be faster
    expect(firstLoadRequests.length).toBeGreaterThan(0);
    expect(secondLoadRequests.length).toBeGreaterThan(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate failure
    await page.route('**/data/**', route => route.abort());
    
    await page.goto('/');
    
    // Should show error state or loading state
    await page.waitForSelector('[data-testid="error-message"], [data-testid="loading-indicator"]', { timeout: 10000 });
    
    // Verify error handling
    const errorElement = page.locator('[data-testid="error-message"]');
    if (await errorElement.isVisible()) {
      await expect(errorElement).toBeVisible();
    }
  });

  test('should load data from correct Cloudflare endpoints', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/data/')) {
        requests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Verify requests go to Cloudflare endpoints
    expect(requests.length).toBeGreaterThan(0);
    requests.forEach(url => {
      expect(url).toMatch(/\/data\/alexandria_parcels_batch_\d{3}\.geojson\.gz$/);
    });
  });
});
```

**tests/cache-validation.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Cache Validation', () => {
  test('should validate cache headers', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/data/')) {
        responses.push({
          url: response.url(),
          headers: response.headers(),
          status: response.status()
        });
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Verify cache headers
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=31536000');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['content-type']).toBe('application/gzip');
      expect(response.headers['content-encoding']).toBe('gzip');
    });
  });

  test('should handle 304 responses on subsequent loads', async ({ page }) => {
    // First load
    await page.goto('/');
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('[data-testid="loading-indicator"]');
      return !loadingElement || loadingElement.style.display === 'none';
    }, { timeout: 30000 });

    // Second load with If-None-Match header
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/data/')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    await page.reload();
    await page.waitForSelector('[data-testid="mapbox-map"]', { timeout: 10000 });

    // Should have some 304 responses (cached)
    const cachedResponses = responses.filter(r => r.status === 304);
    expect(cachedResponses.length).toBeGreaterThan(0);
  });
});
```

### **3.6.4: Performance Testing**
- [ ] Load time comparison (local vs Cloudflare)
- [ ] Memory usage validation
- [ ] Network request optimization
- [ ] Cache hit rate monitoring

### **3.6.5: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: add comprehensive Playwright testing

- Implement UI validation tests for Cloudflare data loading
- Add cache validation tests for ETag and 304 responses
- Test cache-bypass parameter functionality
- Add performance testing and optimization

Phase 3.6 complete: Testing and validation"
```

## **Phase 3.7: Production Deployment**

### **3.7.1: Namecheap DNS Configuration**

**Step 1: Configure DNS in Namecheap**
```
# Add this DNS record in Namecheap:
Type: CNAME
Host: alexandriaparcels
Value: alexandriaparcels.benmcginnis.net.pages.dev
TTL: Automatic
```

**Step 2: Update wrangler.toml**
```toml
name = "alexandria-parcels-api"
main = "src/worker/index.ts"
compatibility_date = "2024-01-15"

[env.production]
routes = [
  { pattern = "alexandriaparcels.benmcginnis.net/data/*", zone_name = "benmcginnis.net" }
]

[[env.production.r2_buckets]]
binding = "PARCEL_DATA_BUCKET"
bucket_name = "alexandria-parcels-data"

[[env.production.kv_namespaces]]
binding = "PARCEL_METADATA"
id = "your-kv-namespace-id"
```

### **3.7.2: Cloudflare SSL Configuration**

**Step 1: Add Domain to Cloudflare**
- Add `benmcginnis.net` to Cloudflare (if not already added)
- Set DNS to "Proxied" (orange cloud) for the subdomain
- This enables Cloudflare's SSL termination

**Step 2: SSL/TLS Settings**
```
SSL/TLS Mode: Full (Strict)
Edge Certificates: Universal SSL Certificate (Free)
Always Use HTTPS: On
HTTP Strict Transport Security (HSTS): On
Minimum TLS Version: 1.2
```

**Step 3: Page Rules (Optional)**
```
URL: alexandriaparcels.benmcginnis.net/*
Settings: 
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

### **3.7.3: Update Application Configuration**

**Update dataLoader.ts for production URLs**
```typescript
// src/utils/dataLoader.ts - No changes needed!
// The existing implementation already uses relative URLs (/data/*)
// which will work perfectly with the same domain setup

export const loadBatch = async (batchNumber: number): Promise<Feature[]> => {
  const batchFileName = getBatchPath(batchNumber);
  const cacheBypass = getCacheBypassParam();
  
  // This will work on both localhost and production
  const url = cacheBypass 
    ? `/data/${batchFileName}?cache-bypass=true&t=${Date.now()}`
    : `/data/${batchFileName}`;
  
  const response = await fetch(url);
  // ... rest of implementation
};
```

### **3.7.4: Phase 3.7 Validation**
- [ ] DNS records configured in Namecheap
- [ ] Domain added to Cloudflare
- [ ] SSL certificates active and valid
- [ ] DNS propagation complete (check with `dig alexandriaparcels.benmcginnis.net`)
- [ ] Site accessible via `https://alexandriaparcels.benmcginnis.net`
- [ ] Data API accessible via `https://alexandriaparcels.benmcginnis.net/data/`
- [ ] All functionality works in production
- [ ] HTTPS redirect working
- [ ] Performance monitoring set up
- [ ] Error logging configured

### **3.7.5: Git Commit Checkpoint**
```bash
git add .
git commit -m "feat: deploy to production domain

- Configure Namecheap DNS for alexandriaparcels.benmcginnis.net
- Set up Cloudflare SSL termination
- Deploy to production domain
- Validate production functionality

Phase 3.7 complete: Production deployment"
```

## **Success Criteria**

### **Functional Requirements**
1. ✅ React app loads without errors
2. ✅ Full-screen Mapbox map displays Alexandria viewport
3. ✅ All 50 compressed batch files load from R2
4. ✅ 47,174 parcel polygons render on map
5. ✅ Popup functionality works identically
6. ✅ Performance is same or better than local
7. ✅ No TypeScript compilation errors
8. ✅ All existing tests pass

### **Technical Requirements**
1. ✅ Cloudflare Pages hosting
2. ✅ Cloudflare Workers API
3. ✅ R2 storage for data files
4. ✅ GitHub Actions deployment
5. ✅ ETag caching implemented
6. ✅ CORS headers configured
7. ✅ Custom domain working
8. ✅ SSL certificates active

### **Performance Requirements**
1. ✅ Global CDN performance
2. ✅ Efficient data loading
3. ✅ Proper caching headers
4. ✅ Fast worker response times
5. ✅ Optimized bundle size


## **Implementation Order**

1. **Phase 3.1**: Project setup and template migration
2. **Phase 3.2**: Worker implementation  
3. **Phase 3.3**: Data migration to R2
4. **Phase 3.4**: GitHub Actions deployment
5. **Phase 3.5**: Testing and validation
6. **Phase 3.6**: Production deployment

## **Next Steps After Phase 3**

**Phase 4: Caching & Index Strategy**
- Implement IndexDB with RxDB
- Add stale-while-revalidate caching
- Set up proper ETag handling

**Phase 5: Advanced Filtering**
- Build filter UI components
- Implement search functionality
- Add user controls for data filtering

---

*Created: January 15, 2025*
*Status: Ready to implement*
