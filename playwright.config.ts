import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // ── 1. Auth setup ─────────────────────────────────────────────────────────
    // Runs first. Logs in once and writes tests/e2e/.auth/user.json.
    // If credentials are absent it writes an empty state file so
    // downstream projects still start without crashing.
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/,
    },

    // ── 2. Guest tests (existing smoke tests) ─────────────────────────────────
    // No authentication required. Runs in parallel with setup.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /setup\/|workflows\//,
    },

    // ── 3. Authenticated workflow tests ───────────────────────────────────────
    // Loads the saved session from step 1. All tests in tests/e2e/workflows/
    // start with the browser already signed in.
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /workflows\//,
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
