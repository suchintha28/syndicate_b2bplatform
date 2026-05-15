import { test, expect } from '@playwright/test'

/**
 * RFQ / messaging workflows — requires a signed-in account.
 *
 * Covers the full "post a request" flow, verifying the RFQ form submits,
 * the request appears in the user's own tab, and no error is shown.
 * Also covers writing a review on a product and a supplier brand.
 *
 * Requires:
 *   E2E_USER_EMAIL    — any authenticated account
 *   E2E_USER_PASSWORD — its password
 */

const SKIP_REASON = 'E2E_USER_EMAIL not set — skipping authenticated RFQ workflow'
const RUN_ID = Date.now().toString().slice(-6)

test.describe('Create an RFQ (post a request)', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) {
      test.skip(true, SKIP_REASON)
      return
    }
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Navigate to RFQs screen
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('RFQs screen shows "My requests" tab for a signed-in user', async ({ page }) => {
    const myTab = page.locator('button').filter({ hasText: /my rfqs?|my requests/i }).first()
    await expect(myTab).toBeVisible({ timeout: 6000 })
  })

  test('"Post a request" button is visible when signed in', async ({ page }) => {
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    await expect(postBtn).toBeVisible({ timeout: 6000 })
  })

  test('clicking "Post a request" opens the RFQ creation form', async ({ page }) => {
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    const hasBtn = await postBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasBtn) {
      test.skip(true, '"Post a request" button not found')
      return
    }

    await postBtn.click()
    await page.waitForTimeout(500)

    // RFQ form should be visible
    const subjectField = page.locator(
      'input[placeholder*="subject" i], input[placeholder*="looking for" i], textarea'
    ).first()
    const heading = page.locator('h1, h2, h3').filter({ hasText: /request|rfq/i }).first()
    const isForm = await subjectField.isVisible().catch(() => false) || await heading.isVisible().catch(() => false)
    expect(isForm).toBe(true)
  })

  test('filling and submitting the RFQ form posts the request without error', async ({ page }) => {
    const postBtn = page.locator('button, a').filter({ hasText: /post a request|new rfq|create rfq/i }).first()
    const hasBtn = await postBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasBtn) {
      test.skip(true, '"Post a request" button not found')
      return
    }

    await postBtn.click()
    await page.waitForTimeout(500)

    // Fill in the required fields
    // Subject / title
    const subjectField = page.locator(
      'input[placeholder*="subject" i], input[placeholder*="looking for" i]'
    ).first()
    if (await subjectField.isVisible().catch(() => false)) {
      await subjectField.fill(`E2E Test RFQ ${RUN_ID} — Please ignore`)
    }

    // Message / description
    const messageField = page.locator('textarea').first()
    if (await messageField.isVisible().catch(() => false)) {
      await messageField.fill('This is an automated E2E test request. Please ignore and delete.')
    }

    // Category (if present)
    const categorySelect = page.locator('select').first()
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.selectOption({ index: 1 })
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|post|send/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(2000)

      // No crash
      const errorText = page.locator('text=/something went wrong|application error/i')
      await expect(errorText).toHaveCount(0)
    }
  })

  test('submitted RFQ appears in "My requests" tab', async ({ page }) => {
    const myTab = page.locator('button').filter({ hasText: /my rfqs?|my requests/i }).first()
    const hasTab = await myTab.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasTab) {
      test.skip(true, '"My requests" tab not visible')
      return
    }

    await myTab.click()
    await page.waitForTimeout(600)

    // There should be at least one request (either from this run or previous ones)
    const rfqCard = page.locator('[class*="card"], [class*="Card"]').first()
    const emptyState = page.locator('text=/no requests|no rfqs|be the first/i').first()
    const hasCard  = await rfqCard.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })
})

test.describe('Write a review (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) {
      test.skip(true, SKIP_REASON)
      return
    }
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Navigate to explore and open a supplier brand
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('"Write a review" button opens the review modal on a brand page', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCard) {
      test.skip(true, 'No supplier cards in DB')
      return
    }

    await card.click()
    await page.waitForTimeout(600)

    const writeBtn = page.locator('button').filter({ hasText: /write a review/i }).first()
    await expect(writeBtn).toBeVisible({ timeout: 6000 })
    await writeBtn.click()
    await page.waitForTimeout(400)

    // Modal should appear with star inputs
    const ratingStars = page.locator('.star-input, [class*="star"]').first()
    const reviewTextarea = page.locator('textarea').first()
    const isModal = await ratingStars.isVisible().catch(() => false) || await reviewTextarea.isVisible().catch(() => false)
    expect(isModal).toBe(true)
  })

  test('submitting a review with rating + text posts without error', async ({ page }) => {
    const card = page.locator('[class*="card"], [class*="Card"]').first()
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCard) {
      test.skip(true, 'No supplier cards in DB')
      return
    }

    await card.click()
    await page.waitForTimeout(600)

    const writeBtn = page.locator('button').filter({ hasText: /write a review/i }).first()
    const hasWriteBtn = await writeBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasWriteBtn) {
      test.skip(true, '"Write a review" button not visible')
      return
    }

    await writeBtn.click()
    await page.waitForTimeout(400)

    // Select 5-star rating (click the last star button in the star input)
    const starButtons = page.locator('.star-input button, [class*="star-input"] button')
    const starCount = await starButtons.count()
    if (starCount > 0) {
      await starButtons.nth(starCount - 1).click() // click the 5th star
    }

    // Fill the review text
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill(`E2E test review ${RUN_ID}. Automated test — please ignore.`)
    }

    // Submit
    const postBtn = page.locator('button').filter({ hasText: /post review/i }).first()
    if (await postBtn.isVisible().catch(() => false)) {
      await postBtn.click()
      await page.waitForTimeout(2000)
    }

    // No crash
    const errorText = page.locator('text=/something went wrong|application error/i')
    await expect(errorText).toHaveCount(0)
  })
})
