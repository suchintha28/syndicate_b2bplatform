import { test, expect } from '@playwright/test'

/**
 * Marketplace screens — verifies the core browsing experience loads correctly.
 *
 * These are smoke tests: they confirm each screen renders without crashing
 * and the key UI elements are present. No sign-in required.
 */

// ---------------------------------------------------------------------------
// Helper — reads the "Showing N suppliers" counter from the results <main>
// and returns N (0 if absent or not yet loaded).
// ---------------------------------------------------------------------------
async function getSupplierCount(page: import('@playwright/test').Page): Promise<number> {
  try {
    const text = await page
      .locator('text=/showing \\d+ supplier/i')
      .first()
      .textContent({ timeout: 8000 })
    const match = text?.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  } catch {
    return 0
  }
}

// Helper — returns the first supplier result card.
//
// DOM structure of ExploreScreen:
//   <main>  ← outer page shell
//     <aside>
//       <div class="card"> ← filter sidebar (NOT a supplier card)
//     </aside>
//     <main>  ← inner results area (second <main>, matched by .last())
//       <article class="card card-hover ..."> ← actual supplier cards
//     </main>
//   </main>
//
// We use `page.locator('main').last()` to target the inner results <main>,
// then `article.card` to match only <article> elements (supplier cards),
// which excludes the sidebar <div class="card"> inside <aside>.
function firstSupplierCard(page: import('@playwright/test').Page) {
  return page.locator('main').last().locator('article.card').first()
}

// ---------------------------------------------------------------------------

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('homepage loads and has visible content', async ({ page }) => {
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
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
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
    const categorySelect = page.locator('select').first()
    await expect(categorySelect).toBeVisible({ timeout: 5000 })
  })

  test('at least one supplier card or empty state is shown', async ({ page }) => {
    const count = await getSupplierCount(page)
    if (count > 0) {
      const card = firstSupplierCard(page)
      await expect(card).toBeVisible({ timeout: 8000 })
    } else {
      const emptyState = page.locator('text=/no suppliers|no results|empty|no.*match|0 suppliers/i').first()
      await expect(emptyState).toBeVisible({ timeout: 8000 })
    }
  })

  test('typing in the search box does not crash the page', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]',
    ).first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('electronics')
      await page.waitForTimeout(500)
      const errorText = page.locator('text=/something went wrong|application error/i')
      await expect(errorText).toHaveCount(0)
    }
  })
})

test.describe('Supplier (brand) detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('opening a supplier card loads the brand detail page without an error', async ({ page }) => {
    const count = await getSupplierCount(page)
    if (count === 0) {
      test.skip(true, 'No supplier cards in the database — skipping')
      return
    }
    await firstSupplierCard(page).click()
    await page.waitForLoadState('networkidle')
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })

  test('brand detail page shows a Reviews section', async ({ page }) => {
    const count = await getSupplierCount(page)
    if (count === 0) {
      test.skip(true, 'No supplier cards in the database — skipping')
      return
    }
    await firstSupplierCard(page).click()
    await page.waitForLoadState('networkidle')
    const reviewsHeading = page.locator('text=/reviews/i').first()
    await expect(reviewsHeading).toBeVisible({ timeout: 6000 })
  })

  test('"Write a review" button is visible on the brand detail page', async ({ page }) => {
    const count = await getSupplierCount(page)
    if (count === 0) {
      test.skip(true, 'No supplier cards in the database — skipping')
      return
    }
    await firstSupplierCard(page).click()
    await page.waitForLoadState('networkidle')
    const writeReviewBtn = page.locator('button').filter({ hasText: /write a review/i }).first()
    await expect(writeReviewBtn).toBeVisible({ timeout: 6000 })
  })
})

test.describe('Product detail page', () => {
  test('product detail page at /products/[slug] loads without a server error', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')

    const count = await getSupplierCount(page)
    if (count === 0) {
      test.skip(true, 'No supplier cards to navigate through')
      return
    }
    await firstSupplierCard(page).click()
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('button, a').filter({ hasText: /view/i }).first()
    if (!await productLink.isVisible().catch(() => false)) {
      test.skip(true, 'No products listed on this supplier page')
      return
    }
    await productLink.click()
    await page.waitForLoadState('networkidle')

    const errorText = page.locator('text=/something went wrong|application error|An error occurred/i')
    await expect(errorText).toHaveCount(0)
  })

  test('product detail page shows a Customer reviews section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')

    const count = await getSupplierCount(page)
    if (count === 0) {
      test.skip(true, 'No supplier cards available')
      return
    }
    await firstSupplierCard(page).click()
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('button, a').filter({ hasText: /view/i }).first()
    if (!await productLink.isVisible().catch(() => false)) {
      test.skip(true, 'No products on this supplier page')
      return
    }
    await productLink.click()
    await page.waitForLoadState('networkidle')

    const reviewsSection = page.locator('text=/customer reviews|reviews/i').first()
    await expect(reviewsSection).toBeVisible({ timeout: 6000 })
  })
})

test.describe('RFQs screen — Browse tab (guest accessible)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('RFQs screen loads without an error message', async ({ page }) => {
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })

  test('an "Open requests" tab is visible', async ({ page }) => {
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
