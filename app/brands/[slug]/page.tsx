import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { DbBrand, DbProduct } from '@/types/database'

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single<DbBrand>()

  if (!brand) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const dbProducts = (products || []) as DbProduct[]

  const nameParts = brand.name.trim().split(/\s+/).filter(Boolean)
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : brand.name.slice(0, 2).toUpperCase()

  const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`
  const CATEGORY_COVERS: Record<string, string> = {
    Manufacturing: IMG('photo-1565793298831-09f04bb2ce80'),
    Technology:    IMG('photo-1518770660439-4636190af475'),
    Construction:  IMG('photo-1503387762-592deb58ef4e'),
    Logistics:     IMG('photo-1601584115197-04ecc0da31d7'),
    'Food & Bev':  IMG('photo-1495474472287-4d71bcdd2085'),
    Services:      IMG('photo-1556761175-5973dc0f32e7'),
  }
  const primaryCategory = brand.categories[0] || 'Services'
  const coverUrl = brand.cover_image_url || CATEGORY_COVERS[primaryCategory] || IMG('photo-1556761175-5973dc0f32e7')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top navigation */}
      <nav style={{ height: 'var(--nav-h)', borderBottom: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-inter-tight, Inter, sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 800 }}>S</span>
          Syndicate
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/" className="btn btn-secondary btn-sm">← Marketplace</Link>
      </nav>

      {/* Cover */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      <div className="container" style={{ maxWidth: 900, marginTop: -72, position: 'relative', zIndex: 2, paddingBottom: 80 }}>
        {/* Brand header card */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div className="flex items-start gap-5 flex-wrap" style={{ marginBottom: 24 }}>
            <span className="avatar avatar-xl">{initials}</span>
            <div className="flex-1" style={{ minWidth: 240 }}>
              <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.1 }}>{brand.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {brand.is_verified && (
                  <span className="badge badge-verified flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Verified
                  </span>
                )}
                {brand.categories.map(c => (
                  <span key={c} className="badge badge-neutral">{c}</span>
                ))}
              </div>
              <div className="flex items-center text-sm" style={{ gap: '4px 14px', flexWrap: 'wrap', color: 'var(--ink2)' }}>
                {brand.city && <span>📍 {brand.city}, Sri Lanka</span>}
                {brand.website && (
                  <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                    🔗 {brand.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap" style={{ flexShrink: 0 }}>
              <Link href={`/?brand=${brand.slug}#rfq`} className="btn btn-primary">
                Send inquiry
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {[
              { l: 'Products', v: String(dbProducts.length) },
              { l: 'Category', v: primaryCategory },
              { l: 'Location', v: brand.city || '—' },
              { l: 'Status', v: brand.is_verified ? 'Verified' : 'Active' },
            ].map((s, i) => (
              <div key={i}>
                <div className="uppercase-label mb-1">{s.l}</div>
                <div className="font-display font-bold text-xl">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="uppercase-label mb-3">About</div>
          <p style={{ lineHeight: 1.7, color: 'var(--ink2)', margin: 0 }}>{brand.description}</p>
        </div>

        {/* Contact */}
        {(brand.phone || brand.email || brand.address) && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="uppercase-label mb-3">Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brand.email && (
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ width: 32, height: 32, borderRadius: 'var(--r-xs)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>✉️</span>
                  <a href={`mailto:${brand.email}`} style={{ color: 'var(--primary)' }}>{brand.email}</a>
                </div>
              )}
              {brand.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ width: 32, height: 32, borderRadius: 'var(--r-xs)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>📞</span>
                  <a href={`tel:${brand.phone}`} style={{ color: 'var(--primary)' }}>{brand.phone}</a>
                </div>
              )}
              {brand.address && (
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ width: 32, height: 32, borderRadius: 'var(--r-xs)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>📍</span>
                  <span style={{ color: 'var(--ink2)' }}>{brand.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{ marginBottom: 24 }}>
          <div className="uppercase-label mb-3">Products ({dbProducts.length})</div>
          {dbProducts.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div className="font-display font-semibold" style={{ marginBottom: 4 }}>No products listed yet</div>
              <div className="text-sm">This supplier hasn&apos;t added any products.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {dbProducts.map(p => {
                const priceMin = p.price_range_min
                const priceLabel = priceMin ? `LKR ${Math.round(priceMin).toLocaleString()}` : 'Contact for price'
                const imgSrc = p.images[0] || `https://picsum.photos/seed/${p.id}/400/300`
                return (
                  <Link key={p.id} href={`/products/${p.slug}`} className="card card-hover" style={{ display: 'block', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-alt)' }}>
                      <img src={imgSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/400/300` }} />
                    </div>
                    <div style={{ padding: 16 }}>
                      <span className="badge badge-neutral" style={{ marginBottom: 8, display: 'inline-block' }}>{p.category}</span>
                      <div className="font-display font-semibold" style={{ fontSize: 15, lineHeight: 1.3, marginBottom: 6 }}>{p.name}</div>
                      {p.min_order_quantity && (
                        <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: 4 }}>MOQ: {p.min_order_quantity} {p.unit || 'units'}</div>
                      )}
                      <div>
                        <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>from</div>
                        <div className="font-display font-bold text-lg">{priceLabel}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="card" style={{ padding: 32, background: 'var(--ink)', color: 'white', textAlign: 'center', borderColor: 'var(--ink)' }}>
          <h3 className="font-display font-bold text-2xl mb-2">Ready to work with {brand.name}?</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Send an inquiry and get a response within 48 hours.</p>
          <Link href="/" className="btn btn-primary btn-lg">Send inquiry via Syndicate</Link>
        </div>
      </div>
    </div>
  )
}
