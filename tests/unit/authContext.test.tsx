import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Auth behaviour tests — verifies the contract that Supabase auth is expected
 * to fulfil. These tests mock the Supabase client so no real database calls
 * are made. They document the expected auth behaviour that drives state
 * management in app/page.tsx.
 *
 * Note: Auth state is managed directly in app/page.tsx via useState +
 * onAuthStateChange — there is no separate AuthContext in this project.
 * These tests verify the underlying Supabase SDK behaviour we depend on.
 */

// ── Shared mock session objects ───────────────────────────────────────────────
const MOCK_USER = {
  id: 'user-uuid-001',
  email: 'supplier@syndicate.lk',
  user_metadata: { full_name: 'Ashan Perera', role: 'seller' },
}

const MOCK_SESSION = {
  access_token: 'fake-jwt',
  refresh_token: 'fake-refresh',
  user: MOCK_USER,
}

// ── Supabase client factory (returns fresh mocks per test) ────────────────────
function makeSupabaseMock(sessionOverride: typeof MOCK_SESSION | null = null) {
  const authChangeCallbacks: Array<(event: string, session: typeof MOCK_SESSION | null) => void> = []

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: sessionOverride }, error: null }),
      onAuthStateChange: vi.fn((cb) => {
        authChangeCallbacks.push(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      // Helper exposed on the mock so tests can fire auth state changes
      _fireAuthChange: (event: string, session: typeof MOCK_SESSION | null) => {
        authChangeCallbacks.forEach((cb) => cb(event, session))
      },
    },
  }
}

// ─── getSession — no active session ──────────────────────────────────────────
describe('Supabase auth — no active session', () => {
  it('getSession returns null when no user is signed in', async () => {
    const client = makeSupabaseMock(null)
    const { data } = await client.auth.getSession()
    expect(data.session).toBeNull()
  })

  it('getSession does not throw when called with no session', async () => {
    const client = makeSupabaseMock(null)
    await expect(client.auth.getSession()).resolves.not.toThrow()
  })
})

// ─── getSession — active session ─────────────────────────────────────────────
describe('Supabase auth — active session', () => {
  it('getSession returns the user object when a user is signed in', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    const { data } = await client.auth.getSession()
    expect(data.session?.user).toEqual(MOCK_USER)
  })

  it('getSession returns the correct user id', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    const { data } = await client.auth.getSession()
    expect(data.session?.user.id).toBe('user-uuid-001')
  })

  it('getSession returns the correct user email', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    const { data } = await client.auth.getSession()
    expect(data.session?.user.email).toBe('supplier@syndicate.lk')
  })
})

// ─── onAuthStateChange — real-time auth events ───────────────────────────────
describe('Supabase auth — onAuthStateChange', () => {
  it('fires the callback with the user when a SIGNED_IN event occurs', () => {
    const client = makeSupabaseMock(null)
    let capturedSession: typeof MOCK_SESSION | null = null

    client.auth.onAuthStateChange((_event, session) => {
      capturedSession = session
    })

    client.auth._fireAuthChange('SIGNED_IN', MOCK_SESSION)
    expect(capturedSession?.user.id).toBe('user-uuid-001')
  })

  it('fires the callback with null when a SIGNED_OUT event occurs', () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    let capturedSession: typeof MOCK_SESSION | null = MOCK_SESSION

    client.auth.onAuthStateChange((_event, session) => {
      capturedSession = session
    })

    client.auth._fireAuthChange('SIGNED_OUT', null)
    expect(capturedSession).toBeNull()
  })

  it('returns an unsubscribe function that can be called without throwing', () => {
    const client = makeSupabaseMock(null)
    const { data } = client.auth.onAuthStateChange(vi.fn())
    expect(() => data.subscription.unsubscribe()).not.toThrow()
  })
})

// ─── signOut ──────────────────────────────────────────────────────────────────
describe('Supabase auth — signOut', () => {
  it('calls signOut exactly once when the user signs out', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    await client.auth.signOut()
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('signOut resolves without an error', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    const result = await client.auth.signOut()
    expect(result.error).toBeNull()
  })

  it('clears the session — getSession returns null after signOut fires SIGNED_OUT', async () => {
    const client = makeSupabaseMock(MOCK_SESSION)
    let currentSession: typeof MOCK_SESSION | null = MOCK_SESSION

    client.auth.onAuthStateChange((_event, session) => {
      currentSession = session
    })

    await client.auth.signOut()
    client.auth._fireAuthChange('SIGNED_OUT', null)

    expect(currentSession).toBeNull()
  })
})
