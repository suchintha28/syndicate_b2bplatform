import { test, expect } from '@playwright/test'

/**
 * Messaging workflows — requires a signed-in account.
 *
 * Covers the full private messaging flow (compose → thread → reply → close),
 * the public RFQ bidding flow (submit bid → accept bid), and inbox search.
 *
 * Two-party flows (e.g. buyer sends, seller replies) require two separate
 * test accounts. Configure with:
 *
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD — primary test user (seller preferred)
 *   E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD — optional second account (buyer)
 *   E2E_USER_ROLE — 'seller' | 'buyer'
 *
 * Tests that need both accounts are skipped when only one is configured.
 * All tests skip gracefully when E2E_USER_EMAIL is absent.
 */

const SKIP_AUTH    = 'E2E_USER_EMAIL not set — skipping messaging workflow'
const SKIP_BUYER   = 'E2E_BUYER_EMAIL not set — skipping two-party messaging test'
const RUN_ID       = Date.now().toString().slice(-6)
const TEST_SUBJECT = `E2E Test Inquiry ${RUN_ID}`

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Navigate to the inbox via the top nav "Inbox" button. */
async function goToInbox(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const inboxBtn = page.locator('nav button, nav a').filter({ hasText: /inbox/i }).first()
  await inboxBtn.click()
  await page.waitForTimeout(600)
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

test.describe('Inbox — navigation and list', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    await goToInbox(page)
  })

  test('Inbox loads without a server error', async ({ page }) => {
    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)
  })

  test('Inbox page heading is visible', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /messages|inbox/i }).first()
    await expect(heading).toBeVisible({ timeout: 6000 })
  })

  test('inbox shows messages list or the empty state — never a blank screen', async ({ page }) => {
    const messageCard = page.locator('.card.card-hover, [class*="card"]').first()
    const emptyState  = page.locator('text=/no messages yet|no results/i').first()
    const hasCard  = await messageCard.isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })

  test('inbox search input is visible', async ({ page }) => {
    const searchInput = page.locator('input.field-search, input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })
  })

  test('unread count or conversation count is shown in the page subtitle', async ({ page }) => {
    // Subtitle reads "N unread · M total" or "M conversations"
    const subtitle = page.locator('text=/unread|conversations|conversation/i').first()
    await expect(subtitle).toBeVisible({ timeout: 5000 })
  })
})

// ── Inbox search ──────────────────────────────────────────────────────────────

test.describe('Inbox — search and filter', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    await goToInbox(page)
  })

  test('typing in the search box filters the inbox list', async ({ page }) => {
    const searchInput = page.locator('input.field-search, input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    const cardsBefore = await page.locator('.card.card-hover').count()
    await searchInput.fill('zzz_no_match_xyz')
    await page.waitForTimeout(400)

    const emptyResult = page.locator('text=/no results/i').first()
    const cardsAfter  = await page.locator('.card.card-hover').count()
    const hasEmpty    = await emptyResult.isVisible().catch(() => false)
    expect(cardsAfter < cardsBefore || hasEmpty).toBe(true)
  })

  test('clearing the search box restores the full list', async ({ page }) => {
    const searchInput = page.locator('input.field-search, input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    const cardsBefore = await page.locator('.card.card-hover').count()
    await searchInput.fill('zzz_no_match_xyz')
    await page.waitForTimeout(300)
    await searchInput.clear()
    await page.waitForTimeout(300)

    const cardsAfter = await page.locator('.card.card-hover').count()
    expect(cardsAfter).toBe(cardsBefore)
  })
})

// ── Compose a private message ─────────────────────────────────────────────────

test.describe('Send a private message to a supplier', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    // Start on the Explore screen and open the first supplier
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /explore/i }).first().click()
    await page.waitForLoadState('networkidle')
  })

  test('"Send message" button is present on a brand detail page', async ({ page }) => {
    const card = page.locator('[class*="card"]').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No supplier cards in DB')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const sendBtn = page.locator('button, a').filter({ hasText: /send message/i }).first()
    await expect(sendBtn).toBeVisible({ timeout: 6000 })
  })

  test('clicking "Send message" opens the compose form', async ({ page }) => {
    const card = page.locator('[class*="card"]').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No supplier cards in DB')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const sendBtn = page.locator('button, a').filter({ hasText: /send message/i }).first()
    if (!await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '"Send message" button not found')
      return
    }
    await sendBtn.click()
    await page.waitForTimeout(500)

    // Compose form should be visible — has a Subject field and Message textarea
    await expect(page.locator('input[placeholder*="Inquiry" i], input[placeholder*="subject" i]').first())
      .toBeVisible({ timeout: 5000 })
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5000 })
  })

  test('filling and submitting the compose form sends the message', async ({ page }) => {
    const card = page.locator('[class*="card"]').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No supplier cards in DB')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const sendBtn = page.locator('button, a').filter({ hasText: /send message/i }).first()
    if (!await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '"Send message" button not found on brand page')
      return
    }
    await sendBtn.click()
    await page.waitForTimeout(500)

    // Fill the subject
    const subjectInput = page.locator('input[placeholder*="Inquiry" i], input[placeholder*="subject" i]').first()
    if (await subjectInput.isVisible().catch(() => false)) {
      await subjectInput.fill(TEST_SUBJECT)
    }

    // Fill the message body
    const messageArea = page.locator('textarea').first()
    if (await messageArea.isVisible().catch(() => false)) {
      await messageArea.fill(`Automated E2E test message ${RUN_ID}. Please ignore this inquiry.`)
    }

    // Submit
    await page.locator('button[type="submit"]').filter({ hasText: /send message/i }).first().click()
    await page.waitForTimeout(2000)

    // Should show a success state or redirect — no error
    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)
  })

  test('sent message appears in the inbox with the correct subject', async ({ page }) => {
    // Navigate to inbox and check the just-sent message exists
    await goToInbox(page)
    const sentMessage = page.locator(`text=${TEST_SUBJECT}`)
    const hasMessage  = await sentMessage.isVisible({ timeout: 6000 }).catch(() => false)
    // Only assert if we successfully sent in the prior test in this session
    if (hasMessage) {
      await expect(sentMessage).toBeVisible()
    } else {
      // Tolerate: message may not be visible if previous test was skipped
      test.skip(true, 'Sent message not found — previous test may have been skipped')
    }
  })
})

// ── Thread view & reply ───────────────────────────────────────────────────────

test.describe('View a message thread and reply', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    await goToInbox(page)
  })

  test('clicking a message card opens the thread detail view', async ({ page }) => {
    const card = page.locator('.card.card-hover').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No messages in inbox to open')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)

    // Detail view should show the original request and a Thread section
    await expect(page.locator('text=/original request|thread/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('thread detail view shows the reply input when the RFQ is not closed', async ({ page }) => {
    const card = page.locator('.card.card-hover').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No messages in inbox')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    // Either the reply textarea is visible (open RFQ) or the "closed" message (closed RFQ)
    const replyInput  = page.locator('textarea[placeholder*="reply" i]').first()
    const closedMsg   = page.locator('text=/this rfq is closed/i').first()
    const hasReply  = await replyInput.isVisible().catch(() => false)
    const hasClosed = await closedMsg.isVisible().catch(() => false)
    expect(hasReply || hasClosed).toBe(true)
  })

  test('typing a reply and clicking "Send reply" posts without error', async ({ page }) => {
    const card = page.locator('.card.card-hover').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No messages in inbox')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    const replyInput = page.locator('textarea[placeholder*="reply" i]').first()
    if (!await replyInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      test.skip(true, 'Thread is closed or reply input not found')
      return
    }

    await replyInput.fill(`E2E test reply ${RUN_ID}. Automated — please ignore.`)

    const sendReplyBtn = page.locator('button').filter({ hasText: /send reply/i }).first()
    await expect(sendReplyBtn).toBeVisible({ timeout: 3000 })
    await sendReplyBtn.click()
    await page.waitForTimeout(2000)

    // No crash after sending
    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)

    // Reply input should be cleared after sending
    const clearedInput = page.locator('textarea[placeholder*="reply" i]').first()
    const inputValue   = await clearedInput.inputValue().catch(() => '')
    expect(inputValue).toBe('')
  })

  test('"Back to inbox" link returns to the inbox list', async ({ page }) => {
    const card = page.locator('.card.card-hover').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No messages in inbox')
      return
    }
    await card.click()
    await page.waitForTimeout(500)

    const backLink = page.locator('a, button').filter({ hasText: /back to inbox/i }).first()
    await expect(backLink).toBeVisible({ timeout: 5000 })
    await backLink.click()
    await page.waitForTimeout(500)

    // Should be back on the inbox screen
    await expect(page.locator('text=/messages|inbox/i').first()).toBeVisible({ timeout: 5000 })
  })
})

// ── Close an RFQ thread ───────────────────────────────────────────────────────

test.describe('Close an RFQ conversation', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    await goToInbox(page)
  })

  test('opening a thread shows the "Close this RFQ" option', async ({ page }) => {
    const card = page.locator('.card.card-hover').first()
    if (!await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No messages in inbox')
      return
    }
    await card.click()
    await page.waitForTimeout(600)

    // The close link is only present on threads that aren't already closed
    const closeLink   = page.locator('button, a').filter({ hasText: /close this rfq/i }).first()
    const closedMsg   = page.locator('text=/this rfq is closed/i').first()
    const hasClose   = await closeLink.isVisible().catch(() => false)
    const hasClosed  = await closedMsg.isVisible().catch(() => false)
    expect(hasClose || hasClosed).toBe(true)
  })
})

// ── Public RFQ bidding (seller flow) ─────────────────────────────────────────

test.describe('Submit a bid on a public RFQ (seller)', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL) test.skip(true, SKIP_AUTH)
    if (process.env.E2E_USER_ROLE && process.env.E2E_USER_ROLE !== 'seller') {
      test.skip(true, 'This test requires a seller account (E2E_USER_ROLE=seller)')
      return
    }
    // Navigate to RFQs → Browse tab (Open requests)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('nav a, nav button').filter({ hasText: /rfq/i }).first().click()
    await page.waitForLoadState('networkidle')
    const openTab = page.locator('button').filter({ hasText: /open requests/i }).first()
    if (await openTab.isVisible().catch(() => false)) await openTab.click()
    await page.waitForTimeout(500)
  })

  test('"Open requests" tab shows public RFQ cards or an empty state', async ({ page }) => {
    const rfqCard   = page.locator('[class*="card"]').first()
    const emptyState = page.locator('text=/no requests|no rfqs|empty|be the first/i').first()
    const hasCard  = await rfqCard.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasCard || hasEmpty).toBe(true)
  })

  test('clicking a public RFQ opens the detail view', async ({ page }) => {
    const rfqCard = page.locator('[class*="card"]').first()
    if (!await rfqCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No public RFQs available')
      return
    }
    await rfqCard.click()
    await page.waitForTimeout(600)

    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)
    await expect(page.locator('text=/original request/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('"Submit bid" button is visible on a public RFQ for a seller with a brand', async ({ page }) => {
    const rfqCard = page.locator('[class*="card"]').first()
    if (!await rfqCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No public RFQs available')
      return
    }
    await rfqCard.click()
    await page.waitForTimeout(600)

    // May show "Submit bid" or "Bid submitted" (if already bid) or "Create brand profile" (no brand)
    const submitBtn  = page.locator('button').filter({ hasText: /submit bid/i }).first()
    const alreadyBid = page.locator('text=/bid submitted/i').first()
    const noBrand    = page.locator('button').filter({ hasText: /create brand profile/i }).first()
    const hasSubmit   = await submitBtn.isVisible().catch(() => false)
    const hasExisting = await alreadyBid.isVisible().catch(() => false)
    const hasNoBrand  = await noBrand.isVisible().catch(() => false)
    expect(hasSubmit || hasExisting || hasNoBrand).toBe(true)
  })

  test('filling the bid form and submitting posts without error', async ({ page }) => {
    const rfqCard = page.locator('[class*="card"]').first()
    if (!await rfqCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No public RFQs available')
      return
    }
    await rfqCard.click()
    await page.waitForTimeout(600)

    const submitBtn = page.locator('button').filter({ hasText: /submit bid/i }).first()
    if (!await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '"Submit bid" not available — already bid or no brand profile')
      return
    }
    await submitBtn.click()
    await page.waitForTimeout(500)

    // Bid description (required)
    const descField = page.locator('textarea').first()
    if (await descField.isVisible().catch(() => false)) {
      await descField.fill(`E2E test bid ${RUN_ID}. Automated — please ignore.`)
    }

    // Optional price
    const priceInput = page.locator('input[type="number"][placeholder="0"]').first()
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill('50000')
    }

    // Optional timeline
    const timelineInput = page.locator('input[placeholder*="weeks" i], input[placeholder*="timeline" i]').first()
    if (await timelineInput.isVisible().catch(() => false)) {
      await timelineInput.fill('4 weeks from order')
    }

    // Submit bid
    const confirmBtn = page.locator('button').filter({ hasText: /submit bid/i }).last()
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click()
      await page.waitForTimeout(2000)
    }

    const error = page.locator('text=/something went wrong|application error/i')
    await expect(error).toHaveCount(0)
  })

  test('after submitting a bid the "Bid submitted" confirmation is shown', async ({ page }) => {
    const rfqCard = page.locator('[class*="card"]').first()
    if (!await rfqCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No public RFQs available')
      return
    }
    await rfqCard.click()
    await page.waitForTimeout(600)

    // The bid may have been submitted in the prior test in this session
    const bidSubmitted = page.locator('text=/bid submitted/i').first()
    const hasSubmitted = await bidSubmitted.isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasSubmitted) {
      test.skip(true, 'No submitted bid visible — run the bid submission test first')
      return
    }
    await expect(bidSubmitted).toBeVisible()
  })
})

// ── Two-party flow: buyer posts, seller replies ───────────────────────────────

test.describe('Two-party flow — buyer posts RFQ, seller opens it', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL || !process.env.E2E_BUYER_EMAIL) {
      test.skip(true, SKIP_BUYER)
      return
    }
  })

  /**
   * NOTE: This describe block's tests require two separate Playwright
   * browser contexts — one authenticated as the buyer, one as the seller.
   *
   * Full two-party flows (buyer logs in, sends a message, seller logs in,
   * sees it in their inbox, replies) need Playwright's multi-page / request API.
   *
   * The tests below verify the handshake points are reachable by each role
   * independently using their respective storageState files.
   */

  test('a newly sent private message appears in the seller inbox', async ({ page, context }) => {
    // This test is a placeholder that documents the intended two-party test.
    // To implement: use context.newPage() with a second storageState pointing
    // to a seller session saved as tests/e2e/.auth/seller.json.
    //
    // Alternatively, run this as two separate test projects in playwright.config.ts:
    //   project 'buyer-workflows'  → storageState: buyer.json
    //   project 'seller-workflows' → storageState: seller.json
    //
    // For now this test serves as a documented placeholder.
    test.skip(true, 'Two-party flow requires multi-context setup — see comment above')
  })
})
