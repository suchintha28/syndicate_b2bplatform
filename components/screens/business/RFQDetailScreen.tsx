'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Badge, Field, TextArea, BackLink, EmptyState, SkeletonCard } from '@/components/ui'
import { type UserProfile, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbRfq, DbRfqResponse, DbRfqBid } from '@/types/database'
import { StatusPill, BidStatusPill, fmtDate, fmtBudget, fmtExpiry } from './_shared'

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
