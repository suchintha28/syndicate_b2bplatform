'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, Field, TextArea, PageHeader, BackLink, SkeletonCard } from '@/components/ui'
import { INDUSTRIES, PLANS, type UserProfile, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/supabase/queries'
import type { DbProduct } from '@/types/database'

/* ── Image upload helper ────────────────────── */
async function uploadImage(
  file: File,
  bucket: 'avatars' | 'logos',
  userId: string,
): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/* ── ImageUploadCircle ──────────────────────── */
function ImageUploadCircle({
  src, initials, size = 'lg', bucket, userId, onUploaded, label,
}: {
  src?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bucket: 'avatars' | 'logos'
  userId?: string
  onUploaded: (url: string) => void
  label: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please use a JPG, PNG, or WebP image.')
      return
    }
    setUploading(true)
    const url = await uploadImage(file, bucket, userId)
    setUploading(false)
    if (url) onUploaded(url)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: userId ? 'pointer' : 'default' }}
      onClick={() => userId && inputRef.current?.click()}>
      <Avatar src={src} initials={initials} size={size} />
      {userId && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--primary)', border: '2px solid white',
          display: 'grid', placeItems: 'center',
        }}>
          {uploading
            ? <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={handleFile} aria-label={label} />
    </div>
  )
}

/* ── ProductImageUploader ───────────────────── */
function ProductImageUploader({ images, brandId, onUpdate }: {
  images: string[]
  brandId: string
  onUpdate: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - images.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length || !brandId) return
    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} is over 5 MB — skipped.`); continue }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Only JPG, PNG, or WebP allowed.'); continue }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${brandId}/${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`
      const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('products').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }
    onUpdate([...images, ...newUrls].slice(0, 3))
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
            <button type="button" onClick={() => onUpdate(images.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 13, lineHeight: 1, fontFamily: 'inherit', padding: 0 }}>
              ×
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || !brandId}
            style={{ width: 80, height: 80, border: '2px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', cursor: brandId ? 'pointer' : 'not-allowed', background: 'var(--bg-alt)', flexShrink: 0 }}>
            {uploading
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              : <Icon name="plus" size={20} stroke="var(--muted)" />
            }
          </button>
        )}
      </div>
      <div className="text-xs text-muted">Up to 3 images · JPG, PNG, WebP · max 5 MB each</div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
    </div>
  )
}

/* ── Status helpers ─────────────────────────── */
const RFQ_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'var(--warning)',       bg: 'var(--warning-soft, #fef9c3)' },
  read:      { label: 'Viewed',    color: 'var(--muted)',         bg: 'var(--bg-alt)' },
  responded: { label: 'Responded', color: 'var(--success)',       bg: 'var(--success-soft)' },
  closed:    { label: 'Closed',    color: 'var(--ink)',           bg: 'var(--bg-alt)' },
}

function StatusPill({ status }: { status: string }) {
  const s = RFQ_STATUS[status] || { label: status, color: 'var(--muted)', bg: 'var(--bg-alt)' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: s.bg, color: s.color, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── ProLock ────────────────────────────────── */
function ProLock({ onUpgrade, label }: { onUpgrade: () => void; label: string }) {
  return (
    <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', padding: 28, textAlign: 'center', background: 'var(--bg-alt)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: 'var(--ink)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
        <Icon name="lock" size={20} stroke="white" />
      </div>
      <div className="font-display font-semibold mb-1">Pro feature</div>
      <div className="text-sm text-muted mb-4" style={{ maxWidth: 320, margin: '0 auto 16px' }}>{label}</div>
      <Button variant="dark" size="sm" icon="sparkle" onClick={onUpgrade}>Upgrade to Pro</Button>
    </div>
  )
}

/* ── DeleteAccountModal ─────────────────────── */
function DeleteAccountModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (password: string) => Promise<string | null>
  onCancel: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await onConfirm(password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={20} stroke="var(--danger)" />
          </div>
          <div>
            <div className="font-display font-bold text-lg" style={{ marginBottom: 4 }}>Delete account</div>
            <div className="text-sm text-muted">This permanently deletes your account, brand, all products, and RFQ history. This cannot be undone.</div>
          </div>
        </div>

        <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 20 }}>
          <div className="text-sm" style={{ color: 'var(--danger)', fontWeight: 500 }}>
            Enter your password to confirm you want to permanently delete your account.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
              color: 'var(--danger)', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={loading || password.length === 0}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: 'var(--r-sm)',
                background: loading || password.length === 0 ? 'var(--danger-soft)' : 'var(--danger)',
                color: loading || password.length === 0 ? 'var(--danger)' : 'white',
                border: 'none', fontWeight: 600, fontSize: 14, cursor: loading || password.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              {loading ? 'Deleting…' : 'Yes, delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── ProfileScreen ──────────────────────────── */
export function ProfileScreen({ goTo, isProMember, userProfile, onSignOut, onDeleteAccount, userId, savedCount = 0 }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isProMember: boolean
  userProfile: UserProfile
  onSignOut?: () => void
  onDeleteAccount?: (password: string) => Promise<string | null>
  userId?: string
  savedCount?: number
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dashLoading, setDashLoading]         = useState(true)
  const [products,    setProducts]            = useState<{ id: string; name: string; category: string; is_active: boolean; price_range_min: number | null; images: string[]; slug: string }[]>([])
  const [rfqs,        setRfqs]               = useState<{ id: string; subject: string; message: string; quantity: number | null; unit: string | null; status: string; created_at: string; profiles?: { full_name: string; email: string } | null; brands?: { name: string; slug: string } | null }[]>([])
  const [bidsReceived, setBidsReceived] = useState(0)

  const isSeller = userProfile.role === 'seller'
  const hasBrand = !!userProfile.brandId

  // Live dashboard data
  useEffect(() => {
    if (!userId) { setDashLoading(false); return }
    const supabase = createClient()

    async function load() {
      if (isSeller && userProfile.brandId) {
        const [pRes, rRes] = await Promise.all([
          supabase.from('products')
            .select('id, name, category, is_active, price_range_min, images, slug')
            .eq('brand_id', userProfile.brandId!).order('created_at', { ascending: false }).limit(5),
          supabase.from('rfqs')
            .select('id, subject, message, quantity, unit, status, created_at, profiles(full_name, email)')
            .eq('brand_id', userProfile.brandId!).order('created_at', { ascending: false }).limit(5),
        ])
        setProducts((pRes.data || []) as typeof products)
        setRfqs((rRes.data || []) as unknown as typeof rfqs)
      } else if (!isSeller) {
        const { data } = await supabase.from('rfqs')
          .select('id, subject, message, quantity, unit, status, created_at, brands(name, slug)')
          .eq('buyer_id', userId!).order('created_at', { ascending: false }).limit(5)
        setRfqs((data || []) as unknown as typeof rfqs)
        // Count bids received on buyer's public RFQs
        const rfqIds = (data || []).map((r: { id: string }) => r.id)
        if (rfqIds.length > 0) {
          const { count } = await supabase.from('rfq_bids')
            .select('id', { count: 'exact', head: true })
            .in('rfq_id', rfqIds)
          setBidsReceived(count ?? 0)
        }
      }
      setDashLoading(false)
    }
    load()
  }, [userId, isSeller, userProfile.brandId])

  async function handleDeleteConfirm(password: string): Promise<string | null> {
    if (!onDeleteAccount) return 'Delete not available.'
    const err = await onDeleteAccount(password)
    if (!err) setShowDeleteModal(false)
    return err
  }

  // Derived stats
  const totalProducts  = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const totalRfqs      = rfqs.length
  const pendingRfqs    = rfqs.filter(r => r.status === 'pending').length
  const respondedRfqs  = rfqs.filter(r => r.status === 'responded').length

  return (
    <>
    {showDeleteModal && (
      <DeleteAccountModal onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteModal(false)} />
    )}

    <div className="container fade-up" style={{ maxWidth: 780, paddingBottom: 80 }}>

      {/* ── Identity header ─────────────────── */}
      <div className="card" style={{ padding: 28, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="flex items-start gap-4 flex-wrap" style={{ marginBottom: 20 }}>
            <Avatar src={userProfile.avatarUrl} initials={userProfile.logo} size="xl" />
            <div className="flex-1" style={{ minWidth: 200 }}>
              <h2 className="font-display font-bold" style={{ fontSize: 22, margin: '0 0 2px' }}>
                {userProfile.fullName || 'My Account'}
              </h2>
              {(userProfile.businessName || userProfile.businessIndustry) && (
                <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
                  {[userProfile.businessName, userProfile.businessIndustry].filter(Boolean).join(' · ')}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isProMember ? 'pro' : 'neutral'} icon={isProMember ? 'sparkle' : undefined}>
                  {isProMember ? 'Pro Member' : 'Free Plan'}
                </Badge>
                {isSeller && <Badge variant="verified" icon="check">Seller</Badge>}
                {!isSeller && <Badge variant="neutral">Buyer</Badge>}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {isSeller && hasBrand && <>
              <Button variant="primary"   size="sm" icon="plus"    onClick={() => goTo('add-product')}>Add product</Button>
              <Button variant="secondary" size="sm" icon="compass" onClick={() => window.open(`/brands/${userProfile.brandSlug}`, '_blank')}>View brand page</Button>
              <Button variant="secondary" size="sm" icon="edit"    onClick={() => goTo('manage-profile')}>Edit profile</Button>
            </>}
            {isSeller && !hasBrand && (
              <Button variant="primary" size="sm" icon="arrow-right" onClick={() => { window.location.href = '/onboarding/brand' }}>
                Set up brand profile
              </Button>
            )}
            {!isSeller && <>
              <Button variant="primary"   size="sm" icon="compass" onClick={() => goTo('listing')}>Browse suppliers</Button>
              <Button variant="secondary" size="sm" icon="file"    onClick={() => goTo('rfq-create')}>Post an RFQ</Button>
              <Button variant="secondary" size="sm" icon="heart"   onClick={() => goTo('saved')}>Saved ({savedCount})</Button>
            </>}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────── */}
      {dashLoading ? (
        <SkeletonCard height={80} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {isSeller && hasBrand && [
            { l: 'Products',       v: totalProducts },
            { l: 'Active',         v: activeProducts },
            { l: 'Incoming RFQs',  v: totalRfqs },
            { l: 'Pending',        v: pendingRfqs },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div className="uppercase-label mb-1" style={{ fontSize: 10 }}>{s.l}</div>
              <div className="font-display font-bold" style={{ fontSize: 22 }}>{s.v}</div>
            </div>
          ))}
          {!isSeller && [
            { l: 'RFQs sent',      v: totalRfqs },
            { l: 'Bids received',  v: bidsReceived },
            { l: 'Responded',      v: respondedRfqs },
            { l: 'Saved',          v: savedCount },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div className="uppercase-label mb-1" style={{ fontSize: 10 }}>{s.l}</div>
              <div className="font-display font-bold" style={{ fontSize: 22 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── List your business CTA (no brand yet) ── */}
      {!hasBrand && (
        <div className="card" style={{ padding: 24, marginBottom: 20, background: 'var(--ink)', color: 'white', borderColor: 'transparent' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="font-display font-bold" style={{ fontSize: 16, marginBottom: 4 }}>List your business on the marketplace</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                Create a brand profile to showcase your products and receive inquiries from buyers.
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { window.location.href = '/onboarding/brand' }}
            >
              Get listed
            </button>
          </div>
        </div>
      )}

      {/* ── Seller: no brand prompt ─────────── */}
      {isSeller && !hasBrand && (
        <div className="card" style={{ padding: 24, marginBottom: 20, background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' }}>
          <div className="font-display font-bold" style={{ fontSize: 16, marginBottom: 6 }}>Complete your seller profile</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 16 }}>
            Create your brand page to start appearing in marketplace search results and receive buyer inquiries.
          </div>
          <Button variant="primary" size="sm" onClick={() => { window.location.href = '/onboarding/brand' }}>
            Create brand profile →
          </Button>
        </div>
      )}

      {/* ── Seller: products ───────────────── */}
      {isSeller && hasBrand && (
        <div style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="uppercase-label">Products</div>
            <Button variant="primary" size="sm" icon="plus" onClick={() => goTo('add-product')}>Add product</Button>
          </div>
          {dashLoading ? <SkeletonCard height={120} /> : products.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div className="text-muted text-sm mb-3">No products yet. Add your first product to start receiving inquiries.</div>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => goTo('add-product')}>Add first product</Button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {products.map((p, i) => (
                <div key={p.id} style={{ padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)' }}>
                    {p.images[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="font-semibold truncate" style={{ fontSize: 14 }}>{p.name}</div>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                      {p.price_range_min && <span className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>LKR {Math.round(p.price_range_min).toLocaleString()}</span>}
                      <span style={{ fontSize: 11, color: p.is_active ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>{p.is_active ? '● Active' : '○ Inactive'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/products/${p.slug}`, '_blank')}>View</Button>
                </div>
              ))}
              {totalProducts > 5 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <button onClick={() => goTo('manage-products')} className="text-sm" style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all {totalProducts} products →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RFQs section ───────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase-label">{isSeller ? 'Incoming inquiries' : 'My RFQs'}</div>
          <button onClick={() => goTo('rfqs')} className="text-sm" style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            View all →
          </button>
        </div>
        {dashLoading ? <SkeletonCard height={140} /> : rfqs.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <div className="text-muted text-sm mb-3">
              {isSeller ? 'No inquiries yet. They will appear here when buyers contact you.' : 'No RFQs yet. Post one to start receiving bids from suppliers.'}
            </div>
            {!isSeller && <Button variant="secondary" size="sm" icon="file" onClick={() => goTo('rfq-create')}>Post an RFQ</Button>}
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {rfqs.map((r, i) => (
              <button key={r.id}
                onClick={() => goTo('rfq-detail', { rfqId: r.id })}
                style={{ width: '100%', textAlign: 'left', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semibold truncate" style={{ fontSize: 14 }}>{r.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {isSeller
                        ? `From ${r.profiles?.full_name || r.profiles?.email || 'a buyer'}`
                        : r.brands?.name ? `To ${r.brands.name}` : ''
                      }
                      {' · '}{fmtDate(r.created_at)}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.message}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Pro upsell (sellers only) ───────── */}
      {!isProMember && isSeller && hasBrand && (
        <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-md)', padding: 20, color: 'white', marginBottom: 20 }}>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={18} stroke="white" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold">Unlock Pro</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Unlimited products, RFQ marketplace access, analytics and more.</div>
            </div>
          </div>
          <Button variant="primary" block onClick={() => goTo('subscription')}>Upgrade to Pro</Button>
        </div>
      )}

      {/* ── Manage ─────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div className="uppercase-label mb-3">Manage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Edit profile',     sub: isSeller ? 'Personal info, business details' : 'Your name, email, contact details', screen: 'manage-profile' as Screen, icon: 'briefcase', show: true },
            { label: 'Products',         sub: `Manage your product listings`, screen: 'manage-products' as Screen, icon: 'box', show: isSeller },
            { label: 'Subscription',     sub: isProMember ? 'Pro plan · manage billing' : 'Upgrade to Pro', screen: 'subscription' as Screen, icon: 'sparkle', show: true },
            { label: 'Settings',         sub: 'Notifications, privacy, preferences', screen: 'settings' as Screen, icon: 'sliders', show: true },
          ].filter(item => item.show).map(item => (
            <button key={item.screen} className="card card-hover"
              onClick={() => goTo(item.screen)}
              style={{ padding: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
                <Icon name={item.icon} size={17} />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold" style={{ fontSize: 14 }}>{item.label}</div>
                <div className="text-xs text-muted">{item.sub}</div>
              </div>
              <Icon name="chevron-right" size={15} stroke="var(--muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sign out ────────────────────────── */}
      {onSignOut && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onSignOut} className="card card-hover"
            style={{ width: '100%', padding: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="log-out" size={17} stroke="var(--danger)" />
            </div>
            <span className="font-display font-semibold" style={{ color: 'var(--danger)', fontSize: 14 }}>Sign out</span>
          </button>
        </div>
      )}

      {/* ── Danger zone ─────────────────────── */}
      {onDeleteAccount && (
        <div style={{ marginTop: 32 }}>
          <div className="uppercase-label mb-3" style={{ color: 'var(--danger)' }}>Danger zone</div>
          <div className="card" style={{ padding: 20, border: '1px solid rgba(185,28,28,0.25)', background: 'var(--danger-soft)' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1" style={{ minWidth: 200 }}>
                <div className="font-display font-semibold" style={{ marginBottom: 4 }}>Delete account</div>
                <div className="text-xs text-muted">Permanently removes your account, brand, products, and all data. Cannot be undone.</div>
              </div>
              <button onClick={() => setShowDeleteModal(true)}
                style={{ padding: '8px 16px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(185,28,28,0.4)', background: 'white', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

/* ── ManageProfileScreen ────────────────────── */
export function ManageProfileScreen({ goTo, userProfile, onSave, isProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  userProfile: UserProfile
  onSave?: (p: UserProfile) => Promise<string | null>
  isProMember: boolean
}) {
  const [form, setForm] = useState<UserProfile>({ ...userProfile })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isSeller = form.role === 'seller'
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id))
  }, [])

  const upd = (k: keyof UserProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    if (isSeller && !form.businessName.trim()) { setError('Business name is required for seller accounts.'); return }
    if (!onSave) { goTo('profile'); return }
    setSaving(true)
    const err = await onSave(form)
    setSaving(false)
    if (err) { setError(err); return }
    goTo('profile')
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Edit profile" sub="Keep your information up to date." />

      <form onSubmit={handleSubmit}>

        {/* ── Personal information ───────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center gap-3 mb-4">
            <ImageUploadCircle
              src={form.avatarUrl}
              initials={form.logo}
              size="lg"
              bucket="avatars"
              userId={userId}
              onUploaded={url => setForm(prev => ({ ...prev, avatarUrl: url }))}
              label="Upload profile photo"
            />
            <div>
              <h3 className="font-display font-bold text-lg">Personal information</h3>
              <div className="text-xs text-muted">Click the avatar to upload a photo</div>
            </div>
          </div>
          <Field
            label="Full name"
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={upd('fullName')}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Email</label>
              <input
                className="field"
                type="email"
                value={form.email}
                readOnly
                style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', color: 'var(--muted)' }}
              />
              <div className="text-xs text-muted mt-1">Email cannot be changed here</div>
            </div>
            <Field label="Phone" type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={upd('phone')} />
          </div>
        </div>

        {/* ── Business information ───────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-start gap-4 mb-4 flex-wrap">
            <ImageUploadCircle
              src={form.logoUrl}
              initials={form.logo || form.businessName?.slice(0, 2).toUpperCase() || '?'}
              size="lg"
              bucket="logos"
              userId={userId}
              onUploaded={url => setForm(prev => ({ ...prev, logoUrl: url }))}
              label="Upload business logo"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-display font-bold text-lg">Business information</h3>
                  <div className="text-xs text-muted">
                    {isSeller
                      ? 'Click the logo to upload · visible on the marketplace'
                      : 'Optional — add if you represent a company'}
                  </div>
                </div>
                {!isSeller && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'var(--bg-alt)', borderRadius: 'var(--r-xs)', padding: '3px 8px', border: '1px solid var(--border)' }}>
                    Optional
                  </span>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Business name"
            placeholder="Acme Industries Ltd."
            value={form.businessName}
            onChange={upd('businessName')}
            required={isSeller}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Industry</label>
              <select className="field" value={form.businessIndustry} onChange={upd('businessIndustry')}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field label="Business phone" type="tel" placeholder="+94 11 000 0000" value={form.businessPhone} onChange={upd('businessPhone')} />
          </div>

          <Field label="Business website" type="url" placeholder="https://yourcompany.com" value={form.businessWebsite} onChange={upd('businessWebsite')} />

          {isSeller && (
            <TextArea
              label="Business description"
              placeholder="Describe what your business does, who you serve, and what makes you different…"
              value={form.description}
              onChange={upd('description')}
              rows={5}
            />
          )}
        </div>

        {/* ── Profile banner (Pro) ────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Profile banner</label>
          {isProMember ? (
            <div>
              <div style={{ height: 100, borderRadius: 'var(--r-sm)', background: form.bannerColor, display: 'grid', placeItems: 'center', color: 'white', marginBottom: 12, fontWeight: 600 }}>
                Banner preview
              </div>
              <input type="color" value={form.bannerColor}
                onChange={(e) => setForm(prev => ({ ...prev, bannerColor: e.target.value }))}
                style={{ width: '100%', height: 40, borderRadius: 'var(--r-xs)' }} />
            </div>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Profile banner customization is a Pro feature." />
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('profile')} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ── ManageProductsScreen ───────────────────── */
export function ManageProductsScreen({ goTo, setEditingProduct }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  setEditingProduct: (p: DbProduct | null) => void
}) {
  const [products, setProducts]   = useState<DbProduct[]>([])
  const [loading, setLoading]     = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: brand } = await supabase.from('brands').select('id').eq('owner_id', user.id).maybeSingle()
      if (!brand) { setLoading(false); return }
      const { data } = await supabase.from('products').select('*').eq('brand_id', brand.id).order('created_at', { ascending: false })
      setProducts((data || []) as DbProduct[])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    setTogglingId(null)
  }

  const total  = products.length
  const active = products.filter(p => p.is_active).length

  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader
        title="Products"
        sub={loading ? 'Loading…' : `${total} total · ${active} active`}
        action={<Button variant="primary" icon="plus" onClick={() => goTo('add-product')}>Add product</Button>}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={76} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="box" size={32} stroke="var(--muted)" />
          <div className="font-display font-semibold mt-3 mb-1">No products yet</div>
          <div className="text-sm text-muted mb-4">Add your first product to start receiving inquiries from buyers.</div>
          <Button variant="primary" icon="plus" onClick={() => goTo('add-product')}>Add first product</Button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {products.map((p, i) => {
            const priceLabel = p.price_range_min ? `LKR ${Math.round(p.price_range_min).toLocaleString()}` : null
            return (
              <div key={p.id} style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
                  {p.images[0]
                    ? <img src={p.images[0]} alt="" className="img-cover" />
                    : <Icon name="image" size={20} stroke="var(--border-strong)" />
                  }
                </div>
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div className="font-display font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                    {priceLabel && <span className="font-mono">{priceLabel}</span>}
                    <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    {p.category && <span>{p.category}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" icon="edit"
                    onClick={() => { setEditingProduct(p); goTo('edit-product') }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" disabled={togglingId === p.id}
                    onClick={() => toggleActive(p.id, p.is_active)}>
                    {togglingId === p.id ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── ProductFormScreen ──────────────────────── */
export function ProductFormScreen({ goTo, mode = 'add', editingProduct, isProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  mode?: 'add' | 'edit'
  editingProduct?: DbProduct | null
  isProMember: boolean
}) {
  const [brandId, setBrandId]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  // Core form state — maps directly to DB columns
  const [form, setForm] = useState({
    name:        editingProduct?.name        || '',
    category:    editingProduct?.category    || '',
    subcategory: editingProduct?.subcategory || '',
    description: editingProduct?.description || '',
    priceMin:    editingProduct?.price_range_min  != null ? String(editingProduct.price_range_min)  : '',
    priceMax:    editingProduct?.price_range_max  != null ? String(editingProduct.price_range_max)  : '',
    unit:        editingProduct?.unit        || '',
    minOrderQty: editingProduct?.min_order_quantity != null ? String(editingProduct.min_order_quantity) : '',
    tags:        editingProduct?.tags.join(', ') || '',
    images:      editingProduct?.images      || [] as string[],
    // UI-only fields (not yet in DB schema)
    videoUrl:    '',
    directSales: false,
  })

  // Tiered pricing — UI only, not persisted yet
  const [tieredPricing, setTieredPricing] = useState([{ min: 1, max: null as number | null, price: 0 }])
  // Variations — UI only, not persisted yet
  const [variations, setVariations] = useState<{ name: string; price: number }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('brands').select('id').eq('owner_id', user.id).maybeSingle()
        .then(({ data: brand }) => { if (brand) setBrandId(brand.id) })
    })
  }, [])

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Tiered pricing handlers
  const setTier = (i: number, key: string, value: string | number | null) => {
    const arr = [...tieredPricing]; arr[i] = { ...arr[i], [key]: value }; setTieredPricing(arr)
  }
  const addTier = () => {
    const last = tieredPricing[tieredPricing.length - 1]
    setTieredPricing([...tieredPricing, { min: (last.max || last.min) + 1, max: null, price: 0 }])
  }
  const removeTier = (i: number) => setTieredPricing(tieredPricing.filter((_, idx) => idx !== i))

  // Variation handlers
  const setVariation = (i: number, key: string, value: string | number) => {
    const arr = [...variations]; arr[i] = { ...arr[i], [key]: value }; setVariations(arr)
  }
  const addVariation  = () => setVariations([...variations, { name: '', price: 0 }])
  const removeVariation = (i: number) => setVariations(variations.filter((_, idx) => idx !== i))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim())        { setError('Product name is required.'); return }
    if (!form.category)           { setError('Please select a category.'); return }
    if (!form.description.trim()) { setError('Description is required.'); return }
    if (!brandId)                 { setError('Could not find your brand. Please try again.'); return }

    setSubmitting(true)
    try {
      const supabase   = createClient()
      const tags       = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const priceMin   = parseFloat(form.priceMin)   || null
      const priceMax   = parseFloat(form.priceMax)   || null
      const moq        = parseInt(form.minOrderQty)  || null

      if (mode === 'add') {
        const baseSlug     = generateSlug(form.name)
        const slug         = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
        const { error: err } = await supabase.from('products').insert({
          brand_id:           brandId,
          name:               form.name.trim(),
          slug,
          description:        form.description.trim(),
          images:             form.images,
          category:           form.category,
          subcategory:        form.subcategory.trim() || null,
          min_order_quantity: moq,
          price_range_min:    priceMin,
          price_range_max:    priceMax,
          unit:               form.unit.trim() || null,
          tags,
          is_active:          true,
        })
        if (err) { setError(err.message); return }
      } else if (editingProduct) {
        const { error: err } = await supabase.from('products').update({
          name:               form.name.trim(),
          description:        form.description.trim(),
          images:             form.images,
          category:           form.category,
          subcategory:        form.subcategory.trim() || null,
          min_order_quantity: moq,
          price_range_min:    priceMin,
          price_range_max:    priceMax,
          unit:               form.unit.trim() || null,
          tags,
        }).eq('id', editingProduct.id)
        if (err) { setError(err.message); return }
      }

      goTo('manage-products')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 820, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('manage-products')}>Back to products</BackLink>
      <PageHeader
        title={mode === 'add' ? 'Add product' : 'Edit product'}
        sub={mode === 'add' ? 'Create a new product listing for your storefront.' : 'Update product details.'}
      />

      <form onSubmit={handleSubmit}>
        {/* ── Basics ──────────────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Basics</h3>

          <Field label="Product name" value={form.name} onChange={upd('name')} required placeholder="Smart Sensor Pro" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Category <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="field" value={form.category} onChange={upd('category')} required>
                <option value="">Select category…</option>
                {INDUSTRIES.filter(i => i !== 'Other').map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field label="Subcategory" value={form.subcategory} onChange={upd('subcategory')} placeholder="e.g. IoT Sensors" />
          </div>

          <TextArea label="Description" value={form.description} onChange={upd('description')} required
            placeholder="Tell buyers what this product does, who it's for, and what makes it different." rows={4} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="field-label">Min price (LKR)</label>
              <input className="field" type="number" min="0" step="0.01" placeholder="89500"
                value={form.priceMin} onChange={upd('priceMin')} />
            </div>
            <div>
              <label className="field-label">Max price (LKR)</label>
              <input className="field" type="number" min="0" step="0.01" placeholder="149500"
                value={form.priceMax} onChange={upd('priceMax')} />
            </div>
            <Field label="Unit" placeholder="per kg, per unit…" value={form.unit} onChange={upd('unit')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Min order quantity</label>
              <input className="field" type="number" min="1" placeholder="10"
                value={form.minOrderQty} onChange={upd('minOrderQty')} />
            </div>
            <div>
              <Field label="Tags" placeholder="sensor, IoT, industrial" value={form.tags} onChange={upd('tags')} />
              <div className="text-xs text-muted" style={{ marginTop: -12 }}>Separate tags with commas</div>
            </div>
          </div>
        </div>

        {/* ── Media ───────────────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Media</h3>
          <label className="field-label">Product images</label>
          <ProductImageUploader
            images={form.images}
            brandId={brandId || ''}
            onUpdate={urls => setForm(prev => ({ ...prev, images: urls }))}
          />
          <div style={{ marginTop: 20 }}>
            <label className="field-label">Product video</label>
            {isProMember
              ? <input className="field" type="url" placeholder="https://youtube.com/..." value={form.videoUrl} onChange={upd('videoUrl')} />
              : <ProLock onUpgrade={() => goTo('subscription')} label="Add a product video to stand out in search results." />
            }
          </div>
        </div>

        {/* ── Tiered pricing (UI only) ─────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Tiered pricing</h3>
            <span className="text-xs text-muted">Reward bulk buyers with quantity discounts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tieredPricing.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label className="field-label text-xs">Min qty</label>
                  <input className="field" type="number" value={t.min || ''} onChange={(e) => setTier(i, 'min', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="field-label text-xs">Max qty</label>
                  <input className="field" type="number" value={t.max || ''} placeholder="∞" onChange={(e) => setTier(i, 'max', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div>
                  <label className="field-label text-xs">Price (LKR)</label>
                  <input className="field" type="number" value={t.price || ''} onChange={(e) => setTier(i, 'price', e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeTier(i)} disabled={i === 0} />
              </div>
            ))}
            <Button variant="secondary" size="sm" icon="plus" type="button" onClick={addTier} block>Add price tier</Button>
          </div>
        </div>

        {/* ── Variations (UI only) ─────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Variations</h3>
            <span className="text-xs text-muted">Offer different options at different price points</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {variations.length === 0 && <div className="text-sm text-muted">No variations yet.</div>}
            {variations.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label className="field-label text-xs">Name</label>
                  <input className="field" type="text" value={v.name} placeholder="Standard" onChange={(e) => setVariation(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="field-label text-xs">Price (LKR)</label>
                  <input className="field" type="number" value={v.price} onChange={(e) => setVariation(i, 'price', e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeVariation(i)} />
              </div>
            ))}
            <Button variant="secondary" size="sm" icon="plus" type="button" onClick={addVariation} block>Add variation</Button>
          </div>
        </div>

        {/* ── Direct sales (UI only) ───────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Direct sales</label>
          {isProMember ? (
            <label className="flex items-center gap-3" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.directSales} onChange={(e) => setForm(prev => ({ ...prev, directSales: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <div className="flex-1">
                <div className="font-display font-semibold">Enable direct sales</div>
                <div className="text-xs text-muted">Buyers can purchase this product directly through the marketplace.</div>
              </div>
            </label>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Let buyers purchase directly with Pro." />
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('manage-products')} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check" disabled={submitting}>
            {submitting ? (mode === 'add' ? 'Adding…' : 'Saving…') : (mode === 'add' ? 'Add product' : 'Save changes')}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ── SettingsScreen ─────────────────────────── */
export function SettingsScreen({ goTo }: { goTo: (s: Screen, opts?: NavOpts) => void }) {
  const groups = [
    { title: 'Account', items: [
      { label: 'Notifications',       sub: 'Email, push, in-app' },
      { label: 'Privacy & security',  sub: 'Password, 2FA, sessions' },
      { label: 'Connected accounts',  sub: 'Google, Slack' },
    ]},
    { title: 'Preferences', items: [
      { label: 'Language', sub: 'English (US)' },
      { label: 'Region',   sub: 'Sri Lanka' },
    ]},
    { title: 'Support', items: [
      { label: 'Help & docs',    sub: 'Browse guides and contact support' },
      { label: 'Terms of service' },
      { label: 'About',          sub: 'Syndicate v2.0' },
    ]},
  ]

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Settings" />

      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div className="uppercase-label mb-3">{g.title}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {g.items.map((it, i) => (
              <button key={i} className="flex items-center gap-3 w-full"
                style={{ padding: 16, textAlign: 'left', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
                <div className="flex-1">
                  <div className="font-display font-semibold">{it.label}</div>
                  {it.sub && <div className="text-xs text-muted">{it.sub}</div>}
                </div>
                <Icon name="chevron-right" size={16} stroke="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── SubscriptionScreen ─────────────────────── */
export function SubscriptionScreen({ goTo, isProMember, setIsProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isProMember: boolean
  setIsProMember: (v: boolean) => void
}) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back</BackLink>
      <PageHeader eyebrow="Plans & pricing" title="Pick the plan that fits" sub="Switch or cancel anytime. Pro unlocks the RFQ marketplace, direct sales, and analytics." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {PLANS.map((plan, i) => {
          const isCurrent = plan.name === 'Free' ? !isProMember : (isProMember && plan.name === 'Monthly Pro')
          const isFeatured = plan.recommended
          return (
            <div key={i} className="card" style={{
              padding: 28,
              borderColor: isFeatured ? 'var(--primary)' : 'var(--border)',
              borderWidth: isFeatured ? 2 : 1,
              position: 'relative',
              overflow: 'visible',
              background: isFeatured ? 'linear-gradient(180deg, var(--primary-soft) 0%, white 60%)' : 'white',
            }}>
              {isFeatured && (
                <span style={{ position: 'absolute', top: -12, right: 24 }}>
                  <Badge variant="pro" icon="sparkle">Best value</Badge>
                </span>
              )}
              <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display font-bold" style={{ fontSize: 40, letterSpacing: '-0.025em' }}>
                  {plan.price === 0 ? 'Free' : `LKR ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="text-muted text-sm">/ {plan.period.split(',')[0]}</span>}
              </div>
              {plan.period.includes(',') && <div className="text-xs text-muted mb-4 font-mono">{plan.period.split(',')[1]}</div>}
              {!plan.period.includes(',') && <div className="text-xs text-muted mb-4">&nbsp;</div>}

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>
                      <Icon name="check" size={15} strokeWidth={2.5} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isFeatured ? 'primary' : (isCurrent ? 'secondary' : 'dark')}
                block
                disabled={isCurrent}
                onClick={() => {
                  if (plan.name !== 'Free') setIsProMember(true)
                  else setIsProMember(false)
                  goTo('success')
                }}
              >
                {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted mt-6 font-mono">
        All plans include a 14-day money-back guarantee · Tax may apply
      </div>
    </div>
  )
}
