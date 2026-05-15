'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, PageHeader, Field, TextArea, Select } from '@/components/ui'
import type { Screen } from '@/lib/data'

export function ContactScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', topic: 'General inquiry', message: '' })
  const [sent, setSent] = useState(false)
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <PageHeader
        eyebrow="Contact us"
        title="Talk to a human."
        sub="Sales, partnerships, press, or a stuck order — pick the right channel below or send us a note."
      />

      <div className="contact-grid">
        <div>
          {[
            { icon: 'mail',    label: 'Email',                value: 'hello@syndicate.example',    sub: 'General questions — we reply within one business day.' },
            { icon: 'phone',   label: 'Phone',                value: '+94 11 555 0188',             sub: 'Mon–Fri, 09:00–18:00 Asia/Colombo.' },
            { icon: 'message', label: 'Sales & partnerships', value: 'sales@syndicate.example',    sub: 'Volume buyers, integrations, enterprise plans.' },
            { icon: 'pin',     label: 'Head office',          value: '200 Galle Road, Colombo 03', sub: 'Sri Lanka — visits by appointment.' },
          ].map(m => (
            <div className="contact-method" key={m.label}>
              <div className="contact-method-icon"><Icon name={m.icon} size={18} /></div>
              <div>
                <div className="contact-method-label">{m.label}</div>
                <div className="contact-method-value">{m.value}</div>
                <div className="contact-method-sub">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ padding: 28 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <Icon name="check" size={28} strokeWidth={2.5} />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Thanks — we got it.</h3>
                <p className="text-muted text-sm mb-4" style={{ maxWidth: 360, margin: '0 auto 20px' }}>
                  {`We'll get back to you within one business day at `}
                  <span className="font-mono text-ink2">{form.email || 'your email'}</span>.
                </p>
                <Button variant="secondary" onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', topic: 'General inquiry', message: '' }) }}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <h3 className="font-display font-bold text-xl mb-1">Send us a message</h3>
                <p className="text-sm text-muted mb-5">{`Fill in the form and we'll route it to the right team.`}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Your name" placeholder="Jane Doe" value={form.name} onChange={upd('name')} required />
                  <Field label="Email" type="email" placeholder="jane@acme.com" value={form.email} onChange={upd('email')} required />
                </div>
                <Field label="Company (optional)" placeholder="Acme Inc." value={form.company} onChange={upd('company')} />
                <Select label="What is this about?" value={form.topic} onChange={upd('topic')} options={[
                  'General inquiry', 'Sales & enterprise plans', 'Supplier verification',
                  'Press & media', 'Bug report', 'Something else',
                ]} />
                <TextArea label="Message" placeholder="Tell us a bit more…" value={form.message} onChange={upd('message')} rows={5} required />
                <div className="text-xs text-muted mb-4">
                  {`By submitting, you agree to our `}
                  <button type="button" onClick={() => goTo('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                    privacy policy
                  </button>.
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" type="button" onClick={() => goTo('home')}>Cancel</Button>
                  <Button variant="primary" type="submit" block icon="message">Send message</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
