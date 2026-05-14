'use client'

import React from 'react'
import { Icon, CategoryIcon } from './icons'
import { Avatar, Badge, Button, Stars, VerifiedMark } from './ui'
import type { Business, Product, Message, RFQItem } from '@/lib/data'

/* ── BusinessCard ───────────────────────────── */
interface BusinessCardProps {
  business: Business
  cardStyle?: 'bordered' | 'shadow' | 'minimal'
  favorited?: boolean
  onFavorite?: () => void
  onNavigate?: () => void
  onMessage?: () => void
}

export function BusinessCard({ business, cardStyle = 'bordered', favorited, onFavorite, onNavigate, onMessage }: BusinessCardProps) {
  return (
    <article className={`card card-hover card-style-${cardStyle} fade-up`} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="img-wrap" style={{ aspectRatio: '16/10', position: 'relative' }}>
        <img
          src={business.cover}
          alt={business.name}
          className="img-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${business.id}/600/375` }}
        />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 'calc(100% - 60px)' }}>
          {business.featured && <Badge variant="pro" icon="sparkle">Featured</Badge>}
          <Badge variant="neutral">{business.category}</Badge>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite?.() }}
          aria-label={favorited ? 'Remove favorite' : 'Save'}
          style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.95)', display: 'grid', placeItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.15s ease', cursor: 'pointer' }}
        >
          <Icon name={favorited ? 'heart-fill' : 'heart'} size={15} stroke={favorited ? 'var(--primary)' : 'var(--ink)'} fill={favorited ? 'var(--primary)' : 'none'} />
        </button>
      </div>
      <div style={{ padding: 'var(--card-pad)', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
        <div className="flex items-start gap-3">
          <Avatar src={business.logoUrl} initials={business.logo} size="md" />
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div className="mb-1" style={{ lineHeight: 1.25 }}>
              <span className="font-display font-bold" style={{ fontSize: 15.5 }}>{business.name}</span>
              {business.verified && <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}><VerifiedMark size={13} /></span>}
            </div>
            <div className="flex items-center text-xs" style={{ flexWrap: 'wrap', gap: '4px 10px' }}>
              <Stars rating={business.rating} count={business.reviews} />
              <span className="font-mono text-muted">{business.priceRange}</span>
              <span className="font-mono text-muted flex items-center gap-1"><Icon name="pin" size={10} />{business.location.split(',')[0]}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-ink2 line-clamp-2" style={{ flex: 1, margin: 0 }}>{business.description}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onNavigate} className="flex-1">View profile</Button>
          <Button variant="primary" size="sm" icon="message" onClick={onMessage}>Message</Button>
        </div>
      </div>
    </article>
  )
}

/* ── ProductCard ────────────────────────────── */
interface ProductCardProps {
  product: Product
  business?: Business
  cardStyle?: 'bordered' | 'shadow' | 'minimal'
  onClick?: () => void
}

export function ProductCard({ product, business, cardStyle = 'bordered', onClick }: ProductCardProps) {
  return (
    <article className={`card card-hover card-style-${cardStyle} fade-up`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="img-wrap" style={{ aspectRatio: '4/3', position: 'relative' }}>
        <img
          src={product.image}
          alt={product.name}
          className="img-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/p${product.id}/400/300` }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {product.tieredPricing && product.tieredPricing.length > 1 && <Badge variant="verified">Bulk pricing</Badge>}
          {product.directSales && <Badge variant="success" icon="zap">Buy now</Badge>}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {business && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={business.logoUrl} initials={business.logo} size="sm" />
            <span className="text-xs text-muted truncate">{business.name}</span>
          </div>
        )}
        <div className="font-display font-semibold text-base mb-1 line-clamp-2" style={{ lineHeight: 1.25 }}>{product.name}</div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="font-mono text-xs text-muted">from</div>
            <div className="font-display font-bold text-lg">{product.price}</div>
          </div>
          {product.variations && product.variations.length > 0 && (
            <span className="font-mono text-xs text-muted">{product.variations.length} variants</span>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── MessageCard ────────────────────────────── */
export function MessageCard({ msg, onClick }: { msg: Message; onClick?: () => void }) {
  return (
    <button
      className="card card-hover"
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', padding: 'var(--card-pad)', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', position: 'relative' }}
    >
      <Avatar initials={msg.avatar} size="md" />
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between mb-1 gap-2">
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <span className="font-display font-semibold truncate">{msg.business}</span>
            {msg.unread && <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 }} />}
          </div>
          <span className="font-mono text-xs text-muted" style={{ flexShrink: 0 }}>{msg.time}</span>
        </div>
        <div className={`text-sm ${msg.unread ? 'text-ink2 font-medium' : 'text-muted'} line-clamp-2`}>{msg.msg}</div>
      </div>
    </button>
  )
}

/* ── RFQCard ────────────────────────────────── */
interface RFQCardProps {
  rfq: RFQItem
  type: 'browse' | 'my'
  onAction?: () => void
  onClick?: () => void
}

export function RFQCard({ rfq, type, onAction, onClick }: RFQCardProps) {
  const statusVariant = rfq.status === 'Open' ? 'success' : rfq.status === 'In Progress' ? 'verified' : 'neutral'
  return (
    <article className="card card-hover" style={{ padding: 'var(--card-pad)', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="font-display font-semibold text-lg mb-2" style={{ lineHeight: 1.25 }}>{rfq.title}</h3>
          {type === 'browse' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted">by</span>
              <span className="text-xs font-semibold text-ink2">{rfq.poster}</span>
              <span className="text-xs text-muted">·</span>
              <Badge variant="verified">{rfq.category}</Badge>
              {rfq.location && <>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted flex items-center gap-1"><Icon name="pin" size={10} />{rfq.location}</span>
              </>}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant as 'success' | 'verified' | 'neutral'}>{rfq.status}</Badge>
              <span className="text-xs text-muted">· Created {rfq.created}</span>
            </div>
          )}
        </div>
        {type === 'browse' && rfq.deadline && (
          <Badge variant="warning" icon="clock">{rfq.deadline}</Badge>
        )}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 mt-4" style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="uppercase-label" style={{ marginBottom: 2 }}>Budget</div>
            <div className="font-display font-bold text-base">{rfq.budget}</div>
          </div>
          <div>
            <div className="uppercase-label" style={{ marginBottom: 2 }}>Responses</div>
            <div className="font-display font-bold text-base">{rfq.responses}</div>
          </div>
        </div>
        {type === 'browse' ? (
          <Button variant="primary" size="sm" iconRight="arrow-right" onClick={(e) => { e.stopPropagation(); onAction?.() }}>Submit bid</Button>
        ) : (
          <Button variant="secondary" size="sm" icon="edit" onClick={(e) => { e.stopPropagation(); onAction?.() }}>Manage</Button>
        )}
      </div>
    </article>
  )
}

/* ── CategoryTile ───────────────────────────── */
export function CategoryTile({ name, onClick }: { name: string; onClick?: () => void }) {
  return (
    <button className="cat-tile" onClick={onClick} type="button">
      <span className="cat-tile-icon"><CategoryIcon name={name} size={22} /></span>
      <span className="cat-tile-label">{name}</span>
    </button>
  )
}
