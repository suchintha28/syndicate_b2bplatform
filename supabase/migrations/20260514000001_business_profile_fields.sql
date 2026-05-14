-- ============================================================
-- Add business info columns to profiles
-- Create business_members table (multi-user business accounts)
-- Update handle_new_user trigger to persist business fields
-- ============================================================

-- ─── Business info columns on profiles ──────────────────────
-- Buyers may optionally fill these; sellers must (enforced in app).
-- Having them on profiles lets us support single-table user lookups
-- without always joining to brands.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_name     text,
  ADD COLUMN IF NOT EXISTS business_industry text,
  ADD COLUMN IF NOT EXISTS business_website  text,
  ADD COLUMN IF NOT EXISTS business_phone    text;

-- ─── Backfill existing sellers from auth.users metadata ─────
UPDATE profiles p
SET
  business_name     = u.raw_user_meta_data->>'business_name',
  business_industry = u.raw_user_meta_data->>'industry'
FROM auth.users u
WHERE p.id = u.id
  AND p.role = 'seller'
  AND u.raw_user_meta_data->>'business_name' IS NOT NULL;

-- ─── Update trigger to save business fields on sign-up ──────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role,
    business_name, business_industry
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'buyer'::user_role
    ),
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'industry'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: % (%)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── business_members — provision for multi-user accounts ───
-- Each brand can have multiple members with different roles.
-- The user who created the brand is automatically the owner
-- (handled by the trg_on_brand_created trigger below).

CREATE TABLE IF NOT EXISTS business_members (
  id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid      NOT NULL REFERENCES brands(id)   ON DELETE CASCADE,
  profile_id  uuid      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_role text      NOT NULL DEFAULT 'member'
                        CHECK (member_role IN ('owner', 'admin', 'member')),
  invited_by  uuid      REFERENCES profiles(id),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, profile_id)
);

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Brand owners and admins can see all members of their brand
CREATE POLICY "business_members: brand owner/admin can read"
  ON business_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members bm2
      WHERE bm2.brand_id = business_members.brand_id
        AND bm2.profile_id = auth.uid()
        AND bm2.member_role IN ('owner', 'admin')
    )
  );

-- Members can see their own membership record
CREATE POLICY "business_members: member can read own"
  ON business_members FOR SELECT USING (profile_id = auth.uid());

-- Only brand owners can add new members
CREATE POLICY "business_members: owner can insert"
  ON business_members FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm2
      WHERE bm2.brand_id = business_members.brand_id
        AND bm2.profile_id = auth.uid()
        AND bm2.member_role = 'owner'
    )
  );

-- Only brand owners can remove members
CREATE POLICY "business_members: owner can delete"
  ON business_members FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM business_members bm2
      WHERE bm2.brand_id = business_members.brand_id
        AND bm2.profile_id = auth.uid()
        AND bm2.member_role = 'owner'
    )
  );

-- ─── Auto-add brand creator as owner ────────────────────────
CREATE OR REPLACE FUNCTION handle_new_brand()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.business_members (brand_id, profile_id, member_role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (brand_id, profile_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_brand failed: % (%)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_on_brand_created
  AFTER INSERT ON brands
  FOR EACH ROW EXECUTE FUNCTION handle_new_brand();

-- Backfill existing brands — add their owners as members
INSERT INTO business_members (brand_id, profile_id, member_role)
SELECT id, owner_id, 'owner'
FROM brands
ON CONFLICT (brand_id, profile_id) DO NOTHING;
