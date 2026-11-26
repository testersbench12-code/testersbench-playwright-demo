import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node scripts/static-server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  // Keep the live Freya E2E available but give it a longer timeout via file override below.
  projects: [
    {
      name: 'local-core',
      testMatch: /tests\/core\/.*\.spec\.ts/,
    },
    // Opt-in: set RUN_LIVE_E2E=1 to include the Freya woman register/approve E2E
    // (needs network + Outlook profile). Existing file is unchanged.
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
