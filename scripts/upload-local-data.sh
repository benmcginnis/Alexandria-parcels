#!/bin/bash

# Script to upload all GeoJSON batch files to local R2 bucket for development
# This uses wrangler's --local flag to upload to the local R2 simulation

set -e

echo "🚀 Uploading GeoJSON batch files to local R2 bucket..."

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "❌ Error: data directory not found"
    exit 1
fi

# Count total files
total_files=$(ls data/*.geojson.gz 2>/dev/null | wc -l)
if [ "$total_files" -eq 0 ]; then
    echo "❌ Error: No .geojson.gz files found in data directory"
    exit 1
fi

echo "📁 Found $total_files batch files to upload"

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
    echo "🎉 All files uploaded successfully to local R2 bucket!"
    echo "💡 You can now run 'npm run dev:worker' to start development with local data"
else
    echo "⚠️  Some files failed to upload. Please check the errors above."
    exit 1
fi
