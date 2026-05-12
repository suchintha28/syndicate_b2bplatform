'use client'

import React from 'react'
import { Icon } from './icons'

/* ── Button ─────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark'
  size?: 'sm' | 'lg' | ''
  block?: boolean
  icon?: string
  iconRight?: string
}

export function Button({ variant = 'primary', size = '', block = false, icon, iconRight, children, className = '', ...rest }: ButtonProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    className,
  ].filter(Boolean).join(' ')
  const iconSize = size === 'sm' ? 14 : 16
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}

/* ── Badge ──────────────────────────────────── */
interface BadgeProps {
  variant?: 'neutral' | 'verified' | 'pro' | 'success' | 'warning' | 'danger'
  icon?: string
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

/* ── Avatar ─────────────────────────────────── */
interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, initials, size = 'md', className = '' }: AvatarProps) {
  return (
    <span className={`avatar avatar-${size} ${className}`}>
      {src
        ? <img src={src} alt={alt || initials} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : initials}
    </span>
  )
}

/* ── Stars ──────────────────────────────────── */
export function Stars({ rating, count }: { rating: number; count?: number }) {
  const full = Math.floor(rating)
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="stars">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" size={12}
            stroke={i < full ? 'currentColor' : 'var(--border-strong)'}
            fill={i < full ? 'currentColor' : 'var(--border-strong)'} />
        ))}
      </span>
      {count !== undefined && <span className="text-muted text-xs font-mono">({count})</span>}
    </span>
  )
}

/* ── Chip ───────────────────────────────────── */
interface ChipProps {
  active?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
  icon?: string
  children: React.ReactNode
}

export function Chip({ active, onClick, removable, onRemove, icon, children }: ChipProps) {
  return (
    <button className={`chip ${active ? 'active' : ''}`} onClick={onClick} type="button">
      {icon && <Icon name={icon} size={13} />}
      {children}
      {removable && (
        <span className="chip-remove" onClick={(e) => { e.stopPropagation(); onRemove?.() }}>
          <Icon name="x" size={12} strokeWidth={2.5} />
        </span>
      )}
    </button>
  )
}

/* ── Field ──────────────────────────────────── */
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Field({ label, hint, className = '', ...rest }: FieldProps) {
  return (
    <div className="mb-4">
      {label && <label className="field-label">{label}</label>}
      <input className={`field ${className}`} {...rest} />
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  )
}

/* ── TextArea ───────────────────────────────── */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function TextArea({ label, hint, ...rest }: TextAreaProps) {
  return (
    <div className="mb-4">
      {label && <label className="field-label">{label}</label>}
      <textarea className="field" {...rest} />
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  )
}

/* ── Select ─────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: string[]
}

export function Select({ label, options, ...rest }: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="field-label">{label}</label>}
      <select className="field" {...rest}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

/* ── SkeletonCard ───────────────────────────── */
export function SkeletonCard({ height = 220 }: { height?: number }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skel" style={{ height: height * 0.55, borderRadius: 0 }} />
      <div style={{ padding: 18 }}>
        <div className="skel" style={{ height: 14, width: '60%', marginBottom: 10 }} />
        <div className="skel" style={{ height: 10, width: '90%', marginBottom: 6 }} />
        <div className="skel" style={{ height: 10, width: '70%' }} />
      </div>
    </div>
  )
}

/* ── EmptyState ─────────────────────────────── */
export function EmptyState({ icon = 'search', title, sub, action }: { icon?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center" style={{ padding: '80px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
        <Icon name={icon} size={28} stroke="var(--muted)" />
      </div>
      <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
      {sub && <p className="text-muted text-sm mb-4" style={{ maxWidth: 360, margin: '0 auto 20px' }}>{sub}</p>}
      {action}
    </div>
  )
}

/* ── PageHeader ─────────────────────────────── */
export function PageHeader({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div className="uppercase-label mb-2">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-subtitle">{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}

/* ── BackLink ───────────────────────────────── */
export function BackLink({ onClick, children = 'Back' }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button className="back-link" onClick={onClick} type="button">
      <Icon name="chevron-left" size={14} strokeWidth={2.5} />
      {children}
    </button>
  )
}

/* ── Tabs ───────────────────────────────────── */
interface Tab { value: string; label: string; count?: number }
export function Tabs({ tabs, value, onChange }: { tabs: Tab[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.value} className={`tab ${value === t.value ? 'active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count !== undefined && <span className="text-xs font-mono" style={{ opacity: 0.6, marginLeft: 6 }}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ── VerifiedMark ───────────────────────────── */
export function VerifiedMark({ size = 16 }: { size?: number }) {
  return (
    <span title="Verified" style={{ display: 'inline-flex', color: 'var(--primary)' }}>
      <Icon name="verified" size={size} stroke="none" fill="currentColor" />
    </span>
  )
}
