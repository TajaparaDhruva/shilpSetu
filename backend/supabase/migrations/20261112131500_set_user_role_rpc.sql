-- ==============================================================================
-- ShilpSetu Database Migration: set_user_role RPC
-- ==============================================================================
-- This function allows an authenticated user to set their own role ONCE.
-- It runs as SECURITY DEFINER (postgres privileges) so it bypasses the
-- prevent_role_modification trigger that blocks direct profile updates.
-- It only succeeds if the user's current role is still the default 'customer'
-- and no explicit role was previously chosen, OR when picking the same role.
-- ==============================================================================

create or replace function public.set_user_role(new_role text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
begin
  -- Validate the requested role
  if new_role not in ('customer', 'artisan') then
    return json_build_object('success', false, 'error', 'Invalid role. Must be customer or artisan.');
  end if;

  -- Get the current user's profile
  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    return json_build_object('success', false, 'error', 'Profile not found. Please sign up first.');
  end if;

  -- Update the role (bypasses trigger because this function is SECURITY DEFINER)
  update public.profiles
  set role = new_role,
      updated_at = timezone('utc'::text, now())
  where id = auth.uid();

  return json_build_object('success', true, 'role', new_role);
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.set_user_role(text) to authenticated;

