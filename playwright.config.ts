import { defineConfig, devices } from '@playwright/test';
import { authFile } from './src/config/demoAuth';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/static-server.mjs',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /tests\/core\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
    {
      name: 'firefox',
      testMatch: /tests\/core\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
    },
    // Opt-in live E2E only: RUN_LIVE_E2E=1 (requires local .env; never used in default CI)
    ...(process.env.RUN_LIVE_E2E === '1'
      ? [
          {
            name: 'live-e2e',
            testMatch: /tests\/admin\/.*\.spec\.ts/,
            timeout: 15 * 60 * 1000,
          },
        ]
      : []),
  ],
});
