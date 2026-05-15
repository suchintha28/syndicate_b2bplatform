'use client'

import React from 'react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { BusinessCard } from '@/components/cards'
import { type Business, type Screen } from '@/lib/data'

export function SavedScreen({ goTo, favorites, toggleFavorite, setSelectedBusiness, brandsCache, cardStyle }: {
  goTo: (s: Screen) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  setSelectedBusiness: (b: Business | null) => void
  brandsCache: Record<string, Business>
  cardStyle: 'bordered' | 'shadow' | 'minimal'
}) {
  const saved = favorites.map(id => brandsCache[id]).filter(Boolean) as Business[]
  return (
    <div className="container fade-up">
      <PageHeader eyebrow="Your collection" title="Saved suppliers" sub={`${saved.length} ${saved.length === 1 ? 'business' : 'businesses'} bookmarked`} />
      {saved.length === 0 ? (
        <EmptyState icon="heart" title="Nothing saved yet" sub="Tap the heart on any supplier card to add it here."
          action={<Button variant="primary" onClick={() => goTo('listing')}>Explore suppliers</Button>} />
      ) : (
        <div className="grid-businesses" style={{ paddingBottom: 64 }}>
          {saved.map(b => (
            <BusinessCard key={b.id} business={b} cardStyle={cardStyle}
              favorited
              onFavorite={() => toggleFavorite(b.id)}
              onNavigate={() => { setSelectedBusiness(b); goTo('detail') }}
              onMessage={() => { setSelectedBusiness(b); goTo('message-form') }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
