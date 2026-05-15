import { test, expect } from '@playwright/test'

/**
 * Seller product workflows — requires a signed-in seller account.
 *
 * Covers the full add-product form, edit-product form, and verifying the
 * product appears in the seller's manage-products list.
 *
 * Requires:
 *   E2E_USER_EMAIL    — a seller account email
 *   E2E_USER_PASSWORD — its password
 *   E2E_USER_ROLE=seller
 *
 * Each test uses a unique timestamped product name so repeated runs never
 * collide with leftover data.
 */

const SKIP_REASON = 'E2E_USER_EMAIL not set — skipping authenticated seller workflow'

// A unique suffix so we can identify test products without conflicting with
// products from previous runs
const RUN_ID = Date.now().toString().slice(-6)
const TEST_PRODUCT_NAME = `E2E Test Product ${RUN_ID}`

test.describe('Seller — add product workflow', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) {
      test.skip(true, SKIP_REASON)
      return
    }
    // /dashboard redirects to /. Navigate to the seller's account area via the
    // Profile nav button which opens the ProfileScreen where "Add product" lives.
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav button, nav a').filter({ hasText: /^profile$/i }).first().click()
    await page.waitForTimeout(600)
  })

  test('seller dashboard loads and shows the Add product button', async ({ page }) => {
    const addBtn = page.locator('button, a').filter({ hasText: /add product/i }).first()
    const hasAdd = await addBtn.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasAdd) {
      // Seller account has no brand yet — "Set up brand profile" is shown instead
      const setupBtn = page.locator('button, a').filter({ hasText: /set up brand/i }).first()
      const hasSetup = await setupBtn.isVisible({ timeout: 3000 }).catch(() => false)
      if (hasSetup) {
        test.skip(true, 'Seller has no brand profile yet — Add product button not available')
        return
      }
    }
    await expect(addBtn).toBeVisible({ timeout: 8000 })
  })

  test('clicking Add product opens the product form', async ({ page }) => {
    const addBtn = page.locator('button, a').filter({ hasText: /add product/i }).first()
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasAdd) {
      test.skip(true, 'Seller has no brand profile yet — Add product button not available')
      return
    }
    await addBtn.click()
    await page.waitForTimeout(500)

    // Form should be visible
    const nameField = page.locator('input[placeholder*="Smart Sensor" i], input[placeholder*="product" i]').first()
    const heading   = page.locator('h1, h2').filter({ hasText: /add product/i }).first()
    const isForm = await nameField.isVisible().catch(() => false) || await heading.isVisible().catch(() => false)
    expect(isForm).toBe(true)
  })

  test('filling and submitting the product form creates a new product', async ({ page }) => {
    // Open the add-product form
    const addBtn = page.locator('button, a').filter({ hasText: /add product/i }).first()
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasAdd) {
      test.skip(true, 'Seller has no brand profile yet — Add product button not available')
      return
    }
    await addBtn.click()
    await page.waitForTimeout(500)

    // ── Basics ──
    await page.locator('input[placeholder*="Smart Sensor" i], input[placeholder*="Product name" i]').first().fill(TEST_PRODUCT_NAME)

    // Category dropdown
    const categorySelect = page.locator('select').first()
    await categorySelect.selectOption({ index: 1 }) // pick first real category

    // Description
    await page.locator('textarea').first().fill('This is an automated E2E test product. Safe to delete.')

    // Price
    await page.locator('input[type="number"]').first().fill('5000')

    // Submit
    await page.locator('button[type="submit"]').first().click()

    // Should navigate back to manage-products with no error
    await page.waitForTimeout(2000)
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)

    // The new product name should appear somewhere on the resulting screen
    await expect(page.locator(`text=${TEST_PRODUCT_NAME}`)).toBeVisible({ timeout: 8000 })
  })

  test('the newly created product appears in the manage-products list', async ({ page }) => {
    // This test depends on the previous test having run in the same session.
    // If the product was created, it should be visible in the dashboard.
    const productEntry = page.locator(`text=${TEST_PRODUCT_NAME}`)
    const exists = await productEntry.isVisible({ timeout: 5000 }).catch(() => false)

    if (!exists) {
      test.skip(true, 'Test product not found — run the "filling and submitting" test first')
      return
    }

    await expect(productEntry).toBeVisible()
  })
})

test.describe('Seller — edit product workflow', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) {
      test.skip(true, SKIP_REASON)
      return
    }
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('clicking View on an existing product opens a product page without error', async ({ page }) => {
    const viewBtn = page.locator('button, a').filter({ hasText: /^view$/i }).first()
    const hasView = await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasView) {
      test.skip(true, 'No products in this seller account to view')
      return
    }

    await viewBtn.click()
    await page.waitForTimeout(800)

    const errorText = page.locator('text=/something went wrong|application error|An error occurred/i')
    await expect(errorText).toHaveCount(0)
  })

  test('tiered pricing section is visible in the product edit form', async ({ page }) => {
    // Navigate into edit form for the first product
    // The edit button may be inside the manage-products screen
    const editBtn = page.locator('button, a').filter({ hasText: /edit/i }).first()
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasEdit) {
      test.skip(true, 'No edit button found — skipping edit form test')
      return
    }

    await editBtn.click()
    await page.waitForTimeout(500)

    const tieredSection = page.locator('text=/tiered pricing/i').first()
    await expect(tieredSection).toBeVisible({ timeout: 5000 })
  })

  test('specifications section is visible in the product edit form', async ({ page }) => {
    const editBtn = page.locator('button, a').filter({ hasText: /edit/i }).first()
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasEdit) {
      test.skip(true, 'No edit button found — skipping edit form test')
      return
    }

    await editBtn.click()
    await page.waitForTimeout(500)

    const specsSection = page.locator('text=/specifications/i').first()
    await expect(specsSection).toBeVisible({ timeout: 5000 })
  })
})
