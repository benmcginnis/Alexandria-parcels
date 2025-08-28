# **Alexandria Parcels File Splitter - Test List**

## **Progress Summary**
- **✅ Input Validation Tests**: 17/17 tests completed (100%)
- **✅ Coordinate Processing Tests**: 10/10 tests completed (100%)
- **⏳ Feature Splitting Tests**: 0/10 tests completed (0%)
- **⏳ Output File Tests**: 0/10 tests completed (0%)
- **⏳ Metadata Generation Tests**: 0/16 tests completed (0%)
- **⏳ Performance Tests**: 0/8 tests completed (0%)
- **⏳ Error Handling Tests**: 0/8 tests completed (0%)
- **⏳ Integration Tests**: 0/6 tests completed (0%)
- **⏳ Cross-Platform Tests**: 0/4 tests completed (0%)
- **⏳ Validation Tests**: 0/6 tests completed (0%)

**Overall Progress: 27/93 tests completed (29.0%)**

## **Test Categories**

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

### **3. Feature Splitting Tests**

#### **A. Batch Creation**
- [ ] **Test 3.1**: Verify exactly 48 batch files are created
- [ ] **Test 3.2**: Verify first 47 batches contain exactly 1000 features each
- [ ] **Test 3.3**: Verify last batch contains remaining features (181 features)
- [ ] **Test 3.4**: Verify total features across all batches equals input file total
- [ ] **Test 3.5**: Verify features maintain their original order within each batch

#### **B. Batch File Structure**
- [ ] **Test 3.6**: Verify each batch file is valid GeoJSON
- [ ] **Test 3.7**: Verify each batch file has `type: "FeatureCollection"`
- [ ] **Test 3.8**: Verify each batch file has correct `name` property
- [ ] **Test 3.9**: Verify each batch file has same `crs` as input file
- [ ] **Test 3.10**: Verify each batch file has correct feature count

### **4. Output File Tests**

#### **A. File Naming**
- [ ] **Test 4.1**: Verify batch files are named correctly: `alexandria_parcels_batch_001.geojson` through `alexandria_parcels_batch_048.geojson`
- [ ] **Test 4.2**: Verify all files are created in `data/` directory
- [ ] **Test 4.3**: Verify index file is created as `data/batches_index.json`

#### **B. File Sizes**
- [ ] **Test 4.4**: Verify each batch file is under 10MB
- [ ] **Test 4.5**: Verify total output size is under 150MB
- [ ] **Test 4.6**: Verify file sizes are reasonable (2-4MB per batch)
- [ ] **Test 4.7**: Verify index file is under 1MB

#### **C. File Content Validation**
- [ ] **Test 4.8**: Verify each batch file can be parsed as valid JSON
- [ ] **Test 4.9**: Verify each batch file can be loaded into a GeoJSON viewer
- [ ] **Test 4.10**: Verify no batch file contains malformed coordinates

### **5. Metadata Generation Tests**

#### **A. Index File Structure**
- [ ] **Test 5.1**: Verify `batches_index.json` has correct structure
- [ ] **Test 5.2**: Verify `dataset` field equals "Alexandria_Parcels"
- [ ] **Test 5.3**: Verify `total_features` equals input file feature count
- [ ] **Test 5.4**: Verify `total_batches` equals 48
- [ ] **Test 5.5**: Verify `coordinate_precision` equals 6
- [ ] **Test 5.6**: Verify `last_updated` is today's date

#### **B. Batch Information**
- [ ] **Test 5.7**: Verify each batch has correct `batch_id`
- [ ] **Test 5.8**: Verify each batch has correct `filename`
- [ ] **Test 5.9**: Verify each batch has correct `feature_count`
- [ ] **Test 5.10**: Verify each batch has correct `objectid_range`
- [ ] **Test 5.11**: Verify each batch has correct `file_size_mb`
- [ ] **Test 5.12**: Verify each batch has valid `coordinate_bounds`

#### **C. Coordinate Bounds**
- [ ] **Test 5.13**: Verify `min_lon` and `max_lon` are within Alexandria bounds
- [ ] **Test 5.14**: Verify `min_lat` and `max_lat` are within Alexandria bounds
- [ ] **Test 5.15**: Verify bounds are calculated correctly for each batch
- [ ] **Test 5.16**: Verify no batch has invalid coordinate bounds

### **6. Performance Tests**

#### **A. Processing Time**
- [ ] **Test 6.1**: Verify entire processing completes in under 5 minutes
- [ ] **Test 6.2**: Verify coordinate processing completes in under 2 minutes
- [ ] **Test 6.3**: Verify batch splitting completes in under 1 minute
- [ ] **Test 6.4**: Verify file writing completes in under 2 minutes

#### **B. Memory Usage**
- [ ] **Test 6.5**: Verify peak memory usage stays under 2GB
- [ ] **Test 6.6**: Verify memory is released after processing
- [ ] **Test 6.7**: Verify no memory leaks during processing

#### **C. File I/O Performance**
- [ ] **Test 6.8**: Verify input file reading completes in under 30 seconds
- [ ] **Test 6.9**: Verify all output files are written successfully
- [ ] **Test 6.10**: Verify no file corruption during writing

### **7. Error Handling Tests**

#### **A. Input File Errors**
- [ ] **Test 7.1**: Verify graceful handling of missing input file
- [ ] **Test 7.2**: Verify graceful handling of corrupted JSON
- [ ] **Test 7.3**: Verify graceful handling of invalid GeoJSON structure
- [ ] **Test 7.4**: Verify graceful handling of empty features array
- [ ] **Test 7.5**: Verify graceful handling of malformed geometry

#### **B. Processing Errors**
- [ ] **Test 7.6**: Verify graceful handling of invalid coordinate values
- [ ] **Test 7.7**: Verify graceful handling of missing properties
- [ ] **Test 7.8**: Verify graceful handling of disk space issues
- [ ] **Test 7.9**: Verify graceful handling of permission errors
- [ ] **Test 7.10**: Verify graceful handling of memory allocation failures

#### **C. Output Errors**
- [ ] **Test 7.11**: Verify graceful handling of output directory creation failures
- [ ] **Test 7.12**: Verify graceful handling of file writing failures
- [ ] **Test 7.13**: Verify graceful handling of index file generation failures
- [ ] **Test 7.14**: Verify partial cleanup on failure

### **8. Integration Tests**

#### **A. Client-Side Loading**
- [ ] **Test 8.1**: Verify all batch files can be loaded via HTTP requests
- [ ] **Test 8.2**: Verify batch files can be parsed in browser JavaScript
- [ ] **Test 8.3**: Verify batch files can be loaded into Mapbox
- [ ] **Test 8.4**: Verify batch files can be stored in IndexedDB
- [ ] **Test 8.5**: Verify batch files can be loaded into RxDB

#### **B. Data Reconstruction**
- [ ] **Test 8.6**: Verify all features can be reconstructed from batches
- [ ] **Test 8.7**: Verify feature order is maintained after reconstruction
- [ ] **Test 8.8**: Verify all properties are preserved after reconstruction
- [ ] **Test 8.9**: Verify geometry integrity is maintained after reconstruction
- [ ] **Test 8.10**: Verify total feature count matches after reconstruction

### **9. Cross-Platform Tests**

#### **A. Operating System Compatibility**
- [ ] **Test 9.1**: Verify processing works on macOS
- [ ] **Test 9.2**: Verify processing works on Linux
- [ ] **Test 9.3**: Verify processing works on Windows
- [ ] **Test 9.4**: Verify file paths are handled correctly on all platforms

#### **B. Node.js Version Compatibility**
- [ ] **Test 9.5**: Verify processing works with Node.js 16.x
- [ ] **Test 9.6**: Verify processing works with Node.js 18.x
- [ ] **Test 9.7**: Verify processing works with Node.js 20.x
- [ ] **Test 9.8**: Verify TypeScript compilation works on all versions

### **10. Validation Tests**

#### **A. Data Integrity Verification**
- [ ] **Test 10.1**: Verify no features are lost during processing
- [ ] **Test 10.2**: Verify no properties are modified during processing
- [ ] **Test 10.3**: Verify coordinate precision reduction is accurate
- [ ] **Test 10.4**: Verify polygon geometries remain valid
- [ ] **Test 10.5**: Verify CRS specification is preserved

#### **B. Output Quality**
- [ ] **Test 10.6**: Verify batch files are human-readable (proper formatting)
- [ ] **Test 10.7**: Verify batch files can be opened in GIS software
- [ ] **Test 10.8**: Verify batch files can be validated with GeoJSON validators
- [ ] **Test 10.9**: Verify index file provides complete metadata
- [ ] **Test 10.10**: Verify all file paths in index are correct

## **Test Execution Order**

1. **Unit Tests**: Run individual function tests first
2. **Integration Tests**: Test complete processing pipeline
3. **Performance Tests**: Verify performance requirements
4. **Error Handling Tests**: Test failure scenarios
5. **Cross-Platform Tests**: Verify compatibility
6. **Validation Tests**: Final data integrity verification

## **Success Criteria**

- **All tests must pass** before considering the implementation complete
- **Performance targets must be met** (processing time <5 minutes, memory <2GB)
- **File size targets must be met** (individual batches <10MB, total <150MB)
- **Data integrity must be 100%** (no features, properties, or geometry lost)
- **Error handling must be robust** (graceful failure with clear error messages)

## **Test Environment Requirements**

- **Hardware**: Minimum 4GB RAM, 2GB free disk space
- **Software**: Node.js 16+, TypeScript 4.9+, ts-node
- **Data**: `rawdata/Alexandria_Parcels.geojson` file
- **Output**: `data/` directory with write permissions
