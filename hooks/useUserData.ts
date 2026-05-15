import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { type UserProfile } from '@/lib/data'

const DEFAULT_PROFILE: UserProfile = {
  fullName: '', email: '', phone: '', logo: '?',
  businessName: '', businessIndustry: '', businessWebsite: '',
  businessPhone: '', description: '', bannerColor: '#4f46e5',
}

async function fetchUserData(userId: string): Promise<UserProfile> {
  const supabase = createClient()
  const [{ data: profile }, { data: brand }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('brands').select('*').eq('owner_id', userId).maybeSingle(),
  ])
  if (!profile) return DEFAULT_PROFILE

  const parts = (profile.full_name || '').trim().split(/\s+/).filter(Boolean)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (profile.full_name || '').slice(0, 2).toUpperCase() || '?'

  return {
    fullName:         profile.full_name,
    email:            profile.email,
    phone:            profile.phone || '',
    logo:             initials,
    businessName:     brand?.name            || profile.business_name     || '',
    businessIndustry: brand?.categories?.[0] || profile.business_industry || '',
    businessWebsite:  brand?.website         || profile.business_website  || '',
    businessPhone:    brand?.phone           || profile.business_phone    || '',
    description:      brand?.description     || '',
    brandId:          brand?.id,
    brandSlug:        brand?.slug,
    bannerColor:      DEFAULT_PROFILE.bannerColor,
    role:             profile.role,
    avatarUrl:        profile.avatar_url  || undefined,
    logoUrl:          brand?.logo_url     || undefined,
  }
}

export function useUserData(userId: string | undefined) {
  const { data, mutate, isLoading } = useSWR<UserProfile>(
    userId ? `user-data-${userId}` : null,
    () => fetchUserData(userId!),
    { revalidateOnFocus: false, dedupingInterval: 5_000 }
  )
  return {
    userProfile: data ?? DEFAULT_PROFILE,
    revalidate: mutate,
    loading: isLoading,
  }
}
