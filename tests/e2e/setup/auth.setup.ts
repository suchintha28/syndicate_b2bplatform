import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

/**
 * Auth setup — runs once before any authenticated workflow test.
 *
 * Logs in with the test user credentials from the environment, then saves
 * the full browser storage state (cookies + localStorage, which contains the
 * Supabase session) to a file. The `chromium-authenticated` project loads
 * that file so every workflow test starts already signed in.
 *
 * Required env vars (add to .env.local locally, GitHub Secrets in CI):
 *   E2E_USER_EMAIL     — email of a real Supabase account for testing
 *   E2E_USER_PASSWORD  — its password
 *   E2E_USER_ROLE      — 'seller' | 'buyer'  (used by tests to branch logic)
 *
 * If the vars are absent the file is written as an empty auth state and
 * every workflow test will skip itself gracefully.
 */

const AUTH_FILE = 'tests/e2e/.auth/user.json'

setup('authenticate test user', async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  // Ensure the directory exists regardless of whether we authenticate
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (!email || !password) {
    // Write an empty state so downstream projects don't crash on a missing file
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }))
    console.warn('[auth.setup] E2E_USER_EMAIL / E2E_USER_PASSWORD not set — writing empty auth state. Workflow tests will skip.')
    return
  }

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"], input[name="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.locator('button[type="submit"]').first().click()

  // Wait for a redirect to dashboard — confirms the login succeeded
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })

  // Persist the session (cookies + localStorage containing the Supabase token)
  await page.context().storageState({ path: AUTH_FILE })
  console.log(`[auth.setup] Saved auth state for ${email}`)
})
