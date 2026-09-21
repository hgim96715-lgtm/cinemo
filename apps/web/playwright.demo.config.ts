import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.DEMO_BASE_URL ?? 'https://cinemo-six.vercel.app';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'demo-traffic.spec.ts',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 1,
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      'x-cinemo-traffic-type': 'synthetic-demo',
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 17 Pro'] },
    },
  ],
});
