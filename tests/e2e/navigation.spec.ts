import { test, expect } from '@playwright/test'

/**
 * Navigation — verifies that the app navigation works correctly on both
 * desktop and mobile viewports. Tests the bottom nav tabs and top nav logo.
 *
 * These tests are guest-only — no sign-in required.
 */

test.describe('Desktop navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('the logo is visible in the top nav', async ({ page }) => {
    const logo = page.locator('nav img, nav [class*="logo"], nav [class*="brand"]').first()
    await expect(logo).toBeVisible()
  })

  test('clicking the logo navigates back to the home screen', async ({ page }) => {
    // Go to a different screen first
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(300)
    // Click logo to return home
    await page.locator('nav img, nav a[href="/"], nav [class*="logo"]').first().click()
    // Home screen content should appear
    await expect(page.locator('text=/featured|suppliers|welcome|marketplace/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('bottom nav Home tab navigates to the home screen', async ({ page }) => {
    // Navigate away first
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(300)
    // Now click Home in bottom nav
    await page.locator('nav a, nav button').filter({ hasText: /home/i }).first().click()
    await expect(page.locator('text=/featured|home|discover/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('bottom nav Explore tab navigates to the listing/explore screen', async ({ page }) => {
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    // The Explore screen shows a search input and supplier listings
    await expect(page.locator('input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]').first()).toBeVisible({ timeout: 5000 })
  })

  test('bottom nav RFQs tab navigates to the RFQs screen', async ({ page }) => {
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await expect(page.locator('text=/rfq|request for quote|browse/i').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Mobile navigation (375px viewport)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('the bottom navigation bar is visible on mobile', async ({ page }) => {
    // Mobile bottom nav should be present
    const bottomNav = page.locator('nav').last()
    await expect(bottomNav).toBeVisible()
  })

  test('Home tab is visible and clickable on mobile', async ({ page }) => {
    const homeTab = page.locator('nav a, nav button').filter({ hasText: /home/i }).first()
    await expect(homeTab).toBeVisible()
    await expect(homeTab).toBeEnabled()
  })

  test('Explore tab is visible and clickable on mobile', async ({ page }) => {
    const exploreTab = page.locator('nav a, nav button').filter({ hasText: /explore/i }).first()
    await expect(exploreTab).toBeVisible()
    await expect(exploreTab).toBeEnabled()
  })

  test('RFQs tab is visible and clickable on mobile', async ({ page }) => {
    const rfqTab = page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first()
    await expect(rfqTab).toBeVisible()
    await expect(rfqTab).toBeEnabled()
  })

  test('Profile/Account tab is visible on mobile', async ({ page }) => {
    const profileTab = page.locator('nav a, nav button').filter({ hasText: /profile|account/i }).first()
    await expect(profileTab).toBeVisible()
  })

  test('no nav items overflow off screen on mobile', async ({ page }) => {
    const nav = page.locator('nav').last()
    const navBox = await nav.boundingBox()
    if (navBox) {
      expect(navBox.width).toBeLessThanOrEqual(375)
    }
  })
})
