import { test, expect } from '@playwright/test'

/**
 * Auth pages — verifies the registration, login, and password-reset pages
 * render correctly and show appropriate validation messages.
 *
 * No real user accounts are created. These tests check the UI structure
 * and client-side validation only.
 */

test.describe('Registration page (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('register page loads without crashing', async ({ page }) => {
    await expect(page).toHaveURL(/register/)
  })

  test('register page has a page heading', async ({ page }) => {
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('full name input field is present', async ({ page }) => {
    await expect(
      page.locator('input[name="fullName"], input[placeholder*="name" i], input[id*="name" i]').first(),
    ).toBeVisible()
  })

  test('email input field is present', async ({ page }) => {
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible()
  })

  test('password input field is present', async ({ page }) => {
    await expect(
      page.locator('input[type="password"]').first(),
    ).toBeVisible()
  })

  test('role selector (buyer/seller) is present', async ({ page }) => {
    // Role can be a select, radio group, or button group
    const roleControl = page.locator(
      'select[name="role"], input[type="radio"][value="buyer"], button:has-text("buyer"), button:has-text("Buyer")',
    ).first()
    await expect(roleControl).toBeVisible()
  })

  test('submit button is present', async ({ page }) => {
    const submit = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")').first()
    await expect(submit).toBeVisible()
  })

  test('shows an error when trying to submit with an invalid email', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'password123')
    await page.locator('button[type="submit"]').first().click()
    // Browser native validation or app-level validation should fire
    // Check for either a validation message or an error element
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    const appError = page.locator('[class*="error"], [class*="danger"], [role="alert"]').first()
    const hasAppError = await appError.isVisible().catch(() => false)
    expect(isInvalid || hasAppError).toBe(true)
  })

  test('has a link to the login page', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"], a:has-text("sign in"), a:has-text("log in")').first()
    await expect(loginLink).toBeVisible()
  })
})

test.describe('Login page (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page loads without crashing', async ({ page }) => {
    await expect(page).toHaveURL(/login/)
  })

  test('login page has a heading', async ({ page }) => {
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('email input field is present', async ({ page }) => {
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible()
  })

  test('password input field is present', async ({ page }) => {
    await expect(
      page.locator('input[type="password"]').first(),
    ).toBeVisible()
  })

  test('sign in button is present', async ({ page }) => {
    const btn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first()
    await expect(btn).toBeVisible()
  })

  test('shows an error message when logging in with wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword99')
    await page.locator('button[type="submit"]').first().click()

    // Wait for the Supabase error to come back and render
    const errorEl = page.locator('[class*="error"], [class*="danger"], [role="alert"], p:has-text("invalid"), p:has-text("incorrect"), p:has-text("credentials")').first()
    await expect(errorEl).toBeVisible({ timeout: 8000 })
  })

  test('has a link to the register page', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"], a:has-text("sign up"), a:has-text("create account")').first()
    await expect(registerLink).toBeVisible()
  })

  test('has a "forgot password" link', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("forgot"), a:has-text("reset")').first()
    await expect(forgotLink).toBeVisible()
  })
})

test.describe('Forgot password page (/forgot-password)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password')
  })

  test('forgot password page loads without crashing', async ({ page }) => {
    await expect(page).toHaveURL(/forgot-password/)
  })

  test('email input field is present', async ({ page }) => {
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible()
  })

  test('submit button is present', async ({ page }) => {
    const btn = page.locator('button[type="submit"], button:has-text("send"), button:has-text("reset")').first()
    await expect(btn).toBeVisible()
  })

  test('has a link back to the login page', async ({ page }) => {
    const backLink = page.locator('a[href*="login"], a:has-text("back"), a:has-text("sign in")').first()
    await expect(backLink).toBeVisible()
  })
})
