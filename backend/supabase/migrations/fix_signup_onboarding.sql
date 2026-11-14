-- ==============================================================================
-- ShilpSetu Database Migration: fix_signup_onboarding.sql
-- ==============================================================================
-- 1. Ensure profiles table structure, NULL role default, and onboarding tracking
-- 2. Ensure artisan_profiles table structure
-- 3. Update handle_new_user() trigger: NEVER assign customer role on registration
-- 4. RPC: getCurrentUserProfile() returning user_id, full_name, email, role,
--    onboarding_completed, and profile_completed status
-- 5. RPC: saveUserRole(p_role text) for authenticated single-time role assignment
-- 6. Strict Row Level Security policies protecting role from tampering
-- ==============================================================================

-- 1. Profiles Table structure and onboarding fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  role text,
  avatar_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  profile_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure onboarding_completed and profile_completed columns exist if table already existed
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Ensure role is strictly NULL by default and valid
ALTER TABLE public.profiles
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('customer', 'artisan'));

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Artisan Profiles Table structure
CREATE TABLE IF NOT EXISTS public.artisan_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  craft_type text,
  craft_specialization text,
  description text,
  experience_years integer,
  location text,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_artisan_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id ON public.artisan_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Automatic Profile Creation Trigger on Signup (Role is strictly NULL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    avatar_url,
    onboarding_completed,
    profile_completed,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.phone,
    NULL, -- Role is explicitly NULL on signup; chosen on Role Setup screen
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    false,
    false,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = CASE
      WHEN excluded.full_name IS NOT NULL AND excluded.full_name <> '' THEN excluded.full_name
      ELSE public.profiles.full_name
    END,
    avatar_url = CASE
      WHEN excluded.avatar_url IS NOT NULL AND excluded.avatar_url <> '' THEN excluded.avatar_url
      ELSE public.profiles.avatar_url
    END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RPC: getCurrentUserProfile()
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_artisan_record record;
  v_effective_role text;
  v_onboarding_completed boolean;
  v_profile_completed boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    -- Return null profile gracefully without assuming customer
    RETURN json_build_object(
      'success', true,
      'profile', null,
      'role', null,
      'onboarding_completed', false,
      'profile_completed', false,
      'is_new', true
    );
  END IF;

  v_effective_role := v_profile.role;
  v_onboarding_completed := coalesce(v_profile.onboarding_completed, false);
  v_profile_completed := coalesce(v_profile.profile_completed, false);

  -- Cross check artisan_profiles: if user exists in artisan_profiles, role is artisan
  IF v_effective_role IS NULL OR v_effective_role <> 'artisan' THEN
    SELECT * INTO v_artisan_record
    FROM public.artisan_profiles
    WHERE user_id = v_user_id;

    IF FOUND THEN
      v_effective_role := 'artisan';
      v_onboarding_completed := true;
      UPDATE public.profiles
      SET role = 'artisan',
          onboarding_completed = true,
          updated_at = timezone('utc'::text, now())
      WHERE id = v_user_id AND (role IS NULL OR role <> 'artisan');
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'profile', json_build_object(
      'id', v_profile.id,
      'full_name', v_profile.full_name,
      'email', v_profile.email,
      'phone', v_profile.phone,
      'role', v_effective_role,
      'avatar_url', v_profile.avatar_url,
      'onboarding_completed', v_onboarding_completed,
      'profile_completed', v_profile_completed,
      'created_at', v_profile.created_at,
      'updated_at', v_profile.updated_at
    ),
    'role', v_effective_role,
    'onboarding_completed', v_onboarding_completed,
    'profile_completed', v_profile_completed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 5. RPC: saveUserRole(p_role text)
CREATE OR REPLACE FUNCTION public.save_user_role(p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_role text;
  v_email text;
  v_name text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required. Please log in first.'
    );
  END IF;

  -- Validate role input
  IF p_role IS NULL OR p_role NOT IN ('customer', 'artisan') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role. Must be either "customer" or "artisan".'
    );
  END IF;

  -- Check existing profile
  SELECT role INTO v_current_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    SELECT email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
    INTO v_email, v_name
    FROM auth.users
    WHERE id = v_user_id;

    INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed, created_at, updated_at)
    VALUES (
      v_user_id,
      v_email,
      v_name,
      p_role,
      true,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );

    v_current_role := p_role;
  ELSE
    -- If role is already set and differs from requested role, prevent overwriting
    IF v_current_role IS NOT NULL AND v_current_role <> p_role THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Role is already set to "' || v_current_role || '" and cannot be modified.'
      );
    END IF;

    UPDATE public.profiles
    SET role = p_role,
        onboarding_completed = true,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_user_id;
  END IF;

  -- If artisan, ensure artisan_profiles row exists
  IF p_role = 'artisan' THEN
    INSERT INTO public.artisan_profiles (user_id, business_name, created_at, updated_at)
    VALUES (v_user_id, coalesce(v_name, 'Artisan Craft'), timezone('utc'::text, now()), timezone('utc'::text, now()))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN json_build_object(
    'success', true,
    'role', p_role,
    'onboarding_completed', true,
    'message', 'Role successfully assigned.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_user_role(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.save_user_role(text) TO authenticated;

-- Backwards-compatibility wrapper for set_user_role
CREATE OR REPLACE FUNCTION public.set_user_role(selected_role text DEFAULT NULL, new_role text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := coalesce(selected_role, new_role);
  RETURN public.save_user_role(v_role);
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_user_role(text, text) TO authenticated;

-- 6. Row Level Security Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view artisan profiles in profiles" ON public.profiles;
CREATE POLICY "Public can view artisan profiles in profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated, anon
  USING (role = 'artisan');

DROP POLICY IF EXISTS "Users can update own profile non-role fields" ON public.profiles;
CREATE POLICY "Users can update own profile non-role fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      OR (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Artisans can view own artisan profile" ON public.artisan_profiles;
CREATE POLICY "Artisans can view own artisan profile"
  ON public.artisan_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view artisan profiles" ON public.artisan_profiles;
CREATE POLICY "Anyone can view artisan profiles"
  ON public.artisan_profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Artisans can insert own artisan profile" ON public.artisan_profiles;
CREATE POLICY "Artisans can insert own artisan profile"
  ON public.artisan_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'artisan'
    )
  );

DROP POLICY IF EXISTS "Artisans can update own artisan profile" ON public.artisan_profiles;
CREATE POLICY "Artisans can update own artisan profile"
  ON public.artisan_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

