'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, PageHeader, Field, TextArea, Select } from '@/components/ui'
import type { Screen } from '@/lib/data'

/* ── AboutScreen ──────────────────────────── */
export function AboutScreen({ goTo }: { goTo: (s: Screen) => void }) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <PageHeader
        eyebrow="About us"
        title="The supply chain, rewired."
        sub="Syndicate is a B2B network where verified buyers and suppliers find each other, quote each other, and ship — without a thousand cold emails."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose">
            <h3>Why we built this</h3>
            <p>
              Buying for a business used to mean trade shows, broker rolodexes, and quote
              chains buried in email. We thought sourcing at scale deserved better — a single
              place where supplier credentials are checked, capabilities are searchable, and
              an RFQ goes out to the right shortlist in minutes, not weeks.
            </p>
            <p>
              Syndicate is that place. Today, more than 1,200 verified suppliers across six
              industries trade with thousands of buyers on the platform.
            </p>
          </div>

          <div className="about-stats">
            {[
              { num: '1,247', label: 'Verified suppliers' },
              { num: '8,930', label: 'Products listed' },
              { num: '$2.4B', label: 'In RFQs YTD' },
              { num: '48h',   label: 'Avg. quote response' },
            ].map(s => (
              <div key={s.label}>
                <div className="about-stat-num">{s.num}</div>
                <div className="about-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="prose" style={{ marginTop: 24 }}>
            <h3>What we believe</h3>
          </div>

          <div className="values-grid">
            {[
              { icon: 'check',    title: 'Verification, not vibes',   body: 'Every supplier on Syndicate is checked against trade registries, references, and historical reviews. Trust is earned per listing, not assumed.' },
              { icon: 'zap',      title: 'Speed at scale',            body: 'A 500-unit RFQ should not take three weeks of back-and-forth. We bake structured specs and bids into the workflow so quotes are comparable on day one.' },
              { icon: 'message',  title: 'Transparent reviews',       body: 'Reviews come from verified buyers tied to real transactions. Suppliers can respond — nothing is hidden, nothing is bought.' },
              { icon: 'sparkle',  title: 'Built for serious buyers',  body: 'No paid placement that distorts ranking, no upsell traps. Pro suppliers get more tools, never an unfair advantage.' },
            ].map(v => (
              <div className="value-card" key={v.title}>
                <div className="value-icon"><Icon name={v.icon} size={18} strokeWidth={2} /></div>
                <div className="font-display font-bold text-base mb-1">{v.title}</div>
                <p className="text-sm text-ink3" style={{ margin: 0, lineHeight: 1.55 }}>{v.body}</p>
              </div>
            ))}
          </div>

          <div className="prose" style={{ marginTop: 32 }}>
            <h3>Where we are</h3>
            <p>
              Syndicate is operated by a distributed team across Colombo, Singapore, and San
              Francisco. We are hiring engineers, supply-chain analysts, and verification
              specialists. If you want to help fix B2B sourcing, we would love to hear from you.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 28, background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 className="font-display font-bold text-2xl mb-1" style={{ color: 'white' }}>Ready to source smarter?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Post your first RFQ in under five minutes.</p>
          </div>
          <Button variant="primary" size="lg" iconRight="arrow-right" onClick={() => goTo('rfq-create')}>Create RFQ</Button>
        </div>
      </div>
    </div>
  )
}

/* ── PrivacyScreen ────────────────────────── */
const PRIVACY_SECTIONS = [
  { id: 'overview',   title: 'Overview',                  body: `Syndicate ("we", "us", "our") operates the Syndicate B2B marketplace. This Privacy Policy explains what information we collect when you use the platform, how we use it, and the choices you have. By using Syndicate you agree to the practices described below. This policy applies to buyers, suppliers, and visitors.` },
  { id: 'collect',    title: 'Information we collect',    body: `We collect three categories of information. (1) Account information you provide directly — business name, contact email, phone, billing details, and tax IDs where required for verification. (2) Activity data generated as you use Syndicate — RFQs posted, messages exchanged, products listed, search history, saved suppliers, and review submissions. (3) Technical data — IP address, device type, browser, and approximate location, collected automatically through cookies and similar technologies.` },
  { id: 'use',        title: 'How we use information',    body: `We use the information we collect to operate the marketplace, verify supplier identity, match RFQs with relevant suppliers, deliver messages, calculate analytics shown in your dashboard, prevent fraud, and comply with legal obligations. We also use aggregated, de-identified data to publish industry benchmarks. We do not sell your personal information.` },
  { id: 'sharing',    title: 'How we share information',  body: `Limited information is shared with other Syndicate members in the natural course of business — for example, your public business profile is visible to other buyers, and your contact details are revealed to a supplier when you message them. We share data with service providers (hosting, payments, analytics) under contracts that bind them to confidentiality. We may disclose data when required by law, court order, or to protect the safety of our users.` },
  { id: 'cookies',    title: 'Cookies and tracking',      body: `Syndicate uses essential cookies to keep you signed in and remember preferences (saved suppliers, density). We use analytics cookies to understand which features are used. You can control cookies through your browser settings. Disabling essential cookies may prevent parts of Syndicate from working.` },
  { id: 'retention',  title: 'Data retention',            body: `We keep your information for as long as your account is active and for a reasonable period afterward to comply with tax, audit, and dispute-resolution obligations. You may close your account at any time from Settings; we will delete or anonymize data that is no longer required by law.` },
  { id: 'rights',     title: 'Your rights',               body: `Depending on your jurisdiction, you may have the right to access, correct, export, or delete the personal information we hold about you, and to object to certain processing. To exercise these rights, contact privacy@syndicate.example. We will respond within 30 days.` },
  { id: 'security',   title: 'Security',                  body: `We protect your data with TLS in transit, encryption at rest, role-based access controls, and routine third-party security audits. No system is perfectly secure — please use a strong, unique password and enable two-factor authentication from Settings.` },
  { id: 'changes',    title: 'Changes to this policy',    body: `We may update this policy as the platform evolves. Material changes will be announced in-app and via email at least 14 days before they take effect. Your continued use of Syndicate after the effective date constitutes acceptance of the updated policy.` },
  { id: 'contact',    title: 'Contact',                   body: `Questions about privacy? Email privacy@syndicate.example or write to: Syndicate, Attn: Privacy Office, 200 Galle Road, Colombo 03, Sri Lanka.` },
]

export function PrivacyScreen({ goTo: _goTo }: { goTo: (s: Screen) => void }) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        sub="What we collect, why we collect it, and the controls you have."
      />
      <div className="text-xs text-muted font-mono mb-4">Last updated: April 12, 2026</div>

      <div className="privacy-grid">
        <aside>
          <div className="card" style={{ padding: 18, position: 'sticky', top: 'calc(var(--nav-h, 64px) + 16px)' }}>
            <div className="font-display font-bold text-sm mb-3 uppercase-label" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Contents</div>
            <ul className="toc-list">
              {PRIVACY_SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#privacy-${s.id}`}>
                    <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main>
          <div className="card" style={{ padding: 32 }}>
            <div className="prose">
              {PRIVACY_SECTIONS.map((s, i) => (
                <section key={s.id} id={`privacy-${s.id}`} style={{ scrollMarginTop: 'calc(var(--nav-h, 64px) + 16px)' }}>
                  <h3>{String(i + 1).padStart(2, '0')}. {s.title}</h3>
                  <p>{s.body}</p>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ── ContactScreen ────────────────────────── */
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
            { icon: 'mail',    label: 'Email',               value: 'hello@syndicate.example',   sub: 'General questions — we reply within one business day.' },
            { icon: 'phone',   label: 'Phone',               value: '+94 11 555 0188',            sub: 'Mon–Fri, 09:00–18:00 Asia/Colombo.' },
            { icon: 'message', label: 'Sales & partnerships', value: 'sales@syndicate.example',   sub: 'Volume buyers, integrations, enterprise plans.' },
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
                  'General inquiry',
                  'Sales & enterprise plans',
                  'Supplier verification',
                  'Press & media',
                  'Bug report',
                  'Something else',
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
