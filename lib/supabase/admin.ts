import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client.
 * NEVER import this in client components or anywhere that ships to the browser.
 * It uses SUPABASE_SERVICE_ROLE_KEY which bypasses all RLS policies.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
