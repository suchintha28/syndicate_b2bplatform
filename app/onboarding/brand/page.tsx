'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/supabase/queries'
import { INDUSTRIES } from '@/lib/data'

export default function BrandOnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    category: 'Manufacturing',
    description: '',
    website: '',
    city: '',
    logoUrl: '',
  })
  const [prefillLoading, setPrefillLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [userId, setUserId] = useState('')
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  // Pre-fill business name + industry from sign-up data
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setPrefillLoading(false); return }
      setUserId(user.id)

      // Prefer profiles table; fall back to auth user_metadata
      supabase.from('profiles')
        .select('business_name, business_industry')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          const name     = profile?.business_name     || (user.user_metadata?.business_name as string | undefined) || ''
          const industry = profile?.business_industry || (user.user_metadata?.industry       as string | undefined) || 'Manufacturing'
          // Only pre-fill if the field is in the INDUSTRIES list (skip 'Other')
          const safeIndustry = INDUSTRIES.filter(i => i !== 'Other').includes(industry) ? industry : 'Manufacturing'
          setForm(prev => ({ ...prev, name, category: safeIndustry }))
          setPrefillLoading(false)
        })
    })
  }, [])

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please use a JPG, PNG, or WebP image.')
      return
    }
    setUploadingLogo(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      setForm(prev => ({ ...prev, logoUrl: data.publicUrl }))
    }
    setUploadingLogo(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Generate a unique slug from the brand name
      const baseSlug = generateSlug(form.name)
      const uniqueSuffix = Math.random().toString(36).slice(2, 6)
      const slug = `${baseSlug}-${uniqueSuffix}`

      const { error: insertError } = await supabase.from('brands').insert({
        owner_id:    user.id,
        name:        form.name,
        slug,
        categories:  [form.category],
        description: form.description,
        website:     form.website || null,
        city:        form.city || null,
        logo_url:    form.logoUrl || null,
        is_verified: false,
        is_active:   true,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A brand with this name already exists. Try a slightly different name.')
        } else {
          setError(insertError.message)
        }
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-inter-tight, "Inter Tight", Inter, sans-serif)' }}>S</div>
          <div className="uppercase-label mb-2">Step 1 of 1</div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Set up your brand</h1>
          <p className="text-muted" style={{ fontSize: 15 }}>This is your public business profile on Syndicate. You can update it any time.</p>
        </div>

        <div className="card" style={{ padding: 32, opacity: prefillLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <form onSubmit={handleSubmit}>
            {/* Logo upload */}
            <div className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: form.logoUrl ? 'transparent' : 'var(--primary-soft)',
                  border: '2px dashed var(--border-strong)',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                  position: 'relative',
                }}
                onClick={() => logoInputRef.current?.click()}
              >
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : uploadingLogo
                    ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                }
              </div>
              <div>
                <div className="font-display font-semibold" style={{ fontSize: 14, marginBottom: 2 }}>Brand logo</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {form.logoUrl ? 'Click to change · ' : ''}JPG, PNG or WebP · max 2 MB
                </div>
                {!form.logoUrl && (
                  <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}
                    onClick={() => logoInputRef.current?.click()}>
                    Upload logo
                  </button>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }} onChange={handleLogoFile} />
            </div>

            <div className="mb-4">
              <label className="field-label">Business name</label>
              <input className="field" type="text" placeholder="Acme Industries Ltd." value={form.name} onChange={upd('name')} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="mb-4">
              <div>
                <label className="field-label">Industry</label>
                <select className="field" value={form.category} onChange={upd('category')}>
                  {INDUSTRIES.filter(i => i !== 'Other').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">City <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                <input className="field" type="text" placeholder="Colombo" value={form.city} onChange={upd('city')} />
              </div>
            </div>

            <div className="mb-4">
              <label className="field-label">Description</label>
              <textarea className="field" rows={4}
                placeholder="Describe what your business does, who you serve, and what makes you different…"
                value={form.description} onChange={upd('description')} required style={{ resize: 'vertical' }} />
            </div>

            <div className="mb-5">
              <label className="field-label">Website <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
              <input className="field" type="url" placeholder="https://yourcompany.com" value={form.website} onChange={upd('website')} />
            </div>

            {error && (
              <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating brand…' : 'Create brand'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
