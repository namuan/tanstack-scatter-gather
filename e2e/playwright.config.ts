import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run mock-server',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: '4000',
        DELAY: '200',
        ERROR_RATE: '0',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
