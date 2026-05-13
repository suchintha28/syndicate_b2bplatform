-- ============================================================
-- Fix: handle_new_user trigger was blocking signup
--
-- Problems fixed:
-- 1. Missing INSERT policy on profiles — newer Supabase projects apply
--    RLS even to SECURITY DEFINER functions unless search_path is set.
-- 2. Unsafe user_role cast — COALESCE fallback 'buyer' was plain text,
--    not cast to user_role, causing a type mismatch error.
-- 3. No exception handler — any trigger error rolled back the entire
--    auth.users INSERT, returning 500 "Database error saving new user".
-- ============================================================

-- 1. Add missing INSERT policy so the trigger can write to profiles
CREATE POLICY "profiles: allow insert on signup"
  ON profiles FOR INSERT WITH CHECK (true);

-- 2. Rebuild the function with safe cast + exception handler + explicit search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'buyer'::user_role        -- explicit cast prevents type-mismatch
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Profile creation failed but we must not block user creation.
  -- The profile can be created on first sign-in as a fallback.
  RAISE WARNING 'handle_new_user failed: % (%)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
