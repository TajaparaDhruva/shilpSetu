-- ==============================================================================
-- ShilpSetu Database Migration: Product Details Backend Functionality
-- Migration: product_details_backend.sql (20261113130000_product_details_backend.sql)
-- ==============================================================================

-- 1. Ensure Public Artisan Profiles View (Exposes only safe public fields, no private email/phone)
create or replace view public.artisan_public_profiles as
select
  ap.user_id as artisan_id,
  coalesce(ap.business_name, p.full_name, 'Skilled Indian Artisan') as name,
  p.avatar_url as profile_picture,
  coalesce(ap.location, 'India') as location,
  ap.description as public_description,
  ap.craft_type,
  ap.experience_years,
  ap.is_verified,
  ap.created_at
from public.artisan_profiles ap
left join public.profiles p on ap.user_id = p.id;

-- 2. Ensure Product Details View with Calculated Discount & Dynamic Review Aggregates
create or replace view public.product_details_view as
select
  p.id as product_id,
  p.name,
  p.description,
  coalesce(p.category_name, p.category, 'Handicrafts') as category,
  p.price as selling_price,
  p.original_price,
  case
    when p.original_price is not null and p.original_price > p.price and p.price > 0
    then round((((p.original_price - p.price) / p.original_price) * 100)::numeric, 0)
    else 0
  end as discount_percentage,
  p.stock as available_stock,
  case
    when p.image_urls is not null and array_length(p.image_urls, 1) > 0
    then p.image_urls
    when p.image_url is not null and p.image_url <> ''
    then array[p.image_url]
    else array[]::text[]
  end as product_images,
  coalesce(p.tags, array[]::text[]) as tags,
  p.created_at,
  p.is_active,
  p.artisan_id,
  -- Public Artisan Details Join
  app.name as artisan_name,
  app.profile_picture as artisan_avatar,
  app.location as artisan_location,
  app.public_description as artisan_description,
  -- Dynamic Rating & Reviews
  prv.avg_rating as rating,
  coalesce(prv.total_reviews, 0) as reviews_count
from public.products p
left join public.artisan_public_profiles app on p.artisan_id = app.artisan_id
left join public.product_ratings_view prv on p.id = prv.product_id;

-- 3. Stored RPC: get_product_details(p_product_id)
-- Fetches full details for an active product, including public artisan details & ratings
create or replace function public.get_product_details(p_product_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result json;
begin
  select json_build_object(
    'id', pd.product_id,
    'name', pd.name,
    'description', pd.description,
    'category', pd.category,
    'price', pd.selling_price,
    'original_price', pd.original_price,
    'discount_percentage', pd.discount_percentage,
    'stock', pd.available_stock,
    'image_urls', pd.product_images,
    'tags', pd.tags,
    'created_at', pd.created_at,
    'is_active', pd.is_active,
    'rating', pd.rating,
    'reviews_count', pd.reviews_count,
    'artisan_id', pd.artisan_id,
    'artisan_name', pd.artisan_name,
    'artisan_avatar', pd.artisan_avatar,
    'artisan_location', pd.artisan_location,
    'artisan_description', pd.artisan_description
  )
  into v_result
  from public.product_details_view pd
  where pd.product_id = p_product_id
    and (pd.is_active = true or auth.uid() = pd.artisan_id);

  return v_result;
end;
$$;

-- 4. Stored RPC: check_wishlist(p_product_id)
-- Checks whether a product exists in current authenticated user's wishlist
create or replace function public.check_wishlist(p_product_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_exists boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.wishlist
    where user_id = v_user_id and product_id = p_product_id
  ) into v_exists;

  return v_exists;
end;
$$;

-- 5. Stored RPC: add_to_wishlist_safe(p_product_id)
-- Adds product to wishlist, ensuring product exists, is active, and prevents duplicates
create or replace function public.add_to_wishlist_safe(p_product_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_is_active boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Authentication required');
  end if;

  -- Validate product exists and is active
  select is_active into v_is_active
  from public.products
  where id = p_product_id;

  if not found then
    return json_build_object('success', false, 'error', 'Product not found');
  end if;

  if not v_is_active then
    return json_build_object('success', false, 'error', 'Product is currently inactive');
  end if;

  -- Insert ignoring duplicate
  insert into public.wishlist (user_id, product_id, created_at)
  values (v_user_id, p_product_id, timezone('utc'::text, now()))
  on conflict (user_id, product_id) do nothing;

  return json_build_object(
    'success', true,
    'product_id', p_product_id,
    'in_wishlist', true
  );
end;
$$;

-- 6. Stored RPC: remove_from_wishlist_safe(p_product_id)
create or replace function public.remove_from_wishlist_safe(p_product_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Authentication required');
  end if;

  delete from public.wishlist
  where user_id = v_user_id and product_id = p_product_id;

  return json_build_object(
    'success', true,
    'product_id', p_product_id,
    'in_wishlist', false
  );
end;
$$;

-- 7. Grant Permissions
grant select on public.artisan_public_profiles to anon, authenticated;
grant select on public.product_details_view to anon, authenticated;
grant execute on function public.get_product_details to anon, authenticated;
grant execute on function public.check_wishlist to authenticated;
grant execute on function public.add_to_wishlist_safe to authenticated;
grant execute on function public.remove_from_wishlist_safe to authenticated;
