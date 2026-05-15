'use client'

import React, { useState, useEffect } from 'react'
import { Button, Field, TextArea, PageHeader, BackLink } from '@/components/ui'
import { CATEGORIES, type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/supabase/queries'
import type { DbProduct } from '@/types/database'
import { ProductImageUploader, ProLock } from './_shared'

export function ProductFormScreen({ goTo, mode = 'add', editingProduct, isProMember }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  mode?: 'add' | 'edit'
  editingProduct?: DbProduct | null
  isProMember: boolean
}) {
  const [brandId, setBrandId]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  // Core form state — maps directly to DB columns
  const [form, setForm] = useState({
    name:        editingProduct?.name        || '',
    category:    editingProduct?.category    || '',
    subcategory: editingProduct?.subcategory || '',
    description: editingProduct?.description || '',
    priceMin:    editingProduct?.price_range_min  != null ? String(editingProduct.price_range_min)  : '',
    priceMax:    editingProduct?.price_range_max  != null ? String(editingProduct.price_range_max)  : '',
    unit:        editingProduct?.unit        || '',
    minOrderQty: editingProduct?.min_order_quantity != null ? String(editingProduct.min_order_quantity) : '',
    tags:        editingProduct?.tags.join(', ') || '',
    images:      editingProduct?.images      || [] as string[],
    // UI-only fields (not yet in DB schema)
    videoUrl:    '',
    directSales: false,
  })

  // Tiered pricing — persisted to products.tiered_pricing (JSONB)
  const [tieredPricing, setTieredPricing] = useState<{ min: number; max: number | null; price: number }[]>(
    editingProduct?.tiered_pricing?.length
      ? editingProduct.tiered_pricing
      : [{ min: 1, max: null, price: 0 }]
  )
  // Variations — persisted to products.variations (JSONB)
  const [variations, setVariations] = useState<{ name: string; price: number }[]>(
    editingProduct?.variations ?? []
  )

  // Specs — persisted to products.product_specs / tech_specs (JSONB)
  const [productSpecs, setProductSpecs] = useState<{ l: string; v: string }[]>(
    editingProduct?.product_specs?.length
      ? editingProduct.product_specs
      : [{ l: 'Brand', v: '' }, { l: 'Model', v: '' }, { l: 'Warranty', v: '' }]
  )
  const [techSpecs, setTechSpecs] = useState<{ l: string; v: string }[]>(
    editingProduct?.tech_specs?.length
      ? editingProduct.tech_specs
      : [{ l: '', v: '' }]
  )
  const setSpec = (group: 'product' | 'tech', i: number, key: 'l' | 'v', val: string) => {
    if (group === 'product') {
      setProductSpecs(prev => { const a = [...prev]; a[i] = { ...a[i], [key]: val }; return a })
    } else {
      setTechSpecs(prev => { const a = [...prev]; a[i] = { ...a[i], [key]: val }; return a })
    }
  }
  const addSpec = (group: 'product' | 'tech') => {
    if (group === 'product') setProductSpecs(prev => [...prev, { l: '', v: '' }])
    else setTechSpecs(prev => [...prev, { l: '', v: '' }])
  }
  const removeSpec = (group: 'product' | 'tech', i: number) => {
    if (group === 'product') setProductSpecs(prev => prev.filter((_, idx) => idx !== i))
    else setTechSpecs(prev => prev.filter((_, idx) => idx !== i))
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('brands').select('id').eq('owner_id', user.id).maybeSingle()
        .then(({ data: brand }) => { if (brand) setBrandId(brand.id) })
    })
  }, [])

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Tiered pricing handlers
  const setTier = (i: number, key: string, value: string | number | null) => {
    const arr = [...tieredPricing]; arr[i] = { ...arr[i], [key]: value }; setTieredPricing(arr)
  }
  const addTier = () => {
    const last = tieredPricing[tieredPricing.length - 1]
    setTieredPricing([...tieredPricing, { min: (last.max || last.min) + 1, max: null, price: 0 }])
  }
  const removeTier = (i: number) => setTieredPricing(tieredPricing.filter((_, idx) => idx !== i))

  // Variation handlers
  const setVariation = (i: number, key: string, value: string | number) => {
    const arr = [...variations]; arr[i] = { ...arr[i], [key]: value }; setVariations(arr)
  }
  const addVariation  = () => setVariations([...variations, { name: '', price: 0 }])
  const removeVariation = (i: number) => setVariations(variations.filter((_, idx) => idx !== i))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim())        { setError('Product name is required.'); return }
    if (!form.category)           { setError('Please select a category.'); return }
    if (!form.description.trim()) { setError('Description is required.'); return }
    if (!brandId)                 { setError('Could not find your brand. Please try again.'); return }

    setSubmitting(true)
    try {
      const supabase   = createClient()
      const tags       = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const priceMin   = parseFloat(form.priceMin)   || null
      const priceMax   = parseFloat(form.priceMax)   || null
      const moq        = parseInt(form.minOrderQty)  || null

      if (mode === 'add') {
        const baseSlug     = generateSlug(form.name)
        const slug         = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
        const { error: err } = await supabase.from('products').insert({
          brand_id:           brandId,
          name:               form.name.trim(),
          slug,
          description:        form.description.trim(),
          images:             form.images,
          category:           form.category,
          subcategory:        form.subcategory.trim() || null,
          min_order_quantity: moq,
          price_range_min:    priceMin,
          price_range_max:    priceMax,
          unit:               form.unit.trim() || null,
          tags,
          tiered_pricing:     tieredPricing,
          variations,
          product_specs:      productSpecs,
          tech_specs:         techSpecs,
          is_active:          true,
        })
        if (err) { setError(err.message); return }
      } else if (editingProduct) {
        const { error: err } = await supabase.from('products').update({
          name:               form.name.trim(),
          description:        form.description.trim(),
          images:             form.images,
          category:           form.category,
          subcategory:        form.subcategory.trim() || null,
          min_order_quantity: moq,
          price_range_min:    priceMin,
          price_range_max:    priceMax,
          unit:               form.unit.trim() || null,
          tags,
          tiered_pricing:     tieredPricing,
          variations,
          product_specs:      productSpecs,
          tech_specs:         techSpecs,
        }).eq('id', editingProduct.id)
        if (err) { setError(err.message); return }
      }

      goTo('manage-products')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container fade-up" style={{ maxWidth: 820, paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('manage-products')}>Back to products</BackLink>
      <PageHeader
        title={mode === 'add' ? 'Add product' : 'Edit product'}
        sub={mode === 'add' ? 'Create a new product listing for your storefront.' : 'Update product details.'}
      />

      <form onSubmit={handleSubmit}>
        {/* ── Basics ──────────────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Basics</h3>

          <Field label="Product name" value={form.name} onChange={upd('name')} required placeholder="Smart Sensor Pro" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="mb-4">
              <label className="field-label">Category <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="field" value={form.category} onChange={upd('category')} required>
                <option value="">Select category…</option>
                {CATEGORIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field label="Subcategory" value={form.subcategory} onChange={upd('subcategory')} placeholder="e.g. IoT Sensors" />
          </div>

          <TextArea label="Description" value={form.description} onChange={upd('description')} required
            placeholder="Tell buyers what this product does, who it's for, and what makes it different." rows={4} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="field-label">Min price (LKR)</label>
              <input className="field" type="number" min="0" step="0.01" placeholder="89500"
                value={form.priceMin} onChange={upd('priceMin')} />
            </div>
            <div>
              <label className="field-label">Max price (LKR)</label>
              <input className="field" type="number" min="0" step="0.01" placeholder="149500"
                value={form.priceMax} onChange={upd('priceMax')} />
            </div>
            <Field label="Unit" placeholder="per kg, per unit…" value={form.unit} onChange={upd('unit')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="field-label">Min order quantity</label>
              <input className="field" type="number" min="1" placeholder="10"
                value={form.minOrderQty} onChange={upd('minOrderQty')} />
            </div>
            <div>
              <Field label="Tags" placeholder="sensor, IoT, industrial" value={form.tags} onChange={upd('tags')} />
              <div className="text-xs text-muted" style={{ marginTop: -12 }}>Separate tags with commas</div>
            </div>
          </div>
        </div>

        {/* ── Media ───────────────────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 className="font-display font-bold text-lg mb-4">Media</h3>
          <label className="field-label">Product images</label>
          <ProductImageUploader
            images={form.images}
            brandId={brandId || ''}
            onUpdate={urls => setForm(prev => ({ ...prev, images: urls }))}
          />
          <div style={{ marginTop: 20 }}>
            <label className="field-label">Product video</label>
            {isProMember
              ? <input className="field" type="url" placeholder="https://youtube.com/..." value={form.videoUrl} onChange={upd('videoUrl')} />
              : <ProLock onUpgrade={() => goTo('subscription')} label="Add a product video to stand out in search results." />
            }
          </div>
        </div>

        {/* ── Tiered pricing (UI only) ─────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Tiered pricing</h3>
            <span className="text-xs text-muted">Reward bulk buyers with quantity discounts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tieredPricing.map((t, i) => (
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

        {/* ── Variations (UI only) ─────────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Variations</h3>
            <span className="text-xs text-muted">Offer different options at different price points</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {variations.length === 0 && <div className="text-sm text-muted">No variations yet.</div>}
            {variations.map((v, i) => (
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

        {/* ── Specifications (UI only) ─────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Specifications</h3>
            <span className="text-xs text-muted">Product and technical specs shown on the detail page</span>
          </div>

          <div className="uppercase-label mb-2">Product specifications</div>
          {productSpecs.map((s, i) => (
            <div key={i} className="spec-row">
              <input type="text" placeholder="Label (e.g. Brand)" value={s.l} onChange={e => setSpec('product', i, 'l', e.target.value)} />
              <input type="text" placeholder="Value" value={s.v} onChange={e => setSpec('product', i, 'v', e.target.value)} />
              <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeSpec('product', i)} />
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="plus" type="button" onClick={() => addSpec('product')}>Add row</Button>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div className="uppercase-label mb-2">Technical specifications</div>
          {techSpecs.map((s, i) => (
            <div key={i} className="spec-row">
              <input type="text" placeholder="Label (e.g. Connectivity)" value={s.l} onChange={e => setSpec('tech', i, 'l', e.target.value)} />
              <input type="text" placeholder="Value" value={s.v} onChange={e => setSpec('tech', i, 'v', e.target.value)} />
              <Button variant="ghost" size="sm" icon="x" type="button" onClick={() => removeSpec('tech', i)} />
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="plus" type="button" onClick={() => addSpec('tech')}>Add row</Button>
        </div>

        {/* ── Direct sales (UI only) ───────────── */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <label className="field-label">Direct sales</label>
          {isProMember ? (
            <label className="flex items-center gap-3" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.directSales} onChange={(e) => setForm(prev => ({ ...prev, directSales: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <div className="flex-1">
                <div className="font-display font-semibold">Enable direct sales</div>
                <div className="text-xs text-muted">Buyers can purchase this product directly through the marketplace.</div>
              </div>
            </label>
          ) : (
            <ProLock onUpgrade={() => goTo('subscription')} label="Let buyers purchase directly with Pro." />
          )}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => goTo('manage-products')} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" block icon="check" disabled={submitting}>
            {submitting ? (mode === 'add' ? 'Adding…' : 'Saving…') : (mode === 'add' ? 'Add product' : 'Save changes')}
          </Button>
        </div>
      </form>
    </div>
  )
}
