# Alexandria Parcels Map Viewer - React Setup

## 🚀 Quick Start

### Prerequisites
- Node.js 24.x (automatically managed by nvm)
- Mapbox access token

**Note**: This project uses `.nvmrc` to automatically manage Node versions. When you `cd` into this directory, nvm will automatically switch to Node 24.

### 1. Environment Setup
Copy the environment template and add your Mapbox access token:
```bash
cp env.example .env
# Edit .env and add your Mapbox access token
```

### 2. Node Version Management
```bash
# nvm will automatically use Node 24 when you cd into this directory
cd /path/to/this/project
nvm use  # This will automatically switch to Node 24

# Or manually switch if needed
nvm use 24

# Verify the correct version
npm run node:check
```

### 3. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev:vite
```

The app will open at `http://localhost:3000`

## 🗺️ Features

- **Full-screen Mapbox map** centered on Alexandria, VA
- **Alexandria bounding box** with proper viewport constraints
- **Navigation controls** (zoom, pan, fullscreen)
- **Responsive design** optimized for all screen sizes
- **TypeScript support** with full type safety

## 🏗️ Project Structure

```
/
├── src/                    # React application source
│   ├── components/         # React components
│   │   └── MapboxMap.tsx  # Main map component
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # React entry point
│   ├── App.css            # App styles
│   └── index.css          # Global styles
├── scripts/splitter/       # File splitting functionality
├── data/                   # Optimized GeoJSON batches
├── plans/                  # Project documentation
├── vite.config.ts          # Vite configuration
└── index.html              # HTML entry point
```

## 🔧 Available Scripts

- `npm run dev:vite` - Start development server
- `npm run build:vite` - Build for production
- `npm run preview` - Preview production build
- `npm run split` - Run file splitter (legacy)
- `npm test` - Run tests

## 🗺️ Map Configuration

- **Center**: Alexandria, VA
- **Bounding Box**: 
  - Southwest: 38.79238855269405, -77.15216206049962
  - Northeast: 38.84972857510591, -77.03046456387351
- **Style**: Mapbox Light v11
- **Zoom**: 12 (default)

## 📊 Data Loading

The app is ready to load the optimized Alexandria parcels data:
- **50 compressed batches** (.geojson.gz files)
- **Total size**: 9.33MB (93.1% compression)
- **Features**: 47,174 parcel polygons
- **Format**: GeoJSON with gzip compression

## 🚧 Next Steps

1. **GeoJSON Loading**: Implement data loading from compressed files
2. **Layer Management**: Add parcel layers to the map
3. **Performance Optimization**: Implement progressive loading
4. **Property Indexing**: Add IndexedDB for parcel properties
5. **Web Workers**: Background processing for large datasets

## 🐛 Troubleshooting

### Mapbox Access Token Error
- Ensure `.env` file exists with `VITE_MAPBOX_ACCESS_TOKEN`
- Get your token from [Mapbox Account](https://account.mapbox.com/access-tokens/)

### Port Already in Use
- Change port in `vite.config.ts` or kill process using port 3000

### TypeScript Errors
- Ensure Node 24 is active: `nvm use` (automatically switches to Node 24)
- Run `npm install` to ensure all dependencies are installed

### Node Version Issues
- **Automatic switching**: `cd` into the project directory and run `nvm use`
- **Manual switching**: `nvm use 24`
- **Verify version**: `npm run node:check`
- **Install Node 24**: `npm run node:install` (if not already installed)

## 📚 Resources

- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
