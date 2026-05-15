// Shared types and constants for marketplace screens
import type { Screen, NavOpts, Business, Product } from '@/lib/data'

export interface CommonProps {
  goTo: (s: Screen, opts?: NavOpts) => void
  setSelectedBusiness: (b: Business | null) => void
  setSelectedProduct: (p: Product | null) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  cardStyle: 'bordered' | 'shadow' | 'minimal'
}
