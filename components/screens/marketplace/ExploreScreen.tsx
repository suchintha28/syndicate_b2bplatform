'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, SkeletonCard, EmptyState, PageHeader, Tabs, Chip } from '@/components/ui'
import { BusinessCard, ProductCard } from '@/components/cards'
import { createClient } from '@/lib/supabase/client'
import { dbBrandToBusiness, dbProductToProduct } from '@/lib/supabase/queries'
import { CATEGORIES, LOCATIONS, PRICE_RANGES, RATING_FILTERS, type Business, type Product, type NavOpts } from '@/lib/data'
import type { CommonProps } from './_shared'

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
