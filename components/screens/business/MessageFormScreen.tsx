'use client'

import React, { useState } from 'react'
import { Button, Avatar, Field, TextArea, PageHeader, BackLink, VerifiedMark } from '@/components/ui'
import { type Business, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'

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
