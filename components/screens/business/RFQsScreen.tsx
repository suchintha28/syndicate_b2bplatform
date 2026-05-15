'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Badge, Chip, PageHeader, EmptyState, SkeletonCard, Tabs } from '@/components/ui'
import { INDUSTRIES, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbRfq, DbRfqBid } from '@/types/database'
import {
  BUDGET_FILTERS, TIME_FILTERS, StatusPill, BidStatusPill,
  fmtDate, fmtBudget, fmtExpiry,
} from './_shared'

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
