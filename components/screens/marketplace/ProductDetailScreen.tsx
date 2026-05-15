'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, Stars, BackLink, VerifiedMark } from '@/components/ui'
import { type Business, type Product, type Screen, type NavOpts } from '@/lib/data'
import { MarketingBanner } from '@/components/MarketingBanner'
import { createClient } from '@/lib/supabase/client'
import type { DbReview } from '@/types/database'

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export function ProductDetailScreen({ product, business, goTo, setSelectedBusiness, isSignedIn = false }: {
  product: Product | null
  business: Business | null
  goTo: (s: Screen, opts?: NavOpts) => void
  setSelectedBusiness: (b: Business | null) => void
  isSignedIn?: boolean
}) {
  // Gallery state
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  // Buy box state
  const [selectedVariation, setSelectedVariation] = useState(0)
  const [qty, setQty] = useState(1)

  // Specs tab
  const [specsTab, setSpecsTab] = useState<'product' | 'technical' | 'pricing'>('product')

  // Reviews
  const [showRevModal, setShowRevModal] = useState(false)
  const [revForm, setRevForm] = useState({ rating: 0, title: '', text: '' })
  const [revHover, setRevHover] = useState(0)
  const [revPhotos, setRevPhotos] = useState<string[]>([])
  const [productReviews, setProductReviews] = useState<DbReview[]>([])
  const [revLoading, setRevLoading] = useState(true)
  const [revSubmitting, setRevSubmitting] = useState(false)
  const [revError, setRevError] = useState('')

  const loadReviews = useCallback(async () => {
    if (!product?.id) return
    setRevLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, business_name, avatar_url)')
      .eq('target_type', 'product')
      .eq('target_id', product.id)
      .order('created_at', { ascending: false })
    setProductReviews((data as DbReview[]) ?? [])
    setRevLoading(false)
  }, [product?.id])

  useEffect(() => { loadReviews() }, [loadReviews])

  if (!product) return null

  // Build gallery items from product image + extra seeds
  const galleryItems = [
    { type: 'image', src: product.image },
    { type: 'image', src: `https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80` },
    { type: 'image', src: `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80` },
    ...(product.videoUrl ? [{ type: 'video', src: product.videoUrl }] : []),
  ]
  const currentItem = galleryItems[galleryIdx] ?? galleryItems[0]

  // Compute unit price from tier + variation
  const varPrice = product.variations[selectedVariation]?.price
  const baseForTier = varPrice ?? (parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0)
  const tier = [...product.tieredPricing].reverse().find(t => qty >= t.min) ?? product.tieredPricing[0]
  const unitPrice = varPrice ? varPrice : (tier?.price ?? baseForTier)
  const totalPrice = unitPrice * qty

  // Default specs
  const productSpecs = product.productSpecs?.length ? product.productSpecs : [
    { label: 'Brand', value: business?.name ?? '—' },
    { label: 'Category', value: product.category },
    { label: 'MOQ', value: product.tieredPricing[0] ? `${product.tieredPricing[0].min} units` : '1 unit' },
    { label: 'Warranty', value: '12 months' },
    { label: 'Certifications', value: 'CE, RoHS' },
  ]
  const techSpecs = product.techSpecs?.length ? product.techSpecs : [
    { label: 'Connectivity', value: 'WiFi, Bluetooth 5.0' },
    { label: 'Power',        value: 'DC 5V / USB-C' },
    { label: 'Dimensions',   value: '120 × 80 × 30 mm' },
    { label: 'Weight',       value: '180 g' },
    { label: 'Operating temp', value: '-20 °C to +70 °C' },
  ]

  const handleRevPhotoAdd = () => {
    // Simulate picking a photo (use a placeholder)
    if (revPhotos.length >= 2) return
    const idx = revPhotos.length
    const seeds = ['photo-1518770660439-4636190af475', 'photo-1581090700227-1e37b190418e']
    setRevPhotos(p => [...p, `https://images.unsplash.com/${seeds[idx]}?auto=format&fit=crop&w=400&q=80`])
  }

  return (
    <div className="container fade-up" style={{ paddingTop: 24, paddingBottom: 64 }}>
      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
          <img src={lightboxSrc} alt="Preview" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <BackLink onClick={() => goTo('detail')}>Back to {business?.name || 'supplier'}</BackLink>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="product-detail-grid">
        {/* ── Gallery ── */}
        <div className="gallery">
          <div className="gallery-main">
            <img src={currentItem.src} alt={product.name}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/p${product.id}/800/600` }} />
            {galleryItems.length > 1 && (
              <>
                <button className="gallery-nav prev" onClick={() => setGalleryIdx(i => (i - 1 + galleryItems.length) % galleryItems.length)}>
                  <Icon name="chevron-left" size={16} strokeWidth={2.5} />
                </button>
                <button className="gallery-nav next" onClick={() => setGalleryIdx(i => (i + 1) % galleryItems.length)}>
                  <Icon name="chevron-right" size={16} strokeWidth={2.5} />
                </button>
                <div className="gallery-counter">{galleryIdx + 1} / {galleryItems.length}</div>
              </>
            )}
          </div>
          {galleryItems.length > 1 && (
            <div className="gallery-thumbs">
              {galleryItems.map((item, i) => (
                <button key={i} className={`gallery-thumb ${i === galleryIdx ? 'active' : ''}`} onClick={() => setGalleryIdx(i)}>
                  <img src={item.src} alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/thumb${i}/200/200` }} />
                  {item.type === 'video' && (
                    <span className="gallery-thumb-badge"><Icon name="play" size={14} stroke="white" /></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Buy box ── */}
        <div>
          <Badge variant="verified">{product.category}</Badge>
          <h1 className="page-title mt-3" style={{ fontSize: 32 }}>{product.name}</h1>
          <p className="text-ink2 text-base mb-4" style={{ lineHeight: 1.6 }}>{product.description}</p>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', marginBottom: 20 }}>
            <div className="uppercase-label mb-1">Unit price</div>
            <div className="font-display font-bold" style={{ fontSize: 36, lineHeight: 1 }}>
              LKR {unitPrice.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-1">Estimated total: <strong>LKR {totalPrice.toLocaleString()}</strong> for {qty} unit{qty !== 1 ? 's' : ''}</div>
          </div>

          {/* Variations */}
          {product.variations.length > 0 && (
            <div className="mb-4">
              <div className="uppercase-label mb-2">Variation</div>
              <div className="var-grid">
                {product.variations.map((v, i) => (
                  <button key={i} className={`var-tile ${selectedVariation === i ? 'selected' : ''}`}
                    onClick={() => setSelectedVariation(i)}>
                    <div className="var-tile-name">{v.name}</div>
                    <div className="var-tile-price">LKR {v.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty stepper */}
          <div className="mb-4">
            <div className="uppercase-label mb-2">Quantity</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="qty-stepper">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
                <button type="button" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              {[10, 50, 100].map(n => (
                <button key={n} type="button" onClick={() => setQty(n)}
                  style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, background: qty === n ? 'var(--primary-soft)' : 'white', color: qty === n ? 'var(--primary)' : 'var(--ink-3)', cursor: 'pointer', fontWeight: 600, borderColor: qty === n ? 'var(--primary)' : undefined }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {product.directSales && (
              <Button variant="primary" size="lg" icon="cart">Buy now</Button>
            )}
            <Button variant="primary" size="lg" icon="file"
              onClick={() => goTo('rfq-create', { brandId: business?.id, brandName: business?.name, productId: product.id })}>
              Request quote
            </Button>
            <Button variant="secondary" size="lg" icon="message" onClick={() => goTo('message-form')}>Contact seller</Button>
          </div>

          {/* Sold by */}
          {business && (
            <div className="card card-hover" style={{ padding: 16, cursor: 'pointer' }}
              onClick={() => { setSelectedBusiness(business); goTo('detail') }}>
              <div className="uppercase-label mb-2">Sold by</div>
              <div className="flex items-center gap-3">
                <Avatar src={business.logoUrl} initials={business.logo} size="md" />
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
        </div>
      </div>

      <MarketingBanner slot="product_gallery" />

      {/* ── Specifications ── */}
      <div className="card" style={{ padding: 24, marginTop: 32 }}>
        <h2 className="font-display font-bold text-xl mb-4">Specifications</h2>
        <div className="product-tabs">
          {(['product', 'technical', 'pricing'] as const).map(tab => (
            <button key={tab} className={`product-tab ${specsTab === tab ? 'active' : ''}`} onClick={() => setSpecsTab(tab)}>
              {tab === 'product' ? 'Product specs' : tab === 'technical' ? 'Technical specs' : 'Bulk pricing'}
            </button>
          ))}
        </div>
        {specsTab === 'product' && (
          <div className="specs-table">
            {productSpecs.map((s, i) => (
              <div key={i} className="specs-row">
                <div className="specs-label">{s.label}</div>
                <div className="specs-value">{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {specsTab === 'technical' && (
          <div className="specs-table">
            {techSpecs.map((s, i) => (
              <div key={i} className="specs-row">
                <div className="specs-label">{s.label}</div>
                <div className="specs-value">{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {specsTab === 'pricing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {product.tieredPricing.map((t, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: qty >= t.min && (t.max === null || qty <= t.max) ? 'var(--primary-soft)' : 'white', borderColor: qty >= t.min && (t.max === null || qty <= t.max) ? 'rgba(79,70,229,0.3)' : undefined }}>
                <div className="font-mono text-xs text-muted mb-1">{t.min}{t.max ? `–${t.max}` : '+'} units</div>
                <div className="font-display font-bold text-xl" style={{ color: qty >= t.min && (t.max === null || qty <= t.max) ? 'var(--primary)' : undefined }}>
                  LKR {t.price.toLocaleString()}
                </div>
                <div className="text-xs text-muted">/unit</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Customer reviews ── */}
      <div style={{ marginTop: 32, paddingBottom: 64 }}>
        <div className="section-header mb-4">
          <h2 className="section-title">Customer reviews</h2>
          <Button variant="secondary" size="sm" icon="edit" onClick={() => {
            if (!isSignedIn) { goTo('auth'); return }
            setShowRevModal(true)
          }}>Write a review</Button>
        </div>

        {/* Review modal */}
        {showRevModal && (
          <div className="lightbox-overlay" onClick={() => setShowRevModal(false)}>
            <div className="card" style={{ padding: 28, width: '100%', maxWidth: 500, position: 'relative', cursor: 'default', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" style={{ position: 'absolute', top: 12, right: 12, background: 'var(--bg-alt)', color: 'var(--ink)', border: '1px solid var(--border)' }} onClick={() => setShowRevModal(false)}>✕</button>
              <h3 className="font-display font-bold text-xl mb-1">Write a review</h3>
              <p className="text-sm text-muted mb-4">Share your experience with this product</p>

              <div className="mb-4">
                <div className="field-label mb-2">Rating</div>
                <div className="star-input">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      className={(revHover || revForm.rating) >= n ? 'filled' : ''}
                      onMouseEnter={() => setRevHover(n)}
                      onMouseLeave={() => setRevHover(0)}
                      onClick={() => setRevForm(f => ({ ...f, rating: n }))}>★</button>
                  ))}
                </div>
                {revForm.rating > 0 && <div className="star-input-label">{STAR_LABELS[revForm.rating]}</div>}
              </div>

              <div className="mb-3">
                <label className="field-label">Review title</label>
                <input className="field" type="text" placeholder="Summarise your experience" value={revForm.title}
                  onChange={e => setRevForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="field-label">Your review</label>
                <textarea className="field" rows={4} placeholder="Quality, delivery, packaging…" value={revForm.text}
                  onChange={e => setRevForm(f => ({ ...f, text: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>

              <div className="mb-4">
                <div className="field-label mb-2">Photos (up to 2)</div>
                <div className="review-photos">
                  {revPhotos.map((src, i) => (
                    <div key={i} className="review-photo">
                      <img src={src} alt="" />
                      <button className="review-photo-remove" onClick={() => setRevPhotos(p => p.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                  {revPhotos.length < 2 && (
                    <button type="button" className="review-photo-add" onClick={handleRevPhotoAdd}>+</button>
                  )}
                </div>
              </div>

              {revError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{revError}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowRevModal(false)}>Cancel</Button>
                <Button variant="primary" block icon="check" disabled={revSubmitting} onClick={async () => {
                  if (!revForm.rating || !revForm.text.trim()) return
                  setRevError('')
                  setRevSubmitting(true)
                  const supabase = createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) { setRevError('You must be signed in.'); setRevSubmitting(false); return }
                  const { error } = await supabase.from('reviews').upsert({
                    reviewer_id: user.id,
                    target_type: 'product',
                    target_id:   product!.id,
                    rating:      revForm.rating,
                    title:       revForm.title.trim() || null,
                    body:        revForm.text.trim(),
                    photos:      revPhotos,
                  }, { onConflict: 'reviewer_id,target_type,target_id' })
                  setRevSubmitting(false)
                  if (error) { setRevError(error.message); return }
                  setRevForm({ rating: 0, title: '', text: '' })
                  setRevPhotos([])
                  setShowRevModal(false)
                  loadReviews()
                }}>Post review</Button>
              </div>
            </div>
          </div>
        )}

        {revLoading ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div className="text-muted text-sm">Loading reviews…</div>
          </div>
        ) : productReviews.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div className="text-muted text-sm">No reviews yet. Be the first to review this product.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {productReviews.map((r) => {
              const fullName = r.profiles?.full_name ?? 'Anonymous'
              const company  = r.profiles?.business_name ?? ''
              const initials = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
              const timeStr  = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              return (
              <div key={r.id} className="card" style={{ padding: 'var(--card-pad)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <Avatar initials={initials} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold">{fullName}</span>
                      {company && <span className="text-xs text-muted">· {company}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-muted font-mono">{timeStr}</span>
                    </div>
                  </div>
                </div>
                {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
                <p className="text-sm text-ink2" style={{ lineHeight: 1.55 }}>{r.body}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className="review-card-photos">
                    {r.photos.map((src, pi) => (
                      <div key={pi} className="review-card-photo" onClick={() => setLightboxSrc(src)}>
                        <img src={src} alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
