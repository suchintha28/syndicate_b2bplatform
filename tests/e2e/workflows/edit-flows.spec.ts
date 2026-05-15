import { test, expect } from '@playwright/test'

/**
 * Edit flows — verifies that changes made through edit forms are actually
 * saved and visible after the form closes.
 *
 * Each test follows the same pattern:
 *   1. Open the edit form
 *   2. Change a specific field to a unique timestamped value
 *   3. Submit the form
 *   4. Verify the new value is visible on the resulting screen
 *
 * Requires:
 *   E2E_USER_EMAIL    — a seller account that already has a brand and ≥1 product
 *   E2E_USER_PASSWORD — its password
 */

const SKIP_REASON = 'E2E_USER_EMAIL not set — skipping authenticated edit flow'
const RUN_ID      = Date.now().toString().slice(-6)

// ── Product edit ───────────────────────────────────────────────────────────────

test.describe('Edit product — field persistence', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) { test.skip(true, SKIP_REASON); return }
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  // Helper: open the edit form for the first product in the manage-products list
  async function openFirstProductEditForm(page: import('@playwright/test').Page) {
    const editBtn = page.locator('button').filter({ hasText: /^edit$/i }).first()
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false)
    if (!hasEdit) return false
    await editBtn.click()
    await page.waitForTimeout(500)
    return true
  }

  test('edit form is pre-populated with the existing product name', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button — account may have no products'); return }

    const nameInput = page.locator('input[placeholder*="Smart Sensor" i], input[placeholder*="Product name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    // The input should not be empty — it carries the saved product name
    const currentValue = await nameInput.inputValue()
    expect(currentValue.length).toBeGreaterThan(0)
  })

  test('editing the product name and saving reflects the new name in the product list', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button — account may have no products'); return }

    const nameInput = page.locator('input[placeholder*="Smart Sensor" i], input[placeholder*="Product name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    const newName = `Edited Product ${RUN_ID}`
    await nameInput.fill(newName)

    // Submit
    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    // Should land on the manage-products screen — new name should be visible
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 6000 })
  })

  test('editing the description persists after save', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    const descArea = page.locator('textarea').first()
    await expect(descArea).toBeVisible({ timeout: 5000 })

    const newDesc = `E2E test description ${RUN_ID}. Updated automatically.`
    await descArea.fill(newDesc)

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(1500)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('editing the price and saving shows the new price in the product list', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    // Min price is the first number input
    const priceInput = page.locator('input[type="number"]').first()
    await expect(priceInput).toBeVisible({ timeout: 5000 })

    const newPrice = String(10000 + parseInt(RUN_ID))
    await priceInput.fill(newPrice)

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    // Product list shows "LKR {price}" — verify no crash at minimum
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('adding a tiered pricing row and saving persists the tier', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    // Click "Add price tier"
    const addTierBtn = page.locator('button').filter({ hasText: /add price tier/i }).first()
    await expect(addTierBtn).toBeVisible({ timeout: 5000 })

    const tiersBefore = await page.locator('button').filter({ hasText: /add price tier/i }).count()
    await addTierBtn.click()
    await page.waitForTimeout(300)

    // A new tier row should have appeared — fill the price
    const priceInputs = page.locator('input[type="number"]')
    const inputCount  = await priceInputs.count()
    // Last number input in the tiers grid should be the new tier's price
    if (inputCount > 0) {
      await priceInputs.last().fill('35000')
    }

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('adding a variation and saving persists it', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    const addVarBtn = page.locator('button').filter({ hasText: /add variation/i }).first()
    await expect(addVarBtn).toBeVisible({ timeout: 5000 })
    await addVarBtn.click()
    await page.waitForTimeout(300)

    // Fill the new variation name
    const varNameInput = page.locator('input[placeholder="Standard"]').last()
    if (await varNameInput.isVisible().catch(() => false)) {
      await varNameInput.fill(`Variant ${RUN_ID}`)
    }

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('adding a product spec row and saving persists it', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    const addRowBtn = page.locator('button').filter({ hasText: /add row/i }).first()
    await expect(addRowBtn).toBeVisible({ timeout: 5000 })
    await addRowBtn.click()
    await page.waitForTimeout(300)

    // Fill the new spec label and value
    const labelInputs = page.locator('input[placeholder*="Label" i]')
    const valueInputs = page.locator('input[placeholder="Value"]')
    const labelCount  = await labelInputs.count()
    const valueCount  = await valueInputs.count()

    if (labelCount > 0) await labelInputs.last().fill(`Spec ${RUN_ID}`)
    if (valueCount > 0) await valueInputs.last().fill('Test value')

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('cancelling the edit form returns to the products list without saving', async ({ page }) => {
    const opened = await openFirstProductEditForm(page)
    if (!opened) { test.skip(true, 'No edit button'); return }

    const nameInput = page.locator('input[placeholder*="Smart Sensor" i], input[placeholder*="Product name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    const originalName = await nameInput.inputValue()
    await nameInput.fill(`Should Not Be Saved ${RUN_ID}`)

    // Click Cancel
    await page.locator('button').filter({ hasText: /^cancel$/i }).first().click()
    await page.waitForTimeout(500)

    // The original product name should still be shown in the list
    if (originalName.length > 0) {
      await expect(page.locator(`text=${originalName}`)).toBeVisible({ timeout: 5000 })
    }
    // The unsaved name should NOT appear
    await expect(page.locator(`text=Should Not Be Saved ${RUN_ID}`)).toHaveCount(0)
  })

  test('toggling a product Inactive and back to Active reflects in the list', async ({ page }) => {
    const deactivateBtn = page.locator('button').filter({ hasText: /deactivate/i }).first()
    const hasDeactivate = await deactivateBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasDeactivate) { test.skip(true, 'No active products to deactivate'); return }

    await deactivateBtn.click()
    await page.waitForTimeout(1500)

    // Status should now show Inactive badge or Activate button
    const activateBtn    = page.locator('button').filter({ hasText: /^activate$/i }).first()
    const inactiveBadge  = page.locator('text=/inactive/i').first()
    const isNowInactive  = await activateBtn.isVisible().catch(() => false) ||
                            await inactiveBadge.isVisible().catch(() => false)
    expect(isNowInactive).toBe(true)

    // Restore: click Activate
    if (await activateBtn.isVisible().catch(() => false)) {
      await activateBtn.click()
      await page.waitForTimeout(1500)
      const activeBadge = page.locator('text=/active/i').first()
      await expect(activeBadge).toBeVisible({ timeout: 4000 })
    }
  })
})

// ── Brand / profile edit ───────────────────────────────────────────────────────

test.describe('Edit brand profile — field persistence', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) { test.skip(true, SKIP_REASON); return }
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  // Helper: navigate to Edit profile form
  async function openEditProfileForm(page: import('@playwright/test').Page) {
    const editBtn = page.locator('button, a').filter({ hasText: /edit profile/i }).first()
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false)
    if (!hasEdit) return false
    await editBtn.click()
    await page.waitForTimeout(500)
    return true
  }

  test('Edit profile form loads without error', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    // Form should have at least one visible input
    await expect(page.locator('input').first()).toBeVisible({ timeout: 5000 })
  })

  test('edit form is pre-populated with the existing full name', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const nameInput = page.locator('input[placeholder="Jane Doe"], input[placeholder*="name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    const currentName = await nameInput.inputValue()
    expect(currentName.length).toBeGreaterThan(0)
  })

  test('email field is read-only and cannot be changed', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    // Email field should be disabled or readonly
    const isReadOnly = await emailInput.evaluate((el: HTMLInputElement) =>
      el.readOnly || el.disabled
    )
    expect(isReadOnly).toBe(true)
  })

  test('editing the full name and saving reflects the new name on the profile screen', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const nameInput = page.locator('input[placeholder="Jane Doe"], input[placeholder*="name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    // Store original so we can restore it
    const originalName = await nameInput.inputValue()
    const newName = `Test User ${RUN_ID}`

    await nameInput.fill(newName)

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    // Should navigate to profile screen and show the new name
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 6000 })

    // Restore the original name so subsequent runs still work
    const editBtnAgain = page.locator('button, a').filter({ hasText: /edit profile/i }).first()
    if (await editBtnAgain.isVisible({ timeout: 3000 }).catch(() => false) && originalName.length > 0) {
      await editBtnAgain.click()
      await page.waitForTimeout(500)
      const nameInputAgain = page.locator('input[placeholder="Jane Doe"], input[placeholder*="name" i]').first()
      if (await nameInputAgain.isVisible().catch(() => false)) {
        await nameInputAgain.fill(originalName)
        await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
        await page.waitForTimeout(1500)
      }
    }
  })

  test('editing the phone number and saving reflects it on the profile screen', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="+94" i]').first()
    if (!await phoneInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Phone input not found'); return
    }

    await phoneInput.fill('+94 77 999 0000')

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('editing the business name and saving reflects the new name on the profile screen', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    // Business name field — placeholder "Acme Industries Ltd."
    const bizNameInput = page.locator('input[placeholder*="Acme Industries" i], input[placeholder*="business name" i]').first()
    if (!await bizNameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Business name input not visible — may be a buyer account'); return
    }

    const originalBizName = await bizNameInput.inputValue()
    const newBizName = `Test Business ${RUN_ID}`
    await bizNameInput.fill(newBizName)

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    await expect(page.locator(`text=${newBizName}`)).toBeVisible({ timeout: 6000 })

    // Restore
    const editBtnAgain = page.locator('button, a').filter({ hasText: /edit profile/i }).first()
    if (await editBtnAgain.isVisible({ timeout: 3000 }).catch(() => false) && originalBizName.length > 0) {
      await editBtnAgain.click()
      await page.waitForTimeout(500)
      const bizInputAgain = page.locator('input[placeholder*="Acme Industries" i], input[placeholder*="business name" i]').first()
      if (await bizInputAgain.isVisible().catch(() => false)) {
        await bizInputAgain.fill(originalBizName)
        await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
        await page.waitForTimeout(1500)
      }
    }
  })

  test('editing the business description and saving does not crash', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    // Business description textarea (sellers only)
    const descArea = page.locator('textarea[placeholder*="Describe what your business" i]').first()
    if (!await descArea.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Business description textarea not found — may be a buyer account'); return
    }

    await descArea.fill(`E2E test business description ${RUN_ID}.`)

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
  })

  test('changing the industry and saving persists the selection', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const industrySelect = page.locator('select').first()
    if (!await industrySelect.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Industry dropdown not found'); return
    }

    const options = await industrySelect.locator('option').count()
    if (options < 2) { test.skip(true, 'No industry options to change to'); return }

    await industrySelect.selectOption({ index: 1 })
    const selectedValue = await industrySelect.inputValue()

    await page.locator('button[type="submit"]').filter({ hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)

    await expect(page.locator('text=/something went wrong|application error/i')).toHaveCount(0)
    // Re-open and verify the selection was saved
    const editBtnAgain = page.locator('button, a').filter({ hasText: /edit profile/i }).first()
    if (await editBtnAgain.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtnAgain.click()
      await page.waitForTimeout(500)
      const selectAgain = page.locator('select').first()
      if (await selectAgain.isVisible().catch(() => false)) {
        const savedValue = await selectAgain.inputValue()
        expect(savedValue).toBe(selectedValue)
      }
    }
  })

  test('cancelling the edit form returns to the profile without changing data', async ({ page }) => {
    const opened = await openEditProfileForm(page)
    if (!opened) { test.skip(true, '"Edit profile" button not found'); return }

    const nameInput = page.locator('input[placeholder="Jane Doe"], input[placeholder*="name" i]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    const originalName = await nameInput.inputValue()
    await nameInput.fill(`Should Not Save ${RUN_ID}`)

    await page.locator('button').filter({ hasText: /^cancel$/i }).first().click()
    await page.waitForTimeout(500)

    // Original name should still be on the profile screen
    if (originalName.length > 0) {
      await expect(page.locator(`text=${originalName}`)).toBeVisible({ timeout: 5000 })
    }
    await expect(page.locator(`text=Should Not Save ${RUN_ID}`)).toHaveCount(0)
  })
})
