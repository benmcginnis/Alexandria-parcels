# Caching and Indexing Strategy with RxDB and IndexDB

## Overview

This document outlines the comprehensive strategy for implementing client-side caching and indexing for the Alexandria Parcels Map Viewer using RxDB and IndexDB. The goal is to provide fast, offline-capable filtering and searching of parcel data while maintaining the existing Mapbox visualization.

**Note**: This implementation builds upon the existing infrastructure, including:
- Current stale-while-revalidate caching strategy in the Cloudflare Worker
- Cache-bypass functionality with `?cache-bypass=true` parameter
- Existing ETag-based cache validation
- Current GeoJsonLoader with batch loading system

## Goals

1. **Enhance existing caching** by adding IndexDB persistence to current batch loading
2. **Add IndexDB indexes** that allow fast querying of features by property
3. **Create user controls** that allow filtering the map on any property in the dataset
4. **Integrate with existing stale-while-revalidate** strategy for background data updates
5. **Leverage existing cache-bypass support** for forced data reloading
6. **Add URL state synchronization** for shareable filtered views

## Data Structure Analysis

### Dataset Characteristics
- **47,174 total features** across 50 batch files
- **34 properties per feature** with varying data types and cardinality
- **Key properties for filtering:**
  - **Categorical**: `BLOCK` (82 unique), `LANDCODE`/`LANDDESC` (76 unique), `STATUS` (9 unique), `ZONING` (64 unique), `ST_TYPE` (25 unique), `OWN_STAT` (54 unique)
  - **Text searchable**: `ADDRESS_GIS`, `OWN_NAME`, `OWN_ADD`, `PRP_NAME`, `ST_NAME`
  - **Numeric ranges**: `LAND_SF`, `SHAPE__Area`, `SHAPE__Length`
  - **High cardinality**: `ACCOUNTNO`, `OBJECTID`, `PID_RE` (unique identifiers)

## RxDB Schema Design

### 1. Parcel Collection Schema

```typescript
const parcelSchema = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 }, // Generated: `parcel_${OBJECTID}`
    objectId: { type: 'number' }, // OBJECTID from original data
    accountNo: { type: 'string' }, // ACCOUNTNO
    addressGis: { type: 'string' }, // ADDRESS_GIS
    block: { type: 'string' }, // BLOCK
    instrument: { type: 'string' }, // INSTRUMENT
    landCode: { type: 'string' }, // LANDCODE
    landDesc: { type: 'string' }, // LANDDESC
    landSf: { type: 'number' }, // LAND_SF
    legalLot: { type: 'string' }, // LEGAL_LOT
    lotGis: { type: 'string' }, // LOT_GIS
    lotRe: { type: 'string' }, // LOT_RE
    map: { type: 'string' }, // MAP
    neighborhood: { type: 'string' }, // NEIGHBORHO
    ownerName2: { type: 'string' }, // OWNERNAME2
    ownAdd: { type: 'string' }, // OWN_ADD
    ownAdd2: { type: 'string' }, // OWN_ADD2
    ownCity: { type: 'string' }, // OWN_CITY
    ownName: { type: 'string' }, // OWN_NAME
    ownStat: { type: 'string' }, // OWN_STAT
    ownZip: { type: 'string' }, // OWN_ZIP
    parcelType: { type: 'string' }, // PARCELTYPE
    pidRe: { type: 'string' }, // PID_RE
    plat: { type: 'string' }, // PLAT
    prpName: { type: 'string' }, // PRP_NAME
    shapeArea: { type: 'number' }, // SHAPE__Area
    shapeLength: { type: 'number' }, // SHAPE__Length
    status: { type: 'string' }, // STATUS
    stAlpha: { type: 'string' }, // ST_ALPHA
    stDir: { type: 'string' }, // ST_DIR
    stName: { type: 'string' }, // ST_NAME
    stNum: { type: 'string' }, // ST_NUM
    stType: { type: 'string' }, // ST_TYPE
    unit: { type: 'string' }, // UNIT
    zoning: { type: 'string' }, // ZONING
    
    // GeoJSON geometry (for Mapbox rendering only)
    geometry: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        coordinates: { type: 'array' }
      }
    },
    
    // Computed fields for filtering
    computedFields: {
      type: 'object',
      properties: {
        searchText: { type: 'string' }, // Normalized text for search
        areaAcres: { type: 'number' }, // Area in acres for easier filtering
        normalizedAddress: { type: 'string' }, // Normalized address components
        ownerNameParts: { type: 'array', items: { type: 'string' } }, // Owner name parts for search
        propertyCategory: { type: 'string' } // Property type category
      }
    },
    
    // Metadata
    metadata: {
      type: 'object',
      properties: {
        batchNumber: { type: 'number' },
        loadedAt: { type: 'number' }, // timestamp
        lastUpdated: { type: 'number' }, // timestamp
        dataVersion: { type: 'string' } // ETag from server
      }
    }
  },
  
  // Indexes for fast querying
  indexes: [
    // Primary identifiers
    'objectId',
    'accountNo',
    'pidRe',
    
    // Categorical filters
    'block',
    'landCode',
    'landDesc', 
    'status',
    'zoning',
    'stType',
    'ownStat',
    'map',
    
    // Text search
    'addressGis',
    'ownName',
    'ownAdd',
    'prpName',
    'stName',
    
    // Numeric ranges
    'landSf',
    'shapeArea',
    'shapeLength',
    
    // Computed fields
    'computedFields.searchText',
    'computedFields.propertyCategory',
    
    // Compound indexes for common filter combinations
    ['block', 'status'],
    ['zoning', 'landDesc'],
    ['ownStat', 'ownCity'],
    ['stType', 'stName'],
    
    // Batch-based queries
    'metadata.batchNumber',
    'metadata.loadedAt'
  ]
};
```

### 2. Batch Metadata Collection

```typescript
const batchMetadataSchema = {
  version: 0,
  type: 'object',
  primaryKey: 'batchNumber',
  properties: {
    batchNumber: { type: 'number' },
    fileName: { type: 'string' },
    fileSize: { type: 'number' },
    featureCount: { type: 'number' },
    etag: { type: 'string' },
    lastModified: { type: 'string' },
    loadedAt: { type: 'number' }, // timestamp
    loadTime: { type: 'number' }, // milliseconds
    status: { 
      type: 'string',
      enum: ['pending', 'loading', 'loaded', 'error', 'stale']
    },
    error: { type: 'string' },
    checksum: { type: 'string' }, // For data integrity
    dataVersion: { type: 'string' } // Server version identifier
  },
  indexes: [
    'status',
    'loadedAt',
    'etag',
    'dataVersion'
  ]
};
```

### 3. Filter Options Collection

```typescript
const filterOptionsSchema = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string' }, // `${fieldName}_${value}`
    fieldName: { type: 'string' },
    value: { type: 'string' },
    displayValue: { type: 'string' },
    count: { type: 'number' }, // How many parcels have this value
    category: { type: 'string' }, // For grouping related values
    isActive: { type: 'boolean' }, // Currently selected in filters
    lastUpdated: { type: 'number' }
  },
  indexes: [
    'fieldName',
    'category',
    'isActive',
    'count',
    ['fieldName', 'count'] // For sorting by frequency
  ]
};
```

### 4. Filter State Collection

```typescript
const filterStateSchema = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string' }, // 'current' or preset name
    name: { type: 'string' },
    filters: {
      type: 'object',
      properties: {
        // Categorical filters
        block: { type: 'array', items: { type: 'string' } },
        landCode: { type: 'array', items: { type: 'string' } },
        landDesc: { type: 'array', items: { type: 'string' } },
        status: { type: 'array', items: { type: 'string' } },
        zoning: { type: 'array', items: { type: 'string' } },
        stType: { type: 'array', items: { type: 'string' } },
        ownStat: { type: 'array', items: { type: 'string' } },
        map: { type: 'array', items: { type: 'string' } },
        
        // Text search filters
        addressSearch: { type: 'string' },
        ownerSearch: { type: 'string' },
        propertySearch: { type: 'string' },
        streetSearch: { type: 'string' },
        
        // Numeric range filters
        landSfRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        areaRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          }
        }
      }
    },
    isPreset: { type: 'boolean' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  indexes: [
    'isActive',
    'isPreset',
    'createdAt',
    'updatedAt'
  ]
};
```

### 5. Query Cache Collection

```typescript
const queryCacheSchema = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string' }, // Hash of query parameters
    queryType: { 
      type: 'string',
      enum: ['filter', 'search', 'aggregation']
    },
    queryParams: { type: 'object' },
    resultIds: { type: 'array', items: { type: 'string' } }, // Parcel IDs
    resultCount: { type: 'number' },
    cachedAt: { type: 'number' },
    expiresAt: { type: 'number' },
    hitCount: { type: 'number' } // For cache optimization
  },
  indexes: [
    'queryType',
    'cachedAt',
    'expiresAt',
    'hitCount'
  ]
};
```

## Caching Strategy

### Enhanced Stale-While-Revalidate Pattern

**Builds on existing Cloudflare Worker implementation:**

1. **Immediate Load**: Load data from IndexDB cache if available, fallback to existing GeoJsonLoader
2. **Background Check**: Use existing ETag validation from Cloudflare Worker
3. **Update Cache**: Store new data in IndexDB when available
4. **Cache Bypass**: Leverage existing `?cache-bypass=true` parameter for forced refresh

### Enhanced Cache Layers

1. **Memory Cache**: Recently accessed features (LRU eviction) - NEW
2. **IndexDB Cache**: All loaded batch data with metadata - NEW
3. **Existing HTTP Cache**: Current ETag-based caching in Cloudflare Worker - ENHANCED
4. **Existing GeoJsonLoader**: Current batch loading system - INTEGRATED

### Enhanced Data Flow

```
App Load → Check IndexDB → Load Cached Data → Fallback to GeoJsonLoader
    ↓
Background Revalidation → Use Existing ETag Check → Update IndexDB Cache
    ↓
User Filters → RxDB Queries → Filtered Results → Update Mapbox
    ↓
Cache Bypass → Use Existing ?cache-bypass=true → Force Refresh → Update IndexDB
```

**Integration Points:**
- **GeoJsonLoader**: Enhanced to also store data in IndexDB
- **Cloudflare Worker**: Existing ETag validation used for revalidation
- **MapboxMap**: Existing component enhanced with filtering capabilities

## URL State Synchronization

### URL Structure

```
/?filters=block:0A,0B&status:U,L&search:alexandria&landSf:1000-5000
```

### URL Parameters

- **Categorical filters**: `?filters.block=0A,0B&filters.status=U`
- **Text search**: `?search.addressSearch=alexandria&search.ownerSearch=smith`
- **Numeric ranges**: `?filters.landSf=1000-5000&filters.area=0.1-1.0`
- **Presets**: `?preset=residential`

### Implementation

```typescript
// Custom hook for URL state management
export const useURLFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({});

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL
    const newParams = filtersToURL(updatedFilters);
    setSearchParams(newParams, { replace: true });
  }, [filters, filtersToURL, setSearchParams]);

  return { filters, updateFilters, clearFilters, hasActiveFilters };
};
```

## Filter UI Components

### Filter Types by Data Shape

1. **Select Dropdowns** (Categorical data):
   - `BLOCK` (82 unique values)
   - `STATUS` (9 unique values)
   - `ZONING` (64 unique values)
   - `ST_TYPE` (25 unique values)
   - `OWN_STAT` (54 unique values)

2. **Search Inputs** (Text data):
   - `ADDRESS_GIS` - Address search
   - `OWN_NAME` - Owner name search
   - `PRP_NAME` - Property name search
   - `ST_NAME` - Street name search

3. **Range Sliders** (Numeric data):
   - `LAND_SF` - Lot size in square feet
   - `SHAPE__Area` - Parcel area
   - `SHAPE__Length` - Parcel perimeter

4. **Multi-select** (Moderate cardinality):
   - `LANDDESC` (76 unique values)
   - `MAP` (299 unique values)

### Filter Component Architecture

```typescript
// Filter components
<FilterPanel>
  <CategoricalFilter field="block" />
  <CategoricalFilter field="status" />
  <CategoricalFilter field="zoning" />
  <TextSearchFilter field="addressSearch" />
  <TextSearchFilter field="ownerSearch" />
  <RangeFilter field="landSfRange" />
  <RangeFilter field="areaRange" />
  <FilterPresets />
  <ClearFilters />
</FilterPanel>
```

## Implementation Phases

### Phase 1: RxDB Setup & Basic Caching

**Goals:**
- Install and configure RxDB with IndexDB adapter
- Create parcel schema with proper indexes
- **Enhance existing GeoJsonLoader** to store data in IndexDB
- **Integrate with existing stale-while-revalidate** logic from Cloudflare Worker

**TDD Approach:**

#### 1.1 Database Setup (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('RxDB Database Setup', () => {
  test('creates database with parcel collection', async () => {
    const db = await createDatabase();
    expect(db.collections.parcels).toBeDefined();
    expect(db.collections.batchMetadata).toBeDefined();
  });
});

// 2. Test fails - no database implementation
// 3. Implement minimal database setup
// 4. Test passes
```

#### 1.2 Schema Validation (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Parcel Schema Validation', () => {
  test('validates parcel data structure', async () => {
    const parcel = createTestParcel();
    const result = await db.collections.parcels.insert(parcel);
    expect(result.id).toBe('parcel_123');
  });
});

// 2. Test fails - no schema defined
// 3. Implement parcel schema
// 4. Test passes
```

#### 1.3 Data Transformation (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Data Transformation', () => {
  test('transforms GeoJSON feature to parcel document', () => {
    const feature = createTestGeoJSONFeature();
    const parcel = transformFeatureToParcel(feature);
    expect(parcel.id).toBe('parcel_123');
    expect(parcel.computedFields.searchText).toContain('test address');
  });
});

// 2. Test fails - no transformation function
// 3. Implement transformation pipeline
// 4. Test passes
```

#### 1.4 GeoJsonLoader Integration (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('GeoJsonLoader IndexDB Integration', () => {
  test('stores loaded batch data in IndexDB', async () => {
    const loader = new GeoJsonLoader();
    await loader.loadBatchFile(1);
    
    const db = await createDatabase();
    const parcels = await db.collections.parcels
      .find()
      .where('metadata.batchNumber')
      .eq(1)
      .exec();
    expect(parcels.length).toBeGreaterThan(0);
  });
});

// 2. Test fails - GeoJsonLoader doesn't store in IndexDB
// 3. Enhance GeoJsonLoader to store data in IndexDB
// 4. Test passes
```

#### 1.5 Existing Cache Integration (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Existing Cache Integration', () => {
  test('uses existing ETag validation for revalidation', async () => {
    const cacheService = new CacheService();
    const result = await cacheService.checkForUpdates('batch_001.geojson.gz');
    
    expect(result.etag).toBeDefined();
    expect(result.lastModified).toBeDefined();
    expect(result.needsUpdate).toBe(false);
  });
});

// 2. Test fails - no integration with existing cache
// 3. Integrate with existing Cloudflare Worker ETag system
// 4. Test passes
```

**Deliverables:**
- RxDB database setup
- Data transformation pipeline
- **Enhanced GeoJsonLoader** with IndexDB persistence
- **Integration with existing cache system**

### Phase 2: Filter System

**Goals:**
- Create filter UI components
- Implement reactive RxDB queries
- Add filter state management
- **Enhance existing MapboxMap** with filtering capabilities

**TDD Approach:**

#### 2.1 Filter Queries (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Parcel Queries', () => {
  test('filters parcels by block', async () => {
    await insertTestParcels();
    const results = await db.collections.parcels
      .find()
      .where('block')
      .in(['0A', '0B'])
      .exec();
    expect(results).toHaveLength(2);
  });
});

// 2. Test fails - no query implementation
// 3. Implement RxDB query system
// 4. Test passes
```

#### 2.2 Filter State Management (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Filter State Management', () => {
  test('updates filter state and triggers re-render', () => {
    const { result } = renderHook(() => useFilterState());
    act(() => {
      result.current.updateFilters({ block: ['0A'] });
    });
    expect(result.current.filters.block).toEqual(['0A']);
  });
});

// 2. Test fails - no state management
// 3. Implement filter state hook
// 4. Test passes
```

#### 2.3 Filter UI Components (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('CategoricalFilter Component', () => {
  test('renders filter options and handles selection', () => {
    const mockOnChange = jest.fn();
    render(
      <CategoricalFilter 
        field="block" 
        options={['0A', '0B']} 
        onChange={mockOnChange} 
      />
    );
    
    fireEvent.click(screen.getByText('0A'));
    expect(mockOnChange).toHaveBeenCalledWith(['0A']);
  });
});

// 2. Test fails - no component implementation
// 3. Implement filter components
// 4. Test passes
```

#### 2.4 URL State Synchronization (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('URL State Synchronization', () => {
  test('syncs filter state with URL parameters', () => {
    const { result } = renderHook(() => useURLFilters());
    act(() => {
      result.current.updateFilters({ block: ['0A'] });
    });
    expect(window.location.search).toContain('filters.block=0A');
  });
});

// 2. Test fails - no URL sync implementation
// 3. Implement URL state management
// 4. Test passes
```

**Deliverables:**
- Filter UI components
- Query system with RxDB
- Filter state management
- **Enhanced MapboxMap** with filtering
- URL state synchronization

**Testing:**
- Component unit tests
- Query performance tests
- Filter state persistence tests

### Phase 3: Performance Optimization

**Goals:**
- Add memory caching layer
- Implement query result caching
- Optimize re-renders
- Add lazy loading

**TDD Approach:**

#### 3.1 Memory Caching (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Memory Cache', () => {
  test('caches query results and returns cached data', async () => {
    const cache = new MemoryCache();
    const query = { block: ['0A'] };
    
    // First query - should hit database
    const result1 = await cache.getOrSet(query, () => dbQuery(query));
    expect(result1.fromCache).toBe(false);
    
    // Second query - should hit cache
    const result2 = await cache.getOrSet(query, () => dbQuery(query));
    expect(result2.fromCache).toBe(true);
  });
});

// 2. Test fails - no cache implementation
// 3. Implement memory cache
// 4. Test passes
```

#### 3.2 Query Performance (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Query Performance', () => {
  test('queries complete within performance threshold', async () => {
    const startTime = Date.now();
    const results = await db.collections.parcels
      .find()
      .where('block')
      .in(['0A', '0B'])
      .exec();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(500); // 500ms threshold
    expect(results).toHaveLength(2);
  });
});

// 2. Test fails - queries too slow
// 3. Implement query optimization
// 4. Test passes
```

#### 3.3 Lazy Loading (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Lazy Loading', () => {
  test('loads data in batches to prevent UI blocking', async () => {
    const loader = new LazyLoader(db, { batchSize: 100 });
    const results = await loader.loadAll();
    
    expect(results.totalLoaded).toBe(1000);
    expect(results.isComplete).toBe(true);
  });
});

// 2. Test fails - no lazy loading
// 3. Implement lazy loading system
// 4. Test passes
```

#### 3.4 Memory Management (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Memory Management', () => {
  test('memory usage stays within limits', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    await loadLargeDataset();
    const finalMemory = performance.memory.usedJSHeapSize;
    
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // 500MB limit
  });
});

// 2. Test fails - memory usage too high
// 3. Implement memory optimization
// 4. Test passes
```

**Deliverables:**
- Memory cache implementation
- Query optimization
- Performance monitoring
- Lazy loading system

### Phase 4: Advanced Features

**Goals:**
- Filter presets and saved searches
- Advanced search capabilities
- Export filtered data

**TDD Approach:**

#### 4.1 Filter Presets (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Filter Presets', () => {
  test('saves and loads filter presets', () => {
    const presetManager = new FilterPresetManager();
    const filters = { block: ['0A'], status: ['U'] };
    
    presetManager.savePreset('residential', filters);
    const loaded = presetManager.loadPreset('residential');
    
    expect(loaded).toEqual(filters);
  });
});

// 2. Test fails - no preset management
// 3. Implement preset system
// 4. Test passes
```

#### 4.2 Advanced Search (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Advanced Search', () => {
  test('performs complex multi-field search', async () => {
    const searchService = new AdvancedSearchService(db);
    const results = await searchService.search({
      address: 'alexandria',
      owner: 'smith',
      minArea: 1000,
      maxArea: 5000
    });
    
    expect(results).toHaveLength(2);
    expect(results[0].addressGis).toContain('alexandria');
  });
});

// 2. Test fails - no advanced search
// 3. Implement advanced search
// 4. Test passes
```

#### 4.3 Export Functionality (Test-Fail-Implement-Pass)
```typescript
// 1. Write failing test
describe('Export Functionality', () => {
  test('exports filtered data as CSV', async () => {
    const exporter = new DataExporter();
    const filteredData = await getFilteredParcels();
    const csv = await exporter.exportToCSV(filteredData);
    
    expect(csv).toContain('OBJECTID,ADDRESS_GIS,OWN_NAME');
    expect(csv.split('\n')).toHaveLength(3); // Header + 2 data rows
  });
});

// 2. Test fails - no export functionality
// 3. Implement export system
// 4. Test passes
```

**Deliverables:**
- Preset management system
- Advanced search UI
- Export functionality

## TDD Workflow Process

### Red-Green-Refactor Cycle

Each feature follows the standard TDD cycle:

1. **🔴 RED**: Write a failing test that describes the desired behavior
2. **🟢 GREEN**: Write the minimal code to make the test pass
3. **🔵 REFACTOR**: Improve the code while keeping tests green
4. **✅ REPEAT**: Move to the next feature

### Test-Fail-Implement-Pass Examples

#### Example 1: Database Setup
```bash
# 1. Write failing test
npm test -- --testNamePattern="creates database with parcel collection"
# ❌ FAIL: Test fails because createDatabase() doesn't exist

# 2. Implement minimal code
# Create src/database/database.ts with basic setup
npm test -- --testNamePattern="creates database with parcel collection"
# ✅ PASS: Test passes with minimal implementation

# 3. Refactor and add more features
# Add error handling, configuration, etc.
npm test -- --testNamePattern="creates database with parcel collection"
# ✅ PASS: All tests still pass after refactoring
```

#### Example 2: Filter Component
```bash
# 1. Write failing test
npm test -- --testNamePattern="renders filter options and handles selection"
# ❌ FAIL: Test fails because CategoricalFilter doesn't exist

# 2. Implement minimal component
# Create src/components/filters/CategoricalFilter.tsx
npm test -- --testNamePattern="renders filter options and handles selection"
# ✅ PASS: Test passes with basic component

# 3. Refactor and enhance
# Add styling, accessibility, error handling
npm test -- --testNamePattern="renders filter options and handles selection"
# ✅ PASS: All tests still pass after enhancements
```

### Continuous Testing

```bash
# Watch mode for continuous feedback
npm run test:watch

# Run specific test suites
npm test -- --testNamePattern="Phase 1"
npm test -- --testNamePattern="Phase 2"

# Run performance tests
npm run test:performance

# Run integration tests
npm run test:integration
```

### Test Coverage Requirements

- **Unit Tests**: > 90% coverage for all new code
- **Integration Tests**: Cover all major data flows
- **Performance Tests**: Verify all performance targets
- **E2E Tests**: Cover complete user workflows

### Phase-by-Phase Validation

#### Phase 1 Validation Checklist
```bash
# Run Phase 1 tests
npm test -- --testNamePattern="Phase 1"

# Verify database setup
npm test -- --testNamePattern="RxDB Database Setup"
npm test -- --testNamePattern="Parcel Schema Validation"
npm test -- --testNamePattern="Data Transformation"
npm test -- --testNamePattern="IndexDB Persistence"

# Check test coverage
npm run test:coverage -- --testNamePattern="Phase 1"

# Performance validation
npm run test:performance -- --testNamePattern="Phase 1"
```

#### Phase 2 Validation Checklist
```bash
# Run Phase 2 tests
npm test -- --testNamePattern="Phase 2"

# Verify filter system
npm test -- --testNamePattern="Parcel Queries"
npm test -- --testNamePattern="Filter State Management"
npm test -- --testNamePattern="CategoricalFilter Component"
npm test -- --testNamePattern="URL State Synchronization"

# Integration tests
npm run test:integration -- --testNamePattern="Filter System"
```

#### Phase 3 Validation Checklist
```bash
# Run Phase 3 tests
npm test -- --testNamePattern="Phase 3"

# Verify performance optimizations
npm test -- --testNamePattern="Memory Cache"
npm test -- --testNamePattern="Query Performance"
npm test -- --testNamePattern="Lazy Loading"
npm test -- --testNamePattern="Memory Management"

# Load testing
npm run test:load -- --testNamePattern="Phase 3"
```

#### Phase 4 Validation Checklist
```bash
# Run Phase 4 tests
npm test -- --testNamePattern="Phase 4"

# Verify advanced features
npm test -- --testNamePattern="Filter Presets"
npm test -- --testNamePattern="Advanced Search"
npm test -- --testNamePattern="Export Functionality"

# End-to-end tests
npm run test:e2e -- --testNamePattern="Phase 4"
```

### Test Commands Reference

```bash
# Development workflow
npm run test:watch              # Continuous testing
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests
npm run test:performance       # Performance tests
npm run test:e2e              # End-to-end tests
npm run test:all              # All tests

# Coverage and quality
npm run test:coverage         # Generate coverage report
npm run test:coverage:watch   # Watch mode with coverage
npm run lint                  # Code linting
npm run type-check           # TypeScript checking

# Specific test patterns
npm test -- --testNamePattern="Database"     # Database tests
npm test -- --testNamePattern="Filter"       # Filter tests
npm test -- --testNamePattern="Performance"  # Performance tests
```

## Testing Strategy

### Unit Tests

```typescript
// Schema validation tests
describe('Parcel Schema', () => {
  test('validates parcel data correctly', () => {
    // Test valid parcel data insertion
    // Test invalid data rejection
    // Test required field validation
  });
});

// Data transformation tests
describe('Data Transformation', () => {
  test('transforms GeoJSON features to parcel documents', () => {
    // Test with sample feature from actual data
    // Verify all 34 properties are mapped correctly
    // Test computed fields generation
  });
});
```

### Integration Tests

```typescript
// IndexDB persistence tests
describe('IndexDB Persistence', () => {
  test('saves and retrieves parcel data', async () => {
    // Insert test data
    // Close and reopen database
    // Verify data persistence
  });
});

// Filter system tests
describe('Filter System', () => {
  test('filter queries work correctly', async () => {
    // Test various filter combinations
    // Verify result accuracy
    // Test performance
  });
});
```

### Performance Tests

```typescript
// Load testing
describe('Performance', () => {
  test('loads all 47K parcels efficiently', async () => {
    // Measure total load time
    // Monitor memory usage
    // Verify no crashes
  });
});
```

## Performance Targets

### Response Times
- **Initial data load**: < 30 seconds
- **Filter query response**: < 500ms
- **Filter options loading**: < 200ms
- **UI responsiveness**: 60fps

### Resource Usage
- **Memory usage**: < 1GB
- **IndexDB size**: < 500MB
- **Query cache hit rate**: > 80%

### Quality Metrics
- **Test coverage**: > 90%
- **No data corruption**
- **No memory leaks**
- **Cross-browser compatibility**

## Dependencies

### New Dependencies
```json
{
  "rxdb": "^15.0.0",
  "idb": "^8.0.0",
  "react-router-dom": "^6.0.0"
}
```

### Existing Dependencies
- React 19 (already installed)
- TypeScript (already installed)
- Mapbox GL JS (already installed)

## Integration with Existing Code

### Enhanced Components

**GeoJsonLoader (src/utils/geoJsonLoader.ts)**
- **Current**: Loads and caches batch data in memory
- **Enhanced**: Also stores data in IndexDB for persistence
- **Integration**: Maintains existing API, adds IndexDB storage

**MapboxMap (src/components/MapboxMap.tsx)**
- **Current**: Displays all loaded parcels on map
- **Enhanced**: Filters displayed parcels based on user selections
- **Integration**: Adds filtering layer without changing core map functionality

**Cloudflare Worker (src/worker/index.ts)**
- **Current**: Provides ETag-based caching and cache-bypass
- **Enhanced**: Used for revalidation checks
- **Integration**: No changes needed, existing functionality leveraged

### New Components

```
src/
├── database/                    # NEW - RxDB integration
│   ├── schemas/
│   │   ├── parcel.ts
│   │   ├── batchMetadata.ts
│   │   ├── filterOptions.ts
│   │   ├── filterState.ts
│   │   └── queryCache.ts
│   ├── database.ts
│   └── migrations/
├── hooks/                       # NEW - Filter state management
│   ├── useURLFilters.ts
│   ├── useFilterPresets.ts
│   └── useParcelQueries.ts
├── components/
│   ├── filters/                 # NEW - Filter UI components
│   │   ├── FilterPanel.tsx
│   │   ├── CategoricalFilter.tsx
│   │   ├── TextSearchFilter.tsx
│   │   ├── RangeFilter.tsx
│   │   └── FilterPresets.tsx
│   └── MapboxMap.tsx           # ENHANCED - Add filtering
├── services/                    # NEW - Data services
│   ├── cacheService.ts
│   ├── dataTransformService.ts
│   └── queryService.ts
├── utils/
│   ├── geoJsonLoader.ts        # ENHANCED - Add IndexDB storage
│   ├── urlState.ts             # NEW - URL state management
│   └── dataValidation.ts       # NEW - Data validation
└── worker/
    └── index.ts                # UNCHANGED - Leverage existing
```

### Backward Compatibility

- **Existing API**: All current GeoJsonLoader methods remain unchanged
- **Existing UI**: MapboxMap continues to work as before
- **Existing Caching**: Cloudflare Worker caching continues to work
- **Progressive Enhancement**: New features are additive, not replacing

## Success Criteria

### Phase 1 Success
- ✅ All 47,174 parcels can be inserted into IndexDB
- ✅ Data retrieval time < 100ms for 1000 parcels
- ✅ Memory usage stays under 500MB
- ✅ No data corruption during save/load cycles

### Phase 2 Success
- ✅ All filter types work correctly (categorical, text, numeric)
- ✅ Query performance < 500ms for full dataset
- ✅ Filter state persists across page refreshes
- ✅ URL state synchronization works

### Phase 3 Success
- ✅ Full dataset loads in < 30 seconds
- ✅ Memory usage stays under 1GB
- ✅ Filtering remains responsive with full dataset
- ✅ No performance degradation over time

### Phase 4 Success
- ✅ All advanced features work correctly
- ✅ Cross-browser compatibility
- ✅ Error handling and recovery

## Risk Mitigation

### Data Integrity
- **Checksums** for batch data validation
- **ETag verification** for cache consistency
- **Error recovery** mechanisms for failed loads

### Performance
- **Progressive loading** to avoid UI blocking
- **Memory monitoring** to prevent crashes
- **Query optimization** with proper indexes

### User Experience
- **Loading indicators** for long operations
- **Error messages** for failed operations
- **Fallback mechanisms** for offline scenarios

## Conclusion

This comprehensive caching and indexing strategy will provide:

1. **Fast initial load** from IndexDB cache
2. **Offline capability** with cached data
3. **Efficient filtering** with proper indexes
4. **Real-time updates** with reactive queries
5. **Memory efficiency** with pagination and lazy loading
6. **Shareable URLs** with filter state persistence
7. **Smooth user experience** with optimized performance

The phased approach ensures each component is thoroughly tested and validated before moving to the next phase, reducing risk and ensuring quality throughout the implementation process.
