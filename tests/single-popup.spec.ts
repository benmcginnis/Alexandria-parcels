import { test, expect } from '@playwright/test';

test.describe('Single Popup Behavior', () => {
  test('should show only one popup at a time', async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('/');
    console.log('Page loaded');
    
    // Check if map container exists
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    console.log('Map container found');
    
    // Wait for map to load and parcel data to be ready
    // We'll wait for the loading text to disappear, which indicates both map and data are loaded
    await page.waitForSelector('text=Loading Alexandria Parcels Map...', { state: 'detached', timeout: 60000 });
    console.log('Map and parcel data loaded');
    
    // Wait a bit more for everything to be ready
    await page.waitForTimeout(3000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'playwright-report/debug-map-loaded.png' });
    

    // Click first location (try to click on a parcel)
    console.log('Clicking first location...');
    await mapContainer.click({ position: { x: 400, y: 300 } });
    
    // Wait for popup to appear
    await page.waitForSelector('.mapboxgl-popup', { timeout: 10000 });
    console.log('First popup appeared');
    
    // Wait a bit to ensure popup is fully rendered
    await page.waitForTimeout(1000);
    
    // Count popups before taking screenshot
    const firstPopups = page.locator('.mapboxgl-popup');
    const firstPopupCount = await firstPopups.count();
    console.log(`First popup count: ${firstPopupCount}`);
    await expect(firstPopups).toHaveCount(1);
    console.log('Verified one popup exists');
    
    // Take screenshot of first popup
    await page.screenshot({ path: 'playwright-report/debug-first-popup.png' });
    console.log('First screenshot taken');
    
    // Click second location (far enough away from the 500px wide popup)
    console.log('Clicking second location...');
    await mapContainer.click({ position: { x: 800, y: 600 } });
    
    // Wait for popup transition and check multiple times
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
      const currentPopups = page.locator('.mapboxgl-popup');
      const currentCount = await currentPopups.count();
      console.log(`After second click, iteration ${i + 1}: ${currentCount} popups`);
      
      if (currentCount > 1) {
        console.log('❌ MULTIPLE POPUPS DETECTED!');
        break;
      }
    }
    
    // Final count
    const secondPopups = page.locator('.mapboxgl-popup');
    const secondPopupCount = await secondPopups.count();
    console.log(`Final popup count: ${secondPopupCount}`);
    await expect(secondPopups).toHaveCount(1);
    console.log('Verified still only one popup exists');
    
    // Take screenshot of second popup
    await page.screenshot({ path: 'playwright-report/debug-second-popup.png' });
    console.log('Second screenshot taken');
    
    console.log('Test completed successfully');
  });
});
