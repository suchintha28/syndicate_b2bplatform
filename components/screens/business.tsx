'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar, Chip, Field, TextArea, PageHeader, BackLink, Tabs, EmptyState, VerifiedMark } from '@/components/ui'
import { RFQCard, MessageCard } from '@/components/cards'
import { BROWSE_RFQS, MY_RFQS, MESSAGES, CATEGORIES, type Business, type Screen } from '@/lib/data'

/* ── RFQsScreen ─────────────────────────────── */
export function RFQsScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const [tab, setTab] = useState('browse')

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Request for quote"
        title="RFQ marketplace"
        sub="Browse open buyer requests or post your own."
        action={<Button variant="primary" icon="plus" onClick={() => goTo('rfq-create')}>New RFQ</Button>}
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'browse', label: 'Open requests', count: BROWSE_RFQS.length },
          { value: 'my',     label: 'My RFQs',       count: MY_RFQS.length },
        ]} />
        {tab === 'browse' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Chip active icon="filter">All categories</Chip>
            <Chip>Budget: any</Chip>
            <Chip>Posted: anytime</Chip>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, paddingBottom: 64 }} className="rfq-grid">
        {tab === 'browse'
          ? BROWSE_RFQS.map(r => <RFQCard key={r.id} rfq={r} type="browse" onAction={() => goTo('success')} />)
          : MY_RFQS.map(r => <RFQCard key={r.id} rfq={r} type="my" />)
        }
      </div>
    </div>
  )
}

/* ── RFQCreateScreen ────────────────────────── */
export function RFQCreateScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const [form, setForm] = useState({ title: '', name: '', company: '', email: '', category: 'Technology', budget: '', timeline: '', requirements: '' })
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('rfqs')}>Back to RFQs</BackLink>
      <PageHeader eyebrow="New request" title="Create RFQ" sub="Describe what you need. Verified suppliers will respond within 48 hours." />

      <form onSubmit={(e) => { e.preventDefault(); goTo('success') }}>
        <div className="card" style={{ padding: 28 }}>
          <Field label="Project title" placeholder="e.g. Custom IoT sensors — 500 units" value={form.title} onChange={upd('title')} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Your name" placeholder="Jane Doe" value={form.name} onChange={upd('name')} required />
            <Field label="Company" placeholder="Acme Inc." value={form.company} onChange={upd('company')} required />
          </div>

          <Field label="Email" type="email" placeholder="jane@acme.com" value={form.email} onChange={upd('email')} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Category</label>
              <select className="field" value={form.category} onChange={upd('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Budget range" placeholder="LKR 10M–25M" value={form.budget} onChange={upd('budget')} />
          </div>

          <Field label="Target timeline" placeholder="Delivery by Q4 2026" value={form.timeline} onChange={upd('timeline')} />

          <TextArea label="Requirements" placeholder="Specs, quantities, certifications, delivery location…" value={form.requirements} onChange={upd('requirements')} required />

          <div className="mb-4">
            <label className="field-label">Attachments (optional)</label>
            <div style={{ border: '2px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', padding: 28, textAlign: 'center', background: 'var(--bg-alt)' }}>
              <Icon name="paperclip" size={24} stroke="var(--muted)" />
              <div className="text-sm text-muted mt-2">Click to upload, or drag and drop</div>
              <div className="text-xs text-muted mt-1 font-mono">PDF, PNG, DWG up to 25MB each</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => goTo('rfqs')}>Cancel</Button>
            <Button variant="primary" type="submit" block iconRight="arrow-right">Submit RFQ</Button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ── MessagesScreen ─────────────────────────── */
export function MessagesScreen({ goTo: _goTo }: { goTo: (s: Screen) => void }) {
  const [search, setSearch] = useState('')
  const filtered = MESSAGES.filter(m =>
    m.business.toLowerCase().includes(search.toLowerCase()) || m.msg.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container fade-up">
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        sub={`${MESSAGES.filter(m => m.unread).length} unread of ${MESSAGES.length} conversations`}
      />

      <div className="mb-6">
        <input className="field field-search" placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 64 }}>
        {filtered.length === 0
          ? <EmptyState icon="message" title="No messages match" sub="Try a different search." />
          : filtered.map(m => <MessageCard key={m.id} msg={m} />)
        }
      </div>
    </div>
  )
}

/* ── MessageFormScreen ──────────────────────── */
export function MessageFormScreen({ goTo, business }: { goTo: (s: Screen) => void; business: Business | null }) {
  const [form, setForm] = useState({ subject: '', name: '', email: '', message: '' })
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="container fade-up" style={{ maxWidth: 680, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('detail')}>Back</BackLink>
      <PageHeader eyebrow="Send message" title={business ? `Message ${business.name}` : 'New message'} />

      <form onSubmit={(e) => { e.preventDefault(); goTo('success') }}>
        <div className="card" style={{ padding: 28 }}>
          {business && (
            <div className="flex items-center gap-3 mb-6" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <Avatar initials={business.logo} size="md" />
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
export function SuccessScreen({ goTo }: { goTo: (s: Screen) => void }) {
  return (
    <div className="container fade-up" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center', maxWidth: 540 }}>
      <div style={{ width: 88, height: 88, borderRadius: 999, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={32} stroke="white" strokeWidth={2.5} />
        </div>
      </div>
      <h1 className="page-title mb-3">You&apos;re all set</h1>
      <p className="text-muted text-base mb-6">Your request has been submitted. We&apos;ll route it to the right team and you&apos;ll get a response within 48 hours.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => goTo('rfqs')}>View RFQs</Button>
        <Button variant="primary" iconRight="arrow-right" onClick={() => goTo('home')}>Back to home</Button>
      </div>
    </div>
  )
}
