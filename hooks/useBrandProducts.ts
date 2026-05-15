import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { dbProductToProduct } from '@/lib/supabase/queries'
import type { Product } from '@/lib/data'

async function fetchBrandProducts(brandId: string): Promise<Product[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data || []).map(dbProductToProduct)
}

export function useBrandProducts(brandId: string | undefined) {
  const { data, error, isLoading } = useSWR<Product[]>(
    brandId ? `brand-products-${brandId}` : null,
    () => fetchBrandProducts(brandId!),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
  return { products: data ?? [], loading: isLoading, error }
}
