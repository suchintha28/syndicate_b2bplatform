'use client'

import React from 'react'
import { PageHeader } from '@/components/ui'
import type { Screen } from '@/lib/data'
import { usePrivacyPage } from '@/hooks/useSanityPage'
import { PortableText } from '@portabletext/react'

// ── Fallback sections shown before Sanity data is published ───────────────────
const FALLBACK_SECTIONS = [
  { id: 'overview',  title: 'Overview',                 body: `Syndicate ("we", "us", "our") operates the Syndicate B2B marketplace. This Privacy Policy explains what information we collect when you use the platform, how we use it, and the choices you have. By using Syndicate you agree to the practices described below.` },
  { id: 'collect',   title: 'Information we collect',   body: `We collect three categories of information. (1) Account information you provide directly — business name, contact email, phone, billing details, and tax IDs. (2) Activity data generated as you use Syndicate — RFQs posted, messages exchanged, products listed, search history, saved suppliers, and review submissions. (3) Technical data — IP address, device type, browser, and approximate location, collected automatically through cookies.` },
  { id: 'use',       title: 'How we use information',   body: `We use the information we collect to operate the marketplace, verify supplier identity, match RFQs with relevant suppliers, deliver messages, calculate analytics, prevent fraud, and comply with legal obligations. We do not sell your personal information.` },
  { id: 'sharing',   title: 'How we share information', body: `Limited information is shared with other Syndicate members in the natural course of business. We share data with service providers under confidentiality contracts. We may disclose data when required by law or to protect user safety.` },
  { id: 'cookies',   title: 'Cookies and tracking',     body: `Syndicate uses essential cookies to keep you signed in and remember preferences. We use analytics cookies to understand which features are used. You can control cookies through your browser settings.` },
  { id: 'retention', title: 'Data retention',           body: `We keep your information for as long as your account is active and for a reasonable period afterward to comply with tax, audit, and dispute-resolution obligations. You may close your account at any time from Settings.` },
  { id: 'rights',    title: 'Your rights',              body: `Depending on your jurisdiction, you may have the right to access, correct, export, or delete the personal information we hold about you. Contact privacy@syndicate.example to exercise these rights.` },
  { id: 'security',  title: 'Security',                 body: `We protect your data with TLS in transit, encryption at rest, role-based access controls, and routine third-party security audits. Please use a strong, unique password and enable two-factor authentication from Settings.` },
  { id: 'changes',   title: 'Changes to this policy',   body: `We may update this policy as the platform evolves. Material changes will be announced in-app and via email at least 14 days before they take effect.` },
  { id: 'contact',   title: 'Contact',                  body: `Questions about privacy? Email privacy@syndicate.example or write to: Syndicate, Attn: Privacy Office, 200 Galle Road, Colombo 03, Sri Lanka.` },
]

export function PrivacyScreen({ goTo: _goTo }: { goTo: (s: Screen) => void }) {
  const { data: cms } = usePrivacyPage()

  // Merge Sanity sections over fallback, or use fallback entirely
  const sections = cms?.sections?.length
    ? cms.sections.map(s => ({ id: s.id?.current ?? s.id as unknown as string, title: s.title, body: s.body, isPortable: true }))
    : FALLBACK_SECTIONS.map(s => ({ ...s, isPortable: false }))

  const lastUpdated = cms?.lastUpdated ?? 'April 12, 2026'

  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        sub="What we collect, why we collect it, and the controls you have."
      />
      <div className="text-xs text-muted font-mono mb-4">Last updated: {lastUpdated}</div>

      <div className="privacy-grid">
        <aside>
          <div className="card" style={{ padding: 18, position: 'sticky', top: 'calc(var(--nav-h, 64px) + 16px)' }}>
            <div className="font-display font-bold text-sm mb-3 uppercase-label" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Contents</div>
            <ul className="toc-list">
              {sections.map((s, i) => (
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
              {sections.map((s, i) => (
                <section key={s.id} id={`privacy-${s.id}`} style={{ scrollMarginTop: 'calc(var(--nav-h, 64px) + 16px)' }}>
                  <h3>{String(i + 1).padStart(2, '0')}. {s.title}</h3>
                  {s.isPortable
                    ? <PortableText value={s.body as Parameters<typeof PortableText>[0]['value']} />
                    : <p>{s.body as string}</p>
                  }
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
