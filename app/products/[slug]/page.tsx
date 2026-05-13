import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { DbBrand, DbProduct } from '@/types/database'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single<DbProduct>()

  if (!product) notFound()

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', product.brand_id)
    .eq('is_active', true)
    .single<DbBrand>()

  const priceMin = product.price_range_min
  const priceMax = product.price_range_max
  const priceLabel = priceMin
    ? priceMax && priceMax !== priceMin
      ? `LKR ${Math.round(priceMin).toLocaleString()} – ${Math.round(priceMax).toLocaleString()}`
      : `LKR ${Math.round(priceMin).toLocaleString()}`
    : 'Contact for price'

  const imgSrc = product.images[0] || `https://picsum.photos/seed/${product.id}/800/600`

  const brandInitials = brand
    ? (() => {
        const parts = brand.name.trim().split(/\s+/).filter(Boolean)
        return parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : brand.name.slice(0, 2).toUpperCase()
      })()
    : '??'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top navigation */}
      <nav style={{ height: 'var(--nav-h)', borderBottom: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-inter-tight, Inter, sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 800 }}>S</span>
          Syndicate
        </Link>
        <div style={{ flex: 1 }} />
        {brand && (
          <Link href={`/brands/${brand.slug}`} className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
            ← {brand.name}
          </Link>
        )}
        <Link href="/" className="btn btn-ghost btn-sm">Marketplace</Link>
      </nav>

      <div className="container" style={{ maxWidth: 900, paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="product-detail-grid">
          {/* Image */}
          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '4/3', background: 'var(--bg-alt)' }}>
            <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/800/600` }} />
          </div>

          {/* Details */}
          <div>
            <span className="badge badge-verified">{product.category}</span>
            <h1 className="font-display" style={{ fontSize: 34, fontWeight: 700, margin: '12px 0 12px', lineHeight: 1.1 }}>{product.name}</h1>
            <p style={{ color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 24 }}>{product.description}</p>

            {/* Price */}
            <div style={{ padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
              <div className="uppercase-label mb-1">Starting at</div>
              <div className="font-display font-bold" style={{ fontSize: 38, lineHeight: 1 }}>{priceLabel}</div>
              {product.min_order_quantity && (
                <div className="text-sm" style={{ color: 'var(--muted)', marginTop: 6 }}>
                  Minimum order: {product.min_order_quantity} {product.unit || 'units'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap mb-6">
              <Link href="/" className="btn btn-primary btn-lg">Request quote</Link>
              {brand && (
                <Link href={`/brands/${brand.slug}`} className="btn btn-secondary btn-lg">View supplier</Link>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map(tag => (
                  <span key={tag} className="badge badge-neutral">{tag}</span>
                ))}
              </div>
            )}

            {/* Sold by */}
            {brand && (
              <Link href={`/brands/${brand.slug}`} className="card card-hover" style={{ padding: 16, display: 'block' }}>
                <div className="uppercase-label mb-2">Sold by</div>
                <div className="flex items-center gap-3">
                  <span className="avatar avatar-md">{brandInitials}</span>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold">{brand.name}</span>
                      {brand.is_verified && (
                        <span className="badge badge-verified" style={{ fontSize: 11 }}>✓ Verified</span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {brand.categories[0]} {brand.city ? `· ${brand.city}` : ''}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
