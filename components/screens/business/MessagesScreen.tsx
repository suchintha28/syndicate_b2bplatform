'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Avatar, PageHeader, EmptyState, SkeletonCard } from '@/components/ui'
import { type UserProfile, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbRfq } from '@/types/database'
import { StatusPill, fmtDate, fmtBudget } from './_shared'

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
