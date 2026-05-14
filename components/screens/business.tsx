'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Badge, Chip, Field, TextArea, PageHeader, BackLink, Tabs, EmptyState, SkeletonCard, VerifiedMark } from '@/components/ui'
import { type Business, type Screen, type NavOpts, type UserProfile, INDUSTRIES } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbRfq, DbRfqResponse, DbRfqBid, DbNotification } from '@/types/database'

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────── */

const EXPIRY_OPTIONS = [
  { label: '2 weeks',  days: 14  },
  { label: '1 month',  days: 30  },
  { label: '2 months', days: 60  },
  { label: '3 months', days: 90  },
]

const BUDGET_FILTERS = [
  { label: 'Any budget',       min: null,       max: null        },
  { label: 'Under LKR 5M',    min: null,       max: 5_000_000   },
  { label: 'LKR 5M–25M',      min: 5_000_000,  max: 25_000_000  },
  { label: 'LKR 25M–100M',    min: 25_000_000, max: 100_000_000 },
  { label: 'LKR 100M+',       min: 100_000_000, max: null       },
]

const TIME_FILTERS = [
  { label: 'Any time',  hours: null  },
  { label: 'Today',     hours: 24    },
  { label: 'This week', hours: 168   },
  { label: 'This month',hours: 720   },
]

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */

const RFQ_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Open',      color: 'var(--success)',  bg: 'var(--success-soft)'           },
  read:      { label: 'Viewed',    color: 'var(--muted)',    bg: 'var(--bg-alt)'                 },
  responded: { label: 'Responded', color: 'var(--primary)',  bg: 'var(--primary-soft)'           },
  closed:    { label: 'Closed',    color: 'var(--ink)',      bg: 'var(--bg-alt)'                 },
}

const BID_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Submitted', color: 'var(--warning)',  bg: 'var(--warning-soft, #fef9c3)' },
  accepted: { label: 'Accepted',  color: 'var(--success)',  bg: 'var(--success-soft)'          },
  rejected: { label: 'Declined',  color: 'var(--danger)',   bg: 'var(--danger-soft)'           },
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

function BidStatusPill({ status }: { status: string }) {
  const s = BID_STATUS[status] || { label: status, color: 'var(--muted)', bg: 'var(--bg-alt)' }
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

function fmtBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `LKR ${(n / 1_000).toFixed(0)}K`
    return `LKR ${n.toLocaleString()}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return null
}

function fmtExpiry(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  if (days < 7) return `Expires in ${days} days`
  return `Expires ${fmtDate(iso)}`
}

/* ─────────────────────────────────────────────────────────────
   RFQ IMAGE UPLOADER
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   PUBLIC RFQ CARD (browse board)
   ───────────────────────────────────────────────────────────── */

function PublicRfqCard({ rfq, onBid, onView, isSignedIn }: {
  rfq: DbRfq
  onBid?: () => void
  onView?: () => void
  isSignedIn: boolean
}) {
  const poster = (rfq.profiles as { full_name?: string } | null)?.full_name || 'Anonymous'
  const budget = fmtBudget(rfq.budget_min, rfq.budget_max)
  const expiry = fmtExpiry(rfq.expires_at)
  const expired = expiry === 'Expired'

  return (
    <article className="card card-hover fade-up" style={{ padding: 'var(--card-pad)', opacity: expired ? 0.55 : 1 }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="font-display font-semibold" style={{ fontSize: 16, lineHeight: 1.25, marginBottom: 4 }}>{rfq.subject}</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
            <span>by {poster}</span>
            {rfq.category && <><span>·</span><Badge variant="neutral">{rfq.category}</Badge></>}
            {rfq.location && <><span>·</span><span className="flex items-center gap-1"><Icon name="pin" size={10} />{rfq.location}</span></>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
          <StatusPill status={rfq.status} />
          {expiry && (
            <span style={{ fontSize: 10, color: expired ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
              {expiry}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-muted line-clamp-2" style={{ marginBottom: 12, lineHeight: 1.55 }}>{rfq.message}</p>

      {rfq.images && rfq.images.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {rfq.images.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-5 flex-wrap text-sm">
          {budget && (
            <div>
              <div className="uppercase-label" style={{ fontSize: 9, marginBottom: 1 }}>Budget</div>
              <div className="font-display font-bold" style={{ fontSize: 14 }}>{budget}</div>
            </div>
          )}
          {rfq.quantity && (
            <div>
              <div className="uppercase-label" style={{ fontSize: 9, marginBottom: 1 }}>Qty</div>
              <div className="font-display font-bold" style={{ fontSize: 14 }}>{rfq.quantity.toLocaleString()} {rfq.unit || ''}</div>
            </div>
          )}
          {rfq.timeline && (
            <div>
              <div className="uppercase-label" style={{ fontSize: 9, marginBottom: 1 }}>Timeline</div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink2)' }}>{rfq.timeline}</div>
            </div>
          )}
          <div>
            <div className="uppercase-label" style={{ fontSize: 9, marginBottom: 1 }}>Posted</div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(rfq.created_at)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onView}>View</Button>
          {!expired && rfq.status !== 'closed' && (
            <Button variant="primary" size="sm" iconRight="arrow-right"
              onClick={() => isSignedIn ? onBid?.() : onView?.()}>
              Submit bid
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────────
   LIVE RFQ CARD (My RFQs / Messages)
   ───────────────────────────────────────────────────────────── */

function LiveRfqCard({ rfq, isSeller, onClick, bidCount }: {
  rfq: DbRfq
  isSeller: boolean
  onClick?: () => void
  bidCount?: number
}) {
  const otherName = isSeller
    ? (rfq.profiles as { full_name?: string; email?: string } | null)?.full_name
      || (rfq.profiles as { full_name?: string; email?: string } | null)?.email
      || 'Buyer'
    : (rfq.brands as { name?: string } | null)?.name || 'Supplier'

  const otherLogoUrl = !isSeller
    ? (rfq.brands as { logo_url?: string | null } | null)?.logo_url || undefined
    : undefined

  const isUnread = rfq.status === 'pending' && isSeller
  const budget = fmtBudget(rfq.budget_min, rfq.budget_max)

  return (
    <button
      className="card card-hover"
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', padding: 'var(--card-pad)', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', position: 'relative' }}>
      {isUnread && (
        <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 999, background: 'var(--primary)' }} />
      )}
      <Avatar src={otherLogoUrl} initials={otherName.slice(0, 2).toUpperCase()} size="md" />
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="font-display font-semibold truncate">{rfq.subject}</span>
          <span className="font-mono text-xs text-muted" style={{ flexShrink: 0 }}>{fmtDate(rfq.created_at)}</span>
        </div>
        <div className="text-xs text-muted mb-1">
          {rfq.is_public ? 'Public RFQ' : (isSeller ? 'From' : 'To') + ' ' + otherName}
          {rfq.location && <> · <Icon name="pin" size={9} /> {rfq.location}</>}
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {budget && <span className="font-mono text-xs" style={{ color: 'var(--ink2)' }}>{budget}</span>}
            {rfq.is_public && bidCount !== undefined && (
              <span className="text-xs text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="file" size={10} />
                {bidCount} bid{bidCount !== 1 ? 's' : ''}
              </span>
            )}
            <p className="text-sm text-muted line-clamp-1" style={{ margin: 0 }}>
              {rfq.message.slice(0, 60)}{rfq.message.length > 60 ? '…' : ''}
            </p>
          </div>
          <StatusPill status={rfq.status} />
        </div>
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────
   BID CARD (My Bids tab)
   ───────────────────────────────────────────────────────────── */

function BidCard({ bid, onClick }: { bid: DbRfqBid; onClick?: () => void }) {
  const rfqSubject = (bid.rfqs as { subject?: string } | null)?.subject || 'RFQ'
  return (
    <button
      className="card card-hover"
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', padding: 'var(--card-pad)', cursor: 'pointer' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-display font-semibold truncate" style={{ fontSize: 14, marginBottom: 4 }}>{rfqSubject}</div>
          <p className="text-sm text-muted line-clamp-2" style={{ marginBottom: 6 }}>{bid.description}</p>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted">
            {bid.amount && <span className="font-mono font-semibold" style={{ color: 'var(--ink2)' }}>{bid.currency} {bid.amount.toLocaleString()}</span>}
            {bid.timeline && <span>· {bid.timeline}</span>}
            <span>· {fmtDate(bid.created_at)}</span>
          </div>
        </div>
        <BidStatusPill status={bid.status} />
      </div>
      {bid.images && bid.images.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {bid.images.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────
   RFQsScreen
   ───────────────────────────────────────────────────────────── */

export function RFQsScreen({
  goTo,
  isSignedIn = false,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isSignedIn?: boolean
}) {
  const [tab, setTab] = useState('browse')

  // Browse state
  const [browseRfqs,   setBrowseRfqs]   = useState<DbRfq[]>([])
  const [browseLoading,setBrowseLoading]= useState(true)
  const [filterCat,    setFilterCat]    = useState('')
  const [filterBudget, setFilterBudget] = useState(0)
  const [filterTime,   setFilterTime]   = useState(0)

  // My RFQs state
  const [myRfqs,    setMyRfqs]    = useState<DbRfq[]>([])
  const [loadingMy, setLoadingMy] = useState(false)

  // My Bids state
  const [myBids,    setMyBids]    = useState<DbRfqBid[]>([])
  const [loadingBids, setLoadingBids] = useState(false)

  // Load browse (public RFQs) on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.from('rfqs')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_public', true)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const now = new Date()
        const live = (data || []).filter((r: DbRfq) =>
          !r.expires_at || new Date(r.expires_at) > now
        )
        setBrowseRfqs(live as unknown as DbRfq[])
        setBrowseLoading(false)
      })
  }, [])

  // Load My RFQs when tab activates
  useEffect(() => {
    if (tab !== 'my' || !isSignedIn) return
    setLoadingMy(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoadingMy(false); return }
      supabase.from('rfqs')
        .select('*, brands(name, slug, logo_url), profiles(full_name, email, avatar_url), rfq_bids(id)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setMyRfqs((data || []) as unknown as DbRfq[])
          setLoadingMy(false)
        })
    })
  }, [tab, isSignedIn])

  // Load My Bids when tab activates
  useEffect(() => {
    if (tab !== 'bids' || !isSignedIn) return
    setLoadingBids(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoadingBids(false); return }
      supabase.from('rfq_bids')
        .select('*, rfqs(subject, buyer_id, is_public, status), brands(name, logo_url)')
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setMyBids((data || []) as unknown as DbRfqBid[])
          setLoadingBids(false)
        })
    })
  }, [tab, isSignedIn])

  // Client-side filter for browse
  const displayBrowse = browseRfqs.filter(r => {
    if (filterCat && r.category !== filterCat) return false
    const bf = BUDGET_FILTERS[filterBudget]
    if (bf.min !== null && (r.budget_max === null || r.budget_max < bf.min)) return false
    if (bf.max !== null && (r.budget_min === null || r.budget_min > bf.max)) return false
    const tf = TIME_FILTERS[filterTime]
    if (tf.hours !== null) {
      const cutoff = new Date(Date.now() - tf.hours * 3600 * 1000)
      if (new Date(r.created_at) < cutoff) return false
    }
    return true
  })

  const tabs = [
    { value: 'browse', label: 'Open requests', count: browseRfqs.length },
    ...(isSignedIn ? [{ value: 'my', label: 'My RFQs', count: myRfqs.length }] : []),
    ...(isSignedIn ? [{ value: 'bids', label: 'My Bids', count: myBids.length }] : []),
  ]

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Request for quote"
        title="RFQ marketplace"
        sub="Browse open buyer requests or post your own."
        action={<Button variant="primary" icon="plus" onClick={() => goTo('rfq-create')}>New RFQ</Button>}
      />

      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={tabs} />
      </div>

      {/* Browse filters */}
      {tab === 'browse' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="uppercase-label" style={{ marginRight: 4 }}>Industry</span>
            <Chip active={!filterCat} onClick={() => setFilterCat('')}>All</Chip>
            {INDUSTRIES.slice(0, 8).filter(i => i !== 'Other').map(cat => (
              <Chip key={cat} active={filterCat === cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}>
                {cat}
              </Chip>
            ))}
          </div>
          {/* Budget + Time filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="uppercase-label" style={{ marginRight: 4 }}>Budget</span>
            {BUDGET_FILTERS.map((b, i) => (
              <Chip key={i} active={filterBudget === i} onClick={() => setFilterBudget(filterBudget === i ? 0 : i)}>
                {b.label}
              </Chip>
            ))}
            <span className="uppercase-label" style={{ margin: '0 4px 0 12px' }}>Posted</span>
            {TIME_FILTERS.map((t, i) => (
              <Chip key={i} active={filterTime === i} onClick={() => setFilterTime(filterTime === i ? 0 : i)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 64 }}>
        {/* ── Browse tab ── */}
        {tab === 'browse' && (
          browseLoading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} height={180} />)
            : displayBrowse.length === 0
              ? <EmptyState icon="file" title="No open RFQs" sub="No RFQs match your filters. Try broadening your search or check back later." />
              : displayBrowse.map(r => (
                  <PublicRfqCard key={r.id} rfq={r} isSignedIn={isSignedIn}
                    onView={() => goTo('rfq-detail', { rfqId: r.id })}
                    onBid={() => goTo('rfq-detail', { rfqId: r.id })}
                  />
                ))
        )}

        {/* ── My RFQs tab ── */}
        {tab === 'my' && (
          loadingMy
            ? [1, 2, 3].map(i => <SkeletonCard key={i} height={100} />)
            : myRfqs.length === 0
              ? <EmptyState icon="file" title="No RFQs yet" sub="Post an RFQ to start receiving bids from verified suppliers." />
              : myRfqs.map(r => (
                  <LiveRfqCard key={r.id} rfq={r} isSeller={false}
                    bidCount={(r as unknown as { rfq_bids?: { id: string }[] }).rfq_bids?.length ?? 0}
                    onClick={() => goTo('rfq-detail', { rfqId: r.id })} />
                ))
        )}

        {/* ── My Bids tab ── */}
        {tab === 'bids' && (
          loadingBids
            ? [1, 2].map(i => <SkeletonCard key={i} height={100} />)
            : myBids.length === 0
              ? <EmptyState icon="file" title="No bids yet" sub="Submit bids on open RFQs in the Browse tab to see them here." />
              : myBids.map(b => (
                  <BidCard key={b.id} bid={b}
                    onClick={() => goTo('rfq-detail', { rfqId: b.rfq_id })} />
                ))
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   RFQCreateScreen
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   BID FORM (inline inside RFQDetailScreen)
   ───────────────────────────────────────────────────────────── */

function BidForm({
  rfqId,
  userId,
  brandId,
  onSubmitted,
}: {
  rfqId: string
  userId: string
  brandId: string
  onSubmitted: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [timeline,    setTimeline]    = useState('')
  const [notes,       setNotes]       = useState('')
  const [images,      setImages]      = useState<string[]>([])
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError('Bid description is required.'); return }
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data: bidData, error: err } = await supabase.from('rfq_bids').insert({
      rfq_id:      rfqId,
      bidder_id:   userId,
      brand_id:    brandId,
      description: description.trim(),
      amount:      amount ? parseFloat(amount) || null : null,
      currency:    'LKR',
      timeline:    timeline.trim() || null,
      notes:       notes.trim() || null,
      images,
      status:      'pending',
    }).select().single()
    setSubmitting(false)
    if (err) { setError(err.message); return }
    // Notify the RFQ buyer
    try {
      const [{ data: rfqRow }, { data: brandRow }] = await Promise.all([
        supabase.from('rfqs').select('buyer_id, subject').eq('id', rfqId).single(),
        supabase.from('brands').select('name').eq('id', brandId).single(),
      ])
      if (rfqRow && brandRow && bidData) {
        await supabase.from('notifications').insert({
          user_id: rfqRow.buyer_id,
          type:    'bid_received',
          title:   `New bid on "${rfqRow.subject}"`,
          body:    `${brandRow.name} submitted a bid. Review it in your RFQ.`,
          rfq_id:  rfqId,
          bid_id:  bidData.id,
        })
      }
    } catch { /* notification insert is non-critical */ }
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ borderTop: '2px solid var(--primary)', paddingTop: 20, marginTop: 4 }}>
        <h3 className="font-display font-bold text-lg mb-4" style={{ color: 'var(--primary-ink, var(--ink))' }}>Submit your bid</h3>

        <TextArea label="Bid description" rows={4} required
          placeholder="Describe how you can fulfil this request — your capabilities, approach, and why you're the right fit…"
          value={description} onChange={e => setDescription(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="mb-4">
            <label className="field-label">Your price (LKR, optional)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>LKR</span>
              <input className="field" type="number" min="0" placeholder="0"
                style={{ paddingLeft: 44 }} value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <Field label="Delivery timeline (optional)" placeholder="e.g. 6 weeks from order"
            value={timeline} onChange={e => setTimeline(e.target.value)} />
        </div>

        <TextArea label="Additional notes (optional)" rows={2}
          placeholder="Lead time, minimum order, certifications, payment terms…"
          value={notes} onChange={e => setNotes(e.target.value)} />

        <div className="mb-4">
          <label className="field-label mb-2 block">Images (optional)</label>
          <RfqImageUploader images={images} userId={userId} onUpdate={setImages} maxImages={2} />
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="primary" type="submit" block iconRight="arrow-right" disabled={submitting}>
            {submitting ? 'Submitting bid…' : 'Submit bid'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────
   RFQDetailScreen
   ───────────────────────────────────────────────────────────── */

export function RFQDetailScreen({
  goTo,
  rfqId,
  userProfile,
  onStatusChange,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  rfqId: string | null
  userProfile: UserProfile
  onStatusChange?: () => void
}) {
  const [rfq,        setRfq]        = useState<DbRfq | null>(null)
  const [responses,  setResponses]  = useState<DbRfqResponse[]>([])
  const [bids,       setBids]       = useState<DbRfqBid[]>([])
  const [loading,    setLoading]    = useState(true)
  const [replyText,  setReplyText]  = useState('')
  const [sending,    setSending]    = useState(false)
  const [closing,    setClosing]    = useState(false)
  const [error,      setError]      = useState('')
  const [userId,     setUserId]     = useState<string | null>(null)
  const [showBidForm,setShowBidForm]= useState(false)
  const [bidSubmitted,setBidSubmitted]=useState(false)
  const [myBid,      setMyBid]      = useState<DbRfqBid | null>(null)
  const [updating,     setUpdating]     = useState(false)
  const [acceptedBid,  setAcceptedBid]  = useState<DbRfqBid | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const isSeller = !!(rfq && userProfile.brandId && rfq.brand_id && userProfile.brandId === rfq.brand_id)
  const isOwner  = !!(rfq && userId && rfq.buyer_id === userId)
  const isPublicRfq = rfq?.is_public ?? false
  const isClosed = rfq?.status === 'closed'
  const expiry   = rfq?.expires_at ? fmtExpiry(rfq.expires_at) : null
  const budget   = rfq ? fmtBudget(rfq.budget_min, rfq.budget_max) : null

  async function loadResponses(supabase: ReturnType<typeof createClient>, id: string) {
    const { data } = await supabase.from('rfq_responses')
      .select('*, profiles(full_name, avatar_url)')
      .eq('rfq_id', id).order('created_at', { ascending: true })
    setResponses((data || []) as unknown as DbRfqResponse[])
  }

  async function loadBids(supabase: ReturnType<typeof createClient>, id: string, uid: string) {
    const { data } = await supabase.from('rfq_bids')
      .select('*, profiles(full_name, avatar_url), brands(name, logo_url)')
      .eq('rfq_id', id).order('created_at', { ascending: true })
    const bidList = (data || []) as unknown as DbRfqBid[]
    setBids(bidList)
    const mine = bidList.find(b => b.bidder_id === uid)
    if (mine) setMyBid(mine)
  }

  async function handleAcceptBid(bid: DbRfqBid) {
    if (!rfq || !userId) return
    setUpdating(true)
    const supabase = createClient()
    // Accept this bid
    await supabase.from('rfq_bids').update({ status: 'accepted' }).eq('id', bid.id)
    // Decline all other pending bids on this RFQ
    await supabase.from('rfq_bids').update({ status: 'declined' })
      .eq('rfq_id', rfqId!).neq('id', bid.id).eq('status', 'pending')
    // Close the RFQ
    await supabase.from('rfqs').update({ status: 'closed' }).eq('id', rfqId!)
    // Notify winning bidder
    try {
      await supabase.from('notifications').insert({
        user_id: bid.bidder_id,
        type:    'bid_accepted',
        title:   '🎉 Your bid was accepted!',
        body:    `The buyer accepted your bid on "${rfq.subject}". Contact them through the messaging system to proceed.`,
        rfq_id:  rfqId,
        bid_id:  bid.id,
      })
    } catch { /* non-critical */ }
    // Notify other pending bidders they were declined
    const pendingOthers = bids.filter(b => b.id !== bid.id && b.status === 'pending')
    await Promise.all(pendingOthers.map(async b => {
      try {
        await supabase.from('notifications').insert({
          user_id: b.bidder_id,
          type:    'bid_declined',
          title:   'Bid not selected',
          body:    `The buyer has selected another supplier for "${rfq.subject}".`,
          rfq_id:  rfqId,
          bid_id:  b.id,
        })
      } catch { /* non-critical */ }
    }))
    await loadBids(supabase, rfqId!, userId)
    setRfq(prev => prev ? { ...prev, status: 'closed' } : null)
    setAcceptedBid(bid)
    setUpdating(false)
    onStatusChange?.()
  }

  async function handleDeclineBid(bid: DbRfqBid) {
    if (!rfq || !userId) return
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('rfq_bids').update({ status: 'declined' }).eq('id', bid.id)
    try {
      await supabase.from('notifications').insert({
        user_id: bid.bidder_id,
        type:    'bid_declined',
        title:   'Bid not selected',
        body:    `The buyer has chosen not to proceed with your bid on "${rfq.subject}".`,
        rfq_id:  rfqId,
        bid_id:  bid.id,
      })
    } catch { /* non-critical */ }
    await loadBids(supabase, rfqId!, userId)
    setUpdating(false)
  }

  useEffect(() => {
    if (!rfqId) { setLoading(false); return }
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { goTo('auth'); return }
      setUserId(user.id)

      const { data: rfqData } = await supabase.from('rfqs')
        .select('*, brands(name, slug, logo_url), profiles(full_name, email, avatar_url)')
        .eq('id', rfqId).single()

      const fetchedRfq = rfqData as unknown as DbRfq | null
      if (fetchedRfq) {
        setRfq(fetchedRfq)
        const isSellerUser = userProfile.brandId && fetchedRfq.brand_id && userProfile.brandId === fetchedRfq.brand_id

        if (fetchedRfq.is_public) {
          // Public RFQ: load bids
          await loadBids(supabase, rfqId!, user.id)
        } else {
          // Private RFQ: load thread + auto-mark read
          await loadResponses(supabase, rfqId!)
          if (isSellerUser && fetchedRfq.status === 'pending') {
            await supabase.from('rfqs').update({ status: 'read' }).eq('id', rfqId!)
            setRfq(prev => prev ? { ...prev, status: 'read' } : prev)
            onStatusChange?.()
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [rfqId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [responses])

  // Thread reply (private RFQs only)
  async function sendReply() {
    if (!replyText.trim() || !rfqId || !userId) return
    setSending(true)
    setError('')
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('rfq_responses').insert({
      rfq_id: rfqId, sender_id: userId, message: replyText.trim(),
    })
    if (insertErr) { setError(insertErr.message); setSending(false); return }
    if (isSeller && rfq && (rfq.status === 'pending' || rfq.status === 'read')) {
      await supabase.from('rfqs').update({ status: 'responded' }).eq('id', rfqId)
      setRfq(prev => prev ? { ...prev, status: 'responded' } : prev)
      onStatusChange?.()
    }
    await loadResponses(supabase, rfqId!)
    setReplyText('')
    setSending(false)
  }

  async function closeRfq() {
    if (!rfqId) return
    setClosing(true)
    const supabase = createClient()
    await supabase.from('rfqs').update({ status: 'closed' }).eq('id', rfqId)
    setRfq(prev => prev ? { ...prev, status: 'closed' } : prev)
    onStatusChange?.()
    setClosing(false)
  }

  if (!rfqId) return (
    <div className="container fade-up">
      <BackLink onClick={() => goTo('rfqs')}>Back</BackLink>
      <EmptyState icon="file" title="RFQ not found" sub="No RFQ ID provided." />
    </div>
  )

  if (loading) return (
    <div className="container fade-up" style={{ maxWidth: 720, paddingBottom: 64 }}>
      <SkeletonCard height={200} /><SkeletonCard height={300} />
    </div>
  )

  if (!rfq) return (
    <div className="container fade-up">
      <BackLink onClick={() => goTo(isPublicRfq ? 'rfqs' : 'messages')}>Back</BackLink>
      <EmptyState icon="file" title="RFQ not found" sub="This RFQ may have been deleted or has expired." />
    </div>
  )

  const otherName = isSeller
    ? (rfq.profiles as { full_name?: string; email?: string } | null)?.full_name
      || (rfq.profiles as { full_name?: string; email?: string } | null)?.email
      || 'Buyer'
    : (rfq.brands as { name?: string } | null)?.name || 'Supplier'

  const otherLogoUrl = !isSeller
    ? (rfq.brands as { logo_url?: string | null } | null)?.logo_url || undefined
    : undefined

  const canBid = isPublicRfq && !isOwner && !!userProfile.brandId && !isClosed && !myBid

  return (
    <div className="container fade-up" style={{ maxWidth: 720, paddingBottom: 80 }}>
      <BackLink onClick={() => goTo(isPublicRfq ? 'rfqs' : 'messages')}>
        {isPublicRfq ? 'Back to RFQs' : 'Back to inbox'}
      </BackLink>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-start gap-3 flex-wrap" style={{ marginBottom: 8 }}>
          {!isPublicRfq && <Avatar src={otherLogoUrl} initials={otherName.slice(0, 2).toUpperCase()} size="md" />}
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title" style={{ margin: 0, fontSize: 20, lineHeight: 1.2 }}>{rfq.subject}</h1>
              <StatusPill status={rfq.status} />
              {isPublicRfq && <Badge variant="neutral">Public</Badge>}
            </div>
            <div className="text-muted text-sm flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
              {isPublicRfq
                ? <span>Posted by {(rfq.profiles as { full_name?: string } | null)?.full_name || 'Anonymous'}</span>
                : <span>{isSeller ? 'From' : 'To'} {otherName}</span>
              }
              <span>·</span><span>{fmtDate(rfq.created_at)}</span>
              {expiry && <><span>·</span><span style={{ color: expiry === 'Expired' ? 'var(--danger)' : 'var(--muted)' }}>{expiry}</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Details card ── */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="uppercase-label mb-3">{isPublicRfq ? 'Requirements' : 'Original request'}</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 16px', color: 'var(--ink2)' }}>{rfq.message}</p>

        {/* Meta grid */}
        {[
          rfq.category   && { l: 'Category',  v: rfq.category },
          rfq.location   && { l: 'Location',  v: rfq.location },
          rfq.quantity   && { l: 'Quantity',  v: `${rfq.quantity.toLocaleString()} ${rfq.unit || ''}`.trim() },
          budget         && { l: 'Budget',    v: budget },
          rfq.timeline   && { l: 'Timeline',  v: rfq.timeline },
        ].filter(Boolean).length > 0 && (
          <div style={{ display: 'flex', gap: '12px 28px', flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {[
              rfq.category   && { l: 'Category',  v: rfq.category },
              rfq.location   && { l: 'Location',  v: rfq.location },
              rfq.quantity   && { l: 'Quantity',  v: `${rfq.quantity.toLocaleString()} ${rfq.unit || ''}`.trim() },
              budget         && { l: 'Budget',    v: budget },
              rfq.timeline   && { l: 'Timeline',  v: rfq.timeline },
            ].filter(Boolean).map((item, i) => item && (
              <div key={i}>
                <div className="uppercase-label" style={{ fontSize: 9, marginBottom: 2 }}>{item.l}</div>
                <div className="font-display font-semibold" style={{ fontSize: 14 }}>{item.v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Images */}
        {rfq.images && rfq.images.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="uppercase-label mb-2">Attachments</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {rfq.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════ PUBLIC RFQ: bids section ══════ */}
      {isPublicRfq && (
        <>
          {/* Bids received (shown to RFQ owner) */}
          {isOwner && (
            <div style={{ marginBottom: 16 }}>
              <div className="uppercase-label mb-3">Bids received ({bids.length})</div>
              {bids.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                  No bids yet. Suppliers will respond once they see your RFQ.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bids.map(bid => {
                    const brandName = (bid.brands as { name?: string } | null)?.name || 'Supplier'
                    const brandLogo = (bid.brands as { logo_url?: string | null } | null)?.logo_url || undefined
                    return (
                      <div key={bid.id} className="card" style={{ padding: 16 }}>
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar src={brandLogo} initials={brandName.slice(0, 2).toUpperCase()} size="md" />
                          <div className="flex-1" style={{ minWidth: 0 }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-semibold">{brandName}</span>
                              <BidStatusPill status={bid.status} />
                            </div>
                            <div className="text-xs text-muted">{fmtDate(bid.created_at)}</div>
                          </div>
                          {bid.amount && (
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div className="uppercase-label" style={{ fontSize: 9 }}>Bid price</div>
                              <div className="font-display font-bold" style={{ fontSize: 16 }}>LKR {bid.amount.toLocaleString()}</div>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5, margin: '0 0 8px' }}>{bid.description}</p>
                        {(bid.timeline || bid.notes) && (
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                            {bid.timeline && <span className="text-xs text-muted"><strong>Timeline:</strong> {bid.timeline}</span>}
                            {bid.notes && <span className="text-xs text-muted"><strong>Notes:</strong> {bid.notes}</span>}
                          </div>
                        )}
                        {bid.images && bid.images.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            {bid.images.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
                              </a>
                            ))}
                          </div>
                        )}
                        {isOwner && bid.status === 'pending' && (
                          <div className="flex gap-2 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <Button variant="primary" size="sm" icon="check"
                              disabled={updating}
                              onClick={() => handleAcceptBid(bid)}>
                              Accept bid
                            </Button>
                            <Button variant="secondary" size="sm"
                              disabled={updating}
                              onClick={() => handleDeclineBid(bid)}>
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {acceptedBid && (
                <div className="card" style={{ padding: 16, background: 'var(--success-soft)', borderColor: 'var(--success)', marginTop: 12 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="check" size={14} stroke="var(--success)" />
                    <span className="font-display font-semibold" style={{ color: 'var(--success)' }}>
                      Bid accepted — {(acceptedBid.brands as { name?: string } | null)?.name || 'Supplier'} selected
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 12 }}>
                    To proceed with the order, contact this supplier through the messaging system.
                  </p>
                  <Button variant="primary" size="sm" icon="message"
                    onClick={() => goTo('message-form', {
                      brandId: acceptedBid.brand_id,
                      brandName: (acceptedBid.brands as { name?: string } | null)?.name,
                    })}>
                    Message {(acceptedBid.brands as { name?: string } | null)?.name || 'supplier'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Already bid (seller) */}
          {myBid && !isOwner && (
            <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--success-soft)', borderColor: 'var(--success)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="check" size={14} stroke="var(--success)" />
                <span className="font-display font-semibold" style={{ color: 'var(--success)' }}>Bid submitted</span>
                <BidStatusPill status={myBid.status} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0 }}>{myBid.description.slice(0, 100)}{myBid.description.length > 100 ? '…' : ''}</p>
              {myBid.amount && <div className="font-mono font-bold mt-1" style={{ fontSize: 14 }}>LKR {myBid.amount.toLocaleString()}</div>}
            </div>
          )}

          {/* Bid form (eligible sellers) */}
          {canBid && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              {!showBidForm ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display font-semibold mb-1">Interested in this RFQ?</div>
                    <div className="text-sm text-muted">Submit a detailed bid — the buyer will be notified.</div>
                  </div>
                  <Button variant="primary" icon="file" onClick={() => setShowBidForm(true)}>Submit bid</Button>
                </div>
              ) : (
                bidSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Icon name="check" size={32} stroke="var(--success)" />
                    <div className="font-display font-semibold mt-2" style={{ color: 'var(--success)' }}>Bid submitted!</div>
                    <div className="text-sm text-muted mt-1">The buyer will review your bid shortly.</div>
                  </div>
                ) : (
                  <BidForm
                    rfqId={rfqId!}
                    userId={userId!}
                    brandId={userProfile.brandId!}
                    onSubmitted={async () => {
                      setBidSubmitted(true)
                      setShowBidForm(false)
                      // Reload bids if owner is viewing
                      if (isOwner) {
                        const supabase = createClient()
                        await loadBids(supabase, rfqId!, userId!)
                      }
                    }}
                  />
                )
              )}
            </div>
          )}

          {/* No brand CTA */}
          {isPublicRfq && !isOwner && !userProfile.brandId && (
            <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
              <div className="font-display font-semibold mb-1">Want to bid on this RFQ?</div>
              <div className="text-sm text-muted mb-3">You need a brand profile to submit bids.</div>
              <Button variant="primary" size="sm" onClick={() => { window.location.href = '/onboarding/brand' }}>
                Create brand profile
              </Button>
            </div>
          )}
        </>
      )}

      {/* ══════ PRIVATE RFQ: thread section ══════ */}
      {!isPublicRfq && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="uppercase-label mb-3">
              Thread {responses.length > 0 ? `(${responses.length} ${responses.length === 1 ? 'reply' : 'replies'})` : ''}
            </div>
            {responses.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                {isSeller ? 'No replies yet. Respond below.' : 'Waiting for the supplier to respond.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {responses.map(resp => {
                  const isMe = resp.sender_id === userId
                  const senderName = (resp.profiles as { full_name?: string } | null)?.full_name || 'Unknown'
                  const senderAvatar = (resp.profiles as { avatar_url?: string | null } | null)?.avatar_url || undefined
                  return (
                    <div key={resp.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <Avatar src={senderAvatar} initials={senderName.slice(0, 2).toUpperCase()} size="sm" />
                        <div style={{
                          maxWidth: '72%', background: isMe ? 'var(--primary)' : 'var(--bg-alt)',
                          color: isMe ? 'white' : 'var(--ink)',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '12px 16px', fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word',
                        }}>
                          {resp.message}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, padding: '0 40px' }}>
                        {senderName} · {fmtDate(resp.created_at)}
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>
            )}
          </div>

          {!isClosed && (
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <textarea className="field" placeholder="Type your reply…" value={replyText}
                onChange={e => setReplyText(e.target.value)} rows={3}
                style={{ marginBottom: 10, resize: 'vertical' }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }} />
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</div>}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">⌘↵ to send</span>
                <Button variant="primary" icon="message" disabled={sending || !replyText.trim()} onClick={sendReply}>
                  {sending ? 'Sending…' : 'Send reply'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Close RFQ */}
      {!isClosed && (isOwner || isSeller) && (
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <button onClick={closeRfq} disabled={closing}
            style={{ color: 'var(--muted)', fontSize: 13, background: 'none', border: 'none', cursor: closing ? 'not-allowed' : 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
            {closing ? 'Closing…' : 'Close this RFQ'}
          </button>
        </div>
      )}
      {isClosed && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>
          This RFQ is closed.
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MessagesScreen
   ───────────────────────────────────────────────────────────── */

export function MessagesScreen({
  goTo,
  userProfile,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  userProfile: UserProfile
}) {
  const [rfqs,    setRfqs]    = useState<DbRfq[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const isSeller = !!(userProfile.brandId)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      if (isSeller) {
        const { data } = await supabase.from('rfqs')
          .select('*, profiles(full_name, email, avatar_url)')
          .eq('brand_id', userProfile.brandId!).eq('is_public', false)
          .order('created_at', { ascending: false })
        setRfqs((data || []) as unknown as DbRfq[])
      } else {
        const { data } = await supabase.from('rfqs')
          .select('*, brands(name, slug, logo_url)')
          .eq('buyer_id', user.id).eq('is_public', false)
          .order('created_at', { ascending: false })
        setRfqs((data || []) as unknown as DbRfq[])
      }
      setLoading(false)
    }
    load()
  }, [isSeller, userProfile.brandId])

  const filtered = rfqs.filter(r => {
    const q = search.toLowerCase()
    if (!q) return true
    const name = isSeller
      ? ((r.profiles as { full_name?: string } | null)?.full_name || '')
      : ((r.brands as { name?: string } | null)?.name || '')
    return name.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q)
  })

  const unreadCount = rfqs.filter(r => r.status === 'pending' && isSeller).length

  return (
    <div className="container fade-up">
      <PageHeader eyebrow="Inbox" title="Messages"
        sub={loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread · ${rfqs.length} total` : `${rfqs.length} conversations`}
      />
      <div className="mb-6">
        <input className="field field-search" placeholder="Search by name or subject…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 64 }}>
        {loading ? [1, 2, 3].map(i => <SkeletonCard key={i} height={80} />)
          : filtered.length === 0 ? (
            rfqs.length === 0
              ? <EmptyState icon="message" title="No messages yet"
                  sub={isSeller ? 'When buyers send you direct RFQs they will appear here.' : 'Send a private RFQ to a supplier to start a conversation.'} />
              : <EmptyState icon="message" title="No results" sub="Try a different search term." />
          ) : filtered.map(r => (
            <LiveRfqCard key={r.id} rfq={r} isSeller={isSeller}
              onClick={() => goTo('rfq-detail', { rfqId: r.id })} />
          ))
        }
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MessageFormScreen
   ───────────────────────────────────────────────────────────── */

export function MessageFormScreen({
  goTo,
  business,
  brandId: propBrandId,
  brandName: propBrandName,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  business: Business | null
  brandId?: string
  brandName?: string
}) {
  const resolvedBrandId   = business?.id   || propBrandId
  const resolvedBrandName = business?.name || propBrandName || 'Supplier'

  const [subject,    setSubject]    = useState('')
  const [message,    setMessage]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolvedBrandId) { setError('No supplier selected.'); return }
    if (!subject.trim())  { setError('Subject is required.'); return }
    if (!message.trim())  { setError('Message is required.'); return }
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { goTo('auth'); return }

    const { error: insertErr } = await supabase.from('rfqs').insert({
      buyer_id:  user.id,
      brand_id:  resolvedBrandId,
      is_public: false,
      subject:   subject.trim(),
      message:   message.trim(),
      status:    'pending',
      images:    [],
    })
    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }
    goTo('success', { successContext: 'message' })
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 680, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('messages')}>Back to inbox</BackLink>
      <PageHeader eyebrow="Send message" title={`Message ${resolvedBrandName}`} />
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 28 }}>
          {(business || resolvedBrandName) && (
            <div className="flex items-center gap-3 mb-6" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <Avatar src={business?.logoUrl} initials={resolvedBrandName.slice(0, 2).toUpperCase()} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">{resolvedBrandName}</span>
                  {business?.verified && <VerifiedMark size={13} />}
                </div>
                {business && <div className="text-xs text-muted">{business.category} · {business.location}</div>}
              </div>
            </div>
          )}
          <Field label="Subject" placeholder="Inquiry about your products"
            value={subject} onChange={e => setSubject(e.target.value)} required />
          <TextArea label="Message" placeholder="What would you like to know or discuss?"
            value={message} onChange={e => setMessage(e.target.value)} rows={6} required />
          {error && (
            <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => goTo('messages')}>Cancel</Button>
            <Button variant="primary" type="submit" block icon="message" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SuccessScreen
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   NotificationsScreen
   ───────────────────────────────────────────────────────────── */

export function NotificationsScreen({
  goTo,
  onRead,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  onRead?: () => void
}) {
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications((data || []) as DbNotification[])
      // Mark all as read
      await supabase.from('notifications').update({ read: true })
        .eq('user_id', user.id).eq('read', false)
      onRead?.()
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function notifIcon(type: string) {
    if (type === 'bid_accepted') return 'check'
    if (type === 'bid_declined') return 'close'
    return 'bell'
  }
  function notifColor(type: string) {
    if (type === 'bid_accepted') return 'var(--success)'
    if (type === 'bid_declined') return 'var(--danger, #dc2626)'
    return 'var(--primary)'
  }
  function notifBg(type: string) {
    if (type === 'bid_accepted') return 'var(--success-soft)'
    if (type === 'bid_declined') return 'rgba(220,38,38,0.07)'
    return 'var(--primary-soft)'
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 640, paddingBottom: 80 }}>
      <PageHeader eyebrow="Activity" title="Notifications" />
      {loading ? (
        [1,2,3].map(i => <SkeletonCard key={i} height={80} />)
      ) : notifications.length === 0 ? (
        <EmptyState icon="bell" title="No notifications yet"
          sub="You'll be notified here when someone bids on your RFQ or your bid status changes." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map(n => (
            <button
              key={n.id}
              className="card card-hover"
              onClick={() => n.rfq_id && goTo('rfq-detail', { rfqId: n.rfq_id })}
              style={{ width: '100%', textAlign: 'left', padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', opacity: n.read ? 0.75 : 1 }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                background: notifBg(n.type), display: 'grid', placeItems: 'center',
              }}>
                <Icon name={notifIcon(n.type)} size={16} stroke={notifColor(n.type)} />
              </div>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display font-semibold" style={{ fontSize: 14 }}>{n.title}</span>
                  <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{fmtDate(n.created_at)}</span>
                </div>
                {n.body && <p className="text-sm text-muted" style={{ margin: '2px 0 0', lineHeight: 1.4 }}>{n.body}</p>}
                {!n.read && (
                  <span style={{ display: 'inline-block', marginTop: 4, width: 7, height: 7, borderRadius: 999, background: 'var(--primary)' }} />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SuccessScreen({ goTo, context }: { goTo: (s: Screen, opts?: NavOpts) => void; context?: 'rfq' | 'message' | null }) {
  const isRfq = context === 'rfq'
  const subtitle = isRfq
    ? 'Your RFQ has been submitted. Suppliers will review it and respond with bids.'
    : context === 'message'
      ? 'Your message has been sent. The supplier will respond shortly.'
      : 'Your request has been submitted successfully.'

  return (
    <div className="container fade-up" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center', maxWidth: 540 }}>
      <div style={{ width: 88, height: 88, borderRadius: 999, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={32} stroke="white" strokeWidth={2.5} />
        </div>
      </div>
      <h1 className="page-title mb-3">You&apos;re all set</h1>
      <p className="text-muted text-base mb-6">{subtitle}</p>
      <div className="flex gap-3 justify-center">
        {isRfq
          ? <Button variant="secondary" onClick={() => goTo('rfqs')}>View RFQ board</Button>
          : <Button variant="secondary" onClick={() => goTo('messages')}>Go to inbox</Button>
        }
        <Button variant="primary" iconRight="arrow-right" onClick={() => goTo('home')}>Back to home</Button>
      </div>
    </div>
  )
}
