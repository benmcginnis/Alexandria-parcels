import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  // Set environment variables for tests
  env: {
    VITE_MAPBOX_ACCESS_TOKEN: process.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.test',
    VITE_API_BASE_URL: 'http://localhost:8787/data',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Automatically start the required servers before tests
  webServer: [
    // Start the Worker dev server
    {
      command: 'npm run dev:worker',
      port: 8787,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
    // Start the React app server
    {
      command: 'cd dist/client && python3 -m http.server 8081',
      port: 8081,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
  ],
});
