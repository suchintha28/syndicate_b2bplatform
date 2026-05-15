'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, SkeletonCard } from '@/components/ui'
import { type UserProfile, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { StatusPill, fmtDate, DeleteAccountModal } from './_shared'

export function ProfileScreen({ goTo, isProMember, userProfile, onSignOut, onDeleteAccount, userId, savedCount = 0 }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  isProMember: boolean
  userProfile: UserProfile
  onSignOut?: () => void
  onDeleteAccount?: (password: string) => Promise<string | null>
  userId?: string
  savedCount?: number
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dashLoading, setDashLoading]         = useState(true)
  const [products,    setProducts]            = useState<{ id: string; name: string; category: string; is_active: boolean; price_range_min: number | null; images: string[]; slug: string }[]>([])
  const [rfqs,        setRfqs]               = useState<{ id: string; subject: string; message: string; quantity: number | null; unit: string | null; status: string; created_at: string; profiles?: { full_name: string; email: string } | null; brands?: { name: string; slug: string } | null }[]>([])
  const [bidsReceived, setBidsReceived] = useState(0)

  const isSeller = userProfile.role === 'seller'
  const hasBrand = !!userProfile.brandId

  // Live dashboard data
  useEffect(() => {
    if (!userId) { setDashLoading(false); return }
    const supabase = createClient()

    async function load() {
      if (isSeller && userProfile.brandId) {
        const [pRes, rRes] = await Promise.all([
          supabase.from('products')
            .select('id, name, category, is_active, price_range_min, images, slug')
            .eq('brand_id', userProfile.brandId!).order('created_at', { ascending: false }).limit(5),
          supabase.from('rfqs')
            .select('id, subject, message, quantity, unit, status, created_at, profiles(full_name, email)')
            .eq('brand_id', userProfile.brandId!).order('created_at', { ascending: false }).limit(5),
        ])
        setProducts((pRes.data || []) as typeof products)
        setRfqs((rRes.data || []) as unknown as typeof rfqs)
      } else if (!isSeller) {
        const { data } = await supabase.from('rfqs')
          .select('id, subject, message, quantity, unit, status, created_at, brands(name, slug)')
          .eq('buyer_id', userId!).order('created_at', { ascending: false }).limit(5)
        setRfqs((data || []) as unknown as typeof rfqs)
        // Count bids received on buyer's public RFQs
        const rfqIds = (data || []).map((r: { id: string }) => r.id)
        if (rfqIds.length > 0) {
          const { count } = await supabase.from('rfq_bids')
            .select('id', { count: 'exact', head: true })
            .in('rfq_id', rfqIds)
          setBidsReceived(count ?? 0)
        }
      }
      setDashLoading(false)
    }
    load()
  }, [userId, isSeller, userProfile.brandId])

  async function handleDeleteConfirm(password: string): Promise<string | null> {
    if (!onDeleteAccount) return 'Delete not available.'
    const err = await onDeleteAccount(password)
    if (!err) setShowDeleteModal(false)
    return err
  }

  // Derived stats
  const totalProducts  = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const totalRfqs      = rfqs.length
  const pendingRfqs    = rfqs.filter(r => r.status === 'pending').length
  const respondedRfqs  = rfqs.filter(r => r.status === 'responded').length

  return (
    <>
    {showDeleteModal && (
      <DeleteAccountModal onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteModal(false)} />
    )}

    <div className="container fade-up" style={{ maxWidth: 780, paddingBottom: 80 }}>

      {/* ── Identity header ─────────────────── */}
      <div className="card" style={{ padding: 28, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="flex items-start gap-4 flex-wrap" style={{ marginBottom: 20 }}>
            <Avatar src={userProfile.avatarUrl} initials={userProfile.logo} size="xl" />
            <div className="flex-1" style={{ minWidth: 200 }}>
              <h2 className="font-display font-bold" style={{ fontSize: 22, margin: '0 0 2px' }}>
                {userProfile.fullName || 'My Account'}
              </h2>
              {(userProfile.businessName || userProfile.businessIndustry) && (
                <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
                  {[userProfile.businessName, userProfile.businessIndustry].filter(Boolean).join(' · ')}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isProMember ? 'pro' : 'neutral'} icon={isProMember ? 'sparkle' : undefined}>
                  {isProMember ? 'Pro Member' : 'Free Plan'}
                </Badge>
                {isSeller && <Badge variant="verified" icon="check">Seller</Badge>}
                {!isSeller && <Badge variant="neutral">Buyer</Badge>}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {isSeller && hasBrand && <>
              <Button variant="primary"   size="sm" icon="plus"    onClick={() => goTo('add-product')}>Add product</Button>
              <Button variant="secondary" size="sm" icon="compass" onClick={() => window.open(`/brands/${userProfile.brandSlug}`, '_blank')}>View brand page</Button>
              <Button variant="secondary" size="sm" icon="edit"    onClick={() => goTo('manage-profile')}>Edit profile</Button>
            </>}
            {isSeller && !hasBrand && (
              <Button variant="primary" size="sm" icon="arrow-right" onClick={() => { window.location.href = '/onboarding/brand' }}>
                Set up brand profile
              </Button>
            )}
            {!isSeller && <>
              <Button variant="primary"   size="sm" icon="compass" onClick={() => goTo('listing')}>Browse suppliers</Button>
              <Button variant="secondary" size="sm" icon="file"    onClick={() => goTo('rfq-create')}>Post an RFQ</Button>
              <Button variant="secondary" size="sm" icon="heart"   onClick={() => goTo('saved')}>Saved ({savedCount})</Button>
            </>}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────── */}
      {dashLoading ? (
        <SkeletonCard height={80} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {isSeller && hasBrand && [
            { l: 'Products',       v: totalProducts },
            { l: 'Active',         v: activeProducts },
            { l: 'Incoming RFQs',  v: totalRfqs },
            { l: 'Pending',        v: pendingRfqs },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div className="uppercase-label mb-1" style={{ fontSize: 10 }}>{s.l}</div>
              <div className="font-display font-bold" style={{ fontSize: 22 }}>{s.v}</div>
            </div>
          ))}
          {!isSeller && [
            { l: 'RFQs sent',      v: totalRfqs },
            { l: 'Bids received',  v: bidsReceived },
            { l: 'Responded',      v: respondedRfqs },
            { l: 'Saved',          v: savedCount },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '14px 18px' }}>
              <div className="uppercase-label mb-1" style={{ fontSize: 10 }}>{s.l}</div>
              <div className="font-display font-bold" style={{ fontSize: 22 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── List your business CTA (no brand yet) ── */}
      {!hasBrand && (
        <div className="card" style={{ padding: 24, marginBottom: 20, background: 'var(--ink)', color: 'white', borderColor: 'transparent' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="font-display font-bold" style={{ fontSize: 16, marginBottom: 4 }}>List your business on the marketplace</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                Create a brand profile to showcase your products and receive inquiries from buyers.
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { window.location.href = '/onboarding/brand' }}
            >
              Get listed
            </button>
          </div>
        </div>
      )}

      {/* ── Seller: no brand prompt ─────────── */}
      {isSeller && !hasBrand && (
        <div className="card" style={{ padding: 24, marginBottom: 20, background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' }}>
          <div className="font-display font-bold" style={{ fontSize: 16, marginBottom: 6 }}>Complete your seller profile</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 16 }}>
            Create your brand page to start appearing in marketplace search results and receive buyer inquiries.
          </div>
          <Button variant="primary" size="sm" onClick={() => { window.location.href = '/onboarding/brand' }}>
            Create brand profile →
          </Button>
        </div>
      )}

      {/* ── Seller: products ───────────────── */}
      {isSeller && hasBrand && (
        <div style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="uppercase-label">Products</div>
            <Button variant="primary" size="sm" icon="plus" onClick={() => goTo('add-product')}>Add product</Button>
          </div>
          {dashLoading ? <SkeletonCard height={120} /> : products.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div className="text-muted text-sm mb-3">No products yet. Add your first product to start receiving inquiries.</div>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => goTo('add-product')}>Add first product</Button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {products.map((p, i) => (
                <div key={p.id} style={{ padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)' }}>
                    {p.images[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="font-semibold truncate" style={{ fontSize: 14 }}>{p.name}</div>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                      {p.price_range_min && <span className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>LKR {Math.round(p.price_range_min).toLocaleString()}</span>}
                      <span style={{ fontSize: 11, color: p.is_active ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>{p.is_active ? '● Active' : '○ Inactive'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/products/${p.slug}`, '_blank')}>View</Button>
                </div>
              ))}
              {totalProducts > 5 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <button onClick={() => goTo('manage-products')} className="text-sm" style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all {totalProducts} products →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RFQs section ───────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase-label">{isSeller ? 'Incoming inquiries' : 'My RFQs'}</div>
          <button onClick={() => goTo('rfqs')} className="text-sm" style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            View all →
          </button>
        </div>
        {dashLoading ? <SkeletonCard height={140} /> : rfqs.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <div className="text-muted text-sm mb-3">
              {isSeller ? 'No inquiries yet. They will appear here when buyers contact you.' : 'No RFQs yet. Post one to start receiving bids from suppliers.'}
            </div>
            {!isSeller && <Button variant="secondary" size="sm" icon="file" onClick={() => goTo('rfq-create')}>Post an RFQ</Button>}
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {rfqs.map((r, i) => (
              <button key={r.id}
                onClick={() => goTo('rfq-detail', { rfqId: r.id })}
                style={{ width: '100%', textAlign: 'left', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semibold truncate" style={{ fontSize: 14 }}>{r.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {isSeller
                        ? `From ${r.profiles?.full_name || r.profiles?.email || 'a buyer'}`
                        : r.brands?.name ? `To ${r.brands.name}` : ''
                      }
                      {' · '}{fmtDate(r.created_at)}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.message}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Pro upsell (sellers only) ───────── */}
      {!isProMember && isSeller && hasBrand && (
        <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-md)', padding: 20, color: 'white', marginBottom: 20 }}>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={18} stroke="white" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold">Unlock Pro</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Unlimited products, RFQ marketplace access, analytics and more.</div>
            </div>
          </div>
          <Button variant="primary" block onClick={() => goTo('subscription')}>Upgrade to Pro</Button>
        </div>
      )}

      {/* ── Manage ─────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div className="uppercase-label mb-3">Manage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Edit profile',     sub: isSeller ? 'Personal info, business details' : 'Your name, email, contact details', screen: 'manage-profile' as Screen, icon: 'briefcase', show: true },
            { label: 'Products',         sub: `Manage your product listings`, screen: 'manage-products' as Screen, icon: 'box', show: isSeller },
            { label: 'Subscription',     sub: isProMember ? 'Pro plan · manage billing' : 'Upgrade to Pro', screen: 'subscription' as Screen, icon: 'sparkle', show: true },
            { label: 'Settings',         sub: 'Notifications, privacy, preferences', screen: 'settings' as Screen, icon: 'sliders', show: true },
          ].filter(item => item.show).map(item => (
            <button key={item.screen} className="card card-hover"
              onClick={() => goTo(item.screen)}
              style={{ padding: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
                <Icon name={item.icon} size={17} />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold" style={{ fontSize: 14 }}>{item.label}</div>
                <div className="text-xs text-muted">{item.sub}</div>
              </div>
              <Icon name="chevron-right" size={15} stroke="var(--muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sign out ────────────────────────── */}
      {onSignOut && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onSignOut} className="card card-hover"
            style={{ width: '100%', padding: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="log-out" size={17} stroke="var(--danger)" />
            </div>
            <span className="font-display font-semibold" style={{ color: 'var(--danger)', fontSize: 14 }}>Sign out</span>
          </button>
        </div>
      )}

      {/* ── Danger zone ─────────────────────── */}
      {onDeleteAccount && (
        <div style={{ marginTop: 32 }}>
          <div className="uppercase-label mb-3" style={{ color: 'var(--danger)' }}>Danger zone</div>
          <div className="card" style={{ padding: 20, border: '1px solid rgba(185,28,28,0.25)', background: 'var(--danger-soft)' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1" style={{ minWidth: 200 }}>
                <div className="font-display font-semibold" style={{ marginBottom: 4 }}>Delete account</div>
                <div className="text-xs text-muted">Permanently removes your account, brand, products, and all data. Cannot be undone.</div>
              </div>
              <button onClick={() => setShowDeleteModal(true)}
                style={{ padding: '8px 16px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(185,28,28,0.4)', background: 'white', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
