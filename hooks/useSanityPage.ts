import useSWR from 'swr'
import {
  fetchAboutPage,   type SanityAboutPage,
  fetchPrivacyPage, type SanityPrivacyPage,
  fetchContactPage, type SanityContactPage,
  fetchSiteSettings, type SanitySiteSettings,
} from '@/sanity/lib/queries'

const OPTS = { revalidateOnFocus: false, dedupingInterval: 3_600_000 } // 1-hour cache for page content

export function useAboutPage() {
  const { data, isLoading } = useSWR<SanityAboutPage | null>('sanity-about', fetchAboutPage, OPTS)
  return { data: data ?? null, isLoading }
}

export function usePrivacyPage() {
  const { data, isLoading } = useSWR<SanityPrivacyPage | null>('sanity-privacy', fetchPrivacyPage, OPTS)
  return { data: data ?? null, isLoading }
}

export function useContactPage() {
  const { data, isLoading } = useSWR<SanityContactPage | null>('sanity-contact', fetchContactPage, OPTS)
  return { data: data ?? null, isLoading }
}

export function useSiteSettings() {
  const { data, isLoading } = useSWR<SanitySiteSettings | null>('sanity-site-settings', fetchSiteSettings, OPTS)
  return { data: data ?? null, isLoading }
}
