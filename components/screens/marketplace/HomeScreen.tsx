'use client'

import React, { useState, useEffect } from 'react'
import { Button, SkeletonCard, EmptyState } from '@/components/ui'
import { BusinessCard, ProductCard, CategoryTile } from '@/components/cards'
import { createClient } from '@/lib/supabase/client'
import { dbBrandToBusiness, dbProductToProduct } from '@/lib/supabase/queries'
import { CATEGORIES, type Business, type Product } from '@/lib/data'
import type { CommonProps } from './_shared'

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
