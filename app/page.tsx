'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  fullName:         '',
  email:            '',
  phone:            '',
  logo:             '?',
  businessName:     '',
  businessIndustry: '',
  businessWebsite:  '',
  businessPhone:    '',
  description:      '',
  bannerColor:      '#4f46e5',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [exploreFilter, setExploreFilter] = useState<NavOpts | null>(null)
  const [selectedBusiness, setSelectedBusinessState] = useState<Business | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProMember, setIsProMember] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [favorites, setFavorites] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const [brandsCache, setBrandsCache] = useState<Record<string, Business>>({})
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

  // Fetch real profile + brand data whenever the signed-in user changes
  useEffect(() => {
    if (!user) {
      setUserProfile(DEFAULT_PROFILE)
      return
    }

    const supabase = createClient()

    async function loadProfile() {
      const [{ data: profile }, { data: brand }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase.from('brands').select('*').eq('owner_id', user!.id).maybeSingle(),
      ])

      if (!profile) return

      const parts = (profile.full_name || '').trim().split(/\s+/).filter(Boolean)
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (profile.full_name || '').slice(0, 2).toUpperCase() || '?'

      setUserProfile({
        // Personal
        fullName: profile.full_name,
        email:    profile.email,
        phone:    profile.phone || '',
        logo:     initials,
        // Business — sellers use brands table as source of truth;
        // buyers use the profiles.business_* columns.
        // Never fall back personal name into businessName.
        businessName:     brand?.name     || profile.business_name     || '',
        businessIndustry: brand?.categories[0] || profile.business_industry || '',
        businessWebsite:  brand?.website  || profile.business_website  || '',
        businessPhone:    brand?.phone    || profile.business_phone    || '',
        description:      brand?.description || '',
        brandId:          brand?.id,
        brandSlug:        brand?.slug,
        bannerColor:      DEFAULT_PROFILE.bannerColor,
        role:             profile.role,
      })
    }

    loadProfile()
  }, [user])

  const goTo = useCallback((s: Screen, opts?: NavOpts) => {
    // Redirect guests away from all private screens to auth
    const GUEST_RESTRICTED: Screen[] = ['profile', 'messages', 'message-form', 'rfq-create',
      'manage-profile', 'manage-products', 'add-product', 'edit-product', 'settings', 'subscription']
    const dest: Screen = (!user && GUEST_RESTRICTED.includes(s)) ? 'auth' : s
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

  // Returns an error string on failure, or null on success
  const deleteAccount = useCallback(async (password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) return data.error ?? 'Account deletion failed.'
      // Clear all local state and sign out
      setUser(null)
      setFavorites([])
      setRecentlyViewed([])
      setBrandsCache({})
      setScreen('home')
      return null
    } catch {
      return 'Network error. Please check your connection and try again.'
    }
  }, [])

  // Save profile edits to Supabase and update local state
  const saveProfile = useCallback(async (updated: UserProfile): Promise<string | null> => {
    if (!user) return 'Not signed in.'
    try {
      const supabase = createClient()

      // Always update personal + business fields on profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name:         updated.fullName,
          phone:             updated.phone     || null,
          business_name:     updated.businessName     || null,
          business_industry: updated.businessIndustry || null,
          business_website:  updated.businessWebsite  || null,
          business_phone:    updated.businessPhone    || null,
        })
        .eq('id', user.id)

      if (profileError) return profileError.message

      // Sellers: also sync to brands table (their public marketplace listing)
      if (updated.role === 'seller' && updated.businessName) {
        await supabase
          .from('brands')
          .update({
            name:        updated.businessName,
            description: updated.description || '',
            website:     updated.businessWebsite  || null,
            phone:       updated.businessPhone    || null,
            categories:  updated.businessIndustry ? [updated.businessIndustry] : [],
          })
          .eq('owner_id', user.id)
      }

      setUserProfile(updated)
      return null
    } catch {
      return 'Network error. Please check your connection and try again.'
    }
  }, [user])

  const setSelectedBusiness = useCallback((b: Business | null) => {
    setSelectedBusinessState(b)
    if (b) {
      setRecentlyViewed(prev => [b.id, ...prev.filter(x => x !== b.id)].slice(0, 10))
      setBrandsCache(prev => ({ ...prev, [b.id]: b }))
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  // Resolve recently viewed IDs → Business objects using the cache
  const recentlyViewedBrands = useMemo(() =>
    recentlyViewed.map(id => brandsCache[id]).filter(Boolean) as Business[],
    [recentlyViewed, brandsCache]
  )

  // Derive avatar initials from the signed-in user's full name
  const userInitials = useMemo(() => {
    const name = (user?.user_metadata?.full_name as string | undefined) || ''
    if (name) {
      const parts = name.trim().split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return user?.email?.slice(0, 2).toUpperCase() || '?'
  }, [user])

  const unreadCount = user ? MESSAGES.filter(m => m.unread).length : 0
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
            recentlyViewedBrands={recentlyViewedBrands}
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
            brandsCache={brandsCache}
            cardStyle={cardStyle}
          />
        )
      case 'rfqs':
        return <RFQsScreen goTo={goTo} isSignedIn={!!user} />
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
            onDeleteAccount={deleteAccount}
            userId={user?.id}
            savedCount={favorites.length}
          />
        )
      case 'manage-profile':
        return (
          <ManageProfileScreen
            goTo={goTo}
            userProfile={userProfile}
            onSave={saveProfile}
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
            recentlyViewedBrands={recentlyViewedBrands}
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
        userInitials={userInitials}
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
