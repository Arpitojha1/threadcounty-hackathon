-- ============================================================================
-- THREADCOUNTY — PHASE 1 VERIFICATION QUERIES
-- Run AFTER schema.sql succeeds. Run EACH block separately and actually look
-- at the output — this is the "produce a plain-English column table and
-- confirm zero mismatches" step from the roadmap. Don't skip this because
-- schema.sql ran without error; "ran without error" is not the same as
-- "matches what the backend will assume."
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. COLUMN INVENTORY — the source of truth table to check Phase 2 Python
--    against, column by column, before writing a single FastAPI query.
-- ----------------------------------------------------------------------------
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- Expected tables in the output above: contact_messages, notifications,
-- profiles, reports, subscriptions, uploads.
-- CONFIRM: no table_name = 'profiles' row has column_name = 'tier'.
-- That exact absence is the root-cause fix this rebuild exists for.


-- ----------------------------------------------------------------------------
-- 2. CONFIRM RLS IS ENABLED ON EVERY TABLE
-- ----------------------------------------------------------------------------
select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public';

-- Expected: rls_enabled = true for all 6 tables. If any row shows false,
-- RLS did not get enabled — do not proceed to Phase 2 until this is true
-- for every row.


-- ----------------------------------------------------------------------------
-- 3. LIST ALL POLICIES — sanity check against section 6 of schema.sql
-- ----------------------------------------------------------------------------
select
  schemaname,
  tablename,
  policyname,
  cmd as applies_to_command,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- Walk this list against schema.sql section 6 by hand:
--   profiles: select_own, update_own (2 policies, no insert/delete)
--   subscriptions: select_own only (1 policy — no update for authenticated)
--   uploads: select_own, insert_own (no update/delete)
--   reports: select_own, insert_own, update_own (no delete)
--   notifications: select_own, update_own (no insert/delete)
--   contact_messages: insert_anyone only (no select/update/delete)
-- If anything here doesn't match, something ran out of order or partially —
-- re-check before moving on.


-- ----------------------------------------------------------------------------
-- 4. CONFIRM STORAGE BUCKET + STORAGE POLICIES
-- ----------------------------------------------------------------------------
select id, name, public from storage.buckets where id = 'fabric-images';
-- Expected: one row, public = true.

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects';
-- Expected: fabric_images_public_read (select), fabric_images_insert_own_folder
-- (insert), fabric_images_delete_own_folder (delete).


-- ----------------------------------------------------------------------------
-- 5. END-TO-END TRIGGER TEST (run this in the Supabase Dashboard, NOT via
--    the API) — confirms handle_new_user() actually fires correctly.
-- ----------------------------------------------------------------------------
-- Easiest way to test this without a real signup: go to
-- Authentication → Users → Add User (Dashboard UI) with a throwaway email,
-- then immediately run:

select
  u.id,
  u.email,
  p.full_name,
  s.plan_tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  (s.current_period_end - s.current_period_start) as period_length
from auth.users u
left join public.profiles p on p.id = u.id
left join public.subscriptions s on s.user_id = u.id
order by u.created_at desc
limit 5;

-- CONFIRM, for the user you just created:
--   - profiles row exists (full_name may be null, that's fine)
--   - subscriptions row exists with plan_tier = 'free', status = 'active'
--   - period_length reads as "30 days" — NOT ~100 years, NOT null.
--     This exact check is what catches the date-math bug from the prior
--     build before it ever reaches Python code.


-- ----------------------------------------------------------------------------
-- 6. CLEANUP — delete the throwaway test user after step 5
-- ----------------------------------------------------------------------------
-- Do this via Dashboard → Authentication → Users → delete the test user
-- (cascades to profiles/subscriptions automatically via ON DELETE CASCADE).
-- Confirm afterward that the profiles/subscriptions rows are actually gone:

-- select * from public.profiles where id = '<paste-test-user-id>';
-- select * from public.subscriptions where user_id = '<paste-test-user-id>';
-- Both should return zero rows.