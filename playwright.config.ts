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
    // ── 1a. Seller auth setup ─────────────────────────────────────────────────
    // Logs in as the seller test account (E2E_USER_EMAIL) and writes
    // tests/e2e/.auth/user.json. Skips gracefully if credentials are absent.
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/,
    },

    // ── 1b. Buyer auth setup ──────────────────────────────────────────────────
    // Logs in as the buyer test account (E2E_BUYER_EMAIL) and writes
    // tests/e2e/.auth/buyer.json. Runs in parallel with the seller setup.
    {
      name: 'setup-buyer',
      testMatch: /setup\/auth\.buyer\.setup\.ts/,
    },

    // ── 2. Guest tests (smoke tests — no auth required) ───────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /setup\/|workflows\//,
    },

    // ── 3. Seller workflow tests ──────────────────────────────────────────────
    // All tests/e2e/workflows/ files that are NOT buyer-specific.
    // Starts with the seller account already signed in.
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: /workflows\/(?!buyer-)/,
      dependencies: ['setup'],
    },

    // ── 4. Buyer workflow tests ───────────────────────────────────────────────
    // Tests in tests/e2e/workflows/buyer-*.spec.ts.
    // Starts with the buyer account already signed in.
    {
      name: 'chromium-buyer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/buyer.json',
      },
      testMatch: /workflows\/buyer-/,
      dependencies: ['setup-buyer'],
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
