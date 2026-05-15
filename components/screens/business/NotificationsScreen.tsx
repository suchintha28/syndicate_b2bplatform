'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { PageHeader, EmptyState, SkeletonCard } from '@/components/ui'
import { type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbNotification } from '@/types/database'
import { fmtDate } from './_shared'

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
