'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      await supabase.auth.signOut()
      router.push('/login?message=password_updated')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      padding: '24px 16px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--r-md)',
            background: 'var(--primary)', display: 'grid', placeItems: 'center',
            margin: '0 auto 16px', color: 'white', fontSize: 22, fontWeight: 800,
            fontFamily: 'var(--font-inter-tight, "Inter Tight", Inter, sans-serif)',
          }}>S</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
            Set new password
          </h1>
          <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
            Choose a strong password for your account.
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="field-label">New password</label>
              <input
                className="field"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="mb-4">
              <label className="field-label">Confirm password</label>
              <input
                className="field"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        </div>

        <p className="text-center text-muted" style={{ fontSize: 14, marginTop: 20 }}>
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
