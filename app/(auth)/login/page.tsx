'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

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

      if (!data.user) {
        setError('Something went wrong. Please try again.')
        return
      }

      // Determine redirect based on role and brand existence
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'seller') {
        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('owner_id', data.user.id)
          .maybeSingle()

        router.push(brand ? '/' : '/onboarding/brand')
      } else {
        router.push('/')
      }

      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
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
          Welcome back
        </h1>
        <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
          Sign in to your Syndicate account
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

          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
                Forgot password?
              </Link>
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-center text-muted" style={{ fontSize: 14, marginTop: 20 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Create one
        </Link>
      </p>
    </div>
  )
}
