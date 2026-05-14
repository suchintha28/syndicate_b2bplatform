'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Chip, Field, TextArea, PageHeader, BackLink, Tabs, EmptyState, SkeletonCard, VerifiedMark } from '@/components/ui'
import { RFQCard } from '@/components/cards'
import { BROWSE_RFQS, type Business, type Screen, type NavOpts, type UserProfile } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbRfq, DbRfqResponse } from '@/types/database'

/* ── Local helpers (mirrored from account.tsx) ─── */
const RFQ_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'var(--warning)',  bg: 'var(--warning-soft, #fef9c3)' },
  read:      { label: 'Viewed',    color: 'var(--muted)',    bg: 'var(--bg-alt)' },
  responded: { label: 'Responded', color: 'var(--success)',  bg: 'var(--success-soft)' },
  closed:    { label: 'Closed',    color: 'var(--ink)',      bg: 'var(--bg-alt)' },
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

/* ── RFQsScreen ─────────────────────────────── */
export function RFQsScreen({
  goTo,
  isSignedIn = false,
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isSignedIn?: boolean
}) {
  const [tab, setTab] = useState('browse')
  const [myRfqs, setMyRfqs]     = useState<DbRfq[]>([])
  const [loadingMy, setLoadingMy] = useState(false)

  // Load buyer's RFQs when "My RFQs" tab is active
  useEffect(() => {
    if (tab !== 'my' || !isSignedIn) return
    setLoadingMy(true)
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingMy(false); return }
      const { data } = await supabase
        .from('rfqs')
        .select('*, brands(name, slug, logo_url)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
      setMyRfqs((data || []) as unknown as DbRfq[])
      setLoadingMy(false)
    }
    load()
  }, [tab, isSignedIn])

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Request for quote"
        title="RFQ marketplace"
        sub="Browse open buyer requests or post your own."
        action={isSignedIn
          ? <Button variant="primary" icon="plus" onClick={() => goTo('rfq-create')}>New RFQ</Button>
          : undefined}
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'browse', label: 'Open requests', count: BROWSE_RFQS.length },
          ...(isSignedIn ? [{ value: 'my', label: 'My RFQs', count: myRfqs.length }] : []),
        ]} />
        {tab === 'browse' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Chip active icon="filter">All categories</Chip>
            <Chip>Budget: any</Chip>
            <Chip>Posted: anytime</Chip>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, paddingBottom: 64 }}>
        {tab === 'browse'
          ? BROWSE_RFQS.map(r => (
              <RFQCard key={r.id} rfq={r} type="browse"
                onAction={() => isSignedIn ? goTo('success', { successContext: 'rfq' }) : goTo('auth')} />
            ))
          : loadingMy
            ? [1, 2, 3].map(i => <SkeletonCard key={i} height={120} />)
            : myRfqs.length === 0
              ? <EmptyState icon="file" title="No RFQs yet" sub="You haven't sent any RFQs yet. Post one to start receiving bids from suppliers." />
              : myRfqs.map(r => (
                  <LiveRfqCard key={r.id} rfq={r} isSeller={false}
                    onClick={() => goTo('rfq-detail', { rfqId: r.id })} />
                ))
        }
      </div>
    </div>
  )
}

/* ── LiveRfqCard — used in RFQsScreen and MessagesScreen ── */
function LiveRfqCard({
  rfq,
  isSeller,
  onClick,
}: {
  rfq: DbRfq
  isSeller: boolean
  onClick?: () => void
}) {
  const otherName = isSeller
    ? (rfq.profiles as { full_name?: string; email?: string } | null)?.full_name
      || (rfq.profiles as { full_name?: string; email?: string } | null)?.email
      || 'Buyer'
    : (rfq.brands as { name?: string } | null)?.name || 'Supplier'

  const otherInitials = otherName.slice(0, 2).toUpperCase()
  const otherLogoUrl  = !isSeller
    ? (rfq.brands as { logo_url?: string | null } | null)?.logo_url || undefined
    : undefined

  const isUnread = rfq.status === 'pending' && isSeller

  return (
    <button
      className="card card-hover"
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', padding: 'var(--card-pad)', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', position: 'relative' }}>
      {isUnread && (
        <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 999, background: 'var(--primary)' }} />
      )}
      <Avatar src={otherLogoUrl} initials={otherInitials} size="md" />
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="font-display font-semibold truncate">{rfq.subject}</span>
          <span className="font-mono text-xs text-muted" style={{ flexShrink: 0 }}>{fmtDate(rfq.created_at)}</span>
        </div>
        <div className="text-xs text-muted mb-2">
          {isSeller ? 'From' : 'To'} {otherName}
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-muted line-clamp-1" style={{ margin: 0, flex: 1 }}>
            {rfq.message.slice(0, 80)}{rfq.message.length > 80 ? '…' : ''}
          </p>
          <StatusPill status={rfq.status} />
        </div>
      </div>
    </button>
  )
}

/* ── RFQCreateScreen ────────────────────────── */
export function RFQCreateScreen({
  goTo,
  opts = {},
}: {
  goTo: (s: Screen, opts?: NavOpts) => void
  opts?: { brandId?: string; brandName?: string; productId?: string }
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Form state — maps to DB columns
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit,     setUnit]     = useState('')

  // Brand selector state
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(
    opts.brandId ? { id: opts.brandId, name: opts.brandName || '' } : null
  )
  const [brandSearch,   setBrandSearch]   = useState('')
  const [brandResults,  setBrandResults]  = useState<{ id: string; name: string; logo_url: string | null }[]>([])
  const [searching,     setSearching]     = useState(false)
  const [showDropdown,  setShowDropdown]  = useState(false)
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
    if (!brandSearch.trim() || selectedBrand) return
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .ilike('name', `%${brandSearch.trim()}%`)
        .eq('is_active', true)
        .limit(8)
      setBrandResults(data || [])
      setShowDropdown(true)
      setSearching(false)
    }, 320)
  }, [brandSearch, selectedBrand])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!subject.trim())    { setError('Subject is required.'); return }
    if (!message.trim())    { setError('Message is required.'); return }
    if (!selectedBrand?.id) { setError('Please select a supplier.'); return }
    if (!userId)            { goTo('auth'); return }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('rfqs').insert({
        buyer_id:   userId,
        brand_id:   selectedBrand.id,
        product_id: opts.productId || null,
        subject:    subject.trim(),
        message:    message.trim(),
        quantity:   quantity ? parseInt(quantity) || null : null,
        unit:       unit.trim() || null,
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

  if (authLoading) {
    return (
      <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
        <SkeletonCard height={400} />
      </div>
    )
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('rfqs')}>Back to RFQs</BackLink>
      <PageHeader eyebrow="New request" title="Create RFQ" sub="Describe what you need. Verified suppliers will respond within 48 hours." />

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 28 }}>

          {/* Supplier selector */}
          <div className="mb-4">
            <label className="field-label">Supplier <span style={{ color: 'var(--danger)' }}>*</span></label>
            {selectedBrand ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)' }}>
                <span className="font-semibold" style={{ flex: 1 }}>{selectedBrand.name}</span>
                {!opts.brandId && (
                  <button type="button" onClick={() => { setSelectedBrand(null); setBrandSearch(''); setBrandResults([]) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  className="field"
                  placeholder="Search for a supplier…"
                  value={brandSearch}
                  onChange={e => { setBrandSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => brandSearch && setShowDropdown(true)}
                  autoComplete="off"
                />
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
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 4, padding: '12px 14px', color: 'var(--muted)', fontSize: 14 }}>
                    No suppliers found for &ldquo;{brandSearch}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          <Field
            label="Subject"
            placeholder="e.g. Custom IoT sensors — 500 units"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />

          <TextArea
            label="Requirements"
            placeholder="Describe what you need — specs, quantities, certifications, delivery location, timeline…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Quantity (optional)</label>
              <input
                className="field"
                type="number"
                min="1"
                placeholder="500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <Field
              label="Unit (optional)"
              placeholder="units, kg, metres…"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => goTo('rfqs')}>Cancel</Button>
            <Button variant="primary" type="submit" block iconRight="arrow-right" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit RFQ'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ── RFQDetailScreen ────────────────────────── */
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
  const [rfq,       setRfq]       = useState<DbRfq | null>(null)
  const [responses, setResponses] = useState<DbRfqResponse[]>([])
  const [loading,   setLoading]   = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending,   setSending]   = useState(false)
  const [closing,   setClosing]   = useState(false)
  const [error,     setError]     = useState('')
  const [userId,    setUserId]    = useState<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const isSeller = !!(rfq && userProfile.brandId && userProfile.brandId === rfq.brand_id)
  const isClosed = rfq?.status === 'closed'

  async function loadResponses(supabase: ReturnType<typeof createClient>, id: string) {
    const { data } = await supabase
      .from('rfq_responses')
      .select('*, profiles(full_name, avatar_url)')
      .eq('rfq_id', id)
      .order('created_at', { ascending: true })
    setResponses((data || []) as unknown as DbRfqResponse[])
  }

  useEffect(() => {
    if (!rfqId) { setLoading(false); return }
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { goTo('auth'); return }
      setUserId(user.id)

      const [rfqRes] = await Promise.all([
        supabase
          .from('rfqs')
          .select('*, brands(name, slug, logo_url), profiles(full_name, email, avatar_url)')
          .eq('id', rfqId)
          .single(),
      ])

      const fetchedRfq = rfqRes.data as unknown as DbRfq | null

      if (fetchedRfq) {
        setRfq(fetchedRfq)
        // Auto-mark as read if this user is the brand owner and RFQ is still pending
        const isOwner = userProfile.brandId && userProfile.brandId === fetchedRfq.brand_id
        if (isOwner && fetchedRfq.status === 'pending') {
          await supabase.from('rfqs').update({ status: 'read' }).eq('id', rfqId)
          setRfq(prev => prev ? { ...prev, status: 'read' } : prev)
          onStatusChange?.()
        }
        await loadResponses(supabase, rfqId!)
      }
      setLoading(false)
    }
    load()
  }, [rfqId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom of thread when responses load
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [responses])

  async function sendReply() {
    if (!replyText.trim() || !rfqId || !userId) return
    setSending(true)
    setError('')
    const supabase = createClient()

    const { error: insertErr } = await supabase.from('rfq_responses').insert({
      rfq_id:    rfqId,
      sender_id: userId,
      message:   replyText.trim(),
    })

    if (insertErr) { setError(insertErr.message); setSending(false); return }

    // Seller responding: update RFQ status to 'responded'
    if (isSeller && rfq && (rfq.status === 'pending' || rfq.status === 'read')) {
      await supabase.from('rfqs').update({ status: 'responded' }).eq('id', rfqId)
      setRfq(prev => prev ? { ...prev, status: 'responded' } : prev)
      onStatusChange?.()
    }

    await loadResponses(supabase, rfqId)
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

  if (!rfqId) {
    return (
      <div className="container fade-up">
        <BackLink onClick={() => goTo('messages')}>Back to inbox</BackLink>
        <EmptyState icon="file" title="RFQ not found" sub="No RFQ ID was provided." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container fade-up" style={{ maxWidth: 720, paddingBottom: 64 }}>
        <SkeletonCard height={180} />
        <SkeletonCard height={280} />
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="container fade-up">
        <BackLink onClick={() => goTo('messages')}>Back to inbox</BackLink>
        <EmptyState icon="file" title="RFQ not found" sub="This RFQ may have been deleted or you don't have access." />
      </div>
    )
  }

  const otherName = isSeller
    ? (rfq.profiles as { full_name?: string; email?: string } | null)?.full_name
      || (rfq.profiles as { full_name?: string; email?: string } | null)?.email
      || 'Buyer'
    : (rfq.brands as { name?: string } | null)?.name || 'Supplier'

  const otherLogoUrl = !isSeller
    ? (rfq.brands as { logo_url?: string | null } | null)?.logo_url || undefined
    : undefined

  return (
    <div className="container fade-up" style={{ maxWidth: 720, paddingBottom: 80 }}>
      <BackLink onClick={() => goTo('messages')}>Back to inbox</BackLink>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 8 }}>
          <Avatar src={otherLogoUrl} initials={otherName.slice(0, 2).toUpperCase()} size="md" />
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title" style={{ margin: 0, fontSize: 20 }}>{rfq.subject}</h1>
              <StatusPill status={rfq.status} />
            </div>
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>
              {isSeller ? 'From' : 'To'} {otherName} · {fmtDate(rfq.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Original request */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="uppercase-label mb-2">Original request</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 12px', color: 'var(--ink2)' }}>{rfq.message}</p>
        {(rfq.quantity || rfq.unit) && (
          <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {rfq.quantity && (
              <div>
                <div className="uppercase-label" style={{ marginBottom: 2 }}>Quantity</div>
                <div className="font-display font-semibold">{rfq.quantity.toLocaleString()} {rfq.unit || ''}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thread */}
      <div style={{ marginBottom: 16 }}>
        <div className="uppercase-label mb-3">
          Thread {responses.length > 0 ? `(${responses.length} ${responses.length === 1 ? 'reply' : 'replies'})` : ''}
        </div>

        {responses.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            {isSeller ? 'No replies yet. Respond below to get started.' : 'Waiting for the supplier to respond.'}
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
                      maxWidth: '72%',
                      background: isMe ? 'var(--primary)' : 'var(--bg-alt)',
                      color: isMe ? 'white' : 'var(--ink)',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 16px',
                      fontSize: 14,
                      lineHeight: 1.55,
                      wordBreak: 'break-word',
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

      {/* Reply form */}
      {!isClosed && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <textarea
            className="field"
            placeholder="Type your reply…"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
            style={{ marginBottom: 10, resize: 'vertical' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
          />
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">⌘↵ to send</span>
            <Button variant="primary" icon="message" disabled={sending || !replyText.trim()} onClick={sendReply}>
              {sending ? 'Sending…' : 'Send reply'}
            </Button>
          </div>
        </div>
      )}

      {/* Close / closed indicator */}
      {!isClosed ? (
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <button
            onClick={closeRfq}
            disabled={closing}
            style={{ color: 'var(--muted)', fontSize: 13, background: 'none', border: 'none', cursor: closing ? 'not-allowed' : 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
            {closing ? 'Closing…' : 'Close this RFQ'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>
          <Icon name="check" size={14} stroke="var(--muted)" /> This RFQ is closed.
        </div>
      )}
    </div>
  )
}

/* ── MessagesScreen ─────────────────────────── */
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
        const { data } = await supabase
          .from('rfqs')
          .select('*, profiles(full_name, email, avatar_url)')
          .eq('brand_id', userProfile.brandId!)
          .order('created_at', { ascending: false })
        setRfqs((data || []) as unknown as DbRfq[])
      } else {
        const { data } = await supabase
          .from('rfqs')
          .select('*, brands(name, slug, logo_url)')
          .eq('buyer_id', user.id)
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
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        sub={loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread · ${rfqs.length} total` : `${rfqs.length} conversations`}
      />

      <div className="mb-6">
        <input
          className="field field-search"
          placeholder="Search by name or subject…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 64 }}>
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} height={80} />)
        ) : filtered.length === 0 ? (
          rfqs.length === 0
            ? <EmptyState icon="message" title="No messages yet"
                sub={isSeller ? 'When buyers send you RFQs they will appear here.' : 'Send an RFQ to a supplier to start a conversation.'} />
            : <EmptyState icon="message" title="No results" sub="Try a different search term." />
        ) : (
          filtered.map(r => (
            <LiveRfqCard
              key={r.id}
              rfq={r}
              isSeller={isSeller}
              onClick={() => goTo('rfq-detail', { rfqId: r.id })}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ── MessageFormScreen ──────────────────────── */
export function MessageFormScreen({ goTo, business }: { goTo: (s: Screen, opts?: NavOpts) => void; business: Business | null }) {
  const [form, setForm] = useState({ subject: '', name: '', email: '', message: '' })
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="container fade-up" style={{ maxWidth: 680, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('detail')}>Back</BackLink>
      <PageHeader eyebrow="Send message" title={business ? `Message ${business.name}` : 'New message'} />

      <form onSubmit={(e) => { e.preventDefault(); goTo('success', { successContext: 'message' }) }}>
        <div className="card" style={{ padding: 28 }}>
          {business && (
            <div className="flex items-center gap-3 mb-6" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <Avatar src={business.logoUrl} initials={business.logo} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">{business.name}</span>
                  {business.verified && <VerifiedMark size={13} />}
                </div>
                <div className="text-xs text-muted">{business.category} · {business.location}</div>
              </div>
            </div>
          )}

          <Field label="Subject" placeholder="Inquiry about your products" value={form.subject} onChange={upd('subject')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Your name" placeholder="Jane Doe" value={form.name} onChange={upd('name')} required />
            <Field label="Email" type="email" placeholder="jane@acme.com" value={form.email} onChange={upd('email')} required />
          </div>
          <TextArea label="Message" placeholder="What would you like to know?" value={form.message} onChange={upd('message')} rows={6} required />

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => goTo('detail')}>Cancel</Button>
            <Button variant="primary" type="submit" block icon="message">Send message</Button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ── SuccessScreen ──────────────────────────── */
export function SuccessScreen({ goTo, context }: { goTo: (s: Screen, opts?: NavOpts) => void; context?: 'rfq' | 'message' | null }) {
  const isRfq = context === 'rfq'

  const subtitle = isRfq
    ? 'Your RFQ has been submitted. The supplier will review it and respond shortly.'
    : context === 'message'
      ? 'Your message has been sent.'
      : 'Your request has been submitted. You\'ll get a response within 48 hours.'

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
          ? <Button variant="secondary" onClick={() => goTo('rfqs')}>View my RFQs</Button>
          : <Button variant="secondary" onClick={() => goTo('messages')}>Go to inbox</Button>
        }
        <Button variant="primary" iconRight="arrow-right" onClick={() => goTo('home')}>Back to home</Button>
      </div>
    </div>
  )
}
