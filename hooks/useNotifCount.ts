import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

async function fetchNotifCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  return count ?? 0
}

export function useNotifCount(userId: string | undefined) {
  const { data = 0, mutate } = useSWR<number>(
    userId ? `notif-count-${userId}` : null,
    () => fetchNotifCount(userId!),
    { refreshInterval: 30_000, revalidateOnFocus: true }
  )
  return { notifCount: data, revalidate: mutate }
}
