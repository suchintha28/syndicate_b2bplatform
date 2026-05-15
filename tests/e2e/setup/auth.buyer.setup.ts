import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

/**
 * Buyer auth setup — runs once before any buyer-role workflow test.
 *
 * Logs in with the E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD credentials and saves
 * a separate storage-state file for the buyer account. The
 * `chromium-buyer` Playwright project loads this file so buyer-specific
 * tests (RFQ submissions, messaging a seller, etc.) start pre-authenticated.
 *
 * Required env vars (add to .env.local locally, GitHub Secrets in CI):
 *   E2E_BUYER_EMAIL    — email of the buyer test account
 *   E2E_BUYER_PASSWORD — its password
 *
 * If the vars are absent the file is written as empty and tests skip gracefully.
 */

const AUTH_FILE = 'tests/e2e/.auth/buyer.json'

setup('authenticate buyer test user', async ({ page }) => {
  const email    = process.env.E2E_BUYER_EMAIL
  const password = process.env.E2E_BUYER_PASSWORD

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (!email || !password) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }))
    console.warn('[auth.buyer.setup] E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD not set — writing empty auth state. Buyer workflow tests will skip.')
    return
  }

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"], input[name="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.locator('button[type="submit"]').first().click()

  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_FILE })
  console.log(`[auth.buyer.setup] Saved buyer auth state for ${email}`)
})
