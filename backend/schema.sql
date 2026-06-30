
-- ROOT-CAUSE FIX THIS FILE ENFORCES:
--   Tier lives ONLY in subscriptions.plan_tier. There is no profiles.tier
--   column anywhere below. If you ever see a query referencing profiles.tier
--   in backend code after this, that code is wrong by definition — reject it.
-- ============================================================================
-- ORDER MATTERS in this file. Do not reorder sections. Run as one paste.
-- ============================================================================


-- ============================================================================
-- SECTION 0 — EXTENSIONS
-- ============================================================================
-- gen_random_uuid() requires pgcrypto on older Postgres; Supabase's default
-- Postgres (15+) ships pgcrypto already, but this is harmless if it already exists.
create extension if not exists "pgcrypto";


-- ============================================================================
-- SECTION 1 — ENUM TYPES
-- ============================================================================

-- The single source of truth for plan/tier values. Referenced ONLY from
-- subscriptions.plan_tier. Never add a tier/plan column to profiles.
create type subscription_tier as enum ('free', 'student', 'professional', 'enterprise');

-- Used by subscriptions to distinguish an active mocked subscription from
-- one that has lapsed/cancelled. This is a mocked billing system — no real
-- payment processor — but we still track lifecycle state explicitly rather
-- than inferring it from dates alone.
create type subscription_status as enum ('active', 'cancelled', 'past_due');


-- ============================================================================
-- SECTION 2 — TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 profiles
-- User-facing metadata only. NEVER a tier/plan column on this table.
-- Tier lives exclusively in subscriptions.plan_tier (see section 2.4 of the
-- roadmap doc). One row per auth.users row, same primary key as the auth UID.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User metadata only. Tier/plan is NEVER stored here — see subscriptions.plan_tier.';

-- ----------------------------------------------------------------------------
-- 2.2 subscriptions
-- THE single source of truth for plan_tier. One row per user, created
-- automatically by handle_new_user() (section 3) at signup, defaulted to 'free'.
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_tier subscription_tier not null default 'free',
  status subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  -- 30-day mocked billing cycle. Explicitly an INTERVAL add, not a hardcoded
  -- future date — this is the exact bug class that produced the ~100-year
  -- current_period_end value in the prior build. Verify this with a real
  -- SELECT after seeding a row; do not trust this comment alone.
  current_period_end timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is 'Single source of truth for plan_tier. No equivalent column should ever exist on profiles.';

-- ----------------------------------------------------------------------------
-- 2.3 uploads
-- IMMUTABLE. No deleted_at column — this is intentional. This table is the
-- ground truth for quota counting. A soft-deleted report must NOT reduce
-- a user's upload count, which is why quota math must always query this
-- table, never the reports table.
-- ----------------------------------------------------------------------------
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,        -- path inside the fabric-images bucket
  file_size_bytes bigint,
  ai_model text not null default 'standard',  -- see note below on ai_model
  created_at timestamptz not null default now()
);

comment on table public.uploads is 'Immutable. No deleted_at by design — this is the quota ground truth, never refunded by report deletion.';

-- NOTE on ai_model: this is intentionally a plain `text` column, not a
-- Postgres enum. The roadmap doc (section 2.1) flags that the exact set of
-- values the frontend's ai_model selector sends is not fully confirmed from
-- code alone. Using `text` here means the backend (Python) can validate
-- against an explicit allow-list and reject anything unexpected with a
-- clean 422 — without requiring a schema migration if the frontend turns
-- out to send a value not anticipated today. If/when the value set is
-- confirmed, consider tightening this to a check constraint as a follow-up,
-- not as part of this rebuild.

-- ----------------------------------------------------------------------------
-- 2.4 reports
-- Soft-delete via deleted_at. upload_id FK to uploads. ON DELETE CASCADE is
-- a deliberate choice here: uploads rows are never deleted by normal app
-- flow (see 2.3), so cascade only matters if a future cleanup job hard-
-- deletes uploads — at which point cascading the dependent report away is
-- the correct behavior, not a silent data-integrity bug. Documented here so
-- this is a stated decision, not an oversight.
-- ----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  image_url text not null,
  thread_density numeric(6,2) not null,
  warp_count integer not null,
  weft_count integer not null,
  fabric_type text not null,
  confidence_score numeric(5,2) not null,
  ai_suggestions text[] not null default '{}',  -- ARRAY, never a single string
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.reports is 'deleted_at = soft delete. ai_suggestions MUST be inserted as a text[] array, never a single string — Results page renders this as a list.';
comment on column public.reports.ai_suggestions is 'Must be a Postgres array (text[]). The API contract requires ai_suggestions to be a JSON array of strings.';

-- ----------------------------------------------------------------------------
-- 2.5 notifications
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2.6 contact_messages
-- Public-facing contact form writes here. Anonymous INSERT only — see RLS
-- section. No one (not even the submitter) can read these back via the API;
-- only reviewed via Supabase Dashboard / service role.
-- ----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- SECTION 3 — NEW USER TRIGGER (handle_new_user equivalent)
-- ============================================================================
-- Fires on every new auth.users row. Inserts a profiles row AND a
-- subscriptions row defaulted to 'free'. This is what makes "every new
-- signup automatically gets a free-tier subscription, no manual step"
-- actually true — verify this with a real signup test in Phase 3, not by
-- reading this function and assuming it works.
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username'
  );

  insert into public.subscriptions (user_id, plan_tier, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user is 'Fires after every Supabase Auth signup. Creates profiles + subscriptions(plan_tier=free) rows automatically. Verify with a real signup, not code review alone.';


-- ============================================================================
-- SECTION 4 — UPDATED_AT AUTO-TOUCH TRIGGERS (small QoL, optional but cheap)
-- ============================================================================
-- Keeps updated_at honest without relying on application code to remember.

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- SECTION 5 — INDEXES
-- ============================================================================
-- Supporting the actual access patterns: per-user lookups, history search/
-- filter (fabric_type, confidence_score, created_at), and quota counting.

create index idx_uploads_user_id on public.uploads (user_id);
create index idx_reports_user_id on public.reports (user_id);
create index idx_reports_upload_id on public.reports (upload_id);
create index idx_reports_deleted_at on public.reports (deleted_at);
create index idx_reports_fabric_type on public.reports (fabric_type);
create index idx_reports_created_at on public.reports (created_at desc);
create index idx_notifications_user_id on public.notifications (user_id);
create index idx_subscriptions_user_id on public.subscriptions (user_id);


-- ============================================================================
-- SECTION 6 — ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Per roadmap rule: EVERY table gets RLS enabled. Minimum bar per table:
-- users can read/write their own rows, nobody can read/write others' rows.
-- Explicitly stated below which tables (if any) allow public access — only
-- contact_messages gets a public policy, and it is INSERT-only, no SELECT.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.uploads enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;

-- ----------------------------------------------------------------------------
-- 6.1 profiles — user can read/update only their own row. No insert policy
-- for authenticated users: rows are created exclusively by the trigger
-- (which runs as security definer and bypasses RLS), so client-side INSERT
-- is intentionally not permitted.
-- ----------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 6.2 subscriptions — user can READ their own row only.
-- Deliberately NO update policy for authenticated users: plan_tier changes
-- go through controlled paths (mocked checkout flow / backend logic with
-- elevated privileges), not arbitrary client-side writes. This was flagged
-- as "never verified" in the prior project's open items — stated explicitly
-- here as a deliberate decision, not an oversight: if you need users to be
-- able to self-service something via a direct table write, that needs a
-- dedicated policy added intentionally, not a broad one.
-- ----------------------------------------------------------------------------
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6.3 uploads — user can SELECT and INSERT their own rows only.
-- No update/delete policy: uploads is immutable by design (section 2.3).
-- ----------------------------------------------------------------------------
create policy "uploads_select_own"
  on public.uploads for select
  using (auth.uid() = user_id);

create policy "uploads_insert_own"
  on public.uploads for insert
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6.4 reports — user can SELECT, UPDATE (for soft-delete via deleted_at),
-- and INSERT their own rows. No hard DELETE policy — soft-delete only,
-- enforced at the RLS layer by simply not granting delete.
-- ----------------------------------------------------------------------------
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "reports_update_own"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6.5 notifications — user can SELECT and UPDATE (mark-as-read) their own.
-- ----------------------------------------------------------------------------
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6.6 contact_messages — the ONE intentional public policy in this schema.
-- INSERT-only for anon AND authenticated roles. No SELECT policy exists for
-- anyone except via the Supabase Dashboard (which uses the service role and
-- bypasses RLS entirely) — this is deliberate: submitters should never be
-- able to read back the contact_messages table, including their own row.
-- ----------------------------------------------------------------------------
create policy "contact_messages_insert_anyone"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Explicitly no select/update/delete policy on contact_messages for anyone
-- other than the service role. This is intentional, not an omission.


-- ============================================================================
-- SECTION 7 — STORAGE BUCKET: fabric-images
-- ============================================================================
-- Public bucket (read access is public — needed so image_url in the API
-- response resolves to a publicly loadable image without signed URLs).
-- Write access (upload/delete) is restricted to the owning user via storage
-- RLS policies on storage.objects, keyed off a per-user folder path
-- convention: fabric-images/{user_id}/{filename}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('fabric-images', 'fabric-images', true)
on conflict (id) do nothing;

-- Public read: anyone can view files in this bucket (required for image_url
-- to work as a plain public link in the API response / <img> tags).
create policy "fabric_images_public_read"
  on storage.objects for select
  using (bucket_id = 'fabric-images');

-- Authenticated users may upload ONLY into a folder matching their own
-- user_id, i.e. the first path segment of the object name must equal
-- auth.uid(). The backend (and any direct-from-client upload code) MUST
-- follow this path convention or uploads will be rejected by RLS.
create policy "fabric_images_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may delete ONLY their own files, same folder
-- convention. Needed so the QA-required "delete report also deletes the
-- storage file" behavior is actually possible to implement correctly.
create policy "fabric_images_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fabric-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No update policy on storage.objects — files are write-once, delete-and-
-- re-upload rather than in-place replaced. Consistent with uploads being
-- immutable (section 2.3).


-- ============================================================================
-- END OF SCHEMA. After running this:
--   1. Confirm all 6 tables exist (Table Editor)
--   2. Confirm fabric-images bucket exists and is public (Storage tab)
--   3. Confirm RLS is "Enabled" (green) on all 6 tables (Table Editor → each
--      table → top right toggle, or Authentication → Policies page)
--   4. Run the verification queries in verify.sql before writing any Python.
-- ============================================================================