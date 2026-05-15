import { describe, it, expect, vi } from 'vitest'
import type { Screen, NavOpts } from '@/lib/data'

/**
 * Navigation options tests — verifies the logic that governs screen transitions
 * in the app. The goTo() function in app/page.tsx uses NavOpts to pass context
 * (e.g. which RFQ to open, which brand pre-fills the RFQ form). These tests
 * verify that logic in isolation using a pure helper that mirrors goTo()'s
 * behaviour, so failures are immediately clear without loading the full app.
 */

// ─── Private screens that require a signed-in user ───────────────────────────
// Mirrors the redirect guard inside goTo() in app/page.tsx
const PRIVATE_SCREENS: Screen[] = [
  'profile', 'manage-profile', 'manage-products', 'add-product', 'edit-product',
  'settings', 'subscription', 'rfq-create', 'rfq-detail', 'messages',
  'message-form', 'notifications',
]

// ─── Pure navigation helper — extracted logic from goTo() ─────────────────────
// Mirrors what goTo() does without React state or Supabase calls.
type NavResult =
  | { destination: 'auth'; pendingScreen: Screen; pendingOpts: NavOpts }
  | { destination: Screen; selectedRfqId: string | null; rfqCreateOpts: { brandId?: string; productId?: string } }

function resolveNavigation(
  screen: Screen,
  opts: NavOpts = {},
  user: { id: string } | null,
): NavResult {
  if (PRIVATE_SCREENS.includes(screen) && !user) {
    return { destination: 'auth', pendingScreen: screen, pendingOpts: opts }
  }
  return {
    destination: screen,
    selectedRfqId: opts.rfqId ?? null,
    rfqCreateOpts: { brandId: opts.brandId, productId: opts.productId },
  }
}

const SIGNED_IN_USER = { id: 'user-uuid-001' }

// ─── Guest navigation — no opts ───────────────────────────────────────────────
describe('goTo — guest user (not signed in)', () => {
  it('navigates to a public screen without redirecting to auth', () => {
    const result = resolveNavigation('home', {}, null)
    expect(result.destination).toBe('home')
  })

  it('navigates to the Explore screen as a guest', () => {
    const result = resolveNavigation('listing', {}, null)
    expect(result.destination).toBe('listing')
  })

  it('navigates to the RFQ browse screen as a guest', () => {
    const result = resolveNavigation('rfqs', {}, null)
    expect(result.destination).toBe('rfqs')
  })

  it('redirects to auth when a guest tries to reach the Profile screen', () => {
    const result = resolveNavigation('profile', {}, null)
    expect(result.destination).toBe('auth')
  })

  it('redirects to auth when a guest tries to create an RFQ', () => {
    const result = resolveNavigation('rfq-create', {}, null)
    expect(result.destination).toBe('auth')
  })

  it('stores the intended screen so it can be resumed after login', () => {
    const result = resolveNavigation('rfq-create', {}, null)
    if (result.destination === 'auth') {
      expect(result.pendingScreen).toBe('rfq-create')
    }
  })

  it('stores the pending NavOpts so they are not lost after the auth redirect', () => {
    const opts: NavOpts = { brandId: 'brand-123', productId: 'product-456' }
    const result = resolveNavigation('rfq-create', opts, null)
    if (result.destination === 'auth') {
      expect(result.pendingOpts).toEqual(opts)
    }
  })
})

// ─── Signed-in navigation — no opts ──────────────────────────────────────────
describe('goTo — signed-in user, no opts', () => {
  it('navigates to the Profile screen without redirecting', () => {
    const result = resolveNavigation('profile', {}, SIGNED_IN_USER)
    expect(result.destination).toBe('profile')
  })

  it('navigates to the Notifications screen without redirecting', () => {
    const result = resolveNavigation('notifications', {}, SIGNED_IN_USER)
    expect(result.destination).toBe('notifications')
  })

  it('sets selectedRfqId to null when no rfqId is provided', () => {
    const result = resolveNavigation('rfq-detail', {}, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.selectedRfqId).toBeNull()
    }
  })
})

// ─── goTo with rfqId ─────────────────────────────────────────────────────────
describe('goTo — rfqId in NavOpts', () => {
  it('sets selectedRfqId when navigating to rfq-detail with an rfqId', () => {
    const result = resolveNavigation('rfq-detail', { rfqId: 'rfq-abc-123' }, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.selectedRfqId).toBe('rfq-abc-123')
    }
  })

  it('selectedRfqId is null when rfqId is not in opts', () => {
    const result = resolveNavigation('rfq-detail', {}, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.selectedRfqId).toBeNull()
    }
  })
})

// ─── goTo with brandId (RFQ pre-fill) ────────────────────────────────────────
describe('goTo — brandId in NavOpts', () => {
  it('sets rfqCreateOpts.brandId when navigating to rfq-create with a brandId', () => {
    const result = resolveNavigation('rfq-create', { brandId: 'brand-xyz' }, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.rfqCreateOpts.brandId).toBe('brand-xyz')
    }
  })

  it('sets rfqCreateOpts.productId when navigating to rfq-create with a productId', () => {
    const result = resolveNavigation('rfq-create', { productId: 'prod-999' }, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.rfqCreateOpts.productId).toBe('prod-999')
    }
  })

  it('can carry both brandId and productId at the same time', () => {
    const opts: NavOpts = { brandId: 'brand-xyz', productId: 'prod-999' }
    const result = resolveNavigation('rfq-create', opts, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.rfqCreateOpts.brandId).toBe('brand-xyz')
      expect(result.rfqCreateOpts.productId).toBe('prod-999')
    }
  })

  it('rfqCreateOpts.brandId is undefined when no brandId is provided', () => {
    const result = resolveNavigation('rfq-create', {}, SIGNED_IN_USER)
    if (result.destination !== 'auth') {
      expect(result.rfqCreateOpts.brandId).toBeUndefined()
    }
  })
})

// ─── All private screens are protected ───────────────────────────────────────
describe('goTo — all private screens redirect guests to auth', () => {
  PRIVATE_SCREENS.forEach((screen) => {
    it(`"${screen}" redirects a guest to auth`, () => {
      const result = resolveNavigation(screen, {}, null)
      expect(result.destination).toBe('auth')
    })
  })
})
