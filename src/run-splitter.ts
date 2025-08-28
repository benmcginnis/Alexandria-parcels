import { FeatureSplitter, SplitterConfig } from './utils/feature-splitter';

async function main() {
  console.log('🚀 Starting Alexandria Parcels Feature Splitting Process...\n');
  
  const config: SplitterConfig = {
    inputFile: 'rawdata/Alexandria_Parcels.geojson',
    outputDir: 'data/',
    batchSize: 1000,
    coordinatePrecision: 6,
    clearOutput: true // Clear existing output before processing
  };
  
  console.log('📋 Configuration:');
  console.log(`   Input File: ${config.inputFile}`);
  console.log(`   Output Directory: ${config.outputDir}`);
  console.log(`   Batch Size: ${config.batchSize} features`);
  console.log(`   Coordinate Precision: ${config.coordinatePrecision} decimal places`);
  console.log(`   Clear Output: ${config.clearOutput}\n`);
  
  try {
    const splitter = new FeatureSplitter(config);
    
    console.log('⏳ Processing features...');
    const startTime = Date.now();
    
    const result = await splitter.run();
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000; // Convert to seconds
    
    console.log('\n✅ Feature splitting completed successfully!');
    console.log('\n📊 Results:');
    console.log(`   Total Features Processed: ${result.totalFeatures.toLocaleString()}`);
    console.log(`   Total Batches Created: ${result.totalBatches}`);
    console.log(`   Processing Time: ${processingTime.toFixed(2)} seconds`);
    console.log(`   Average Speed: ${(result.totalFeatures / processingTime).toFixed(0)} features/second`);
    
    console.log('\n📁 Generated Files:');
    result.batches.forEach(batch => {
      console.log(`   ${batch.filename} (${batch.featureCount} features, OBJECTID ${batch.objectIdRange[0]}-${batch.objectIdRange[1]})`);
    });
    
    console.log(`\n📂 Output directory: ${config.outputDir}`);
    console.log('🎉 Ready for use in your React app!');
    
  } catch (error) {
    console.error('\n❌ Feature splitting failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
