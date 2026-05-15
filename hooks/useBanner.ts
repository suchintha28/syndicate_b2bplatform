import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export interface Banner {
  id: string
  slot: string
  title: string | null
  subtitle: string | null
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  bg_color: string
  text_color: string
}

async function fetchBanner(slot: string): Promise<Banner | null> {
  const supabase = createClient()
  // RLS handles active / date window filtering server-side
  const { data } = await supabase
    .from('banners')
    .select('id, slot, title, subtitle, cta_text, cta_url, image_url, bg_color, text_color')
    .eq('slot', slot)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export function useBanner(slot: string) {
  const { data } = useSWR<Banner | null>(
    `banner-${slot}`,
    () => fetchBanner(slot),
    {
      revalidateOnFocus:  false,
      dedupingInterval:   300_000, // 5-minute cache — banners don't change often
      fallbackData:       null,
    }
  )
  // undefined (loading) and null (no banner) both treated the same: render nothing
  return data ?? null
}
