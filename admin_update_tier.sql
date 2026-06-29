-- ============================================================================
-- RPC: admin_update_tier
-- ============================================================================
-- Note on Schema Amendment: This function fulfills the ADMIN-2 requirement to
-- move date math server-side natively (using PostgreSQL intervals), avoiding
-- client-side JS arithmetic. It leverages the "Scope Amendment" rule in CLAUDE.md
-- which permits schema changes for operations RLS legitimacy blocks from the client,
-- or when persisted logic requires it.
-- ============================================================================

create or replace function public.admin_update_tier(target_user_id uuid, new_tier text)
returns void
language plpgsql
security definer
as $$
declare
  current_tier text;
  new_weight int;
  current_weight int;
begin
  -- 1. Explicit Security Definer check: Must be an admin
  -- Re-uses the existing public.is_admin() function to ensure only admins can run this.
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can update tiers';
  end if;

  -- 2. Verify the new_tier is a valid enum value to prevent cast errors bubbling up ungracefully
  if new_tier not in ('free', 'student', 'professional', 'enterprise') then
    raise exception 'invalid input value for enum: %', new_tier;
  end if;

  -- 3. Fetch the current tier to determine if this is an upgrade or downgrade
  select plan_tier::text into current_tier
  from public.subscriptions
  where user_id = target_user_id;

  if not found then
    raise exception 'Subscription not found for user';
  end if;

  -- 4. Calculate tier weights
  new_weight := case new_tier
    when 'free' then 1
    when 'student' then 2
    when 'professional' then 3
    when 'enterprise' then 4
  end;

  current_weight := case current_tier
    when 'free' then 1
    when 'student' then 2
    when 'professional' then 3
    when 'enterprise' then 4
    else 0
  end;

  -- 5. Execute conditional update
  if new_weight > current_weight then
    -- UPGRADE: Reset the period to grant a full 30 days on the new tier starting NOW.
    update public.subscriptions
    set 
      plan_tier = new_tier::public.subscription_tier,
      current_period_start = now(),
      current_period_end = now() + interval '30 days',
      updated_at = now()
    where user_id = target_user_id;
  else
    -- DOWNGRADE / LATERAL: Only update the tier and updated_at. 
    -- Preserves the user's current billing cycle instead of punitively shrinking it.
    update public.subscriptions
    set 
      plan_tier = new_tier::public.subscription_tier,
      updated_at = now()
    where user_id = target_user_id;
  end if;
end;
$$;

comment on function public.admin_update_tier is 'Allows admins to override a user tier. Upgrades reset the 30-day cycle; downgrades/lateral moves preserve the current cycle.';
