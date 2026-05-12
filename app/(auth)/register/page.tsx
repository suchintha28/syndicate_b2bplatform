'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'buyer' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: form.role,
          },
        },
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already in use')) {
          setError('An account with this email already exists. Try signing in.')
        } else if (authError.message.toLowerCase().includes('password')) {
          setError('Password must be at least 6 characters.')
        } else {
          setError(authError.message)
        }
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
          background: 'var(--success-soft)', display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
          Check your email
        </h2>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="btn btn-primary">Back to sign in</Link>
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
          Create your account
        </h1>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          Join 1,200+ businesses on Syndicate
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="field-label">Full name</label>
            <input
              className="field"
              type="text"
              placeholder="Jane Doe"
              value={form.fullName}
              onChange={upd('fullName')}
              required
              autoComplete="name"
            />
          </div>

          <div className="mb-4">
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={upd('email')}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={upd('password')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="mb-5">
            <label className="field-label">I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['buyer', 'seller'] as const).map(r => (
                <label
                  key={r}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px',
                    border: `1px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)',
                    background: form.role === r ? 'var(--primary-soft)' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={form.role === r}
                    onChange={upd('role')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <div className="font-display font-semibold" style={{ fontSize: 14, textTransform: 'capitalize' }}>{r}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {r === 'buyer' ? 'Source products & RFQs' : 'Sell & list products'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-muted" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>

      <p className="text-center text-muted" style={{ fontSize: 14, marginTop: 20 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
