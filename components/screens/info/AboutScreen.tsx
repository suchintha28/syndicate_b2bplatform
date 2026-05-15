'use client'

import React from 'react'
import { Icon } from '@/components/icons'
import { Button, PageHeader } from '@/components/ui'
import type { Screen } from '@/lib/data'

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
              { icon: 'check',   title: 'Verification, not vibes',  body: 'Every supplier on Syndicate is checked against trade registries, references, and historical reviews. Trust is earned per listing, not assumed.' },
              { icon: 'zap',     title: 'Speed at scale',           body: 'A 500-unit RFQ should not take three weeks of back-and-forth. We bake structured specs and bids into the workflow so quotes are comparable on day one.' },
              { icon: 'message', title: 'Transparent reviews',      body: 'Reviews come from verified buyers tied to real transactions. Suppliers can respond — nothing is hidden, nothing is bought.' },
              { icon: 'sparkle', title: 'Built for serious buyers', body: 'No paid placement that distorts ranking, no upsell traps. Pro suppliers get more tools, never an unfair advantage.' },
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
