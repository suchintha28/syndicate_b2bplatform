'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { TopNav, BottomNav } from '@/components/nav'
import { AuthScreen } from '@/components/screens/auth'
import {
  HomeScreen,
  ExploreScreen,
  BusinessDetailScreen,
  ProductDetailScreen,
  SavedScreen,
} from '@/components/screens/marketplace'
import {
  RFQsScreen,
  RFQCreateScreen,
  MessagesScreen,
  MessageFormScreen,
  SuccessScreen,
} from '@/components/screens/business'
import {
  ProfileScreen,
  ManageProfileScreen,
  ManageProductsScreen,
  ProductFormScreen,
  SettingsScreen,
  SubscriptionScreen,
} from '@/components/screens/account'
import {
  MESSAGES,
  type Screen,
  type NavOpts,
  type Business,
  type Product,
  type UserProfile,
} from '@/lib/data'

const DEFAULT_PROFILE: UserProfile = {
  businessName: 'Colombo Trading Co.',
  logo: 'MB',
  category: 'Technology',
  email: 'malith@colombotrading.lk',
  phone: '+94 77 123 4567',
  website: 'colombotrading.lk',
  description: 'A Sri Lanka-based B2B trading company sourcing technology and manufacturing components.',
  bannerColor: '#4f46e5',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [exploreFilter, setExploreFilter] = useState<NavOpts | null>(null)
  const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProMember, setIsProMember] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [favorites, setFavorites] = useState<number[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const f = localStorage.getItem('syndicate_favorites')
      const r = localStorage.getItem('syndicate_recently_viewed')
      if (f) setFavorites(JSON.parse(f))
      if (r) setRecentlyViewed(JSON.parse(r))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('syndicate_favorites', JSON.stringify(favorites)) } catch {}
  }, [favorites])

  useEffect(() => {
    try { localStorage.setItem('syndicate_recently_viewed', JSON.stringify(recentlyViewed)) } catch {}
  }, [recentlyViewed])

  // Auth state — subscribe once, update user on every session change
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const goTo = useCallback((s: Screen, opts?: NavOpts) => {
    // Guests trying to reach profile land on the auth screen instead
    const dest: Screen = (s === 'profile' && !user) ? 'auth' : s
    if (opts) setExploreFilter(opts)
    window.scrollTo({ top: 0, behavior: 'instant' })
    setScreen(dest)
  }, [user])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setScreen('home')
  }, [])

  const setSelectedBusiness = useCallback((b: Business | null) => {
    setSelectedBusinessState(b)
    if (b) {
      setRecentlyViewed(prev => [b.id, ...prev.filter(x => x !== b.id)].slice(0, 10))
    }
  }, [])

  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  const unreadCount = MESSAGES.filter(m => m.unread).length
  const cardStyle = 'bordered' as const

  function renderScreen() {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            goTo={goTo}
            setSelectedBusiness={setSelectedBusiness}
            setSelectedProduct={setSelectedProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            recentlyViewed={recentlyViewed}
            cardStyle={cardStyle}
          />
        )
      case 'listing':
        return (
          <ExploreScreen
            goTo={goTo}
            setSelectedBusiness={setSelectedBusiness}
            setSelectedProduct={setSelectedProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            initialFilter={exploreFilter}
            cardStyle={cardStyle}
          />
        )
      case 'detail':
        return (
          <BusinessDetailScreen
            goTo={goTo}
            business={selectedBusiness}
            setSelectedProduct={setSelectedProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            cardStyle={cardStyle}
          />
        )
      case 'product-detail':
        return (
          <ProductDetailScreen
            goTo={goTo}
            product={selectedProduct}
            business={selectedBusiness}
            setSelectedBusiness={setSelectedBusiness}
          />
        )
      case 'saved':
        return (
          <SavedScreen
            goTo={goTo}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            setSelectedBusiness={setSelectedBusiness}
            cardStyle={cardStyle}
          />
        )
      case 'rfqs':
        return <RFQsScreen goTo={goTo} />
      case 'rfq-create':
        return <RFQCreateScreen goTo={goTo} />
      case 'messages':
        return <MessagesScreen goTo={goTo} />
      case 'message-form':
        return <MessageFormScreen goTo={goTo} business={selectedBusiness} />
      case 'success':
        return <SuccessScreen goTo={goTo} />
      case 'auth':
        return <AuthScreen goTo={goTo} />
      case 'profile':
        return (
          <ProfileScreen
            goTo={goTo}
            isProMember={isProMember}
            userProfile={userProfile}
            onSignOut={signOut}
          />
        )
      case 'manage-profile':
        return (
          <ManageProfileScreen
            goTo={goTo}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            isProMember={isProMember}
          />
        )
      case 'manage-products':
        return (
          <ManageProductsScreen
            goTo={goTo}
            setEditingProduct={setEditingProduct}
          />
        )
      case 'add-product':
        return (
          <ProductFormScreen
            goTo={goTo}
            mode="add"
            editingProduct={null}
            isProMember={isProMember}
          />
        )
      case 'edit-product':
        return (
          <ProductFormScreen
            goTo={goTo}
            mode="edit"
            editingProduct={editingProduct}
            isProMember={isProMember}
          />
        )
      case 'settings':
        return <SettingsScreen goTo={goTo} />
      case 'subscription':
        return (
          <SubscriptionScreen
            goTo={goTo}
            isProMember={isProMember}
            setIsProMember={setIsProMember}
          />
        )
      default:
        return (
          <HomeScreen
            goTo={goTo}
            setSelectedBusiness={setSelectedBusiness}
            setSelectedProduct={setSelectedProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            recentlyViewed={recentlyViewed}
            cardStyle={cardStyle}
          />
        )
    }
  }

  return (
    <div className="app density-cozy">
      <TopNav
        screen={screen}
        setScreen={goTo}
        unreadCount={unreadCount}
        savedCount={favorites.length}
        isProMember={isProMember}
        isSignedIn={!!user}
      />
      <main className="main-content">
        {renderScreen()}
      </main>
      <BottomNav
        screen={screen}
        setScreen={goTo}
        unreadCount={unreadCount}
      />
    </div>
  )
}
