'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, SkeletonCard, EmptyState, PageHeader, Tabs, Chip } from '@/components/ui'
import { BusinessCard, ProductCard } from '@/components/cards'
import { createClient } from '@/lib/supabase/client'
import { dbBrandToBusiness, dbProductToProduct } from '@/lib/supabase/queries'
import {
  CATEGORIES, SL_LOCATIONS, BUDGET_RANGES, RATING_FILTERS,
  type Business, type Product, type NavOpts,
} from '@/lib/data'
import type { CommonProps } from './_shared'
import { MarketingBanner } from '@/components/MarketingBanner'
import type { DbBrand } from '@/types/database'

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * All query parameters are combined into one state object so every filter
 * change (including offset resets) happens atomically — the fetch effect fires
 * exactly once per user action with no double-fetch risk.
 */
interface ExploreQuery {
  searchQuery:      string
  selectedCategory: string
  selectedLocation: string
  selectedBudget:   string
  selectedRating:   string
  sortOrder:        string
  exploreTab:       string
  offset:           number
  append:           boolean   // true = "Load more", false = fresh page-1 load
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns [minPrice, maxPrice] bounds for a budget range label. null = no bound. */
function getBudgetBounds(budget: string): [number | null, number | null] {
  if (budget === 'Under LKR 10,000')      return [null, 10_000]
  if (budget === 'LKR 10,000 – 100,000')  return [10_000, 100_000]
  if (budget === 'LKR 100,000 – 500,000') return [100_000, 500_000]
  if (budget === 'Above LKR 500,000')     return [500_000, null]
  return [null, null]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExploreScreen({
  goTo, setSelectedBusiness, setSelectedProduct,
  favorites, toggleFavorite, initialFilter, cardStyle,
}: CommonProps & { initialFilter: NavOpts | null }) {

  // Raw search input — displayed immediately; debounced into query.searchQuery
  const [searchInput, setSearchInput] = useState('')

  // Combined query state — changing any field triggers exactly one fetch
  const [query, setQuery] = useState<ExploreQuery>({
    searchQuery:      '',
    selectedCategory: initialFilter?.category || 'All Industries',
    selectedLocation: 'All Locations',
    selectedBudget:   'All Budgets',
    selectedRating:   'All Ratings',
    sortOrder:        'relevance',
    exploreTab:       initialFilter?.tab || 'businesses',
    offset:           0,
    append:           false,
  })

  // Results
  const [brands, setBrands]           = useState<Business[]>([])
  const [products, setProducts]       = useState<Product[]>([])
  const [brandMap, setBrandMap]       = useState<Record<string, Business>>({})
  const [totalBrands, setTotalBrands] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [isLoading, setIsLoading]         = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // ── Debounce search input (300 ms) ──────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q => ({ ...q, searchQuery: searchInput, offset: 0, append: false }))
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Helper: change one filter and reset to page 1 ───────────────────────────
  const setFilter = <K extends keyof ExploreQuery>(key: K, value: ExploreQuery[K]) => {
    setQuery(q => ({ ...q, [key]: value, offset: 0, append: false }))
  }

  // ── Main fetch effect — fires once per query object change ──────────────────
  useEffect(() => {
    let mounted = true
    const {
      append, offset, exploreTab, searchQuery,
      selectedCategory, selectedLocation, selectedBudget, selectedRating, sortOrder,
    } = query

    // Clear stale results and show skeletons on a fresh (non-append) load
    if (!append) {
      setBrands([])
      setProducts([])
      setTotalBrands(0)
      setTotalProducts(0)
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    // ── Brands fetch ──────────────────────────────────────────────────────────
    async function fetchBrands() {
      const supabase = createClient()

      // Budget filter: resolve to the set of brand IDs that have at least one
      // active product whose price_range_min falls within the chosen range.
      // Brands with no products are only shown under "All Budgets".
      let budgetBrandIds: string[] | null = null
      if (selectedBudget !== 'All Budgets') {
        const [minVal, maxVal] = getBudgetBounds(selectedBudget)
        let bq = supabase.from('products').select('brand_id').eq('is_active', true)
        if (minVal !== null) bq = bq.gte('price_range_min', minVal)
        if (maxVal !== null) bq = bq.lt('price_range_min', maxVal)
        const { data: budgetData } = await bq
        if (!mounted) return
        budgetBrandIds = budgetData
          ? Array.from(new Set(budgetData.map((p: { brand_id: string }) => p.brand_id)))
          : []
        // No brands match — return empty results immediately
        if (budgetBrandIds.length === 0) {
          if (mounted) {
            setIsLoading(false)
            setIsLoadingMore(false)
          }
          return
        }
      }

      let q = supabase.from('brands').select('*', { count: 'exact' }).eq('is_active', true)

      if (searchQuery)
        q = q.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      if (selectedCategory !== 'All Industries')
        q = q.contains('categories', [selectedCategory])
      if (selectedLocation !== 'All Locations')
        q = q.eq('city', selectedLocation)
      if (budgetBrandIds)
        q = q.in('id', budgetBrandIds)

      // Sort
      if (sortOrder === 'a-z')
        q = q.order('name', { ascending: true })
      else if (sortOrder === 'z-a')
        q = q.order('name', { ascending: false })
      else if (sortOrder === 'rating')
        // TODO: wire to real rating column when reviews are aggregated onto brands
        q = q.order('is_verified', { ascending: false }).order('created_at', { ascending: false })
      else
        q = q.order('created_at', { ascending: false })

      q = q.range(offset, offset + PAGE_SIZE - 1)

      const { data, count } = await q
      if (!mounted) return

      let fetched = (data || []).map(dbBrandToBusiness)

      // Rating filter is applied client-side — brands.rating is a placeholder (4.5)
      // until the reviews table is aggregated into a rating column on brands.
      // TODO: wire to real rating column when reviews table is aggregated
      if (selectedRating === '5 Stars')      fetched = fetched.filter(b => b.rating >= 5)
      else if (selectedRating === '4+ Stars') fetched = fetched.filter(b => b.rating >= 4)
      else if (selectedRating === '3+ Stars') fetched = fetched.filter(b => b.rating >= 3)

      const newMap: Record<string, Business> = {}
      fetched.forEach(b => { newMap[b.id] = b })

      if (!append) {
        setBrands(fetched)
        setBrandMap(newMap)
      } else {
        setBrands(prev => [...prev, ...fetched])
        setBrandMap(prev => ({ ...prev, ...newMap }))
      }
      setTotalBrands(count || 0)
      setIsLoading(false)
      setIsLoadingMore(false)
    }

    // ── Products fetch ────────────────────────────────────────────────────────
    async function fetchProducts() {
      const supabase = createClient()

      let q = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true)

      if (searchQuery)
        q = q.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      if (selectedCategory !== 'All Industries')
        q = q.eq('category', selectedCategory)

      q = q.order('created_at', { ascending: false })
      q = q.range(offset, offset + PAGE_SIZE - 1)

      const { data, count } = await q
      if (!mounted) return

      const fetched = (data || []).map(dbProductToProduct)

      if (!append) setProducts(fetched)
      else setProducts(prev => [...prev, ...fetched])
      setTotalProducts(count || 0)

      // Fetch brand info for supplier attribution on product cards
      const brandIds = Array.from(new Set((data || []).map((p: { brand_id: string }) => p.brand_id)))
      if (brandIds.length > 0) {
        const { data: brandData } = await supabase
          .from('brands').select('*').in('id', brandIds).eq('is_active', true)
        if (mounted && brandData) {
          const newMap: Record<string, Business> = {}
          brandData.forEach((b: DbBrand) => { newMap[b.id] = dbBrandToBusiness(b) })
          setBrandMap(prev => ({ ...prev, ...newMap }))
        }
      }

      setIsLoading(false)
      setIsLoadingMore(false)
    }

    if (exploreTab === 'businesses') fetchBrands()
    else fetchProducts()

    return () => { mounted = false }
  }, [query])

  // ── Active filter chips ────────────────────────────────────────────────────
  const activeFilters = [
    query.selectedCategory !== 'All Industries' && { label: query.selectedCategory, clear: () => setFilter('selectedCategory', 'All Industries') },
    query.selectedLocation !== 'All Locations'  && { label: query.selectedLocation,  clear: () => setFilter('selectedLocation',  'All Locations')  },
    query.selectedRating   !== 'All Ratings'    && { label: query.selectedRating,    clear: () => setFilter('selectedRating',    'All Ratings')    },
    query.selectedBudget   !== 'All Budgets'    && { label: query.selectedBudget,    clear: () => setFilter('selectedBudget',    'All Budgets')    },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  // ── Reset all filters ──────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchInput('')
    setQuery({
      searchQuery:      '',
      selectedCategory: 'All Industries',
      selectedLocation: 'All Locations',
      selectedBudget:   'All Budgets',
      selectedRating:   'All Ratings',
      sortOrder:        'relevance',
      exploreTab:       query.exploreTab,
      offset:           0,
      append:           false,
    })
  }

  // ── Load more ──────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    setQuery(q => ({ ...q, offset: q.offset + PAGE_SIZE, append: true }))
  }

  const currentCount = query.exploreTab === 'businesses' ? brands.length   : products.length
  const totalCount   = query.exploreTab === 'businesses' ? totalBrands      : totalProducts
  const hasMore      = currentCount < totalCount

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Marketplace"
        title="Explore suppliers"
        sub={isLoading && !query.append
          ? 'Loading…'
          : `${totalBrands} verified businesses across ${CATEGORIES.length} industries`}
        action={
          <Tabs value={query.exploreTab} onChange={(v) => setFilter('exploreTab', v)} tabs={[
            { value: 'businesses', label: 'Businesses', count: totalBrands || undefined },
            { value: 'products',   label: 'Products',   count: totalProducts || undefined },
          ]} />
        }
      />

      <MarketingBanner slot="explore_heading" />

      <div className="layout-explore">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
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
              <input
                className="field field-search"
                type="text"
                placeholder="Search…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="field-label">Industry</label>
              <select className="field" value={query.selectedCategory} onChange={(e) => setFilter('selectedCategory', e.target.value)}>
                {['All Industries', ...CATEGORIES].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">Location</label>
              <select className="field" value={query.selectedLocation} onChange={(e) => setFilter('selectedLocation', e.target.value)}>
                {SL_LOCATIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">Rating</label>
              <select className="field" value={query.selectedRating} onChange={(e) => setFilter('selectedRating', e.target.value)}>
                {RATING_FILTERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">Budget Range</label>
              <select className="field" value={query.selectedBudget} onChange={(e) => setFilter('selectedBudget', e.target.value)}>
                {BUDGET_RANGES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="mb-2">
              <label className="field-label">Sort by</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 'relevance', l: 'Relevance' },
                  { v: 'rating',    l: 'Top rated'  },
                  { v: 'a-z',       l: 'A→Z'        },
                  { v: 'z-a',       l: 'Z→A'        },
                ].map(s => (
                  <Chip key={s.v} active={query.sortOrder === s.v} onClick={() => setFilter('sortOrder', s.v)}>
                    {s.l}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <main>
          {/* Count / active filter chips row */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.length === 0 ? (
                <span className="text-sm text-muted">
                  Showing{' '}
                  <span className="font-mono font-semibold text-ink2">{currentCount}</span>
                  {totalCount > currentCount && (
                    <> of <span className="font-mono font-semibold text-ink2">{totalCount}</span></>
                  )}
                  {' '}{query.exploreTab === 'businesses' ? 'suppliers' : 'products'}
                </span>
              ) : (
                activeFilters.map((f, i) => (
                  <Chip key={i} active removable onRemove={f.clear}>{f.label}</Chip>
                ))
              )}
            </div>
            {activeFilters.length > 0 && (
              <button className="text-xs font-semibold text-muted" onClick={resetFilters}>Clear all</button>
            )}
          </div>

          {/* Businesses tab */}
          {query.exploreTab === 'businesses' ? (
            isLoading && !query.append ? (
              <div className="grid-businesses">
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={300} />)}
              </div>
            ) : brands.length > 0 ? (
              <>
                <div className="grid-businesses">
                  {brands.map(b => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      cardStyle={cardStyle}
                      favorited={favorites.includes(b.id)}
                      onFavorite={() => toggleFavorite(b.id)}
                      onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
                      onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                    <Button variant="secondary" onClick={handleLoadMore} disabled={isLoadingMore}>
                      {isLoadingMore
                        ? 'Loading…'
                        : `Load more (${totalCount - currentCount} remaining)`}
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading ? (
              <EmptyState
                title="No suppliers match those filters"
                sub="Try widening your search or clearing filters."
                action={<Button variant="primary" onClick={resetFilters}>Clear filters</Button>}
              />
            ) : null
          ) : (
            // Products tab
            isLoading && !query.append ? (
              <div className="grid-products">
                {[1,2,3,4].map(i => <SkeletonCard key={i} height={260} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid-products">
                  {products.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      business={brandMap[p.businessId]}
                      cardStyle={cardStyle}
                      onClick={() => {
                        setSelectedProduct(p)
                        setSelectedBusiness(brandMap[p.businessId] || null)
                        goTo('product-detail')
                      }}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                    <Button variant="secondary" onClick={handleLoadMore} disabled={isLoadingMore}>
                      {isLoadingMore
                        ? 'Loading…'
                        : `Load more (${totalCount - currentCount} remaining)`}
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading ? (
              <EmptyState
                title="No products match those filters"
                sub="Try a different search or category."
              />
            ) : null
          )}
        </main>
      </div>
      <div style={{ paddingBottom: 64 }} />
    </div>
  )
}
