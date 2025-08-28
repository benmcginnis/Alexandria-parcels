# Alexandria Parcels File Splitter

A TypeScript application to split large GeoJSON files into manageable batches for GitHub storage and efficient client-side processing.

## Project Structure

```
cursor-test/
├── rawdata/                          # Git ignored - contains source files
│   └── Alexandria_Parcels.geojson   # 130MB source file
├── data/                             # Git tracked - contains processed batches
├── plans/                            # Project planning documents
│   ├── file-splitter-plan.md        # Implementation specification
│   └── test-list.md                 # Comprehensive test list
├── src/                              # Source code
│   ├── __tests__/                   # Test files
│   └── utils/                       # Utility functions
└── .gitignore                        # Ignores rawdata/* directory
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

## Testing

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run specific test file:**
```bash
npm test -- input-validation.test.ts
```

## Development

**Run in development mode:**
```bash
npm run dev
```

**Run production build:**
```bash
npm start
```

## Current Status

- ✅ Project structure created
- ✅ Testing framework configured (Jest + TypeScript)
- ✅ First test created (Test 1.1: File existence check)
- 🔄 Implementation in progress
- ❌ Tests not yet passing

## Next Steps

1. Implement the file validation logic
2. Make Test 1.1 pass
3. Continue with remaining tests from the test list
4. Implement the complete file splitting functionality
