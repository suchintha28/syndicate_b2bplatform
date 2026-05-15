import type { DbBrand, DbProduct } from '@/types/database'
import type { Business, Product } from '@/lib/data'

export function dbBrandToBusiness(brand: DbBrand): Business {
  const parts = brand.name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : brand.name.slice(0, 2).toUpperCase()

  const primaryCategory = brand.categories[0] || 'Services'

  return {
    id: brand.id,
    slug: brand.slug,
    logo: initials,
    name: brand.name,
    category: primaryCategory,
    // rating and reviews start at 0; BusinessDetailScreen computes live values
    // from the reviews it fetches so the card shows real data once available.
    rating: 0,
    reviews: 0,
    description: brand.description,
    verified: brand.is_verified,
    featured: false,
    location: [brand.city, 'Sri Lanka'].filter(Boolean).join(', '),
    priceRange: '',
    founded: new Date(brand.created_at).getFullYear(),
    // employees is not stored in the database — intentionally omitted
    cover: brand.cover_image_url || '',
    logoUrl: brand.logo_url || undefined,
  }
}

export function dbProductToProduct(product: DbProduct): Product {
  const priceMin = product.price_range_min
  const priceFormatted = priceMin
    ? `LKR ${Math.round(priceMin).toLocaleString()}`
    : 'Contact for price'

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: priceFormatted,
    image: (product.images ?? [])[0] || '',
    images: (product.images ?? []).filter(Boolean),
    category: product.category,
    businessId: product.brand_id,
    status: 'Active' as const,
    sales: 0,
    variations: (product.variations ?? []).map(v => ({ name: v.name, price: Number(v.price) })),
    tieredPricing: (product.tiered_pricing ?? []).length
      ? (product.tiered_pricing ?? []).map(t => ({ min: t.min, max: t.max, price: Number(t.price) }))
      : priceMin ? [{ min: 1, max: null, price: priceMin }] : [],
    videoUrl: '',
    directSales: false,
    description: product.description,
    productSpecs: (product.product_specs ?? []).map(s => ({ label: s.l, value: s.v })),
    techSpecs:    (product.tech_specs    ?? []).map(s => ({ label: s.l, value: s.v })),
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
