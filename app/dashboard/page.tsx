import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isSeller = profile?.role === 'seller'
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <nav style={{
        height: 'var(--nav-h)', borderBottom: '1px solid var(--border)',
        background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{
          fontFamily: 'var(--font-inter-tight, Inter, sans-serif)',
          fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', flex: 1,
        }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--primary)', color: 'white',
            fontSize: 14, fontWeight: 800, marginRight: 8, verticalAlign: 'middle',
          }}>S</span>
          Syndicate
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="btn btn-secondary btn-sm">Marketplace</Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 900 }}>
        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <div className="uppercase-label mb-2">Dashboard</div>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>
            Welcome back, {displayName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge badge-${isSeller ? 'verified' : 'neutral'}`}>
              {isSeller ? 'Seller' : 'Buyer'}
            </span>
            <span className="text-muted" style={{ fontSize: 14 }}>{user.email}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { href: '/',         icon: '🏪', label: 'Marketplace',    sub: 'Browse suppliers & products' },
            { href: '/rfqs',     icon: '📋', label: 'RFQs',           sub: 'Manage requests for quote' },
            { href: '/inbox',    icon: '💬', label: 'Inbox',          sub: 'Your messages' },
            { href: '/profile',  icon: '⚙️', label: 'Profile',        sub: 'Edit your business profile' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="card card-hover" style={{
              padding: 20, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--r-sm)',
                background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', fontSize: 20,
              }}>
                {item.icon}
              </div>
              <div>
                <div className="font-display font-semibold">{item.label}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Seller-only: set up brand CTA */}
        {isSeller && (
          <div className="card" style={{
            padding: 28, background: 'var(--ink)', color: 'white',
            borderColor: 'var(--ink)', marginBottom: 32,
          }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div style={{ flex: 1 }}>
                <div className="font-display font-bold" style={{ fontSize: 18, marginBottom: 6 }}>
                  Complete your seller profile
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  Set up your brand page to start appearing in search results.
                </div>
              </div>
              <Link href="/onboarding/brand" className="btn btn-primary">Set up brand</Link>
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="card" style={{ padding: 24 }}>
          <div className="uppercase-label mb-3">Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Email', value: user.email },
              { label: 'Role', value: profile?.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : '—' },
              { label: 'User ID', value: user.id, mono: true },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span className="text-muted" style={{ fontSize: 14 }}>{row.label}</span>
                <span className={row.mono ? 'font-mono' : 'font-display font-semibold'} style={{ fontSize: 14 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
