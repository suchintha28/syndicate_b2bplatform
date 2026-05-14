'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, Avatar, Field, TextArea, PageHeader, BackLink } from '@/components/ui'
import { PRODUCTS, CATEGORIES, MY_RFQS, PLANS, type UserProfile, type Product, type Screen } from '@/lib/data'

/* ── ProLock ────────────────────────────────── */
function ProLock({ onUpgrade, label }: { onUpgrade: () => void; label: string }) {
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
function DeleteAccountModal({
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

/* ── ProfileScreen ──────────────────────────── */
export function ProfileScreen({ goTo, isProMember, userProfile, onSignOut, onDeleteAccount }: {
  goTo: (s: Screen) => void
  isProMember: boolean
  userProfile: UserProfile
  onSignOut?: () => void
  onDeleteAccount?: (password: string) => Promise<string | null>
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleDeleteConfirm(password: string): Promise<string | null> {
    if (!onDeleteAccount) return 'Delete not available.'
    const err = await onDeleteAccount(password)
    if (!err) setShowDeleteModal(false)
    return err
  }

  return (
    <>
    {showDeleteModal && (
      <DeleteAccountModal
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    )}
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <PageHeader eyebrow="Account" title={userProfile.role === 'seller' ? 'Your business' : 'Your account'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="profile-grid">
        <div>
          {/* Identity card */}
          <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 240, height: 240, background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)', opacity: 0.7 }} />
            <div style={{ position: 'relative' }}>
              <div className="flex items-start gap-4 mb-6 flex-wrap">
                <Avatar initials={userProfile.logo} size="xl" />
                <div className="flex-1" style={{ minWidth: 220 }}>
                  <h2 className="font-display font-bold text-2xl mb-1">
                    {userProfile.businessName || userProfile.fullName || 'My Account'}
                  </h2>
                  {userProfile.category && (
                    <div className="text-muted mb-3">{userProfile.category}</div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={isProMember ? 'pro' : 'neutral'} icon={isProMember ? 'sparkle' : undefined}>
                      {isProMember ? 'Pro Member' : 'Free Plan'}
                    </Badge>
                    {userProfile.role === 'seller' && (
                      <Badge variant="verified" icon="check">Seller</Badge>
                    )}
                    {userProfile.role === 'buyer' && (
                      <Badge variant="neutral">Buyer</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller: prompt to set up brand if none exists */}
              {userProfile.role === 'seller' && !userProfile.businessName && (
                <div style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)', borderRadius: 'var(--r-md)', padding: 20, marginBottom: 20 }}>
                  <div className="font-display font-semibold mb-1">Set up your brand profile</div>
                  <div className="text-sm text-muted mb-3">Create your brand listing so buyers can find you on the marketplace.</div>
                  <Button variant="primary" size="sm" icon="arrow-right" onClick={() => { window.location.href = '/onboarding/brand' }}>
                    Create brand profile
                  </Button>
                </div>
              )}

              {userProfile.role === 'seller' && userProfile.businessName && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 16, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                  {[
                    { l: 'Products',      v: PRODUCTS.length },
                    { l: 'Open RFQs',     v: MY_RFQS.filter(r => r.status === 'Open').length },
                    { l: 'Profile views', v: '—' },
                    { l: 'Conversion',    v: '—' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="uppercase-label mb-1">{s.l}</div>
                      <div className="font-display font-bold text-xl">{s.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {userProfile.role === 'buyer' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 16, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                  {[
                    { l: 'RFQs sent',   v: MY_RFQS.length },
                    { l: 'Responses',   v: '—' },
                    { l: 'Saved brands', v: '—' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="uppercase-label mb-1">{s.l}</div>
                      <div className="font-display font-bold text-xl">{s.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {!isProMember && userProfile.role === 'seller' && (
                <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-md)', padding: 20, color: 'white' }}>
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="sparkle" size={18} stroke="white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-bold">Unlock Pro</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Unlimited products, RFQ access, direct sales, and more.</div>
                    </div>
                  </div>
                  <Button variant="primary" block onClick={() => goTo('subscription')}>Upgrade to Pro</Button>
                </div>
              )}
            </div>
          </div>

          {/* Manage list */}
          <div style={{ marginTop: 24 }}>
            <div className="uppercase-label mb-3">Manage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Edit profile', sub: userProfile.role === 'seller' ? 'Business info, contact details, custom pages' : 'Your name, email, contact details', screen: 'manage-profile' as Screen, icon: 'briefcase', show: true },
                { label: 'Products',     sub: `${PRODUCTS.length} products · ${PRODUCTS.filter(p => p.status === 'Active').length} active`, screen: 'manage-products' as Screen, icon: 'box', show: userProfile.role === 'seller' },
                { label: 'Settings',     sub: 'Notifications, privacy, app preferences', screen: 'settings' as Screen, icon: 'sliders', show: true },
              ].filter(item => item.show).map(item => (
                <button key={item.screen} className="card card-hover"
                  onClick={() => goTo(item.screen)}
                  style={{ padding: 18, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold">{item.label}</div>
                    <div className="text-xs text-muted">{item.sub}</div>
                  </div>
                  <Icon name="chevron-right" size={16} stroke="var(--muted)" />
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          {onSignOut && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={onSignOut}
                className="card card-hover"
                style={{ width: '100%', padding: 18, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="log-out" size={18} stroke="var(--danger)" />
                </div>
                <span className="font-display font-semibold" style={{ color: 'var(--danger)' }}>Sign out</span>
              </button>
            </div>
          )}

          {/* Danger zone */}
          {onDeleteAccount && (
            <div style={{ marginTop: 32 }}>
              <div className="uppercase-label mb-3" style={{ color: 'var(--danger)' }}>Danger zone</div>
              <div className="card" style={{ padding: 20, border: '1px solid rgba(185,28,28,0.25)', background: 'var(--danger-soft)' }}>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1" style={{ minWidth: 200 }}>
                    <div className="font-display font-semibold" style={{ marginBottom: 4 }}>Delete account</div>
                    <div className="text-xs text-muted">Permanently removes your account, brand, products, and all associated data. This action cannot be reversed.</div>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      padding: '8px 16px', borderRadius: 'var(--r-sm)',
                      border: '1px solid rgba(185,28,28,0.4)', background: 'white',
                      color: 'var(--danger)', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
                    }}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity */}
        <div>
          <div className="uppercase-label mb-3">Recent activity</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { icon: 'message',  label: 'New message from TechMakers Inc.',            time: '2h ago' },
              { icon: 'file',     label: 'RFQ "Packaging Materials" got 2 new responses', time: '1d ago' },
              { icon: 'trending', label: 'Smart Sensor Pro reached 50 views',           time: '2d ago' },
              { icon: 'heart',    label: 'Your profile was saved by 3 buyers',          time: '3d ago' },
            ].map((a, i, arr) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: 16, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r-xs)', background: 'var(--primary-soft)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={a.icon} size={14} stroke="var(--primary)" />
                </div>
                <div className="flex-1 text-sm">{a.label}</div>
                <span className="font-mono text-xs text-muted">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

/* ── ManageProfileScreen ────────────────────── */
export function ManageProfileScreen({ goTo, userProfile, setUserProfile, isProMember }: {
  goTo: (s: Screen) => void
  userProfile: UserProfile
  setUserProfile: (p: UserProfile) => void
  isProMember: boolean
}) {
  const upd = (k: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setUserProfile({ ...userProfile, [k]: e.target.value })

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Edit profile" sub="Keep your business info up to date so buyers can find you." />

      <form onSubmit={(e) => { e.preventDefault(); goTo('profile') }}>
        {/* Banner */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <label className="field-label">Profile banner</label>
          {isProMember ? (
            <div>
              <div style={{ height: 120, borderRadius: 'var(--r-sm)', background: userProfile.bannerColor, display: 'grid', placeItems: 'center', color: 'white', marginBottom: 12, fontWeight: 600 }}>
                Banner preview
              </div>
              <input type="color" value={userProfile.bannerColor}
                onChange={(e) => setUserProfile({ ...userProfile, bannerColor: e.target.value })}
                style={{ width: '100%', height: 40, borderRadius: 'var(--r-xs)' }} />
            </div>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Profile banner customization is a Pro feature." />
          )}
        </div>

        {/* Logo */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <label className="field-label">Business logo</label>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar initials={userProfile.logo} size="xl" />
            <div className="flex-1" style={{ minWidth: 180 }}>
              <input className="field" type="text"
                value={userProfile.logo}
                onChange={(e) => setUserProfile({ ...userProfile, logo: e.target.value.slice(0, 2).toUpperCase() })}
                maxLength={2} placeholder="MB" />
              <div className="text-xs text-muted mt-1">Two letters · later you can upload an image</div>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Business info</h3>
          <Field label="Business name" value={userProfile.businessName} onChange={upd('businessName')} required />
          <div className="mb-4">
            <label className="field-label">Category</label>
            <select className="field" value={userProfile.category} onChange={upd('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <TextArea label="Description" value={userProfile.description} onChange={upd('description')} required rows={5} />
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Contact</h3>
          <Field label="Email" type="email" value={userProfile.email} onChange={upd('email')} required />
          <Field label="Phone" type="tel" value={userProfile.phone} onChange={upd('phone')} required />
          <Field label="Website" type="text" value={userProfile.website} onChange={upd('website')} />
        </div>

        {/* Custom pages */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Custom pages</label>
          {isProMember ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex items-center justify-between" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
                <div>
                  <div className="font-medium">About Us</div>
                  <div className="text-xs text-muted">Last updated 2 weeks ago</div>
                </div>
                <Button variant="secondary" size="sm" icon="edit">Edit</Button>
              </div>
              <Button variant="secondary" size="sm" icon="plus" block>Add custom page</Button>
            </div>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Add About Us, FAQ, and other custom pages with Pro." />
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('profile')}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check">Save changes</Button>
        </div>
      </form>
    </div>
  )
}

/* ── ManageProductsScreen ───────────────────── */
export function ManageProductsScreen({ goTo, setEditingProduct }: {
  goTo: (s: Screen) => void
  setEditingProduct: (p: Product | null) => void
}) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader
        title="Products"
        sub={`${PRODUCTS.length} total · ${PRODUCTS.filter(p => p.status === 'Active').length} active`}
        action={<Button variant="primary" icon="plus" onClick={() => goTo('add-product')}>Add product</Button>}
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        {PRODUCTS.map((p, i) => (
          <div key={p.id} style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)' }}>
              <img src={p.image} alt="" className="img-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/p${p.id}/120/120` }} />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="font-display font-semibold truncate">{p.name}</div>
              <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                <span className="font-mono">{p.price}</span>
                <Badge variant={p.status === 'Active' ? 'success' : 'neutral'}>{p.status}</Badge>
                <span>· {p.sales} sales</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" icon="edit"
                onClick={() => { setEditingProduct(p); goTo('edit-product') }}>Edit</Button>
              <Button variant="ghost" size="sm">Duplicate</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ProductFormScreen ──────────────────────── */
export function ProductFormScreen({ goTo, mode = 'add', editingProduct, isProMember }: {
  goTo: (s: Screen) => void
  mode?: 'add' | 'edit'
  editingProduct?: Product | null
  isProMember: boolean
}) {
  const seed = editingProduct || { name: '', description: '', price: '', variations: [], tieredPricing: [{ min: 1, max: null, price: 0 }], videoUrl: '', directSales: false }
  const [p, setP] = useState({
    name: seed.name || '',
    description: seed.description || '',
    basePrice: '',
    variations: seed.variations || [],
    tieredPricing: (seed as Product).tieredPricing || [{ min: 1, max: null, price: 0 }],
    videoUrl: (seed as Product).videoUrl || '',
    directSales: (seed as Product).directSales || false,
  })

  const setTier = (i: number, key: string, value: string | number | null) => {
    const arr = [...p.tieredPricing]
    arr[i] = { ...arr[i], [key]: value }
    setP({ ...p, tieredPricing: arr })
  }
  const addTier = () => {
    const last = p.tieredPricing[p.tieredPricing.length - 1]
    setP({ ...p, tieredPricing: [...p.tieredPricing, { min: (last.max || last.min) + 1, max: null, price: 0 }] })
  }
  const removeTier = (i: number) => setP({ ...p, tieredPricing: p.tieredPricing.filter((_, idx) => idx !== i) })

  const setVariation = (i: number, key: string, value: string | number) => {
    const arr = [...p.variations]
    arr[i] = { ...arr[i], [key]: value }
    setP({ ...p, variations: arr })
  }
  const addVariation = () => setP({ ...p, variations: [...p.variations, { name: '', price: 0 }] })
  const removeVariation = (i: number) => setP({ ...p, variations: p.variations.filter((_, idx) => idx !== i) })

  return (
    <div className="container fade-up" style={{ maxWidth: 820, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('manage-products')}>Back to products</BackLink>
      <PageHeader
        title={mode === 'add' ? 'Add product' : 'Edit product'}
        sub={mode === 'add' ? 'Create a new product listing for your storefront.' : 'Update product details.'}
      />

      <form onSubmit={(e) => { e.preventDefault(); goTo('manage-products') }}>
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Basics</h3>
          <Field label="Product name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required placeholder="Smart Sensor Pro" />
          <TextArea label="Description" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} required
            placeholder="Tell buyers what this product does, who it's for, and what makes it different." />
          <Field label="Base price (LKR)" type="number" value={p.basePrice} onChange={(e) => setP({ ...p, basePrice: e.target.value })} required placeholder="89500" />
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Media</h3>
          <label className="field-label">Product images</label>
          <div style={{ border: '2px dashed var(--border-strong)', borderRadius: 'var(--r-sm)', padding: 28, textAlign: 'center', background: 'var(--bg-alt)' }}>
            <Icon name="image" size={28} stroke="var(--muted)" />
            <div className="text-sm text-muted mt-2">Drop images here or click to upload</div>
            <div className="text-xs text-muted mt-1 font-mono">JPG, PNG up to 5MB · Add up to 8 images</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="field-label">Product video</label>
            {isProMember
              ? <input className="field" type="url" placeholder="https://youtube.com/..." value={p.videoUrl} onChange={(e) => setP({ ...p, videoUrl: e.target.value })} />
              : <ProLock onUpgrade={() => goTo('subscription')} label="Add a product video to stand out in search results." />
            }
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Tiered pricing</h3>
            <span className="text-xs text-muted">Reward bulk buyers with quantity discounts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.tieredPricing.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label className="field-label text-xs">Min qty</label>
                  <input className="field" type="number" value={t.min || ''} onChange={(e) => setTier(i, 'min', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="field-label text-xs">Max qty</label>
                  <input className="field" type="number" value={t.max || ''} placeholder="∞" onChange={(e) => setTier(i, 'max', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div>
                  <label className="field-label text-xs">Price (LKR)</label>
                  <input className="field" type="number" value={t.price || ''} onChange={(e) => setTier(i, 'price', e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeTier(i)} disabled={i === 0} />
              </div>
            ))}
            <Button variant="secondary" size="sm" icon="plus" type="button" onClick={addTier} block>Add price tier</Button>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Variations</h3>
            <span className="text-xs text-muted">Offer different options at different price points</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.variations.length === 0 && <div className="text-sm text-muted">No variations yet.</div>}
            {p.variations.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label className="field-label text-xs">Name</label>
                  <input className="field" type="text" value={v.name} placeholder="Standard" onChange={(e) => setVariation(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="field-label text-xs">Price (LKR)</label>
                  <input className="field" type="number" value={v.price} onChange={(e) => setVariation(i, 'price', e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeVariation(i)} />
              </div>
            ))}
            <Button variant="secondary" size="sm" icon="plus" type="button" onClick={addVariation} block>Add variation</Button>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Direct sales</label>
          {isProMember ? (
            <label className="flex items-center gap-3" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={p.directSales} onChange={(e) => setP({ ...p, directSales: e.target.checked })} style={{ width: 18, height: 18 }} />
              <div className="flex-1">
                <div className="font-display font-semibold">Enable direct sales</div>
                <div className="text-xs text-muted">Buyers can purchase this product directly through the marketplace.</div>
              </div>
            </label>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Let buyers purchase directly with Pro." />
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('manage-products')}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check">{mode === 'add' ? 'Add product' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  )
}

/* ── SettingsScreen ─────────────────────────── */
export function SettingsScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const groups = [
    { title: 'Account', items: [
      { label: 'Notifications',       sub: 'Email, push, in-app' },
      { label: 'Privacy & security',  sub: 'Password, 2FA, sessions' },
      { label: 'Connected accounts',  sub: 'Google, Slack' },
    ]},
    { title: 'Preferences', items: [
      { label: 'Language', sub: 'English (US)' },
      { label: 'Region',   sub: 'Sri Lanka' },
    ]},
    { title: 'Support', items: [
      { label: 'Help & docs',    sub: 'Browse guides and contact support' },
      { label: 'Terms of service' },
      { label: 'About',          sub: 'Syndicate v2.0' },
    ]},
  ]

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Settings" />

      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div className="uppercase-label mb-3">{g.title}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {g.items.map((it, i) => (
              <button key={i} className="flex items-center gap-3 w-full"
                style={{ padding: 16, textAlign: 'left', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
                <div className="flex-1">
                  <div className="font-display font-semibold">{it.label}</div>
                  {it.sub && <div className="text-xs text-muted">{it.sub}</div>}
                </div>
                <Icon name="chevron-right" size={16} stroke="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── SubscriptionScreen ─────────────────────── */
export function SubscriptionScreen({ goTo, isProMember, setIsProMember }: {
  goTo: (s: Screen) => void
  isProMember: boolean
  setIsProMember: (v: boolean) => void
}) {
  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back</BackLink>
      <PageHeader eyebrow="Plans & pricing" title="Pick the plan that fits" sub="Switch or cancel anytime. Pro unlocks the RFQ marketplace, direct sales, and analytics." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {PLANS.map((plan, i) => {
          const isCurrent = plan.name === 'Free' ? !isProMember : (isProMember && plan.name === 'Monthly Pro')
          const isFeatured = plan.recommended
          return (
            <div key={i} className="card" style={{
              padding: 28,
              borderColor: isFeatured ? 'var(--primary)' : 'var(--border)',
              borderWidth: isFeatured ? 2 : 1,
              position: 'relative',
              overflow: 'visible',
              background: isFeatured ? 'linear-gradient(180deg, var(--primary-soft) 0%, white 60%)' : 'white',
            }}>
              {isFeatured && (
                <span style={{ position: 'absolute', top: -12, right: 24 }}>
                  <Badge variant="pro" icon="sparkle">Best value</Badge>
                </span>
              )}
              <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display font-bold" style={{ fontSize: 40, letterSpacing: '-0.025em' }}>
                  {plan.price === 0 ? 'Free' : `LKR ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="text-muted text-sm">/ {plan.period.split(',')[0]}</span>}
              </div>
              {plan.period.includes(',') && <div className="text-xs text-muted mb-4 font-mono">{plan.period.split(',')[1]}</div>}
              {!plan.period.includes(',') && <div className="text-xs text-muted mb-4">&nbsp;</div>}

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>
                      <Icon name="check" size={15} strokeWidth={2.5} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isFeatured ? 'primary' : (isCurrent ? 'secondary' : 'dark')}
                block
                disabled={isCurrent}
                onClick={() => {
                  if (plan.name !== 'Free') setIsProMember(true)
                  else setIsProMember(false)
                  goTo('success')
                }}
              >
                {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted mt-6 font-mono">
        All plans include a 14-day money-back guarantee · Tax may apply
      </div>
    </div>
  )
}
