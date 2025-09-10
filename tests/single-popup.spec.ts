import { test, expect } from '@playwright/test';

test.describe('Single Popup Behavior', () => {
  test('should show only one popup at a time', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('/');
    
    // Wait for map to be ready
    await page.waitForSelector('#map');
    await page.waitForFunction(() => {
      return document.querySelector('#map')?.classList.contains('mapboxgl-map');
    });
    
    // Wait for parcel data to load (indicated by loading text disappearing)
    await page.waitForSelector('text=Loading Alexandria Parcels Map...', { state: 'detached', timeout: 60000 });
    
    // Wait a bit more for everything to be ready
    await page.waitForTimeout(3000);
    
    // Try clicking on the map in different areas until we get a popup
    const mapContainer = page.locator('#map');
    let popupFound = false;
    
    // Try clicking in different areas of the map
    const clickPositions = [
      { x: 0.5, y: 0.5 }, // center
      { x: 0.3, y: 0.4 }, // left-center  
      { x: 0.7, y: 0.6 }, // right-center
      { x: 0.4, y: 0.3 }, // upper-left
      { x: 0.6, y: 0.7 }, // lower-right
    ];
    
    for (const pos of clickPositions) {
      const mapBounds = await mapContainer.boundingBox();
      if (!mapBounds) continue;
      
      await mapContainer.click({ 
        position: { 
          x: mapBounds.width * pos.x, 
          y: mapBounds.height * pos.y 
        } 
      });
      
      // Wait a moment for popup to appear
      await page.waitForTimeout(1000);
      
      const popupCount = await page.locator('.mapboxgl-popup').count();
      if (popupCount > 0) {
        popupFound = true;
        break;
      }
    }
    
    // If no popup found, the test should fail with a clear message
    if (!popupFound) {
      throw new Error('Could not trigger a popup by clicking on the map. This might indicate an issue with parcel data loading or map interaction.');
    }
    
    // Verify only one popup exists
    await expect(page.locator('.mapboxgl-popup')).toHaveCount(1);
    
    // Try clicking in a different area to test single popup behavior
    const mapBounds = await mapContainer.boundingBox();
    if (mapBounds) {
      await mapContainer.click({ 
        position: { 
          x: mapBounds.width * 0.8, 
          y: mapBounds.height * 0.2 
        } 
      });
      
      // Wait for popup transition
      await page.waitForTimeout(1000);
      
      // Should still have exactly one popup
      await expect(page.locator('.mapboxgl-popup')).toHaveCount(1);
    }
  });
});