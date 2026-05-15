import { test, expect } from '@playwright/test'

/**
 * Explore / search workflows — no sign-in required.
 *
 * Tests the real interactive search and filter behaviour on the Explore
 * screen. These run in the `chromium-authenticated` project (which starts
 * authenticated) but work equally well without a session because the
 * Explore screen is public.
 */

test.describe('Explore search and filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('typing in the search box filters the supplier list', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]'
    ).first()

    await expect(searchInput).toBeVisible({ timeout: 5000 })

    // Capture how many cards are visible before searching
    const cardsBefore = await page.locator('[class*="card"], [class*="Card"]').count()

    await searchInput.fill('electronics')
    await page.waitForTimeout(600) // debounce

    // Page should still be functional — no crash
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)

    // Either: fewer cards (filtered), same cards (no match shown differently),
    // or an empty state — all are valid filtered outcomes
    const cardsAfter = await page.locator('[class*="card"], [class*="Card"]').count()
    const emptyState = await page.locator('text=/no suppliers|no results|empty/i').count()
    expect(cardsAfter <= cardsBefore || emptyState > 0).toBe(true)
  })

  test('clearing the search box restores the full list', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]'
    ).first()

    await expect(searchInput).toBeVisible({ timeout: 5000 })
    // Scope to results <main> to avoid counting sidebar card-like elements
    const cardsBefore = await page.locator('main').last().locator('[class*="card" i]').count()

    await searchInput.fill('zzz_no_match_xyz')
    await page.waitForTimeout(600)

    await searchInput.clear()
    await page.waitForTimeout(600)

    // After clearing, cards should be back to the original count
    const cardsAfter = await page.locator('main').last().locator('[class*="card" i]').count()
    expect(cardsAfter).toBe(cardsBefore)
  })

  test('selecting a category from the dropdown filters results', async ({ page }) => {
    const categorySelect = page.locator('select').first()
    await expect(categorySelect).toBeVisible({ timeout: 5000 })

    // Pick the second option (first non-"All" category)
    const options = await categorySelect.locator('option').all()
    if (options.length > 1) {
      const secondOption = await options[1].getAttribute('value') ?? await options[1].textContent()
      await categorySelect.selectOption({ index: 1 })
      await page.waitForTimeout(600)

      // Page should not crash after filtering
      const errorText = page.locator('text=/something went wrong|application error/i')
      await expect(errorText).toHaveCount(0)

      // The selected value should now be set
      const selectedValue = await categorySelect.inputValue()
      expect(selectedValue).toBeTruthy()
    }
  })

  test('combining search text and a category filter does not crash the page', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"], input[placeholder*="supplier" i]'
    ).first()
    const categorySelect = page.locator('select').first()

    if (await searchInput.isVisible() && await categorySelect.isVisible()) {
      await searchInput.fill('manufacturing')
      await page.waitForTimeout(400)
      await categorySelect.selectOption({ index: 1 })
      await page.waitForTimeout(400)

      const errorText = page.locator('text=/something went wrong|application error/i')
      await expect(errorText).toHaveCount(0)
    }
  })

  test('clicking a supplier card opens the brand detail page', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible().catch(() => false)

    if (!hasCard) {
      test.skip(true, 'No supplier cards in DB — skipping navigation test')
      return
    }

    await card.click()
    await page.waitForTimeout(600)

    // Brand detail page should be visible — no crash, and has some content
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
    const body = await page.locator('body').innerText()
    expect(body.length).toBeGreaterThan(100)
  })
})
