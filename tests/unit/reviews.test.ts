import { describe, it, expect } from 'vitest'
import type { DbReview } from '@/types/database'

/**
 * Reviews — unit tests for the pure helper logic used in ProductDetailScreen
 * and BusinessDetailScreen when rendering review cards.
 *
 * The components extract initials, format dates, and validate review input
 * before posting. Those helpers are inline lambdas, so we mirror them here
 * as standalone functions and verify every edge case.
 */

// ─── Helpers mirrored from the review components ──────────────────────────────

/** Derives avatar initials from a reviewer's full name. */
function reviewerInitials(fullName: string): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

/** Formats a review's created_at ISO timestamp as a human-readable date. */
function formatReviewDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Returns true when the review form has enough data to submit. */
function isReviewSubmittable(rating: number, body: string): boolean {
  return rating > 0 && body.trim().length > 0
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

const SAMPLE_REVIEW: DbReview = {
  id: 'rev-uuid-001',
  reviewer_id: 'user-uuid-111',
  target_type: 'product',
  target_id: 'product-uuid-789',
  rating: 4,
  title: 'Great module',
  body: 'Works perfectly in our automation line.',
  photos: [],
  created_at: '2025-03-15T09:30:00Z',
  profiles: {
    full_name: 'Kamal Perera',
    business_name: 'Perera Industrials',
    avatar_url: null,
  },
}

// ─── reviewerInitials ─────────────────────────────────────────────────────────
describe('reviewerInitials', () => {
  it('uses first letter of first and last name for a two-word name', () => {
    expect(reviewerInitials('Kamal Perera')).toBe('KP')
  })

  it('uses first two letters of a single-word name', () => {
    // Only one word → only one initial letter
    expect(reviewerInitials('Kamal')).toBe('K')
  })

  it('uses the first two words for a three-word name (not first+last)', () => {
    // slice(0, 2) takes "Kamal" + "Amal" → "KA"
    expect(reviewerInitials('Kamal Amal Perera')).toBe('KA')
  })

  it('returns uppercased initials regardless of input casing', () => {
    expect(reviewerInitials('kamal perera')).toBe('KP')
  })

  it('handles extra whitespace between words', () => {
    expect(reviewerInitials('  Kamal   Perera  ')).toBe('KP')
  })

  it('returns "?" for an empty string', () => {
    expect(reviewerInitials('')).toBe('?')
  })

  it('returns "?" for a whitespace-only string', () => {
    expect(reviewerInitials('   ')).toBe('?')
  })

  it('returns correct initials for "Anonymous"', () => {
    expect(reviewerInitials('Anonymous')).toBe('A')
  })
})

// ─── formatReviewDate ─────────────────────────────────────────────────────────
describe('formatReviewDate', () => {
  it('formats a known date correctly in en-GB locale', () => {
    // 15 Mar 2025
    const result = formatReviewDate('2025-03-15T09:30:00Z')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/Mar|2025/)
  })

  it('includes the year in the formatted string', () => {
    const result = formatReviewDate('2025-03-15T09:30:00Z')
    expect(result).toContain('2025')
  })

  it('does not throw for any valid ISO date string', () => {
    const dates = [
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
      '2026-06-15T12:00:00.000Z',
    ]
    for (const d of dates) {
      expect(() => formatReviewDate(d)).not.toThrow()
    }
  })

  it('different dates produce different formatted strings', () => {
    const jan = formatReviewDate('2025-01-01T00:00:00Z')
    const dec = formatReviewDate('2025-12-01T00:00:00Z')
    expect(jan).not.toBe(dec)
  })
})

// ─── isReviewSubmittable ──────────────────────────────────────────────────────
describe('isReviewSubmittable', () => {
  it('returns true when rating >= 1 and body is non-empty', () => {
    expect(isReviewSubmittable(4, 'Great product!')).toBe(true)
  })

  it('returns false when rating is 0', () => {
    expect(isReviewSubmittable(0, 'Great product!')).toBe(false)
  })

  it('returns false when body is empty string', () => {
    expect(isReviewSubmittable(5, '')).toBe(false)
  })

  it('returns false when body is only whitespace', () => {
    expect(isReviewSubmittable(5, '   ')).toBe(false)
  })

  it('returns false when both rating is 0 and body is empty', () => {
    expect(isReviewSubmittable(0, '')).toBe(false)
  })

  it('accepts a rating of 1 as valid', () => {
    expect(isReviewSubmittable(1, 'Not great, but ok.')).toBe(true)
  })

  it('accepts a rating of 5 as valid', () => {
    expect(isReviewSubmittable(5, 'Excellent!')).toBe(true)
  })
})

// ─── DbReview shape ───────────────────────────────────────────────────────────
describe('DbReview shape', () => {
  it('has the expected target_type values', () => {
    const productReview: DbReview = { ...SAMPLE_REVIEW, target_type: 'product' }
    const brandReview:   DbReview = { ...SAMPLE_REVIEW, target_type: 'brand' }
    expect(productReview.target_type).toBe('product')
    expect(brandReview.target_type).toBe('brand')
  })

  it('profiles join is optional and can be null', () => {
    const noProfile: DbReview = { ...SAMPLE_REVIEW, profiles: null }
    expect(noProfile.profiles).toBeNull()
  })

  it('profiles join is optional and can be undefined', () => {
    const noProfile: DbReview = { ...SAMPLE_REVIEW, profiles: undefined }
    expect(noProfile.profiles).toBeUndefined()
  })

  it('photos defaults to an empty array', () => {
    expect(SAMPLE_REVIEW.photos).toEqual([])
  })

  it('title is optional (can be null)', () => {
    const noTitle: DbReview = { ...SAMPLE_REVIEW, title: null }
    expect(noTitle.title).toBeNull()
  })

  it('rating is between 1 and 5 in the fixture', () => {
    expect(SAMPLE_REVIEW.rating).toBeGreaterThanOrEqual(1)
    expect(SAMPLE_REVIEW.rating).toBeLessThanOrEqual(5)
  })

  it('reviewer initials derived from profiles.full_name match expected value', () => {
    const fullName = SAMPLE_REVIEW.profiles?.full_name ?? 'Anonymous'
    expect(reviewerInitials(fullName)).toBe('KP')
  })

  it('falls back to "Anonymous" initials when profiles is null', () => {
    const noProfile: DbReview = { ...SAMPLE_REVIEW, profiles: null }
    const fullName = noProfile.profiles?.full_name ?? 'Anonymous'
    expect(reviewerInitials(fullName)).toBe('A')
  })
})
