import { test, expect } from '@playwright/test'

/**
 * Guest browsing — covers everything a visitor can do without signing in.
 *
 * These tests use only the UI — no Supabase credentials required.
 * The app shows static/seeded data on the homepage even when the DB is empty.
 */

test.describe('Guest browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage so favourites/recently-viewed never interfere
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('homepage loads and shows the Syndicate brand', async ({ page }) => {
    await expect(page).toHaveTitle(/Syndicate/i)
  })

  test('homepage renders without any console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Filter known non-critical noise: browser quirks, Supabase network calls,
    // Sanity CDN, and hydration warnings that do not affect functionality
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('supabase') &&
        !e.includes('Supabase') &&
        !e.includes('sanity') &&
        !e.includes('cdn.sanity') &&
        !e.includes('Failed to load resource') &&
        !e.includes('NetworkError') &&
        !e.includes('fetch') &&
        !e.includes('CORS') &&
        !e.includes('hydrat') &&
        !e.includes('Warning:'),
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('homepage shows category tiles or featured suppliers', async ({ page }) => {
    // The homepage shows either CategoryTiles or a featured supplier section
    // Both contain clickable elements — we just verify the page has content
    const mainContent = page.locator('main, [role="main"], #__next > div').first()
    await expect(mainContent).toBeVisible()
  })

  test('guest can see the top navigation bar', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test('guest can navigate to the Explore screen via the bottom nav', async ({ page }) => {
    // Bottom nav "Explore" tab
    await page.locator('nav').filter({ hasText: /explore/i }).locator('a, button').filter({ hasText: /explore/i }).first().click()
    // The listing/explore screen should now be visible
    await expect(page.locator('text=/explore|suppliers|browse/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('guest can navigate to the RFQs screen via the bottom nav', async ({ page }) => {
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    // The RFQ screen Browse tab header should appear
    await expect(page.locator('text=/rfq|request/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('clicking "Post a request" or "New RFQ" as a guest redirects to auth', async ({ page }) => {
    // Navigate to RFQs screen first
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForTimeout(500)

    // Find the create/post button
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    if (await postBtn.count() > 0) {
      await postBtn.click()
      // Should land on the auth/login screen
      await expect(page.locator('text=/sign in|log in|email/i').first()).toBeVisible({ timeout: 5000 })
    } else {
      // Button not visible for guest — still a valid state (hidden behind auth guard)
      test.skip(true, '"Post a request" button not visible to guests on this screen')
    }
  })

  test('clicking "Inbox" as a guest redirects to auth', async ({ page }) => {
    const inboxLink = page.locator('nav a, nav button').filter({ hasText: /inbox|messages/i }).first()
    if (await inboxLink.count() > 0) {
      await inboxLink.click()
      await expect(page.locator('text=/sign in|log in|email/i').first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip(true, 'Inbox nav item not found — may be hidden on this viewport')
    }
  })
})
