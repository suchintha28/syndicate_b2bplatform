'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, Stars, SkeletonCard, EmptyState } from '@/components/ui'
import { ProductCard } from '@/components/cards'
import { REVIEWS, type Business, type Product, type Screen, type NavOpts } from '@/lib/data'
import { useBrandProducts } from '@/hooks/useBrandProducts'
import { MarketingBanner } from '@/components/MarketingBanner'

export function BusinessDetailScreen({ business, goTo, setSelectedProduct, favorites, toggleFavorite, cardStyle, isSignedIn = false }: {
  business: Business | null
  goTo: (s: Screen, opts?: NavOpts) => void
  setSelectedProduct: (p: Product | null) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  cardStyle: 'bordered' | 'shadow' | 'minimal'
  isSignedIn?: boolean
}) {
  const { products: brandProducts, loading: productsLoading } = useBrandProducts(business?.id)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [extraReviews, setExtraReviews] = useState<typeof REVIEWS>([])
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', text: '' })
  const [hoverStar, setHoverStar] = useState(0)

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
            <Avatar src={business.logoUrl} initials={business.logo} size="xl" />
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

          <MarketingBanner slot="brand_about" margin="0 0 32px" />

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
            <div className="section-header">
              <h2 className="section-title">Reviews</h2>
              <Button variant="secondary" size="sm" icon="edit" onClick={() => {
                if (!isSignedIn) { goTo('auth'); return }
                setShowReviewModal(true)
              }}>Write a review</Button>
            </div>

            {/* Review modal */}
            {showReviewModal && (
              <div className="lightbox-overlay" onClick={() => setShowReviewModal(false)}>
                <div className="card" style={{ padding: 28, width: '100%', maxWidth: 480, position: 'relative', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <button className="lightbox-close" style={{ position: 'absolute', top: 12, right: 12, background: 'var(--bg-alt)', color: 'var(--ink)', border: '1px solid var(--border)' }} onClick={() => setShowReviewModal(false)}>✕</button>
                  <h3 className="font-display font-bold text-xl mb-1">Write a review</h3>
                  <p className="text-sm text-muted mb-4">Share your experience with {business?.name}</p>

                  <div className="mb-4">
                    <div className="field-label mb-2">Rating</div>
                    <div className="star-input">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button"
                          className={(hoverStar || reviewForm.rating) >= n ? 'filled' : ''}
                          onMouseEnter={() => setHoverStar(n)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>★</button>
                      ))}
                    </div>
                    {reviewForm.rating > 0 && (
                      <div className="star-input-label">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewForm.rating]}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="field-label">Review title</label>
                    <input className="field" type="text" placeholder="Summarise your experience" value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <label className="field-label">Your review</label>
                    <textarea className="field" rows={4} placeholder="Tell others about quality, communication, delivery…" value={reviewForm.text}
                      onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                    <Button variant="primary" block icon="check" onClick={() => {
                      if (!reviewForm.rating || !reviewForm.text.trim()) return
                      setExtraReviews(prev => [{ initials: 'ME', name: 'You', company: 'Your company', rating: reviewForm.rating, time: 'Just now', text: reviewForm.text }, ...prev])
                      setReviewForm({ rating: 0, title: '', text: '' })
                      setShowReviewModal(false)
                    }}>Post review</Button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...extraReviews, ...REVIEWS].map((r, i) => (
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
              <Button variant="primary" size="lg" iconRight="arrow-right" onClick={() => goTo('rfq-create', { brandId: business.id, brandName: business.name })}>Request a quote</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
