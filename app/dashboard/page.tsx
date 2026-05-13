import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'
import type { DbBrand, DbProduct, DbRfq } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  read:      'Read',
  responded: 'Responded',
  closed:    'Closed',
}
const STATUS_VARIANTS: Record<string, string> = {
  pending:   'badge-warning',
  read:      'badge-verified',
  responded: 'badge-success',
  closed:    'badge-neutral',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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

  // ── Seller data ──────────────────────────────────────────────
  let brand: DbBrand | null = null
  let products: DbProduct[] = []
  let incomingRfqs: (DbRfq & { profiles: { full_name: string; email: string } | null })[] = []

  if (isSeller) {
    const { data: brandData } = await supabase
      .from('brands')
      .select('*')
      .eq('owner_id', user.id)
      .single<DbBrand>()
    brand = brandData

    if (brand) {
      const [productsRes, rfqsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('rfqs')
          .select('*, profiles(full_name, email)')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      products = (productsRes.data || []) as DbProduct[]
      incomingRfqs = (rfqsRes.data || []) as typeof incomingRfqs
    }
  }

  // ── Buyer data ───────────────────────────────────────────────
  let myRfqs: (DbRfq & { brands: { name: string; slug: string } | null })[] = []

  if (!isSeller) {
    const { data: rfqsData } = await supabase
      .from('rfqs')
      .select('*, brands(name, slug)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    myRfqs = (rfqsData || []) as typeof myRfqs
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <nav style={{
        height: 'var(--nav-h)', borderBottom: '1px solid var(--border)',
        background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontFamily: 'var(--font-inter-tight, Inter, sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', flex: 1 }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 800, marginRight: 8, verticalAlign: 'middle' }}>S</span>
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
            <span className={`badge ${isSeller ? 'badge-verified' : 'badge-neutral'}`}>
              {isSeller ? 'Seller' : 'Buyer'}
            </span>
            <span className="text-muted" style={{ fontSize: 14 }}>{user.email}</span>
          </div>
        </div>

        {/* ── SELLER VIEW ── */}
        {isSeller && (
          <>
            {/* No brand yet */}
            {!brand && (
              <div className="card" style={{ padding: 28, background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)', marginBottom: 32 }}>
                <div className="flex items-center gap-4 flex-wrap">
                  <div style={{ flex: 1 }}>
                    <div className="font-display font-bold" style={{ fontSize: 18, marginBottom: 6 }}>Complete your seller profile</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>Set up your brand page to start appearing in search results.</div>
                  </div>
                  <Link href="/onboarding/brand" className="btn btn-primary">Set up brand</Link>
                </div>
              </div>
            )}

            {/* Brand summary */}
            {brand && (
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="uppercase-label mb-1">Your brand</div>
                    <h2 className="font-display font-bold" style={{ fontSize: 20, margin: 0 }}>{brand.name}</h2>
                    <div className="text-sm" style={{ color: 'var(--muted)', marginTop: 2 }}>
                      {brand.is_verified ? '✓ Verified' : 'Pending verification'} · {brand.categories.join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/brands/${brand.slug}`} className="btn btn-secondary btn-sm" target="_blank">View page</Link>
                    <Link href="/onboarding/brand" className="btn btn-ghost btn-sm">Edit brand</Link>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  {[
                    { l: 'Products',        v: String(products.length) },
                    { l: 'Active products', v: String(products.filter(p => p.is_active).length) },
                    { l: 'Incoming RFQs',   v: String(incomingRfqs.length) },
                    { l: 'Pending RFQs',    v: String(incomingRfqs.filter(r => r.status === 'pending').length) },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="uppercase-label mb-1">{s.l}</div>
                      <div className="font-display font-bold text-2xl">{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {brand && (
              <div style={{ marginBottom: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="uppercase-label">Products</div>
                  <Link href="/" className="btn btn-primary btn-sm">+ Add product</Link>
                </div>
                {products.length === 0 ? (
                  <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                    <div className="font-semibold" style={{ marginBottom: 4 }}>No products yet</div>
                    <div className="text-sm">Add your first product to start getting inquiries.</div>
                  </div>
                ) : (
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {products.map((p, i) => {
                      const priceMin = p.price_range_min
                      const priceLabel = priceMin ? `LKR ${Math.round(priceMin).toLocaleString()}` : '—'
                      return (
                        <div key={p.id} style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)' }}>
                            {p.images[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div className="flex-1" style={{ minWidth: 0 }}>
                            <div className="font-display font-semibold truncate">{p.name}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                              <span className="font-mono">{priceLabel}</span>
                              <span className="badge badge-neutral" style={{ fontSize: 10 }}>{p.category}</span>
                              {p.min_order_quantity && <span>MOQ: {p.min_order_quantity}</span>}
                            </div>
                          </div>
                          <Link href={`/products/${p.slug}`} className="btn btn-secondary btn-sm" target="_blank">View</Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Incoming RFQs */}
            {brand && (
              <div>
                <div className="uppercase-label mb-3">Incoming inquiries</div>
                {incomingRfqs.length === 0 ? (
                  <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    <div className="font-semibold" style={{ marginBottom: 4 }}>No inquiries yet</div>
                    <div className="text-sm">Inquiries from buyers will appear here.</div>
                  </div>
                ) : (
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {incomingRfqs.map((rfq, i) => (
                      <div key={rfq.id} style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-display font-semibold truncate">{rfq.subject}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)', marginTop: 2 }}>
                              From {rfq.profiles?.full_name || rfq.profiles?.email || 'a buyer'} · {formatDate(rfq.created_at)}
                            </div>
                            {rfq.quantity && (
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>Qty: {rfq.quantity} {rfq.unit || 'units'}</div>
                            )}
                          </div>
                          <span className={`badge ${STATUS_VARIANTS[rfq.status] || 'badge-neutral'}`}>
                            {STATUS_LABELS[rfq.status] || rfq.status}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--ink2)', marginTop: 8, lineHeight: 1.5 }}>{rfq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── BUYER VIEW ── */}
        {!isSeller && (
          <>
            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { href: '/',      icon: '🏪', label: 'Marketplace',  sub: 'Browse suppliers & products' },
                { href: '/#rfqs', icon: '📋', label: 'Post an RFQ',  sub: 'Request bids from suppliers' },
                { href: '/',      icon: '💬', label: 'Inbox',        sub: 'Your messages' },
                { href: '/',      icon: '⚙️', label: 'Profile',      sub: 'Account settings' },
              ].map(item => (
                <Link key={item.href + item.label} href={item.href} className="card card-hover" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{item.icon}</div>
                  <div>
                    <div className="font-display font-semibold">{item.label}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{item.sub}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { l: 'RFQs sent',   v: String(myRfqs.length) },
                { l: 'Responses',   v: String(myRfqs.filter(r => r.status === 'responded').length) },
                { l: 'Pending',     v: String(myRfqs.filter(r => r.status === 'pending').length) },
                { l: 'Closed',      v: String(myRfqs.filter(r => r.status === 'closed').length) },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div className="uppercase-label mb-1">{s.l}</div>
                  <div className="font-display font-bold text-2xl">{s.v}</div>
                </div>
              ))}
            </div>

            {/* My RFQs */}
            <div>
              <div className="uppercase-label mb-3">Your RFQs</div>
              {myRfqs.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div className="font-semibold" style={{ marginBottom: 4 }}>No RFQs yet</div>
                  <div className="text-sm" style={{ marginBottom: 16 }}>Post an RFQ to receive bids from verified suppliers.</div>
                  <Link href="/" className="btn btn-primary">Browse suppliers</Link>
                </div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  {myRfqs.map((rfq, i) => (
                    <div key={rfq.id} style={{ padding: 20, borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="font-display font-semibold">{rfq.subject}</div>
                          {rfq.brands && (
                            <div className="text-xs" style={{ color: 'var(--muted)', marginTop: 2 }}>
                              To: <Link href={`/brands/${rfq.brands.slug}`} style={{ color: 'var(--primary)' }}>{rfq.brands.name}</Link>
                            </div>
                          )}
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(rfq.created_at)}</div>
                        </div>
                        <span className={`badge ${STATUS_VARIANTS[rfq.status] || 'badge-neutral'}`}>
                          {STATUS_LABELS[rfq.status] || rfq.status}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--ink2)', marginTop: 8, lineHeight: 1.5 }}>{rfq.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Account info */}
        <div className="card" style={{ padding: 24, marginTop: 32 }}>
          <div className="uppercase-label mb-3">Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Email', value: user.email },
              { label: 'Role',  value: profile?.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : '—' },
              { label: 'User ID', value: user.id, mono: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted" style={{ fontSize: 14 }}>{row.label}</span>
                <span className={row.mono ? 'font-mono' : 'font-display font-semibold'} style={{ fontSize: 14, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
