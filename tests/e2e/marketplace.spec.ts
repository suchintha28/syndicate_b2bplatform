import { test, expect } from '@playwright/test'

/**
 * Marketplace screens — verifies the core browsing experience loads correctly.
 *
 * These are smoke tests: they confirm each screen renders without crashing
 * and the key UI elements are present. No sign-in required.
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('homepage loads and has visible content', async ({ page }) => {
    // The page should have rendered something meaningful — not a blank screen
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(50)
  })

  test('homepage title contains "Syndicate"', async ({ page }) => {
    await expect(page).toHaveTitle(/Syndicate/i)
  })

  test('homepage does not show an uncaught error boundary message', async ({ page }) => {
    const errorText = page.locator('text=/something went wrong|application error|unhandled exception/i')
    await expect(errorText).toHaveCount(0)
  })

  test('homepage renders a main content area', async ({ page }) => {
    const content = page.locator('main, [role="main"], #__next').first()
    await expect(content).toBeVisible()
  })
})

test.describe('Explore / Listing screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Navigate to the Explore screen
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(500)
  })

  test('Explore screen loads without an error message', async ({ page }) => {
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })

  test('a search input is visible on the Explore screen', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i], input[placeholder*="browse" i]',
    ).first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })
  })

  test('category filter dropdown is visible', async ({ page }) => {
    // Explore screen uses a <select> dropdown for categories with "All Industries" as default
    const categorySelect = page.locator('select').first()
    await expect(categorySelect).toBeVisible({ timeout: 5000 })
  })

  test('at least one supplier card or empty state is shown', async ({ page }) => {
    // Either supplier cards are shown, or an empty state message
    const supplierCard = page.locator('[class*="card"], [class*="Card"]').first()
    const emptyState = page.locator('text=/no suppliers|no results|empty/i').first()
    const hasCard = await supplierCard.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })

  test('typing in the search box does not crash the page', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]',
    ).first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('electronics')
      await page.waitForTimeout(500)
      // Page should still be functional — no crash
      const errorText = page.locator('text=/something went wrong|application error/i')
      await expect(errorText).toHaveCount(0)
    }
  })
})

test.describe('Supplier (brand) detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Navigate to Explore, then open the first supplier card
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(600)
  })

  test('opening a supplier card loads the brand detail page without an error', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible().catch(() => false)
    if (!hasCard) {
      test.skip(true, 'No supplier cards available to click')
      return
    }
    await card.click()
    await page.waitForTimeout(600)
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })

  test('brand detail page shows a Reviews section', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible().catch(() => false)
    if (!hasCard) {
      test.skip(true, 'No supplier cards available to click')
      return
    }
    await card.click()
    await page.waitForTimeout(600)
    const reviewsHeading = page.locator('text=/reviews/i').first()
    await expect(reviewsHeading).toBeVisible({ timeout: 6000 })
  })

  test('"Write a review" button is visible on the brand detail page', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible().catch(() => false)
    if (!hasCard) {
      test.skip(true, 'No supplier cards available to click')
      return
    }
    await card.click()
    await page.waitForTimeout(600)
    const writeReviewBtn = page.locator('button').filter({ hasText: /write a review/i }).first()
    await expect(writeReviewBtn).toBeVisible({ timeout: 6000 })
  })
})

test.describe('Product detail page', () => {
  test('product detail page at /products/[slug] loads without a server error', async ({ page }) => {
    // Navigate to Explore, open a supplier, then click a product
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(600)

    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible().catch(() => false)
    if (!hasCard) {
      test.skip(true, 'No supplier cards to navigate through')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    // Look for a product card or "View" link inside the supplier page
    const productLink = page.locator('button, a').filter({ hasText: /view/i }).first()
    const hasProduct = await productLink.isVisible().catch(() => false)
    if (!hasProduct) {
      test.skip(true, 'No products listed on this supplier page')
      return
    }
    await productLink.click()
    await page.waitForTimeout(800)

    const errorText = page.locator('text=/something went wrong|application error|An error occurred/i')
    await expect(errorText).toHaveCount(0)
  })

  test('product detail page shows a Customer reviews section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForTimeout(600)

    const card = page.locator('[class*="card"], [class*="Card"]').first()
    if (!await card.isVisible().catch(() => false)) {
      test.skip(true, 'No supplier cards available')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const productLink = page.locator('button, a').filter({ hasText: /view/i }).first()
    if (!await productLink.isVisible().catch(() => false)) {
      test.skip(true, 'No products on this supplier page')
      return
    }
    await productLink.click()
    await page.waitForTimeout(800)

    const reviewsSection = page.locator('text=/customer reviews/i').first()
    await expect(reviewsSection).toBeVisible({ timeout: 6000 })
  })
})

test.describe('RFQs screen — Browse tab (guest accessible)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForTimeout(500)
  })

  test('RFQs screen loads without an error message', async ({ page }) => {
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })

  test('an "Open requests" tab is visible', async ({ page }) => {
    // The RFQs screen Browse tab label is "Open requests"
    const browseEl = page.locator('button').filter({ hasText: 'Open requests' }).first()
    await expect(browseEl).toBeVisible({ timeout: 5000 })
  })

  test('RFQ screen shows request cards or an empty state', async ({ page }) => {
    const rfqCard = page.locator('[class*="card"], [class*="Card"]').first()
    const emptyState = page.locator('text=/no requests|no rfqs|empty|be the first/i').first()
    const hasCard = await rfqCard.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })
})
