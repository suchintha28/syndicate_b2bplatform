'use client'

import React from 'react'

export const EXPIRY_OPTIONS = [
  { label: '2 weeks',  days: 14  },
  { label: '1 month',  days: 30  },
  { label: '2 months', days: 60  },
  { label: '3 months', days: 90  },
]

export const BUDGET_FILTERS = [
  { label: 'Any budget',       min: null,       max: null        },
  { label: 'Under LKR 5M',    min: null,       max: 5_000_000   },
  { label: 'LKR 5M–25M',      min: 5_000_000,  max: 25_000_000  },
  { label: 'LKR 25M–100M',    min: 25_000_000, max: 100_000_000 },
  { label: 'LKR 100M+',       min: 100_000_000, max: null       },
]

export const TIME_FILTERS = [
  { label: 'Any time',  hours: null  },
  { label: 'Today',     hours: 24    },
  { label: 'This week', hours: 168   },
  { label: 'This month',hours: 720   },
]

export const RFQ_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Open',      color: 'var(--success)',  bg: 'var(--success-soft)'           },
  read:      { label: 'Viewed',    color: 'var(--muted)',    bg: 'var(--bg-alt)'                 },
  responded: { label: 'Responded', color: 'var(--primary)',  bg: 'var(--primary-soft)'           },
  closed:    { label: 'Closed',    color: 'var(--ink)',      bg: 'var(--bg-alt)'                 },
}

export const BID_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Submitted', color: 'var(--warning)',  bg: 'var(--warning-soft, #fef9c3)' },
  accepted: { label: 'Accepted',  color: 'var(--success)',  bg: 'var(--success-soft)'          },
  rejected: { label: 'Declined',  color: 'var(--danger)',   bg: 'var(--danger-soft)'           },
}

export function StatusPill({ status }: { status: string }) {
  const s = RFQ_STATUS[status] || { label: status, color: 'var(--muted)', bg: 'var(--bg-alt)' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: s.bg, color: s.color, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

export function BidStatusPill({ status }: { status: string }) {
  const s = BID_STATUS[status] || { label: status, color: 'var(--muted)', bg: 'var(--bg-alt)' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: s.bg, color: s.color, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `LKR ${(n / 1_000).toFixed(0)}K`
    return `LKR ${n.toLocaleString()}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return null
}

export function fmtExpiry(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  if (days < 7) return `Expires in ${days} days`
  return `Expires ${fmtDate(iso)}`
}
