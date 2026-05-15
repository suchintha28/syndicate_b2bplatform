'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Field, TextArea, PageHeader, BackLink, SkeletonCard } from '@/components/ui'
import { INDUSTRIES, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { EXPIRY_OPTIONS } from './_shared'

function RfqImageUploader({
  images,
  userId,
  onUpdate,
  maxImages = 3,
}: {
  images: string[]
  userId: string | null
  onUpdate: (urls: string[]) => void
  maxImages?: number
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remaining = maxImages - images.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length || !userId) return
    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} is over 5 MB — skipped.`); continue }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Only JPG, PNG, or WebP allowed.'); continue }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`
      const { error } = await supabase.storage.from('rfq-files').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('rfq-files').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }
    onUpdate([...images, ...newUrls].slice(0, maxImages))
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
            <button type="button" onClick={() => onUpdate(images.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12, lineHeight: 1, fontFamily: 'inherit', padding: 0 }}>
              ×
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || !userId}
            style={{ width: 72, height: 72, border: '2px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', cursor: userId ? 'pointer' : 'not-allowed', background: 'var(--bg-alt)', flexShrink: 0 }}>
            {uploading
              ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              : <Icon name="image" size={18} stroke="var(--muted)" />
            }
          </button>
        )}
      </div>
      <div className="text-xs text-muted">Up to {maxImages} image{maxImages > 1 ? 's' : ''} · JPG, PNG, WebP · max 5 MB each</div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
    </div>
  )
}

export function RFQCreateScreen({
  goTo,
  opts = {},
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  opts?: { brandId?: string; brandName?: string; productId?: string }
}) {
  const [userId, setUserId]       = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Public vs private toggle
  const [isPublic, setIsPublic]   = useState(!opts.brandId)

  // Form fields
  const [subject,   setSubject]   = useState('')
  const [message,   setMessage]   = useState('')
  const [category,  setCategory]  = useState('')
  const [quantity,  setQuantity]  = useState('')
  const [unit,      setUnit]      = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [location,  setLocation]  = useState('')
  const [timeline,  setTimeline]  = useState('')
  const [expiryIdx, setExpiryIdx] = useState(1) // default: 1 month
  const [images,    setImages]    = useState<string[]>([])

  // Brand selector (for private RFQs)
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(
    opts.brandId ? { id: opts.brandId, name: opts.brandName || '' } : null
  )
  const [brandSearch,  setBrandSearch]  = useState('')
  const [brandResults, setBrandResults] = useState<{ id: string; name: string; logo_url: string | null }[]>([])
  const [searching,    setSearching]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  // Auth check
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
      setAuthLoading(false)
      if (!user) goTo('auth')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Brand search with debounce
  useEffect(() => {
    if (!brandSearch.trim() || selectedBrand || isPublic) return
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase.from('brands').select('id, name, logo_url')
        .ilike('name', `%${brandSearch.trim()}%`).eq('is_active', true).limit(8)
      setBrandResults(data || [])
      setShowDropdown(true)
      setSearching(false)
    }, 320)
  }, [brandSearch, selectedBrand, isPublic])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!subject.trim()) { setError('Subject is required.'); return }
    if (!message.trim()) { setError('Requirements are required.'); return }
    if (!isPublic && !selectedBrand?.id) { setError('Please select a supplier for a private RFQ.'); return }
    if (!userId) { goTo('auth'); return }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + EXPIRY_OPTIONS[expiryIdx].days)

      const { error: err } = await supabase.from('rfqs').insert({
        buyer_id:   userId,
        brand_id:   isPublic ? null : selectedBrand!.id,
        product_id: opts.productId || null,
        subject:    subject.trim(),
        message:    message.trim(),
        category:   category || null,
        quantity:   quantity ? parseInt(quantity) || null : null,
        unit:       unit.trim() || null,
        budget_min: budgetMin ? parseFloat(budgetMin) || null : null,
        budget_max: budgetMax ? parseFloat(budgetMax) || null : null,
        location:   location.trim() || null,
        timeline:   timeline.trim() || null,
        expires_at: expiresAt.toISOString(),
        images,
        is_public:  isPublic,
        status:     'pending',
      })

      if (err) { setError(err.message); return }
      goTo('success', { successContext: 'rfq' })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <SkeletonCard height={500} />
    </div>
  )

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('rfqs')}>Back to RFQs</BackLink>
      <PageHeader eyebrow="New request" title="Create RFQ"
        sub="Describe what you need and receive bids from verified suppliers." />

      <form onSubmit={handleSubmit}>

        {/* ── Type toggle ────────────────────── */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="uppercase-label mb-3">RFQ type</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { pub: true,  icon: 'compass', title: 'Public',  sub: 'Open to all suppliers on the marketplace. Bids are submitted through the RFQ board.' },
              { pub: false, icon: 'message', title: 'Private', sub: 'Sent directly to one specific supplier as a private inquiry.' },
            ].map(opt => (
              <button key={String(opt.pub)} type="button"
                onClick={() => { setIsPublic(opt.pub); if (opt.pub) setSelectedBrand(null) }}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer',
                  background: isPublic === opt.pub ? 'var(--primary-soft)' : 'var(--bg-alt)',
                  border: `2px solid ${isPublic === opt.pub ? 'var(--primary)' : 'var(--border)'}`,
                  fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={opt.icon} size={14} stroke={isPublic === opt.pub ? 'var(--primary)' : 'var(--muted)'} />
                  <span className="font-display font-bold" style={{ fontSize: 14, color: isPublic === opt.pub ? 'var(--primary-ink, var(--ink))' : 'var(--ink)' }}>{opt.title}</span>
                </div>
                <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Supplier (private only) ───────── */}
        {!isPublic && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="uppercase-label mb-3">Supplier <span style={{ color: 'var(--danger)' }}>*</span></div>
            {selectedBrand ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)' }}>
                <span className="font-semibold flex-1">{selectedBrand.name}</span>
                {!opts.brandId && (
                  <button type="button" onClick={() => { setSelectedBrand(null); setBrandSearch('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input className="field" placeholder="Search for a supplier…" value={brandSearch}
                  onChange={e => { setBrandSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => brandSearch && setShowDropdown(true)} autoComplete="off" />
                {searching && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )}
                {showDropdown && brandResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 240, overflowY: 'auto' }}>
                    {brandResults.map(b => (
                      <button key={b.id} type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
                        onMouseDown={() => { setSelectedBrand({ id: b.id, name: b.name }); setBrandSearch(''); setShowDropdown(false) }}>
                        <Avatar src={b.logo_url || undefined} initials={b.name.slice(0, 2).toUpperCase()} size="sm" />
                        <span className="font-semibold" style={{ fontSize: 14 }}>{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && !searching && brandSearch && brandResults.length === 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginTop: 4, padding: '12px 14px', color: 'var(--muted)', fontSize: 14 }}>
                    No suppliers found for &ldquo;{brandSearch}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Core fields ───────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Request details</h3>

          <Field label="Subject" placeholder="e.g. 500 custom IoT sensors for smart building retrofit"
            value={subject} onChange={e => setSubject(e.target.value)} required />

          <TextArea label="Requirements" rows={5} required
            placeholder="Describe what you need — specs, quantities, certifications, delivery location, any other details…"
            value={message} onChange={e => setMessage(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Industry / Category</label>
              <select className="field" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category…</option>
                {INDUSTRIES.filter(i => i !== 'Other').map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field label="Location" placeholder="e.g. Colombo, Sri Lanka"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Quantity (optional)</label>
              <input className="field" type="number" min="1" placeholder="500"
                value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <Field label="Unit (optional)" placeholder="units, kg, metres…"
              value={unit} onChange={e => setUnit(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Budget min (LKR, optional)</label>
              <input className="field" type="number" min="0" placeholder="5000000"
                value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Budget max (LKR, optional)</label>
              <input className="field" type="number" min="0" placeholder="25000000"
                value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
            </div>
          </div>

          <Field label="Delivery timeline (optional)" placeholder="e.g. Delivery by Q4 2026 or within 60 days"
            value={timeline} onChange={e => setTimeline(e.target.value)} />
        </div>

        {/* ── Attachments ───────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-3">Attachments</h3>
          <label className="field-label mb-2 block">Images (optional)</label>
          <RfqImageUploader images={images} userId={userId} onUpdate={setImages} />
        </div>

        {/* ── Expiry ────────────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-1">Listing duration</h3>
          <p className="text-sm text-muted mb-4" style={{ lineHeight: 1.5 }}>
            Your RFQ will be automatically removed after the expiry date. Maximum 3 months.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {EXPIRY_OPTIONS.map((opt, i) => (
              <button key={i} type="button"
                onClick={() => setExpiryIdx(i)}
                style={{
                  padding: '8px 18px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                  background: expiryIdx === i ? 'var(--primary)' : 'var(--bg-alt)',
                  color: expiryIdx === i ? 'white' : 'var(--ink)',
                  border: `1.5px solid ${expiryIdx === i ? 'var(--primary)' : 'var(--border)'}`,
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
                  transition: 'all 0.15s',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--ink2)' }}>
            <Icon name="clock" size={13} stroke="var(--muted)" /> Your RFQ will expire on{' '}
            <strong>{new Date(Date.now() + EXPIRY_OPTIONS[expiryIdx].days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
            After this date it will be automatically removed from the marketplace.
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('rfqs')}>Cancel</Button>
          <Button variant="primary" type="submit" block iconRight="arrow-right" disabled={submitting}>
            {submitting ? 'Submitting…' : isPublic ? 'Post RFQ publicly' : 'Send private RFQ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
