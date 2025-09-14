import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'https://alexandria-parcels.pages.dev',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    // Set environment variables for tests
    extraHTTPHeaders: {
      'X-VITE-MAPBOX-ACCESS-TOKEN': process.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.test',
      'X-VITE-API-BASE-URL': 'https://alexandria-parcels-api.mcginnisb.workers.dev/data',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer needed for production tests
});
