#!/bin/bash

# Setup script for local development with persistent R2 data
# This script uploads GeoJSON batch files to Wrangler's local R2 simulation

set -e

echo "🚀 Setting up local development environment..."

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "❌ Error: data directory not found"
    echo "💡 Please ensure you have GeoJSON batch files in the data/ directory"
    exit 1
fi

# Count total files
total_files=$(ls data/*.geojson.gz 2>/dev/null | wc -l)
if [ "$total_files" -eq 0 ]; then
    echo "❌ Error: No .geojson.gz files found in data directory"
    echo "💡 Please run the file splitter first to generate batch files"
    exit 1
fi

echo "📁 Found $total_files batch files in data directory"
echo "📤 Uploading data to local R2 bucket..."

# Upload each file to local R2 bucket
uploaded=0
failed=0

for file in data/*.geojson.gz; do
    filename=$(basename "$file")
    echo "📤 Uploading $filename..."
    
    if npx wrangler r2 object put "alexandria-parcels-data/$filename" --file "$file" --local --persist-to ./local-storage; then
        echo "✅ Successfully uploaded $filename"
        ((uploaded++))
    else
        echo "❌ Failed to upload $filename"
        ((failed++))
    fi
done

echo ""
echo "📊 Upload Summary:"
echo "   ✅ Successfully uploaded: $uploaded files"
echo "   ❌ Failed uploads: $failed files"
echo "   📁 Total files: $total_files"

if [ "$failed" -eq 0 ]; then
    echo ""
    echo "🎉 Local development environment is ready!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Run 'npm run dev:worker' to start the Worker dev server"
    echo "   2. Run 'npm run dev:vite' to start the React dev server"
    echo "   3. Or run 'npx playwright test' to run the tests"
    echo ""
    echo "📝 Note: Data will persist in the ./local-storage directory across sessions"
else
    echo "⚠️  Some files failed to upload. Please check the errors above."
    exit 1
fi
