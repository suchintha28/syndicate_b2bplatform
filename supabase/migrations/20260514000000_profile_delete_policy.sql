-- ============================================================
-- Allow users to delete their own profile row.
-- The auth.users row is deleted via the API route using the
-- service-role key; the CASCADE on profiles(id) then removes
-- this row automatically.  The policy below also permits a
-- direct DELETE by the row owner should that ever be needed.
-- ============================================================

CREATE POLICY "profiles: owner can delete"
  ON profiles FOR DELETE USING (auth.uid() = id);
