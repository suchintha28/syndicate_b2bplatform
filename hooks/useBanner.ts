import useSWR from 'swr'
import { fetchSanityBanner, type SanityBanner } from '@/sanity/lib/queries'

/**
 * Returns the active banner for a given slot, or null if:
 *   – no banner is configured / active in Sanity
 *   – the data is still loading
 *
 * In both cases the caller renders nothing (zero layout impact).
 * SWR deduplicates requests and caches for 5 minutes.
 */
export function useBanner(slot: string): SanityBanner | null {
  const { data } = useSWR<SanityBanner | null>(
    `sanity-banner-${slot}`,
    () => fetchSanityBanner(slot),
    {
      revalidateOnFocus: false,
      dedupingInterval:  300_000,  // 5 min — banners change infrequently
      fallbackData:      null,
    }
  )
  return data ?? null
}
