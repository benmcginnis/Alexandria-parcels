# **Alexandria Parcels File Splitter - Test List**

## **Progress Summary**
- **✅ Input Validation Tests**: 17/17 tests completed (100%)
- **✅ Coordinate Processing Tests**: 10/10 tests completed (100%)
- **✅ Feature Splitting Logic Tests**: 10/10 tests completed (100%)

**Overall Progress: 37/37 tests completed (100.0%)**

## **Test Categories**

This test plan focuses on **core functionality** rather than implementation details, following these principles:
- Tests validate **what the system should do**, not how it should do it
- No duplicate validation logic across test categories
- Tests focus on individual functions and processing logic
- No performance, cross-platform, or error handling tests that don't validate core functionality

### **1. Input Validation Tests**

#### **A. File Structure Validation**
- [x] **Test 1.1**: Verify input file exists at `rawdata/Alexandria_Parcels.geojson`
- [x] **Test 1.2**: Validate input file is valid JSON
- [x] **Test 1.3**: Validate input file has correct GeoJSON structure
- [x] **Test 1.4**: Verify input file has `type: "FeatureCollection"`
- [x] **Test 1.5**: Verify input file has `features` array
- [x] **Test 1.6**: Verify input file has `crs` property with CRS84 specification
- [x] **Test 1.7**: Verify all features have required properties (`type`, `properties`, `geometry`)
- [x] **Test 1.8**: Verify all features have `type: "Feature"`
- [x] **Test 1.9**: Verify all geometries have valid polygon types (Polygon or MultiPolygon)
- [x] **Test 1.10**: Verify feature count matches expected total (~47,181 features)

#### **B. Data Integrity Validation**
- [x] **Test 1.11**: Verify all features have non-empty properties object
- [x] **Test 1.12**: Verify all features have required property keys (OBJECTID, PID_RE, ADDRESS_GIS, ZONING, LAND_SF)
- [x] **Test 1.13**: Verify file size is reasonable for the feature count (~130MB for ~47K features)
- [x] **Test 1.14**: Verify coordinate precision is reasonable (6+ decimal places)
- [x] **Test 1.15**: Verify all features have valid coordinate ranges (longitude: -77.1 to -77.0, latitude: 38.8 to 38.9)
- [x] **Test 1.16**: Verify all features have valid polygon geometry (closed rings, proper winding order)
- [x] **Test 1.17**: Verify no duplicate OBJECTID values exist

### **2. Coordinate Processing Tests**

#### **A. Coordinate Processing Functions**
- [x] **Test 2.1**: Verify `reduceCoordinatePrecision` function correctly rounds coordinates to 6 decimal places
- [x] **Test 2.2**: Verify `reduceCoordinatePrecision` preserves coordinate structure (rings and points)
- [x] **Test 2.3**: Verify `reduceCoordinatePrecision` handles both Polygon and MultiPolygon geometries
- [x] **Test 2.4**: Verify `reduceCoordinatePrecision` maintains coordinate order within rings
- [x] **Test 2.5**: Verify `reduceCoordinatePrecision` returns new object without mutating input

#### **B. Coordinate Processing Edge Cases**
- [x] **Test 2.6**: Verify `reduceCoordinatePrecision` handles coordinates with no decimal places
- [x] **Test 2.7**: Verify `reduceCoordinatePrecision` handles coordinates with more than 6 decimal places
- [x] **Test 2.8**: Verify `reduceCoordinatePrecision` handles negative coordinates correctly
- [x] **Test 2.9**: Verify `reduceCoordinatePrecision` handles zero coordinates correctly
- [x] **Test 2.10**: Verify `reduceCoordinatePrecision` handles very small coordinate values correctly

### **3. Feature Splitting Logic Tests**

#### **A. Core Splitting Functionality**
- [x] **Test 3.1**: Verify `splitFeaturesIntoBatches` function creates correct number of batches
- [x] **Test 3.2**: Verify `splitFeaturesIntoBatches` maintains feature order within batches
- [x] **Test 3.3**: Verify `splitFeaturesIntoBatches` distributes features evenly (1000 per batch)
- [x] **Test 3.4**: Verify `processBatch` function correctly applies coordinate precision reduction to Polygon geometries
- [x] **Test 3.5**: Verify `processBatch` function correctly handles MultiPolygon geometries

#### **B. Batch Processing Logic**
- [x] **Test 3.6**: Verify `processBatch` function correctly handles features without geometry
- [x] **Test 3.7**: Verify `processBatch` function preserves all feature properties
- [x] **Test 3.8**: Verify `splitFeaturesIntoBatches` handles different batch sizes correctly
- [x] **Test 3.9**: Verify `splitFeaturesIntoBatches` handles edge cases correctly
- [x] **Test 3.10**: Verify `processBatch` function handles mixed geometry types correctly




