import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/supabase/queries'

/**
 * generateSlug — converts a business/product name into a URL-safe slug.
 * Used when creating brands and products.
 */
describe('generateSlug', () => {
  it('generates a slug from a normal string', () => {
    expect(generateSlug('TechMakers Inc')).toBe('techmakers-inc')
  })

  it('lowercases the entire slug', () => {
    expect(generateSlug('UPPER CASE NAME')).toBe('upper-case-name')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('hello world')).toBe('hello-world')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(generateSlug('too   many   spaces')).toBe('too-many-spaces')
  })

  it('removes special characters like @, #, !, &', () => {
    expect(generateSlug('Rocks & Rolls! #1')).toBe('rocks-rolls-1')
  })

  it('removes punctuation like dots and commas', () => {
    expect(generateSlug('A.B.C, Ltd.')).toBe('abc-ltd')
  })

  it('preserves hyphens that are already in the name', () => {
    expect(generateSlug('well-known brand')).toBe('well-known-brand')
  })

  it('handles an empty string without throwing', () => {
    expect(generateSlug('')).toBe('')
  })

  it('trims leading and trailing whitespace before slugifying', () => {
    expect(generateSlug('  trimmed  ')).toBe('trimmed')
  })
})
