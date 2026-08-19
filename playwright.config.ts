import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    }
  ],
  // Form tests are emulator-only (see tests/forms.spec.ts). When
  // VITE_FIREBASE_EMULATOR is set, boot a server built against the local
  // emulators and reuse it if one is already listening.
  webServer: process.env.VITE_FIREBASE_EMULATOR
    ? {
        command: 'VITE_FIREBASE_EMULATOR=1 npm run build:ssr && npm run preview',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
      }
    : undefined,
});