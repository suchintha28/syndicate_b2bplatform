'use client'

import React from 'react'
import { Icon } from '@/components/icons'
import { PageHeader, BackLink } from '@/components/ui'
import { type Screen, type NavOpts } from '@/lib/data'

export function SettingsScreen({ goTo }: { goTo: (s: Screen, opts?: NavOpts) => void }) {
  const groups = [
    { title: 'Account', items: [
      { label: 'Notifications',       sub: 'Email, push, in-app' },
      { label: 'Privacy & security',  sub: 'Password, 2FA, sessions' },
      { label: 'Connected accounts',  sub: 'Google, Slack' },
    ]},
    { title: 'Preferences', items: [
      { label: 'Language', sub: 'English (US)' },
      { label: 'Region',   sub: 'Sri Lanka' },
    ]},
    { title: 'Support', items: [
      { label: 'Help & docs',    sub: 'Browse guides and contact support' },
      { label: 'Terms of service' },
      { label: 'About',          sub: 'Syndicate v2.0' },
    ]},
  ]

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Settings" />

      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div className="uppercase-label mb-3">{g.title}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {g.items.map((it, i) => (
              <button key={i} className="flex items-center gap-3 w-full"
                style={{ padding: 16, textAlign: 'left', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
                <div className="flex-1">
                  <div className="font-display font-semibold">{it.label}</div>
                  {it.sub && <div className="text-xs text-muted">{it.sub}</div>}
                </div>
                <Icon name="chevron-right" size={16} stroke="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
