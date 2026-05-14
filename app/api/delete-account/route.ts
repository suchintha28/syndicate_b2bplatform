import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    // 1. Get the currently signed-in user from the session cookie
    const supabase = createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json({ error: 'You must be signed in to delete your account.' }, { status: 401 })
    }

    // 2. Re-authenticate with the supplied password to confirm identity
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 403 })
    }

    // 3. Hard-delete the auth user via the service-role client.
    //    Because profiles.id references auth.users ON DELETE CASCADE,
    //    and brands/products/rfqs reference profiles ON DELETE CASCADE,
    //    this single call wipes all data for this user automatically.
    const admin = createAdminClient()
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('delete-account: admin.deleteUser failed', deleteError)
      return NextResponse.json({ error: 'Account deletion failed. Please try again or contact support.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('delete-account: unexpected error', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
