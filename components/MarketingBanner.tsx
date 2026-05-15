'use client'

/**
 * MarketingBanner
 *
 * Renders a horizontal promotional banner for a given slot.
 * Returns null (zero layout impact, no blank space) when:
 *   – no banner is active for this slot in the CMS
 *   – the SWR fetch hasn't resolved yet
 *
 * Banners are managed via the `banners` table in Supabase.
 * Fields: slot · title · subtitle · cta_text · cta_url ·
 *         image_url · bg_color · text_color · is_active · starts_at · ends_at
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

  const hasImage  = !!banner.image_url
  const hasText   = !!(banner.title || banner.subtitle)
  const hasCta    = !!(banner.cta_text && banner.cta_url)

  const card = (
    <div
      className="marketing-banner"
      style={{
        background: hasImage
          ? `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url(${banner.image_url}) center / cover no-repeat`
          : banner.bg_color,
        color: banner.text_color,
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
        <span className="marketing-banner-cta">{banner.cta_text}</span>
      )}
    </div>
  )

  if (banner.cta_url) {
    return (
      <a href={banner.cta_url} style={{ display: 'block', textDecoration: 'none' }}>
        {card}
      </a>
    )
  }

  return card
}
