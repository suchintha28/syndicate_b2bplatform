import { test, expect } from '@playwright/test'

/**
 * Buyer-role workflow tests.
 *
 * These run in the `chromium-buyer` Playwright project, which loads
 * tests/e2e/.auth/buyer.json — the saved session for the buyer test account
 * (e2e_buyer@syndicate-test.dev).
 *
 * Covers:
 *   • Buyer dashboard loads correctly
 *   • Buyer can browse Explore and view a supplier
 *   • Buyer can post an RFQ
 *   • Buyer can open the messages / inbox screen
 */

const SKIP_REASON = 'E2E_BUYER_EMAIL not set — skipping buyer workflow tests'
const RUN_ID = Date.now().toString().slice(-6)

// ── Helper: skip if buyer credentials not configured ──────────────────────────
function skipIfNoBuyer() {
  if (!process.env.E2E_BUYER_EMAIL) {
    test.skip(true, SKIP_REASON)
  }
}

// ── Buyer dashboard ───────────────────────────────────────────────────────────
test.describe('Buyer dashboard', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoBuyer()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('buyer reaches dashboard without being redirected to login', async ({ page }) => {
    // Should stay on /dashboard, not bounce back to /login
    await expect(page).not.toHaveURL(/login/, { timeout: 6_000 })
  })

  test('buyer dashboard shows buyer-relevant navigation links', async ({ page }) => {
    // Buyer should see Explore / RFQs / Messages — not "Manage products"
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 6_000 })

    const exploreLink = nav.locator('a, button').filter({ hasText: /explore/i }).first()
    await expect(exploreLink).toBeVisible({ timeout: 6_000 })
  })
})

// ── Browse Explore as buyer ───────────────────────────────────────────────────
test.describe('Buyer explores supplier listings', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoBuyer()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('explore page loads supplier cards', async ({ page }) => {
    // Page should show at least one supplier card or an empty-state message
    const card       = page.locator('[class*="card"], [class*="Card"]').first()
    const emptyState = page.locator('text=/no suppliers|no results|be the first/i').first()
    const hasCard    = await card.isVisible({ timeout: 8_000 }).catch(() => false)
    const hasEmpty   = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })

  test('buyer can click a supplier card and view their profile page', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible({ timeout: 8_000 }).catch(() => false)

    if (!hasCard) {
      test.skip(true, 'No supplier cards in DB — skipping')
      return
    }

    await card.click()
    await page.waitForTimeout(600)

    // Should be on a brand/supplier detail screen — look for a heading or about section
    const heading    = page.locator('h1, h2').first()
    const aboutBlock = page.locator('text=/about|overview|contact/i').first()
    const isDetail   = await heading.isVisible({ timeout: 6_000 }).catch(() => false)
                    || await aboutBlock.isVisible().catch(() => false)
    expect(isDetail).toBe(true)
  })
})

// ── Buyer posts an RFQ ────────────────────────────────────────────────────────
test.describe('Buyer posts a request for quote (RFQ)', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoBuyer()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('"Post a request" button is visible for buyer', async ({ page }) => {
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    await expect(postBtn).toBeVisible({ timeout: 6_000 })
  })

  test('buyer can fill and submit an RFQ without error', async ({ page }) => {
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    const hasBtn  = await postBtn.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!hasBtn) {
      test.skip(true, '"Post a request" button not found')
      return
    }

    await postBtn.click()
    await page.waitForTimeout(500)

    // Subject / title
    const subjectField = page.locator(
      'input[placeholder*="subject" i], input[placeholder*="looking for" i]'
    ).first()
    if (await subjectField.isVisible().catch(() => false)) {
      await subjectField.fill(`Buyer E2E RFQ ${RUN_ID} — Please ignore`)
    }

    // Message / description
    const messageField = page.locator('textarea').first()
    if (await messageField.isVisible().catch(() => false)) {
      await messageField.fill('Automated buyer E2E test. Please ignore and delete.')
    }

    // Category (if present)
    const categorySelect = page.locator('select').first()
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.selectOption({ index: 1 })
    }

    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|post|send/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(2_000)
    }

    // No application-level crash
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })
})

// ── Buyer inbox ───────────────────────────────────────────────────────────────
test.describe('Buyer messages / inbox', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoBuyer()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('buyer can reach the messages / inbox screen', async ({ page }) => {
    const msgLink = page.locator('nav a, nav button').filter({ hasText: /message|inbox/i }).first()
    const hasLink = await msgLink.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!hasLink) {
      test.skip(true, 'No messages link in nav')
      return
    }

    await msgLink.click()
    await page.waitForLoadState('networkidle')

    // Inbox should show conversations, an empty state, or a heading — never a blank screen
    const convItem   = page.locator('[class*="conversation"], [class*="thread"], [class*="card"]').first()
    const emptyState = page.locator('text=/no messages|no conversations|start a conversation|inbox/i').first()
    const heading    = page.locator('h1, h2').filter({ hasText: /message|inbox/i }).first()
    const hasConv    = await convItem.isVisible({ timeout: 8_000 }).catch(() => false)
    const hasEmpty   = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasHeading = await heading.isVisible({ timeout: 3_000 }).catch(() => false)
    expect(hasConv || hasEmpty || hasHeading).toBe(true)
  })
})
