'use client'

/**
 * MarketingBanner
 *
 * Renders a horizontal promotional banner for a given slot.
 * Returns null (zero layout impact — no blank space) when:
 *   – no banner is active for this slot in Sanity CMS
 *   – the SWR fetch hasn't resolved yet
 *
 * Banners are managed via Sanity Studio at /studio → Marketing banners.
 * Fields: slot · title · subtitle · ctaText · ctaUrl ·
 *         image · bgColor · textColor · isActive · startsAt · endsAt
 */

import React from 'react'
import { useBanner } from '@/hooks/useBanner'

interface Props {
  slot: string
  /** Extra wrapper margin. Defaults to '24px 0'. Pass '0' to let the caller handle spacing. */
  margin?: string
}

export function MarketingBanner({ slot, margin = '24px 0' }: Props) {
  const banner = useBanner(slot)
  if (!banner) return null

  const hasImage = !!banner.imageUrl
  const hasText  = !!(banner.title || banner.subtitle)
  const hasCta   = !!(banner.ctaText && banner.ctaUrl)

  const card = (
    <div
      className="marketing-banner"
      style={{
        background: hasImage
          ? `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url(${banner.imageUrl}) center / cover no-repeat`
          : (banner.bgColor ?? '#1a1a2e'),
        color: banner.textColor ?? '#ffffff',
        margin,
      }}
    >
      {hasText && (
        <div className="marketing-banner-text">
          {banner.title    && <div className="marketing-banner-title">{banner.title}</div>}
          {banner.subtitle && <div className="marketing-banner-subtitle">{banner.subtitle}</div>}
        </div>
      )}
      {hasCta && (
        <span className="marketing-banner-cta">{banner.ctaText}</span>
      )}
    </div>
  )

  if (banner.ctaUrl) {
    return (
      <a href={banner.ctaUrl} style={{ display: 'block', textDecoration: 'none' }}>
        {card}
      </a>
    )
  }

  return card
}
