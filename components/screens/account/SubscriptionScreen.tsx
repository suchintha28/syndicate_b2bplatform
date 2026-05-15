'use client'

import React from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, PageHeader, BackLink } from '@/components/ui'
import { PLANS, type Screen, type NavOpts } from '@/lib/data'

export function SubscriptionScreen({ goTo, isProMember, setIsProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isProMember: boolean
  setIsProMember: (v: boolean) => void
}) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back</BackLink>
      <PageHeader eyebrow="Plans & pricing" title="Pick the plan that fits" sub="Switch or cancel anytime. Pro unlocks the RFQ marketplace, direct sales, and analytics." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {PLANS.map((plan, i) => {
          const isCurrent = plan.name === 'Free' ? !isProMember : (isProMember && plan.name === 'Monthly Pro')
          const isFeatured = plan.recommended
          return (
            <div key={i} className="card" style={{
              padding: 28,
              borderColor: isFeatured ? 'var(--primary)' : 'var(--border)',
              borderWidth: isFeatured ? 2 : 1,
              position: 'relative',
              overflow: 'visible',
              background: isFeatured ? 'linear-gradient(180deg, var(--primary-soft) 0%, white 60%)' : 'white',
            }}>
              {isFeatured && (
                <span style={{ position: 'absolute', top: -12, right: 24 }}>
                  <Badge variant="pro" icon="sparkle">Best value</Badge>
                </span>
              )}
              <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display font-bold" style={{ fontSize: 40, letterSpacing: '-0.025em' }}>
                  {plan.price === 0 ? 'Free' : `LKR ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="text-muted text-sm">/ {plan.period.split(',')[0]}</span>}
              </div>
              {plan.period.includes(',') && <div className="text-xs text-muted mb-4 font-mono">{plan.period.split(',')[1]}</div>}
              {!plan.period.includes(',') && <div className="text-xs text-muted mb-4">&nbsp;</div>}

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>
                      <Icon name="check" size={15} strokeWidth={2.5} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isFeatured ? 'primary' : (isCurrent ? 'secondary' : 'dark')}
                block
                disabled={isCurrent}
                onClick={() => {
                  if (plan.name !== 'Free') setIsProMember(true)
                  else setIsProMember(false)
                  goTo('success')
                }}
              >
                {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted mt-6 font-mono">
        All plans include a 14-day money-back guarantee · Tax may apply
      </div>
    </div>
  )
}
