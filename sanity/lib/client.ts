import { createClient } from 'next-sanity'

// Fall back to the hardcoded project ID so `next build` never throws
// "Configuration must contain `projectId`" when the env var is absent
// (e.g. in CI or a fresh clone without .env.local).
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'mx1vcbbk',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,          // cached responses — fast for read-only public content
  perspective: 'published',
})
