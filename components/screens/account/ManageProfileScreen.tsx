'use client'

import React, { useState, useEffect } from 'react'
import { Button, Field, TextArea, PageHeader, BackLink } from '@/components/ui'
import { CATEGORIES, type UserProfile, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { ImageUploadCircle, ProLock } from './_shared'

export function ManageProfileScreen({ goTo, userProfile, onSave, isProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  userProfile: UserProfile
  onSave?: (p: UserProfile) => Promise<string | null>
  isProMember: boolean
}) {
  const [form, setForm] = useState<UserProfile>({ ...userProfile })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isSeller = form.role === 'seller'
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id))
  }, [])

  const upd = (k: keyof UserProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    if (isSeller && !form.businessName.trim()) { setError('Business name is required for seller accounts.'); return }
    if (!onSave) { goTo('profile'); return }
    setSaving(true)
    const err = await onSave(form)
    setSaving(false)
    if (err) { setError(err); return }
    goTo('profile')
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader title="Edit profile" sub="Keep your information up to date." />

      <form onSubmit={handleSubmit}>

        {/* ── Personal information ───────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center gap-3 mb-4">
            <ImageUploadCircle
              src={form.avatarUrl}
              initials={form.logo}
              size="lg"
              bucket="avatars"
              userId={userId}
              onUploaded={url => setForm(prev => ({ ...prev, avatarUrl: url }))}
              label="Upload profile photo"
            />
            <div>
              <h3 className="font-display font-bold text-lg">Personal information</h3>
              <div className="text-xs text-muted">Click the avatar to upload a photo</div>
            </div>
          </div>
          <Field
            label="Full name"
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={upd('fullName')}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Email</label>
              <input
                className="field"
                type="email"
                value={form.email}
                readOnly
                style={{ background: 'var(--bg-alt)', cursor: 'not-allowed', color: 'var(--muted)' }}
              />
              <div className="text-xs text-muted mt-1">Email cannot be changed here</div>
            </div>
            <Field label="Phone" type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={upd('phone')} />
          </div>
        </div>

        {/* ── Business information ───────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-start gap-4 mb-4 flex-wrap">
            <ImageUploadCircle
              src={form.logoUrl}
              initials={form.logo || form.businessName?.slice(0, 2).toUpperCase() || '?'}
              size="lg"
              bucket="logos"
              userId={userId}
              onUploaded={url => setForm(prev => ({ ...prev, logoUrl: url }))}
              label="Upload business logo"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-display font-bold text-lg">Business information</h3>
                  <div className="text-xs text-muted">
                    {isSeller
                      ? 'Click the logo to upload · visible on the marketplace'
                      : 'Optional — add if you represent a company'}
                  </div>
                </div>
                {!isSeller && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'var(--bg-alt)', borderRadius: 'var(--r-xs)', padding: '3px 8px', border: '1px solid var(--border)' }}>
                    Optional
                  </span>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Business name"
            placeholder="Acme Industries Ltd."
            value={form.businessName}
            onChange={upd('businessName')}
            required={isSeller}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Industry</label>
              <select className="field" value={form.businessIndustry} onChange={upd('businessIndustry')}>
                <option value="">Select industry…</option>
                {CATEGORIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field label="Business phone" type="tel" placeholder="+94 11 000 0000" value={form.businessPhone} onChange={upd('businessPhone')} />
          </div>

          <Field label="Business website" type="url" placeholder="https://yourcompany.com" value={form.businessWebsite} onChange={upd('businessWebsite')} />

          {isSeller && (
            <TextArea
              label="Business description"
              placeholder="Describe what your business does, who you serve, and what makes you different…"
              value={form.description}
              onChange={upd('description')}
              rows={5}
            />
          )}
        </div>

        {/* ── Profile banner (Pro) ────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Profile banner</label>
          {isProMember ? (
            <div>
              <div style={{ height: 100, borderRadius: 'var(--r-sm)', background: form.bannerColor, display: 'grid', placeItems: 'center', color: 'white', marginBottom: 12, fontWeight: 600 }}>
                Banner preview
              </div>
              <input type="color" value={form.bannerColor}
                onChange={(e) => setForm(prev => ({ ...prev, bannerColor: e.target.value }))}
                style={{ width: '100%', height: 40, borderRadius: 'var(--r-xs)' }} />
            </div>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Profile banner customization is a Pro feature." />
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('profile')} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
