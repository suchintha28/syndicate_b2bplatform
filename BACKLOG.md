# Product Backlog

Items noted here are intentionally deferred — they are planned features, not bugs.
Each item should become a GitHub issue when prioritised for a sprint.

---

## Saved / Favourites section

**Summary:** Allow buyers to save brands and products to a persistent favourites list,
viewable from the "Saved" tab in the bottom nav.

**Current state:** The heart/save button on BusinessCard writes to in-memory React state
(`favorites` array in the root component). State is lost on page refresh. The "Saved" screen
(`screen === 'saved'`) is a placeholder that shows nothing.

**Work required:**
- [ ] Create a `saved_items` table in Supabase (`user_id`, `type: 'brand' | 'product'`, `target_id`, `created_at`)
- [ ] RLS: users can only read/write their own saved items
- [ ] On sign-in, hydrate the `favorites` array from `saved_items`
- [ ] Wire `toggleFavorite` to upsert/delete from `saved_items` (optimistic UI)
- [ ] Build the "Saved" screen to fetch and display the user's saved brands and products
- [ ] Guest users: keep current in-memory behaviour; prompt to sign in to persist
- [ ] E2E tests: buyer-saves.spec.ts covering save/unsave flow

**Priority:** Medium — nice-to-have for buyer retention, not blocking supplier onboarding.
