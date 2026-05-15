import { describe, it, expect } from 'vitest'
import { dbBrandToBusiness, dbProductToProduct } from '@/lib/supabase/queries'
import type { DbBrand, DbProduct } from '@/types/database'

/**
 * DB adapters — convert raw Supabase database rows into the clean UI types
 * used throughout the app. These are critical: a broken adapter means the
 * entire marketplace shows no data or crashes.
 */

// ─── Minimal valid DbBrand row (all required fields present) ──────────────────
const VALID_BRAND: DbBrand = {
  id: 'brand-uuid-123',
  owner_id: 'user-uuid-456',
  name: 'Acme Electronics',
  slug: 'acme-electronics',
  description: 'Supplier of industrial electronics.',
  logo_url: 'https://cdn.example.com/logo.jpg',
  cover_image_url: 'https://cdn.example.com/cover.jpg',
  website: 'https://acme.lk',
  phone: '+94 11 234 5678',
  email: 'hello@acme.lk',
  address: '42 Main Street',
  city: 'Colombo',
  categories: ['Technology', 'Manufacturing'],
  is_verified: true,
  is_active: true,
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-15T00:00:00Z',
}

// ─── Minimal valid DbProduct row ──────────────────────────────────────────────
const VALID_PRODUCT: DbProduct = {
  id: 'product-uuid-789',
  brand_id: 'brand-uuid-123',
  name: 'Smart Relay Module',
  slug: 'smart-relay-module',
  description: 'Industrial-grade relay for automation.',
  images: ['https://cdn.example.com/product.jpg'],
  category: 'Technology',
  subcategory: 'Automation',
  min_order_quantity: 10,
  price_range_min: 45000,
  price_range_max: 52000,
  unit: 'units',
  tags: ['relay', 'automation'],
  is_active: true,
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
}

// ─── dbBrandToBusiness ────────────────────────────────────────────────────────
describe('dbBrandToBusiness', () => {
  it('returns an object with the correct id', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.id).toBe('brand-uuid-123')
  })

  it('preserves the slug from the database row', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.slug).toBe('acme-electronics')
  })

  it('sets the brand name correctly', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.name).toBe('Acme Electronics')
  })

  it('generates initials from the first and last word of the brand name', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    // "Acme Electronics" → "AE"
    expect(result.logo).toBe('AE')
  })

  it('uses the first category as the primary category', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.category).toBe('Technology')
  })

  it('marks verified brands as verified', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.verified).toBe(true)
  })

  it('marks unverified brands as not verified', () => {
    const unverified: DbBrand = { ...VALID_BRAND, is_verified: false }
    const result = dbBrandToBusiness(unverified)
    expect(result.verified).toBe(false)
  })

  it('includes Sri Lanka in the location string', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.location).toContain('Sri Lanka')
    expect(result.location).toContain('Colombo')
  })

  it('uses logo_url when provided', () => {
    const result = dbBrandToBusiness(VALID_BRAND)
    expect(result.logoUrl).toBe('https://cdn.example.com/logo.jpg')
  })

  it('handles a single-word brand name — generates a 2-char initial from the name', () => {
    const singleWord: DbBrand = { ...VALID_BRAND, name: 'Acme' }
    const result = dbBrandToBusiness(singleWord)
    // Single word: slices first 2 chars → "AC"
    expect(result.logo).toBe('AC')
  })

  it('falls back to default cover image when cover_image_url is null', () => {
    const nocover: DbBrand = { ...VALID_BRAND, cover_image_url: null as unknown as string }
    const result = dbBrandToBusiness(nocover)
    // Should fall back to a category or default cover, not be empty
    expect(result.cover).toBeTruthy()
    expect(typeof result.cover).toBe('string')
  })

  it('sets logoUrl to undefined when logo_url is null', () => {
    const noLogo: DbBrand = { ...VALID_BRAND, logo_url: null as unknown as string }
    const result = dbBrandToBusiness(noLogo)
    expect(result.logoUrl).toBeUndefined()
  })

  it('defaults category to Services when categories array is empty', () => {
    const noCategories: DbBrand = { ...VALID_BRAND, categories: [] }
    const result = dbBrandToBusiness(noCategories)
    expect(result.category).toBe('Services')
  })
})

// ─── dbProductToProduct ───────────────────────────────────────────────────────
describe('dbProductToProduct', () => {
  it('returns an object with the correct id', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.id).toBe('product-uuid-789')
  })

  it('preserves the slug', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.slug).toBe('smart-relay-module')
  })

  it('sets the product name correctly', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.name).toBe('Smart Relay Module')
  })

  it('formats the price as a LKR string using price_range_min', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.price).toContain('LKR')
    expect(result.price).toContain('45,000')
  })

  it('uses the first image URL as the primary image', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.image).toBe('https://cdn.example.com/product.jpg')
  })

  it('links the product back to its brand via businessId', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.businessId).toBe('brand-uuid-123')
  })

  it('sets status to Active', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.status).toBe('Active')
  })

  it('shows "Contact for price" when price_range_min is null', () => {
    const noPrice: DbProduct = { ...VALID_PRODUCT, price_range_min: null as unknown as number }
    const result = dbProductToProduct(noPrice)
    expect(result.price).toBe('Contact for price')
  })

  it('falls back to a picsum placeholder image when images array is empty', () => {
    const noImages: DbProduct = { ...VALID_PRODUCT, images: [] }
    const result = dbProductToProduct(noImages)
    expect(result.image).toContain('picsum.photos')
  })

  it('preserves the product description', () => {
    const result = dbProductToProduct(VALID_PRODUCT)
    expect(result.description).toBe('Industrial-grade relay for automation.')
  })
})
