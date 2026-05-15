'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/icons'
import { Button, Badge, PageHeader, BackLink, SkeletonCard } from '@/components/ui'
import { type Screen, type NavOpts } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import type { DbProduct } from '@/types/database'

export function ManageProductsScreen({ goTo, setEditingProduct }: {
  goTo: (s: Screen, opts?: NavOpts) => void
  setEditingProduct: (p: DbProduct | null) => void
}) {
  const [products, setProducts]   = useState<DbProduct[]>([])
  const [loading, setLoading]     = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: brand } = await supabase.from('brands').select('id').eq('owner_id', user.id).maybeSingle()
      if (!brand) { setLoading(false); return }
      const { data } = await supabase.from('products').select('*').eq('brand_id', brand.id).order('created_at', { ascending: false })
      setProducts((data || []) as DbProduct[])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    setTogglingId(null)
  }

  const total  = products.length
  const active = products.filter(p => p.is_active).length

  return (
    <div className="container fade-up" style={{ paddingBottom: 64 }}>
      <BackLink onClick={() => goTo('profile')}>Back to profile</BackLink>
      <PageHeader
        title="Products"
        sub={loading ? 'Loading…' : `${total} total · ${active} active`}
        action={<Button variant="primary" icon="plus" onClick={() => goTo('add-product')}>Add product</Button>}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={76} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="box" size={32} stroke="var(--muted)" />
          <div className="font-display font-semibold mt-3 mb-1">No products yet</div>
          <div className="text-sm text-muted mb-4">Add your first product to start receiving inquiries from buyers.</div>
          <Button variant="primary" icon="plus" onClick={() => goTo('add-product')}>Add first product</Button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {products.map((p, i) => {
            const priceLabel = p.price_range_min ? `LKR ${Math.round(p.price_range_min).toLocaleString()}` : null
            return (
              <div key={p.id} style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
                  {p.images[0]
                    ? <img src={p.images[0]} alt="" className="img-cover" />
                    : <Icon name="image" size={20} stroke="var(--border-strong)" />
                  }
                </div>
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div className="font-display font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                    {priceLabel && <span className="font-mono">{priceLabel}</span>}
                    <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    {p.category && <span>{p.category}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" icon="edit"
                    onClick={() => { setEditingProduct(p); goTo('edit-product') }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" disabled={togglingId === p.id}
                    onClick={() => toggleActive(p.id, p.is_active)}>
                    {togglingId === p.id ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
