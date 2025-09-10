#!/bin/bash

# Complete setup and test script
# This ensures everything is built and set up in the correct order

set -e

echo "🚀 Setting up complete test environment..."

# 1. Build Worker
echo "🔨 Building Worker..."
npm run build:worker

# 2. Build React app
echo "🔨 Building React app..."
VITE_API_BASE_URL=http://localhost:8787/data npm run build:vite

# 3. Setup local data (only if not already present)
echo "📦 Checking local data..."
if [ ! -d "local-storage/v3/r2/alexandria-parcels-data/blobs" ] || [ -z "$(ls -A local-storage/v3/r2/alexandria-parcels-data/blobs 2>/dev/null)" ]; then
    echo "📤 No persisted data found, uploading..."
    npm run setup:local-dev
else
    echo "✅ Found persisted data, skipping upload"
fi

echo "✅ Setup complete! Starting tests..."
echo ""

# 4. Run tests
npx playwright test
