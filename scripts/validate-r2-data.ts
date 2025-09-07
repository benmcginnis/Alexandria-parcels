#!/usr/bin/env ts-node

// Validation script for R2 data availability
import { execSync } from 'child_process';

const BATCH_COUNT = 50;

async function validateR2Data() {
  console.log('🔍 Validating R2 data availability...\n');

  try {
    // Check if bucket exists
    console.log('1. Checking R2 bucket exists...');
    execSync('npx wrangler r2 bucket list', { stdio: 'pipe' });
    console.log('✅ R2 bucket accessible\n');

    // Check if all batch files exist
    console.log('2. Checking batch files in R2...');
    let missingFiles = 0;
    let existingFiles = 0;

    for (let i = 1; i <= BATCH_COUNT; i++) {
      const batchNum = i.toString().padStart(3, '0');
      const fileName = `alexandria_parcels_batch_${batchNum}.geojson.gz`;
      
      try {
        execSync(`npx wrangler r2 object head alexandria-parcels-data/${fileName}`, { stdio: 'pipe' });
        existingFiles++;
        if (i % 10 === 0) {
          console.log(`   Checked ${i}/${BATCH_COUNT} files...`);
        }
      } catch (error) {
        missingFiles++;
        console.log(`   ❌ Missing: ${fileName}`);
      }
    }

    console.log(`\n📊 File availability summary:`);
    console.log(`   ✅ Existing files: ${existingFiles}`);
    console.log(`   ❌ Missing files: ${missingFiles}`);
    console.log(`   📈 Coverage: ${((existingFiles / BATCH_COUNT) * 100).toFixed(1)}%`);

    if (missingFiles === 0) {
      console.log('\n🎉 All batch files are available in R2!');
    } else {
      console.log(`\n⚠️  ${missingFiles} files are missing from R2.`);
      process.exit(1);
    }

    // Test worker endpoint (if deployed)
    console.log('\n3. Testing worker endpoint...');
    try {
      const response = await fetch('https://alexandria-parcels-api.benmcginnis.workers.dev/data/alexandria_parcels_batch_001.geojson.gz');
      if (response.ok) {
        console.log('✅ Worker endpoint is responding');
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('Content-Type')}`);
        console.log(`   ETag: ${response.headers.get('ETag')}`);
        console.log(`   Cache-Control: ${response.headers.get('Cache-Control')}`);
      } else {
        console.log(`⚠️  Worker endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  Worker endpoint not accessible (may not be deployed yet)');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation
validateR2Data().catch(console.error);
