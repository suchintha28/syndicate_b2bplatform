'use client'

import React from 'react'
import { Icon } from '@/components/icons'
import { Button } from '@/components/ui'
import { type Screen, type NavOpts } from '@/lib/data'

export function SuccessScreen({ goTo, context }: { goTo: (s: Screen, opts?: NavOpts) => void; context?: 'rfq' | 'message' | null }) {
  const isRfq = context === 'rfq'
  const subtitle = isRfq
    ? 'Your RFQ has been submitted. Suppliers will review it and respond with bids.'
    : context === 'message'
      ? 'Your message has been sent. The supplier will respond shortly.'
      : 'Your request has been submitted successfully.'

  return (
    <div className="container fade-up" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center', maxWidth: 540 }}>
      <div style={{ width: 88, height: 88, borderRadius: 999, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={32} stroke="white" strokeWidth={2.5} />
        </div>
      </div>
      <h1 className="page-title mb-3">You&apos;re all set</h1>
      <p className="text-muted text-base mb-6">{subtitle}</p>
      <div className="flex gap-3 justify-center">
        {isRfq
          ? <Button variant="secondary" onClick={() => goTo('rfqs')}>View RFQ board</Button>
          : <Button variant="secondary" onClick={() => goTo('messages')}>Go to inbox</Button>
        }
        <Button variant="primary" iconRight="arrow-right" onClick={() => goTo('home')}>Back to home</Button>
      </div>
    </div>
  )
}
