import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // exchangeCodeForSession returns the user directly — use it instead of
    // calling getUser() again, because the newly-set session cookie is not
    // readable in the same server request.
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const base = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

      // Sellers confirming their email for the first time should go to brand
      // onboarding if they haven't created a brand yet.
      if (user.user_metadata?.role === 'seller') {
        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()
        if (!brand) {
          return NextResponse.redirect(`${base}/onboarding/brand`)
        }
      }

      // Default to home; ignore legacy /dashboard redirects
      const destination = (!next || next === '/dashboard') ? '/' : next
      return NextResponse.redirect(`${base}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
