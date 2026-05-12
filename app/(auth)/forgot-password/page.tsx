'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: 'var(--primary-soft)', display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
          Check your inbox
        </h2>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>
          We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
        </p>
        <Link href="/login" className="btn btn-secondary">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--r-md)',
          background: 'var(--primary)', display: 'grid', placeItems: 'center',
          margin: '0 auto 16px', color: 'white', fontSize: 22, fontWeight: 800,
          fontFamily: 'var(--font-inter-tight, "Inter Tight", Inter, sans-serif)',
        }}>S</div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
          Reset your password
        </h1>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)',
              border: '1px solid rgba(185,28,28,0.2)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>
      </div>

      <p className="text-center text-muted" style={{ fontSize: 14, marginTop: 20 }}>
        Remembered it?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
