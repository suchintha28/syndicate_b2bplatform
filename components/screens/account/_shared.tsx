'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, Avatar } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

/* ── Image upload helper ────────────────────── */
export async function uploadImage(
  file: File,
  bucket: 'avatars' | 'logos',
  userId: string,
): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/* ── ImageUploadCircle ──────────────────────── */
export function ImageUploadCircle({
  src, initials, size = 'lg', bucket, userId, onUploaded, label,
}: {
  src?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bucket: 'avatars' | 'logos'
  userId?: string
  onUploaded: (url: string) => void
  label: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please use a JPG, PNG, or WebP image.')
      return
    }
    setUploading(true)
    const url = await uploadImage(file, bucket, userId)
    setUploading(false)
    if (url) onUploaded(url)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: userId ? 'pointer' : 'default' }}
      onClick={() => userId && inputRef.current?.click()}>
      <Avatar src={src} initials={initials} size={size} />
      {userId && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--primary)', border: '2px solid white',
          display: 'grid', placeItems: 'center',
        }}>
          {uploading
            ? <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={handleFile} aria-label={label} />
    </div>
  )
}

/* ── ProductImageUploader ───────────────────── */
export function ProductImageUploader({ images, brandId, onUpdate }: {
  images: string[]
  brandId: string
  onUpdate: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - images.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length || !brandId) return
    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} is over 5 MB — skipped.`); continue }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Only JPG, PNG, or WebP allowed.'); continue }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${brandId}/${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`
      const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('products').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }
    onUpdate([...images, ...newUrls].slice(0, 3))
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }} />
            <button type="button" onClick={() => onUpdate(images.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 13, lineHeight: 1, fontFamily: 'inherit', padding: 0 }}>
              ×
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || !brandId}
            style={{ width: 80, height: 80, border: '2px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', cursor: brandId ? 'pointer' : 'not-allowed', background: 'var(--bg-alt)', flexShrink: 0 }}>
            {uploading
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              : <Icon name="plus" size={20} stroke="var(--muted)" />
            }
          </button>
        )}
      </div>
      <div className="text-xs text-muted">Up to 3 images · JPG, PNG, WebP · max 5 MB each</div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
    </div>
  )
}

/* ── StatusPill ─────────────────────────────── */
const ACCOUNT_RFQ_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'var(--warning)',       bg: 'var(--warning-soft, #fef9c3)' },
  read:      { label: 'Viewed',    color: 'var(--muted)',         bg: 'var(--bg-alt)' },
  responded: { label: 'Responded', color: 'var(--success)',       bg: 'var(--success-soft)' },
  closed:    { label: 'Closed',    color: 'var(--ink)',           bg: 'var(--bg-alt)' },
}

export function StatusPill({ status }: { status: string }) {
  const s = ACCOUNT_RFQ_STATUS[status] || { label: status, color: 'var(--muted)', bg: 'var(--bg-alt)' }
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

/* ── ProLock ────────────────────────────────── */
export function ProLock({ onUpgrade, label }: { onUpgrade: () => void; label: string }) {
  return (
    <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', padding: 28, textAlign: 'center', background: 'var(--bg-alt)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: 'var(--ink)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
        <Icon name="lock" size={20} stroke="white" />
      </div>
      <div className="font-display font-semibold mb-1">Pro feature</div>
      <div className="text-sm text-muted mb-4" style={{ maxWidth: 320, margin: '0 auto 16px' }}>{label}</div>
      <Button variant="dark" size="sm" icon="sparkle" onClick={onUpgrade}>Upgrade to Pro</Button>
    </div>
  )
}

/* ── DeleteAccountModal ─────────────────────── */
export function DeleteAccountModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (password: string) => Promise<string | null>
  onCancel: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await onConfirm(password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={20} stroke="var(--danger)" />
          </div>
          <div>
            <div className="font-display font-bold text-lg" style={{ marginBottom: 4 }}>Delete account</div>
            <div className="text-sm text-muted">This permanently deletes your account, brand, all products, and RFQ history. This cannot be undone.</div>
          </div>
        </div>

        <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 20 }}>
          <div className="text-sm" style={{ color: 'var(--danger)', fontWeight: 500 }}>
            Enter your password to confirm you want to permanently delete your account.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
              color: 'var(--danger)', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={loading || password.length === 0}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: 'var(--r-sm)',
                background: loading || password.length === 0 ? 'var(--danger-soft)' : 'var(--danger)',
                color: loading || password.length === 0 ? 'var(--danger)' : 'white',
                border: 'none', fontWeight: 600, fontSize: 14, cursor: loading || password.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              {loading ? 'Deleting…' : 'Yes, delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
