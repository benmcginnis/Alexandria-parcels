# Alexandria Parcels Map Viewer - Project Plan

## Overview
Transform the existing Alexandria parcels splitter project into a React 19 single-page application with Mapbox integration. The app will load all 50 optimized, compressed batch files from the data directory and display them as polygon layers on a full-screen map. The existing file splitting functionality will be moved to a `scripts/splitter/` directory while keeping all source code in the main `src/` directory.

## 🎯 Enhanced Data Ready for Map Viewer
- **✅ File Splitter Complete**: Smart splitting + compression implemented and validated
- **✅ Optimized Data**: 50 compressed batches (9.33MB total vs. 136MB original)
- **✅ Web-Ready Files**: All batches under 1MB, 93.1% compression achieved
- **✅ Performance Validated**: 47,174 features processed in 5.36 seconds

## Goals
1. ✅ Single page app with create-react-app and vite + typescript
2. ✅ Single page is a full screen map using mapbox, centered on Alexandria view box
3. ✅ Successfully loads all split files from data directory and displays polygons
4. ✅ Uses React 19 and latest dependencies
5. ✅ No eslint or typescript errors
6. ✅ Environment variables for Mapbox token
7. ✅ Node 24 compatibility

## Alexandria View Box Coordinates
- **Southwest**: 38.79238855269405, -77.15216206049962
- **Northeast**: 38.84972857510591, -77.03046456387351

## Project Structure
```
/
├── src/
│   ├── components/
│   │   ├── MapboxMap.tsx          # Main map component
│   │   ├── GeoJSONLoader.tsx      # Handles loading of batch files
│   │   └── LoadingIndicator.tsx   # Shows loading progress
│   ├── utils/
│   │   ├── geoJsonLoader.ts       # Utility functions for loading GeoJSON
│   │   ├── mapConfig.ts           # Map configuration constants
│   │   ├── coordinate-processor.ts # Existing coordinate processing utility
│   │   ├── feature-splitter.ts    # Existing feature splitting utility
│   │   └── file-validator.ts      # Existing file validation utility
│   ├── types/
│   │   └── geoJson.ts             # TypeScript type definitions
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # App entry point
│   └── index.html                 # HTML entry point
├── scripts/
│   └── splitter/                  # File splitting functionality
│       ├── run-splitter.ts        # Main splitter script
│       └── __tests__/             # Splitter tests
├── data/                          # GeoJSON batch files
├── .env.example                   # Environment variables template
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Technical Requirements

### Dependencies
- **React**: 19.x (latest)
- **React DOM**: 19.x (latest)
- **Mapbox GL JS**: Latest version
- **React Map GL**: Latest Mapbox React wrapper
- **TypeScript**: Latest version
- **Vite**: Latest version for build tooling
- **@types/mapbox-gl**: TypeScript definitions

### Environment Variables
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox access token (required)

### Node.js Version
- **Required**: Node 24.x (for React 19 compatibility)
- **Note**: Use nvm to switch to Node 24 for this project only, do not make it system default

## Implementation Phases

### Phase 1: Project Setup & Dependencies
1. **Reorganize existing project structure**
   - Move existing file splitter files to `scripts/splitter/` directory
   - Keep all source code in the main `src/` directory

2. **Node.js version management**
   - Use nvm to install and switch to Node 24 for this project
   - Verify Node 24 is active in current shell
   - Ensure system default remains Node 18

3. **Install core dependencies**
   - React 19 with latest TypeScript
   - Mapbox GL JS and React wrapper
   - Vite for build tooling
   - Update existing package.json with new dependencies

3. **Environment configuration**
   - Set up `.env` file for Mapbox access token
   - Configure Vite to handle environment variables
   - Add `.env.example` for documentation

### Phase 2: Map Component Development
1. **Create MapboxMap component**
   - Full-screen map container
   - Initialize Mapbox with environment variable access token
   - Set viewport to Alexandria coordinates
   - Handle map initialization and cleanup

2. **Implement GeoJSON loading system**
   - Create utility to dynamically load all 50 compressed `.geojson.gz` batch files from `data/` directory
   - Handle async loading of compressed files (browser automatically decompresses .gz files)
   - Implement error handling for failed loads
   - Optimize loading sequence for 9.33MB total compressed data
   - Support for 48 batch files (ranging from 571KB to 13MB)

3. **Data layer management**
   - Add GeoJSON sources to Mapbox
   - Style polygon layers with appropriate colors and borders
   - Simple, clean visualization without complex controls

### Phase 3: Performance Optimization
1. **Handle large datasets efficiently**
   - Implement progressive loading (load visible batches first)
   - Use Mapbox clustering for dense areas
   - Implement viewport-based loading to avoid loading off-screen data
   - Handle files ranging from 571KB to 13MB efficiently

2. **Memory management**
   - Clean up unused GeoJSON sources
   - Implement proper cleanup on component unmount
   - Monitor memory usage with large datasets
   - Prevent memory leaks with 48+ large GeoJSON files

### Phase 4: UI/UX Enhancements
1. **Loading states and progress indicators**
   - Show loading progress for each batch
   - Display total loaded features count
   - Error handling for failed loads
   - Progress bar for overall loading completion

2. **Basic map controls**
   - Zoom controls
   - Simple navigation
   - Reset view to Alexandria bounds

### Phase 5: Testing & Quality Assurance
1. **TypeScript configuration**
   - Strict type checking enabled
   - Proper type definitions for Mapbox and GeoJSON
   - No TypeScript errors
   - Comprehensive type safety

2. **Code quality**
   - Proper error boundaries
   - Performance monitoring
   - Verify Node 24 compatibility (using nvm)
   - Clean, maintainable code structure

## Data Files to Load
The app will load optimized, compressed GeoJSON batch files from the `data/` directory:
- **File Format**: `.geojson.gz` (gzipped GeoJSON)
- **File Sizes**: 0.09-0.58MB each (compressed, down from 2-13MB uncompressed)
- **File Count**: 50 optimized batches (vs. 48 fixed)
- **Compression**: 93.1% size reduction achieved (exceeding 60-80% target)
- **Total Data**: 9.33MB compressed (down from 136MB uncompressed)

**Note**: Files have been optimized using smart splitting (size and feature count constraints) and gzip compression for optimal web loading performance. All files are now web-ready and under 1MB.

## Critical Considerations

### Performance Challenges
- **Optimized File Sizes**: Files now 0.09-0.58MB each (compressed), down from 2-13MB
- **Total Features**: 47,174 polygon features across 50 optimized batches
- **Memory Usage**: Significantly improved with smaller, compressed files
- **Loading Time**: Much faster with 93.1% compression and optimized file sizes
- **Decompression**: Browser handles gzip decompression automatically
- **Web Optimization**: All files under 1MB, perfect for web loading

### Technical Requirements
- **Mapbox Access Token**: Required for map functionality
- **Coordinate System**: Ensure proper projection and coordinate handling
- **Error Handling**: Robust error handling for failed file loads
- **Responsive Design**: Full-screen map that works on different screen sizes

### Future Enhancements (Not in Current Scope)
- Layer toggling and visibility controls
- Search and filtering functionality
- Advanced styling options
- Export capabilities
- User preferences and settings

## Success Criteria
1. ✅ App loads without errors
2. ✅ Map displays centered on Alexandria coordinates
3. ✅ All 50 optimized batch files load successfully
4. ✅ Parcels display as visible polygons on the map
5. ✅ No TypeScript compilation errors
6. ✅ App runs on Node 24
7. ✅ Environment variables properly configured
8. ✅ Performance excellent with optimized datasets (9.33MB total)
9. ✅ Clean, maintainable code structure
