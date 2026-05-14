'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, Stars, Chip, SkeletonCard, EmptyState, PageHeader, BackLink, Tabs, VerifiedMark } from '@/components/ui'
import { BusinessCard, ProductCard, CategoryTile } from '@/components/cards'
import { createClient } from '@/lib/supabase/client'
import { dbBrandToBusiness, dbProductToProduct } from '@/lib/supabase/queries'
import {
  CATEGORIES, LOCATIONS, PRICE_RANGES, RATING_FILTERS, REVIEWS,
  type Business, type Product, type Screen, type NavOpts
} from '@/lib/data'

interface CommonProps {
  goTo: (s: Screen, opts?: NavOpts) => void
  setSelectedBusiness: (b: Business | null) => void
  setSelectedProduct: (p: Product | null) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  cardStyle: 'bordered' | 'shadow' | 'minimal'
}

/* ── HomeScreen ─────────────────────────────── */
export function HomeScreen({ goTo, setSelectedBusiness, setSelectedProduct, favorites, toggleFavorite, recentlyViewedBrands, cardStyle }: CommonProps & { recentlyViewedBrands: Business[] }) {
  const [featuredBrands, setFeaturedBrands] = useState<Business[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [discoverBrands, setDiscoverBrands] = useState<Business[]>([])
  const [stats, setStats] = useState({ suppliers: 0, products: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = createClient()
      const [brandsRes, productsRes, brandCountRes, productCountRes] = await Promise.all([
        supabase.from('brands').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(12),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(4),
        supabase.from('brands').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ])
      if (!mounted) return
      const brands = (brandsRes.data || []).map(dbBrandToBusiness)
      setFeaturedBrands(brands.slice(0, 6))
      setDiscoverBrands(brands.slice(6))
      setTrendingProducts((productsRes.data || []).map(dbProductToProduct))
      setStats({ suppliers: brandCountRes.count || 0, products: productCountRes.count || 0 })
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="container fade-up">
      {/* Hero */}
      <section className="hero" style={{ marginTop: 32 }}>
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>{stats.suppliers > 0 ? `${stats.suppliers.toLocaleString()}+ verified suppliers` : 'Verified suppliers'}</span>
          </div>
          <h1 className="hero-title">The B2B network<br />built for serious buyers.</h1>
          <p className="hero-sub">Find verified suppliers, request quotes, and source at scale. From IoT components to logistics — one network.</p>
          <form className="hero-search" onSubmit={(e) => { e.preventDefault(); goTo('listing') }}>
            <input type="text" placeholder="Search suppliers, products, or capabilities…" className="field" onFocus={() => goTo('listing')} />
            <Button variant="primary" type="submit" icon="search">Search</Button>
          </form>
          <div className="hero-stats">
            <div><div className="hero-stat-num">{stats.suppliers > 0 ? stats.suppliers.toLocaleString() : '—'}</div><div className="hero-stat-label">Suppliers</div></div>
            <div><div className="hero-stat-num">{stats.products > 0 ? stats.products.toLocaleString() : '—'}</div><div className="hero-stat-label">Products</div></div>
            <div><div className="hero-stat-num">LKR 480B</div><div className="hero-stat-label">In RFQs YTD</div></div>
            <div><div className="hero-stat-num">98%</div><div className="hero-stat-label">Verified</div></div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="uppercase-label mb-1">Browse by industry</div>
            <h2 className="section-title">Categories</h2>
          </div>
        </div>
        <div className="grid-categories">
          {CATEGORIES.map(c => <CategoryTile key={c} name={c} onClick={() => goTo('listing', { category: c })} />)}
        </div>
      </section>

      {/* Featured */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="uppercase-label mb-1">Hand-picked this week</div>
            <h2 className="section-title">Featured suppliers</h2>
          </div>
          <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => goTo('listing')}>See all</Button>
        </div>
        {loading ? (
          <div className="grid-businesses">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={300} />)}</div>
        ) : featuredBrands.length === 0 ? (
          <EmptyState icon="briefcase" title="No suppliers yet" sub="Check back soon — verified businesses are joining every day." />
        ) : (
          <div className="grid-businesses">
            {featuredBrands.map(b => (
              <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
                favorited={favorites.includes(b.id)}
                onFavorite={() => toggleFavorite(b.id)}
                onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
                onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trending products */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="uppercase-label mb-1">Top sellers right now</div>
            <h2 className="section-title">Trending products</h2>
          </div>
          <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => goTo('listing', { tab: 'products' })}>Browse products</Button>
        </div>
        {loading ? (
          <div className="grid-products">{[1,2,3,4].map(i => <SkeletonCard key={i} height={260} />)}</div>
        ) : trendingProducts.length === 0 ? (
          <EmptyState icon="box" title="No products yet" sub="Products will appear here once suppliers start listing." />
        ) : (
          <div className="grid-products">
            {trendingProducts.map(p => (
              <ProductCard key={p.id} product={p} cardStyle={cardStyle}
                onClick={() => { setSelectedProduct(p); goTo('product-detail') }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently viewed */}
      {recentlyViewedBrands.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <div className="uppercase-label mb-1">Pick up where you left off</div>
              <h2 className="section-title">Recently viewed</h2>
            </div>
          </div>
          <div className="grid-businesses">
            {recentlyViewedBrands.slice(0, 3).map(b => (
              <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
                favorited={favorites.includes(b.id)}
                onFavorite={() => toggleFavorite(b.id)}
                onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
                onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discover all */}
      <section className="section" style={{ paddingBottom: 64 }}>
        <div className="section-header">
          <div>
            <div className="uppercase-label mb-1">More on the platform</div>
            <h2 className="section-title">Discover suppliers</h2>
          </div>
        </div>
        {loading ? (
          <div className="grid-businesses">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={300} />)}</div>
        ) : discoverBrands.length === 0 ? null : (
          <div className="grid-businesses">
            {discoverBrands.map(b => (
              <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
                favorited={favorites.includes(b.id)}
                onFavorite={() => toggleFavorite(b.id)}
                onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
                onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── ExploreScreen ──────────────────────────── */
export function ExploreScreen({ goTo, setSelectedBusiness, setSelectedProduct, favorites, toggleFavorite, initialFilter, cardStyle }: CommonProps & { initialFilter: NavOpts | null }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.category || 'All Industries')
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [selectedRating, setSelectedRating] = useState('All Ratings')
  const [selectedPrice, setSelectedPrice] = useState('All Prices')
  const [sortOrder, setSortOrder] = useState('relevance')
  const [exploreTab, setExploreTab] = useState(initialFilter?.tab || 'businesses')
  const [allBrands, setAllBrands] = useState<Business[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      const supabase = createClient()
      const [brandsRes, productsRes] = await Promise.all([
        supabase.from('brands').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ])
      if (!mounted) return
      setAllBrands((brandsRes.data || []).map(dbBrandToBusiness))
      setAllProducts((productsRes.data || []).map(dbProductToProduct))
      setIsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    let f = [...allBrands]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.location.toLowerCase().includes(q))
    }
    if (selectedCategory !== 'All Industries') f = f.filter(b => b.category === selectedCategory)
    if (selectedLocation !== 'All Locations') f = f.filter(b => b.location.includes(selectedLocation.split(',')[0]))
    if (selectedRating === '5 Stars') f = f.filter(b => b.rating === 5)
    else if (selectedRating === '4+ Stars') f = f.filter(b => b.rating >= 4)
    else if (selectedRating === '3+ Stars') f = f.filter(b => b.rating >= 3)
    if (selectedPrice !== 'All Prices') f = f.filter(b => b.priceRange === selectedPrice)
    if (sortOrder === 'a-z') f.sort((a, b) => a.name.localeCompare(b.name))
    if (sortOrder === 'z-a') f.sort((a, b) => b.name.localeCompare(a.name))
    if (sortOrder === 'rating') f.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    return f
  }, [allBrands, searchQuery, selectedCategory, selectedLocation, selectedRating, selectedPrice, sortOrder])

  const filteredProducts = useMemo(() => {
    let f = [...allProducts]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (selectedCategory !== 'All Industries') f = f.filter(p => p.category === selectedCategory)
    return f
  }, [allProducts, searchQuery, selectedCategory])

  const resetFilters = () => {
    setSearchQuery(''); setSelectedCategory('All Industries'); setSelectedLocation('All Locations')
    setSelectedRating('All Ratings'); setSelectedPrice('All Prices'); setSortOrder('relevance')
  }

  const activeFilters = [
    selectedCategory !== 'All Industries' && { label: selectedCategory, clear: () => setSelectedCategory('All Industries') },
    selectedLocation !== 'All Locations' && { label: selectedLocation, clear: () => setSelectedLocation('All Locations') },
    selectedRating !== 'All Ratings' && { label: selectedRating, clear: () => setSelectedRating('All Ratings') },
    selectedPrice !== 'All Prices' && { label: selectedPrice, clear: () => setSelectedPrice('All Prices') },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Marketplace"
        title="Explore suppliers"
        sub={isLoading ? 'Loading…' : `${allBrands.length} verified businesses across ${CATEGORIES.length} industries`}
        action={
          <Tabs value={exploreTab} onChange={setExploreTab} tabs={[
            { value: 'businesses', label: 'Businesses', count: allBrands.length },
            { value: 'products',   label: 'Products',   count: allProducts.length },
          ]} />
        }
      />

      <div className="layout-explore">
        {/* Sidebar */}
        <aside>
          <div className="card" style={{ padding: 20, position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Icon name="sliders" size={15} />Filters
              </h3>
              {activeFilters.length > 0 && (
                <button className="text-xs font-semibold" style={{ color: 'var(--primary)' }} onClick={resetFilters}>Reset</button>
              )}
            </div>
            <div className="mb-4">
              <label className="field-label">Search</label>
              <input className="field field-search" type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="field-label">Industry</label>
              <select className="field" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {['All Industries', ...CATEGORIES].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="field-label">Location</label>
              <select className="field" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                {LOCATIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="field-label">Rating</label>
              <select className="field" value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)}>
                {RATING_FILTERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="field-label">Price range</label>
              <select className="field" value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)}>
                {PRICE_RANGES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="mb-2">
              <label className="field-label">Sort by</label>
              <div className="flex flex-wrap gap-2">
                {[{ v: 'relevance', l: 'Relevance' }, { v: 'rating', l: 'Top rated' }, { v: 'a-z', l: 'A→Z' }, { v: 'z-a', l: 'Z→A' }].map(s => (
                  <Chip key={s.v} active={sortOrder === s.v} onClick={() => setSortOrder(s.v)}>{s.l}</Chip>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.length === 0 ? (
                <span className="text-sm text-muted">
                  Showing <span className="font-mono font-semibold text-ink2">
                    {exploreTab === 'businesses' ? filtered.length : filteredProducts.length}
                  </span> {exploreTab === 'businesses' ? 'suppliers' : 'products'}
                </span>
              ) : activeFilters.map((f, i) => (
                <Chip key={i} active removable onRemove={f.clear}>{f.label}</Chip>
              ))}
            </div>
            {activeFilters.length > 0 && <button className="text-xs font-semibold text-muted" onClick={resetFilters}>Clear all</button>}
          </div>

          {exploreTab === 'businesses' ? (
            isLoading ? (
              <div className="grid-businesses">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={300} />)}</div>
            ) : filtered.length > 0 ? (
              <div className="grid-businesses">
                {filtered.map(b => (
                  <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
                    favorited={favorites.includes(b.id)}
                    onFavorite={() => toggleFavorite(b.id)}
                    onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
                    onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No suppliers match those filters" sub="Try widening your search or clearing filters."
                action={<Button variant="primary" onClick={resetFilters}>Clear filters</Button>} />
            )
          ) : (
            isLoading ? (
              <div className="grid-products">{[1,2,3,4].map(i => <SkeletonCard key={i} height={260} />)}</div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid-products">
                {filteredProducts.map(p => {
                  const biz = allBrands.find(b => b.id === p.businessId)
                  return (
                    <ProductCard key={p.id} product={p} business={biz} cardStyle={cardStyle}
                      onClick={() => { setSelectedProduct(p); setSelectedBusiness(biz || null); goTo('product-detail') }}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState title="No products match those filters" sub="Try a different search or category." />
            )
          )}
        </main>
      </div>
      <div style={{ paddingBottom: 64 }} />
    </div>
  )
}

/* ── BusinessDetailScreen ───────────────────── */
export function BusinessDetailScreen({ business, goTo, setSelectedProduct, favorites, toggleFavorite, cardStyle }: {
  business: Business | null
  goTo: (s: Screen) => void
  setSelectedProduct: (p: Product | null) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  cardStyle: 'bordered' | 'shadow' | 'minimal'
}) {
  const [brandProducts, setBrandProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    if (!business) return
    let mounted = true
    setProductsLoading(true)
    async function load() {
      if (!business) return
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', business.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (!mounted) return
      setBrandProducts((data || []).map(dbProductToProduct))
      setProductsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [business?.id])

  if (!business) return null
  const favorited = favorites.includes(business.id)

  return (
    <div className="fade-up">
      {/* Cover */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        <img src={business.cover} alt="" className="img-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${business.id}/1600/600` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      <div className="container" style={{ marginTop: -64, position: 'relative', zIndex: 2 }}>
        <button className="back-link" onClick={() => goTo('listing')} style={{ color: 'white', marginBottom: 12 }}>
          <Icon name="chevron-left" size={14} strokeWidth={2.5} /> Back to explore
        </button>

        <div className="card" style={{ padding: 28 }}>
          <div className="flex items-start gap-5 flex-wrap" style={{ marginBottom: 24 }}>
            <Avatar initials={business.logo} size="xl" />
            <div className="flex-1" style={{ minWidth: 240 }}>
              <h1 className="page-title" style={{ fontSize: 32, margin: '0 0 10px', lineHeight: 1.1 }}>{business.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {business.verified && <Badge variant="verified" icon="check">Verified</Badge>}
                {business.featured && <Badge variant="pro" icon="sparkle">Featured</Badge>}
                <Badge variant="neutral">{business.category}</Badge>
              </div>
              <div className="flex items-center text-sm text-ink2" style={{ gap: '4px 14px', flexWrap: 'wrap' }}>
                <Stars rating={business.rating} count={business.reviews} />
                {business.location && <span className="flex items-center gap-1"><Icon name="pin" size={13} />{business.location}</span>}
                <span className="font-mono text-muted">Est. {business.founded}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap" style={{ flexShrink: 0 }}>
              <Button variant="secondary" icon={favorited ? 'heart-fill' : 'heart'} onClick={() => toggleFavorite(business.id)}>
                {favorited ? 'Saved' : 'Save'}
              </Button>
              <Button variant="primary" icon="message" onClick={() => goTo('message-form')}>Message</Button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {[
              { l: 'Products', v: productsLoading ? '…' : String(brandProducts.length) },
              { l: 'Rating', v: `${business.rating}.0` },
              { l: 'Reviews', v: String(business.reviews) },
              { l: 'Employees', v: business.employees },
              { l: 'Price range', v: business.priceRange },
            ].map((s, i) => (
              <div key={i}>
                <div className="uppercase-label mb-1">{s.l}</div>
                <div className="font-display font-bold text-2xl">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          {/* About */}
          <section className="section" style={{ padding: 0, marginBottom: 32 }}>
            <h2 className="section-title mb-4">About</h2>
            <div className="card" style={{ padding: 24 }}>
              <p className="text-ink2 text-base" style={{ lineHeight: 1.6 }}>{business.description}</p>
            </div>
          </section>

          {/* Products */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Products</h2>
              {brandProducts.length > 4 && (
                <Button variant="ghost" size="sm" iconRight="arrow-right">View all {brandProducts.length}</Button>
              )}
            </div>
            {productsLoading ? (
              <div className="grid-products">{[1,2,3,4].map(i => <SkeletonCard key={i} height={260} />)}</div>
            ) : brandProducts.length === 0 ? (
              <EmptyState icon="box" title="No products listed yet" sub="This supplier hasn't added any products." />
            ) : (
              <div className="grid-products">
                {brandProducts.slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p} cardStyle={cardStyle}
                    onClick={() => { setSelectedProduct(p); goTo('product-detail') }} />
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="section">
            <h2 className="section-title mb-4">Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {REVIEWS.map((r, i) => (
                <div key={i} className="card" style={{ padding: 'var(--card-pad)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar initials={r.initials} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold">{r.name}</span>
                        <span className="text-xs text-muted">· {r.company}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars rating={r.rating} />
                        <span className="text-xs text-muted font-mono">{r.time}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-ink2" style={{ lineHeight: 1.55 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="section" style={{ paddingBottom: 64 }}>
            <div className="card" style={{ padding: 32, background: 'var(--ink)', color: 'white', textAlign: 'center', borderColor: 'var(--ink)' }}>
              <h3 className="font-display font-bold text-2xl mb-2">Need a custom quote?</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Send a detailed RFQ and get bids within 48 hours.</p>
              <Button variant="primary" size="lg" iconRight="arrow-right" onClick={() => goTo('rfq-create')}>Request a quote</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* ── ProductDetailScreen ────────────────────── */
export function ProductDetailScreen({ product, business, goTo, setSelectedBusiness }: {
  product: Product | null
  business: Business | null
  goTo: (s: Screen) => void
  setSelectedBusiness: (b: Business | null) => void
}) {
  if (!product) return null
  return (
    <div className="container fade-up" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('detail')}>Back to {business?.name || 'supplier'}</BackLink>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="product-detail-grid">
        <div className="img-wrap" style={{ borderRadius: 'var(--r-lg)', aspectRatio: '4/3' }}>
          <img src={product.image} alt={product.name} className="img-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/p${product.id}/800/600` }} />
        </div>

        <div>
          <Badge variant="verified">{product.category}</Badge>
          <h1 className="page-title mt-3" style={{ fontSize: 36 }}>{product.name}</h1>
          <p className="text-ink2 text-base mb-4" style={{ lineHeight: 1.6 }}>{product.description}</p>

          <div className="flex items-end gap-4 mb-6" style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="uppercase-label mb-1">Starting at</div>
              <div className="font-display font-bold" style={{ fontSize: 40, lineHeight: 1 }}>{product.price}</div>
            </div>
            {product.directSales && <Badge variant="success" icon="zap">Direct sales available</Badge>}
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {product.directSales
              ? <Button variant="primary" size="lg" icon="cart">Buy now</Button>
              : <Button variant="primary" size="lg" icon="file" onClick={() => goTo('rfq-create')}>Request quote</Button>
            }
            <Button variant="secondary" size="lg" icon="message" onClick={() => goTo('message-form')}>Contact seller</Button>
          </div>

          {/* Sold by */}
          {business && (
            <div className="card card-hover" style={{ padding: 16, marginBottom: 20, cursor: 'pointer' }}
              onClick={() => { setSelectedBusiness(business); goTo('detail') }}>
              <div className="uppercase-label mb-2">Sold by</div>
              <div className="flex items-center gap-3">
                <Avatar initials={business.logo} size="md" />
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div style={{ lineHeight: 1.2, marginBottom: 2 }}>
                    <span className="font-display font-semibold">{business.name}</span>
                    {business.verified && <span style={{ marginLeft: 4, verticalAlign: 'middle', display: 'inline-block' }}><VerifiedMark size={13} /></span>}
                  </div>
                  <div className="text-xs text-muted">{business.category} · {business.location}</div>
                </div>
                <Icon name="chevron-right" size={16} stroke="var(--muted)" />
              </div>
            </div>
          )}

          {/* Variations */}
          {product.variations.length > 0 && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 className="font-display font-bold text-base mb-3">Variations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.variations.map((v, i) => (
                  <label key={i} className="flex items-center justify-between"
                    style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="variation" defaultChecked={i === 0} />
                      <span className="font-medium">{v.name}</span>
                    </div>
                    <span className="font-display font-bold">LKR {v.price.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tiered pricing */}
          {product.tieredPricing.length > 1 && (
            <div className="card" style={{ padding: 20, background: 'var(--primary-soft)', borderColor: 'rgba(79,70,229,0.15)' }}>
              <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2" style={{ color: 'var(--primary-ink)' }}>
                <Icon name="trending" size={16} /> Bulk pricing
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {product.tieredPricing.map((t, i) => (
                  <div key={i} style={{ background: 'white', padding: 14, borderRadius: 'var(--r-sm)' }}>
                    <div className="font-mono text-xs text-muted">{t.min}{t.max ? `–${t.max}` : '+'} units</div>
                    <div className="font-display font-bold text-xl">LKR {t.price.toLocaleString()}<span className="text-sm text-muted font-medium">/ea</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── SavedScreen ────────────────────────────── */
export function SavedScreen({ goTo, favorites, toggleFavorite, setSelectedBusiness, brandsCache, cardStyle }: {
  goTo: (s: Screen) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  setSelectedBusiness: (b: Business | null) => void
  brandsCache: Record<string, Business>
  cardStyle: 'bordered' | 'shadow' | 'minimal'
}) {
  const saved = favorites.map(id => brandsCache[id]).filter(Boolean) as Business[]
  return (
    <div className="container fade-up">
      <PageHeader eyebrow="Your collection" title="Saved suppliers" sub={`${saved.length} ${saved.length === 1 ? 'business' : 'businesses'} bookmarked`} />
      {saved.length === 0 ? (
        <EmptyState icon="heart" title="Nothing saved yet" sub="Tap the heart on any supplier card to add it here."
          action={<Button variant="primary" onClick={() => goTo('listing')}>Explore suppliers</Button>} />
      ) : (
        <div className="grid-businesses" style={{ paddingBottom: 64 }}>
          {saved.map(b => (
            <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
              favorited
              onFavorite={() => toggleFavorite(b.id)}
              onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
              onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
