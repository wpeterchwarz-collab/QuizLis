import { defineConfig, devices } from '@playwright/test';

/* Oberflächentests im iPhone-Format. Lokal: Chromium. In GitHub Actions zusätzlich WebKit (= Safari-Engine). */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173/', trace: 'retain-on-failure', locale: 'de-DE' },
  webServer: { command: 'node tests/serve.mjs 4173', url: 'http://localhost:4173/', reuseExistingServer: true },
  projects: [
    { name: 'iphone-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
    ...(process.env.CI ? [{ name: 'iphone-webkit', use: { ...devices['iPhone 13'] } }] : []),
  ],
});
