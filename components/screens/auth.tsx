'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INDUSTRIES, type Screen } from '@/lib/data'

type AuthTab = 'signin' | 'signup'

/* ── Shared error box ───────────────────────── */
function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--danger-soft)',
      border: '1px solid rgba(185,28,28,0.18)',
      borderRadius: 'var(--r-sm)',
      padding: '10px 14px',
      color: 'var(--danger)',
      fontSize: 13,
      marginBottom: 16,
    }}>
      {message}
    </div>
  )
}

/* ── Sign-in form ───────────────────────────── */
function SignInForm({ goTo }: { goTo: (s: Screen) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email address before signing in.')
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(authError.message)
        }
        return
      }
      goTo('home')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
      <div className="mb-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
          <a href="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
            Forgot password?
          </a>
        </div>
        <input
          className="field"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && <ErrorBox message={error} />}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

/* ── Sign-up form ───────────────────────────── */
function SignUpForm() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'buyer',
    businessName: '',
    industry: 'Manufacturing',
    industryOther: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const isSeller = form.role === 'seller'
  const resolvedIndustry = form.industry === 'Other' ? form.industryOther : form.industry

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isSeller && !form.businessName.trim()) {
      setError('Please enter your business name.')
      return
    }
    if (isSeller && form.industry === 'Other' && !form.industryOther.trim()) {
      setError('Please specify your industry.')
      return
    }
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
            ...(isSeller && {
              business_name: form.businessName.trim(),
              industry: resolvedIndustry,
            }),
          },
        },
      })
      if (authError) {
        if (authError.message.toLowerCase().includes('already')) {
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
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999,
          background: 'var(--success-soft)', display: 'grid', placeItems: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="font-display font-bold" style={{ fontSize: 18, marginBottom: 8 }}>Check your email</div>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          We sent a confirmation link to <strong>{form.email}</strong>.<br />Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="field-label">Full name</label>
        <input className="field" type="text" placeholder="Jane Doe" value={form.fullName}
          onChange={upd('fullName')} required autoComplete="name" />
      </div>
      <div className="mb-4">
        <label className="field-label">Email</label>
        <input className="field" type="email" placeholder="you@company.com" value={form.email}
          onChange={upd('email')} required autoComplete="email" />
      </div>
      <div className="mb-4">
        <label className="field-label">Password</label>
        <input className="field" type="password" placeholder="Min. 6 characters" value={form.password}
          onChange={upd('password')} required minLength={6} autoComplete="new-password" />
      </div>

      {/* Role picker */}
      <div className="mb-4">
        <label className="field-label">I am a</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['buyer', 'seller'] as const).map(r => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
              border: `1px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--r-sm)',
              background: form.role === r ? 'var(--primary-soft)' : 'white',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <input type="radio" name="signup-role" value={r} checked={form.role === r}
                onChange={() => setForm(prev => ({ ...prev, role: r }))}
                style={{ accentColor: 'var(--primary)' }} />
              <div>
                <div className="font-display font-semibold" style={{ fontSize: 13, textTransform: 'capitalize' }}>{r}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {r === 'buyer' ? 'Source & buy' : 'Sell & list'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Seller-only fields */}
      {isSeller && (
        <div style={{
          background: 'var(--bg-alt)', borderRadius: 'var(--r-sm)',
          padding: '14px 14px 2px', marginBottom: 16,
          border: '1px solid var(--border)',
        }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--primary)', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Business details
          </div>
          <div className="mb-3">
            <label className="field-label">Business name</label>
            <input className="field" type="text" placeholder="Acme Industries Ltd."
              value={form.businessName} onChange={upd('businessName')} required={isSeller} />
          </div>
          <div className="mb-3">
            <label className="field-label">Industry</label>
            <select className="field" value={form.industry} onChange={upd('industry')}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          {form.industry === 'Other' && (
            <div className="mb-3">
              <label className="field-label">Specify industry</label>
              <input className="field" type="text" placeholder="e.g. Marine Engineering"
                value={form.industryOther} onChange={upd('industryOther')} required />
            </div>
          )}
        </div>
      )}

      {error && <ErrorBox message={error} />}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

/* ── AuthScreen ─────────────────────────────── */
export function AuthScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const [tab, setTab] = useState<AuthTab>('signin')

  return (
    <div className="container fade-up" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 480 }}>
      {/* Brand mark */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--r-md)',
          background: 'var(--primary)', display: 'grid', placeItems: 'center',
          margin: '0 auto 16px', color: 'white', fontSize: 22, fontWeight: 800,
          fontFamily: 'var(--font-inter-tight, "Inter Tight", Inter, sans-serif)',
        }}>S</div>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>
          {tab === 'signin' ? 'Welcome back' : 'Join Syndicate'}
        </h1>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          {tab === 'signin'
            ? 'Sign in to your account'
            : '1,200+ verified businesses — and counting'}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: 'var(--bg-alt)',
        borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 24,
      }}>
        {(['signin', 'signup'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', borderRadius: 'var(--r-xs)',
            fontFamily: 'var(--font-inter-tight, Inter, sans-serif)',
            fontWeight: 600, fontSize: 14,
            background: tab === t ? 'white' : 'transparent',
            color: tab === t ? 'var(--ink)' : 'var(--muted)',
            boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
          }}>
            {t === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="card" style={{ padding: 24 }}>
        {tab === 'signin' ? <SignInForm goTo={goTo} /> : <SignUpForm />}
      </div>

      {/* Footer nudge */}
      <p className="text-center text-muted" style={{ fontSize: 13, marginTop: 20 }}>
        {tab === 'signin'
          ? <>New here? <button className="font-semibold" style={{ color: 'var(--primary)' }} onClick={() => setTab('signup')}>Create an account</button></>
          : <>Already have an account? <button className="font-semibold" style={{ color: 'var(--primary)' }} onClick={() => setTab('signin')}>Sign in</button></>
        }
      </p>
    </div>
  )
}
