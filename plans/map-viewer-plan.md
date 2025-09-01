# Alexandria Parcels Map Viewer - Project Plan

## Overview
Transform the existing Alexandria parcels splitter project into a React 19 single-page application with Mapbox integration. The app will load all 48 batch files from the data directory and display them as polygon layers on a full-screen map. The existing file splitting functionality will be moved to a `scripts/splitter/` directory while keeping all source code in the main `src/` directory.

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
   - Create utility to dynamically load all batch files from `data/` directory
   - Handle async loading of multiple large GeoJSON files
   - Implement error handling for failed loads
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
- **File Sizes**: 2-4MB each (compressed, down from 2-13MB uncompressed)
- **File Count**: Variable (optimized based on size and feature count)
- **Compression**: 60-80% size reduction achieved
- **Total Data**: Approximately 60-80MB compressed (down from 200MB+ uncompressed)

**Note**: Files have been optimized using smart splitting (large files broken into smaller chunks) and gzip compression for optimal web loading performance.

## Critical Considerations

### Performance Challenges
- **Optimized File Sizes**: Files now 2-4MB each (compressed), down from 2-13MB
- **Total Features**: Potentially millions of polygon features across optimized batches
- **Memory Usage**: Improved with smaller, compressed files
- **Loading Time**: Faster with gzip compression and optimized file sizes
- **Decompression**: Browser handles gzip decompression automatically

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
3. ✅ All 48 batch files load successfully
4. ✅ Parcels display as visible polygons on the map
5. ✅ No TypeScript compilation errors
6. ✅ App runs on Node 24
7. ✅ Environment variables properly configured
8. ✅ Performance acceptable with large datasets
9. ✅ Clean, maintainable code structure
