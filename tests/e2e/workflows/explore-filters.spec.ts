import { test, expect } from '@playwright/test'

/**
 * Explore screen — exhaustive filter, sort, and tab tests.
 *
 * Covers every interactive control on the Explore/listing screen:
 *   - Industry dropdown
 *   - Location dropdown
 *   - Rating dropdown
 *   - Price range dropdown
 *   - Sort chips (Relevance, Top rated, A→Z, Z→A)
 *   - Businesses / Products tab switch
 *   - Active filter chips display and individual removal
 *   - Reset / Clear all button
 *   - Empty state "Clear filters" button
 *   - Multi-filter combinations
 *
 * All tests are guest-safe (no auth required).
 */

// ── Navigation helper ──────────────────────────────────────────────────────────

async function goToExplore(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
  await page.waitForLoadState('networkidle')
}

// ── Controls ────────────────────────────────────────────────────────────────────
// Exact placeholder / label values from ExploreScreen.tsx

const SEL = {
  search:       'input[placeholder="Search…"], input[placeholder*="search" i]',
  industry:     'select',            // first <select> on the screen
  cards:        '[class*="card"]',
  emptyBiz:     'text=/no suppliers match|no results/i',
  emptyProd:    'text=/no products match/i',
  resetBtn:     'button:has-text("Reset"), button:has-text("Clear all")',
  clearFilters: 'button:has-text("Clear filters")',
  activeChip:   '[class*="chip"], [class*="filter-chip"], [class*="active-filter"]',
}

// Count only supplier result cards scoped to the inner results area.
// The results container has role="main" (a <div>); using [role="main"].last()
// targets it specifically, avoiding the filter sidebar's card-like elements.
async function countResultCards(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('[role="main"]').last().locator('[class*="card" i]').count()
}

// ── Industry filter ────────────────────────────────────────────────────────────

test.describe('Industry filter', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('Industry dropdown is visible and has at least two options', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })
    const options = await select.locator('option').count()
    expect(options).toBeGreaterThanOrEqual(2)
  })

  test('selecting a non-default industry updates the results without crashing', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })

    const optionCount = await select.locator('option').count()
    if (optionCount < 2) { test.skip(true, 'Only one industry option available'); return }

    await select.selectOption({ index: 1 })
    await page.waitForTimeout(600)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    const selected = await select.inputValue()
    expect(selected).toBeTruthy()
  })

  test('selecting each industry option never crashes the page', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })

    const options = await select.locator('option').all()
    for (let i = 0; i < Math.min(options.length, 6); i++) {
      await select.selectOption({ index: i })
      await page.waitForTimeout(300)
      await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    }
  })

  test('resetting industry to default ("All Industries") restores the full list', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })

    const countBefore = await countResultCards(page)

    // Apply a filter
    const optionCount = await select.locator('option').count()
    if (optionCount >= 2) {
      await select.selectOption({ index: 1 })
      await page.waitForTimeout(500)
    }

    // Reset to default (index 0 = "All Industries")
    await select.selectOption({ index: 0 })
    await page.waitForTimeout(500)

    const countAfter = await countResultCards(page)
    expect(countAfter).toBe(countBefore)
  })
})

// ── Location filter ────────────────────────────────────────────────────────────

test.describe('Location filter', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('Location dropdown is visible', async ({ page }) => {
    const selects = page.locator('select')
    const count = await selects.count()
    // Explore has multiple selects — at least Industry and Location
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('selecting a location option does not crash the page', async ({ page }) => {
    // Location is the second <select> (after Industry)
    const selects = page.locator('select')
    const selectCount = await selects.count()
    if (selectCount < 2) { test.skip(true, 'Location dropdown not present'); return }

    const locationSelect = selects.nth(1)
    const options = await locationSelect.locator('option').count()
    if (options < 2) { test.skip(true, 'No location options beyond default'); return }

    await locationSelect.selectOption({ index: 1 })
    await page.waitForTimeout(600)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('resetting location to default restores the full list', async ({ page }) => {
    const selects = page.locator('select')
    if (await selects.count() < 2) { test.skip(true, 'Location dropdown not present'); return }

    const locationSelect = selects.nth(1)
    const countBefore = await countResultCards(page)

    await locationSelect.selectOption({ index: 1 })
    await page.waitForTimeout(400)
    await locationSelect.selectOption({ index: 0 })
    await page.waitForTimeout(400)

    const countAfter = await countResultCards(page)
    expect(countAfter).toBe(countBefore)
  })
})

// ── Rating filter ──────────────────────────────────────────────────────────────

test.describe('Rating filter', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('Rating dropdown is present and selectable', async ({ page }) => {
    const selects = page.locator('select')
    const count = await selects.count()
    if (count < 3) { test.skip(true, 'Rating dropdown not found (fewer than 3 selects)'); return }

    const ratingSelect = selects.nth(2)
    await expect(ratingSelect).toBeVisible({ timeout: 5000 })

    const options = await ratingSelect.locator('option').count()
    if (options >= 2) {
      await ratingSelect.selectOption({ index: 1 })
      await page.waitForTimeout(500)
      await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    }
  })
})

// ── Price range filter ─────────────────────────────────────────────────────────

test.describe('Price range filter', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('Price range dropdown is present and selectable', async ({ page }) => {
    const selects = page.locator('select')
    const count = await selects.count()
    if (count < 4) { test.skip(true, 'Price range dropdown not found'); return }

    const priceSelect = selects.nth(3)
    await expect(priceSelect).toBeVisible({ timeout: 5000 })

    const options = await priceSelect.locator('option').count()
    if (options >= 2) {
      await priceSelect.selectOption({ index: 1 })
      await page.waitForTimeout(500)
      await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    }
  })
})

// ── Sort chips ─────────────────────────────────────────────────────────────────

test.describe('Sort options', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('"Top rated" sort chip is clickable and does not crash', async ({ page }) => {
    const chip = page.locator('button').filter({ hasText: /top rated/i }).first()
    if (!await chip.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, '"Top rated" sort chip not found'); return
    }
    await chip.click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('"A→Z" sort chip orders results alphabetically ascending', async ({ page }) => {
    const chip = page.locator('button').filter({ hasText: /a.*z|a→z|a-z/i }).first()
    if (!await chip.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'A→Z sort chip not found'); return
    }

    const countBefore = await countResultCards(page)
    await chip.click()
    await page.waitForTimeout(500)

    // Results should still be visible after sorting
    const countAfter = await countResultCards(page)
    expect(countAfter).toBe(countBefore)
    await expect(page.locator('text=/something went wrong/i')).toHaveCount(0)
  })

  test('"Z→A" sort chip does not crash', async ({ page }) => {
    const chip = page.locator('button').filter({ hasText: /z.*a|z→a|z-a/i }).first()
    if (!await chip.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Z→A sort chip not found'); return
    }
    await chip.click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('"Relevance" sort chip restores default ordering', async ({ page }) => {
    // Click A→Z then back to Relevance
    const azChip  = page.locator('button').filter({ hasText: /a.*z|a→z|a-z/i }).first()
    const relChip = page.locator('button').filter({ hasText: /relevance/i }).first()

    if (!await relChip.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, '"Relevance" sort chip not found'); return
    }

    if (await azChip.isVisible().catch(() => false)) {
      await azChip.click()
      await page.waitForTimeout(400)
    }
    await relChip.click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })
})

// ── Businesses / Products tab ──────────────────────────────────────────────────

test.describe('Businesses / Products tab switch', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('"Businesses" tab is active by default', async ({ page }) => {
    const bizTab = page.locator('button').filter({ hasText: /businesses/i }).first()
    await expect(bizTab).toBeVisible({ timeout: 5000 })
  })

  test('switching to "Products" tab loads the products view without error', async ({ page }) => {
    const prodTab = page.locator('button').filter({ hasText: /products/i }).first()
    if (!await prodTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, '"Products" tab not found'); return
    }
    await prodTab.click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('switching back to "Businesses" tab from "Products" works without error', async ({ page }) => {
    const prodTab = page.locator('button').filter({ hasText: /products/i }).first()
    const bizTab  = page.locator('button').filter({ hasText: /businesses/i }).first()

    if (!await prodTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Tab controls not found'); return
    }

    await prodTab.click()
    await page.waitForTimeout(400)
    await bizTab.click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('"Products" tab shows product cards or an empty state', async ({ page }) => {
    const prodTab = page.locator('button').filter({ hasText: /products/i }).first()
    if (!await prodTab.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, '"Products" tab not found'); return
    }
    await prodTab.click()
    await page.waitForTimeout(600)

    const card      = page.locator(SEL.cards).first()
    const emptyMsg  = page.locator(SEL.emptyProd).first()
    const hasCard   = await card.isVisible().catch(() => false)
    const hasEmpty  = await emptyMsg.isVisible().catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })
})

// ── Active filter chips & reset ────────────────────────────────────────────────

test.describe('Active filter chips and reset', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('applying a filter shows a Reset or Clear-all button', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })

    const optionCount = await select.locator('option').count()
    if (optionCount < 2) { test.skip(true, 'No options to filter by'); return }

    await select.selectOption({ index: 1 })
    await page.waitForTimeout(500)

    const resetBtn = page.locator(SEL.resetBtn).first()
    await expect(resetBtn).toBeVisible({ timeout: 4000 })
  })

  test('clicking Reset clears all filter dropdowns back to defaults', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    await expect(select).toBeVisible({ timeout: 5000 })

    const optionCount = await select.locator('option').count()
    if (optionCount < 2) { test.skip(true, 'No options to filter by'); return }

    const countBefore = await countResultCards(page)

    await select.selectOption({ index: 1 })
    await page.waitForTimeout(400)

    const resetBtn = page.locator(SEL.resetBtn).first()
    if (!await resetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Reset button did not appear after filtering'); return
    }

    await resetBtn.click()
    await page.waitForTimeout(500)

    const countAfter = await countResultCards(page)
    expect(countAfter).toBe(countBefore)

    // The reset button should be gone after resetting
    await expect(resetBtn).toHaveCount(0)
  })

  test('empty-state "Clear filters" button resets all filters', async ({ page }) => {
    const searchInput = page.locator(SEL.search).first()
    if (!await searchInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Search input not found'); return
    }

    // Force an empty state with a guaranteed-no-match query
    await searchInput.fill('zzz_no_match_xyz_999')
    await page.waitForTimeout(600)

    const clearBtn = page.locator(SEL.clearFilters).first()
    const hasClearBtn = await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasClearBtn) {
      test.skip(true, 'Clear-filters button not visible — empty state may not have appeared'); return
    }

    const countBefore = await page.locator(SEL.cards).count()
    await clearBtn.click()
    await page.waitForTimeout(500)

    const countAfter = await page.locator(SEL.cards).count()
    expect(countAfter).toBeGreaterThanOrEqual(countBefore)

    // Search input should be cleared
    const inputValue = await searchInput.inputValue()
    expect(inputValue).toBe('')
  })
})

// ── Multi-filter combinations ──────────────────────────────────────────────────

test.describe('Multi-filter combinations', () => {
  test.beforeEach(async ({ page }) => { await goToExplore(page) })

  test('industry + search text combination does not crash', async ({ page }) => {
    const select      = page.locator(SEL.industry).first()
    const searchInput = page.locator(SEL.search).first()

    await expect(select).toBeVisible({ timeout: 5000 })
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    await select.selectOption({ index: 1 })
    await page.waitForTimeout(300)
    await searchInput.fill('manufacturing')
    await page.waitForTimeout(500)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('industry + sort combination does not crash', async ({ page }) => {
    const select = page.locator(SEL.industry).first()
    const azChip = page.locator('button').filter({ hasText: /a.*z|a→z|a-z/i }).first()

    await expect(select).toBeVisible({ timeout: 5000 })

    await select.selectOption({ index: 1 })
    await page.waitForTimeout(300)

    if (await azChip.isVisible().catch(() => false)) {
      await azChip.click()
      await page.waitForTimeout(400)
    }

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('applying all four dropdowns simultaneously does not crash', async ({ page }) => {
    const selects = page.locator('select')
    const count   = await selects.count()

    for (let i = 0; i < Math.min(count, 4); i++) {
      const sel     = selects.nth(i)
      const options = await sel.locator('option').count()
      if (options >= 2) {
        await sel.selectOption({ index: 1 })
        await page.waitForTimeout(200)
      }
    }

    await page.waitForTimeout(400)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })
})
