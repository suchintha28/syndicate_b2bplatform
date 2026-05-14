import type { DbBrand, DbProduct } from '@/types/database'
import type { Business, Product } from '@/lib/data'

const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

const CATEGORY_COVERS: Record<string, string> = {
  Manufacturing: IMG('photo-1565793298831-09f04bb2ce80'),
  Technology:    IMG('photo-1518770660439-4636190af475'),
  Construction:  IMG('photo-1503387762-592deb58ef4e'),
  Logistics:     IMG('photo-1601584115197-04ecc0da31d7'),
  'Food & Bev':  IMG('photo-1495474472287-4d71bcdd2085'),
  Services:      IMG('photo-1556761175-5973dc0f32e7'),
}
const DEFAULT_COVER = IMG('photo-1556761175-5973dc0f32e7')

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
    rating: 4.5,
    reviews: 0,
    description: brand.description,
    verified: brand.is_verified,
    featured: false,
    location: [brand.city, 'Sri Lanka'].filter(Boolean).join(', '),
    priceRange: '$$',
    founded: new Date(brand.created_at).getFullYear(),
    employees: '10-50',
    cover: brand.cover_image_url || CATEGORY_COVERS[primaryCategory] || DEFAULT_COVER,
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
    image: product.images[0] || `https://picsum.photos/seed/${product.id}/400/300`,
    category: product.category,
    businessId: product.brand_id,
    status: 'Active' as const,
    sales: 0,
    variations: [],
    tieredPricing: priceMin ? [{ min: 1, max: null, price: priceMin }] : [],
    videoUrl: '',
    directSales: false,
    description: product.description,
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
