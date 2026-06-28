
# CLAUDE.md — ThreadCounty

This file is project memory. Read it in full before making changes. It describes what exists, what doesn't, and the contracts that must not be broken.

## What ThreadCounty Is

An AI-powered textile analysis SaaS. Manufacturers/researchers upload macro images of fabric and get back automated analysis: thread density, warp/weft counts, fabric type, confidence score, and AI suggestions.

This started as a hackathon project. **Mock AI data is explicitly allowed.** The backend returns realistic-looking mock analysis, not real CV inference. Judging weight is on UI/UX polish, responsiveness, and a flawless user flow — not on the AI being real.

## Repo Structure (Monorepo)

```
threadcounty-hackathon/
├── frontend/                 # Next.js — primary ongoing work
│   ├── src/app/
│   ├── src/components/ui/    # Shadcn components
│   ├── src/lib/supabase/     # Supabase clients (browser + server)
│   └── .env.local
└── backend/                  # Python FastAPI
    ├── core/database.py
    ├── routers/upload.py
    ├── services/mock_ai.py
    └── main.py
```

## Current Status

| Layer | Status |
|---|---|
| Backend (FastAPI) | Live. Can be modified when a specific change is justified — see Backend Scope below. |
| Database (Supabase) | Live. Tables + RLS + storage bucket all live. |
| Frontend (Next.js) | Substantially complete. Auth, dashboard, history, upload, results all built. |
| Subscriptions/Payments | Not yet built. Next major work item. |
| Admin Layer | Not yet built. Planned after subscriptions. |

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** Python, FastAPI
- **Database/Auth/Storage:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Payments:** Stripe (to be integrated — see Subscription Architecture below)

## Database State (Supabase) — Reference

Tables: `profiles`, `subscriptions`, `uploads`, `reports`, `notifications`, `contact_messages`.
RLS is active on all of them.
Storage bucket `fabric-images` is public and active.

### Soft-Delete Architecture (MANDATORY — do not hard-delete reports or storage files)

**Hard deletion of reports or storage files by users is prohibited.** This is both a product decision and an abuse-prevention measure.

The abuse loop that must not be enabled: a user uploads a fabric image → gets analysis → downloads the result → deletes the report → repeats, consuming unlimited AI analysis at zero cost by recycling the same quota slot.

**How deletion must work:**
- `reports` rows get soft-deleted: set `deleted_at = now()`, never `DELETE` the row.
- Storage files (in `fabric-images`) are **never deleted by user action.** They are append-only from the user's perspective.
- The UI filters out soft-deleted rows (RLS policy or app-layer `WHERE deleted_at IS NULL` on every query).
- Storage usage shown on dashboard reflects total-ever-uploaded (not current live files) — this is intentional. Storage consumed is consumed from a business standpoint regardless of whether the user "deleted" the report.

**Admin** can hard-delete for GDPR/compliance purposes — this is a separate, privileged operation not exposed to regular users.

### Role System (profiles.role)

`profiles` has a `role` column with values: `'user'` (default), `'admin'`.

This column gates:
- Access to `/admin` routes (middleware + RLS)
- Ability to view all users' data in admin dashboard
- Ability to perform hard-deletes (GDPR compliance path)

Do not invent a separate roles table. `profiles.role` is the single source of truth.

### Subscription Tiers

`subscriptions` table tracks the user's current plan. Plans:

| Plan | Price | Upload limit | Notes |
|---|---|---|---|
| `free` | $0 | 5 uploads/month | Default on signup |
| `pro` | $49/month | 100 uploads/month | Requires real Stripe payment |
| `custom` | Negotiated | Unlimited | Admin-assigned, no self-serve Stripe |

**Billing Logic Note:** Quota is period-scoped via `current_period_start`/`current_period_end`, not cumulative against all-time `uploads` rows. Upgrading resets the period to `now()` and grants a full fresh quota regardless of prior usage in the old period.

`subscriptions` row structure (existing table, add columns if needed but document additions):
- `user_id` — FK to `profiles`
- `plan` — `'free'` | `'pro'` | `'custom'`
- `stripe_customer_id` — Stripe customer ID (null for free/custom)
- `stripe_subscription_id` — Stripe subscription ID (null for free/custom)
- `current_period_end` — timestamp (null for free/custom)
- `status` — `'active'` | `'canceled'` | `'past_due'`

Upload limit enforcement happens server-side (FastAPI or Next.js Route Handler) — count uploads for the current billing period against the plan limit before processing. Return a clear 402/429 with a specific message if exceeded, never a silent failure.

## Backend Scope (Updated)

The backend is **no longer locked.** Backend changes are now in scope when:
1. A feature requires server-side logic that cannot safely be done from the frontend (upload limit enforcement, Stripe webhook handling, admin operations)
2. The change is documented here before the agent makes it
3. The agent explicitly states what it's changing in `backend/` and why, in its response — no silent backend edits

**What still must NOT happen:**
- Changing the `/api/upload` request/response shape without updating this file first
- Adding new endpoints without documenting them here
- Modifying `backend/services/mock_ai.py`'s output shape (the mock AI data contract is still locked — the frontend depends on it)

### Current FastAPI Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/upload` | user_id in FormData | Upload + mock AI analysis |

### New Endpoints to Build (this round)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/usage` | Bearer token | Returns current period upload count + limit for authenticated user |
| POST | `/api/stripe/webhook` | Stripe-Signature header | Handles subscription lifecycle events from Stripe |

## The API Contract — Upload (unchanged, must not be broken)

### `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request payload:**
| Field | Type | Notes |
|---|---|---|
| `file` | File | Raw image file object. Must be an image. |
| `user_id` | string | Real authenticated Supabase Auth UID (mock ID retired) |

**Success response (200):**
```json
{
  "status": "success",
  "message": "Image processed successfully",
  "image_url": "https://[project].supabase.co/storage/v1/object/public/fabric-images/[filename].png",
  "report": {
    "id": "uuid-string",
    "thread_density": 70.89,
    "warp_count": 29,
    "weft_count": 48,
    "fabric_type": "Linen",
    "confidence_score": 91.78,
    "ai_suggestions": [
      "Weave tension appears uniform.",
      "No surface defects detected."
    ]
  }
}
```

**New: 402 response when upload limit exceeded:**
```json
{
  "status": "error",
  "code": "upload_limit_exceeded",
  "message": "You've used all 5 uploads for this month. Upgrade to Pro for 100 uploads/month.",
  "current_count": 5,
  "limit": 5
}
```

### Debugging Rule

If `/api/upload` fails: assume the frontend FormData is malformed first. Common causes:
1. `file` not an actual `File`/`Blob`
2. `user_id` missing
3. `Content-Type` manually set (let browser set multipart boundary)
4. Frontend not on `localhost:3000` (CORS)

## Mandatory Pages (updated)

| Route | Purpose | Status |
|---|---|---|
| `/` | Landing — Hero, Features, Workflow, Testimonials, Pricing | Built |
| `/pricing` | Full pricing page with plan comparison | Built |
| `/about` | About page | Built |
| `/faq` | FAQ page | Built |
| `/contact` | Contact page | Built |
| `/login`, `/signup` | Auth UI | Built |
| `/dashboard` | Welcome, stats, recent reports, quick actions | Built |
| `/dashboard/upload` | Drag-and-drop upload + loading state | Built |
| `/dashboard/results/[id]` | Results view with AI data | Built |
| `/dashboard/history` | Full report history with search/filter/delete | Built |
| `/dashboard/profile` | User profile + subscription status | Built |
| `/dashboard/billing` | Upgrade to Pro, Stripe Checkout | **To build** |
| `/admin` | Admin dashboard (role-gated) | **To build** |
| `/admin/users` | User management | **To build** |

### Read vs. Write Architecture

FastAPI handles: uploads (POST /api/upload), upload limit checks, Stripe webhook.
Supabase handles: all reads — reports, dashboard stats, history, profile, subscription status.
Never proxy Supabase reads through FastAPI.

## Design Bar

- Dark mode supported on every page
- Framer Motion for meaningful transitions
- Shadcn UI component baseline
- Full mobile responsiveness
- Upload loading state narrates fake progress ("Analyzing weave tension…", "Calculating thread density…")
- Every page passes the design-system self-check in SKILL.md before being called done

## Known Limitations (document here, not just in chat)

- **Email confirmation disabled:** Supabase email confirmation is off. The `/auth/confirm` route, "check your email" UI, and unverified-account rejection logic are dead code paths. This was a deliberate hackathon tradeoff (Resend sandbox recipient restriction). Document in README.
- **Remember Me:** Implementation status (Option A vs Option B) must be confirmed and documented here once verified.
- **Search debounce race condition:** Status of abort controller / stale-request fix must be confirmed.
- **ID search:** Whether partial-match or field-dropped — must be confirmed.
- **Contact form:** Was broken (anonymous Supabase insert blocked by RLS, form showed false success). Fixed via Next.js Route Handler with service-role key. Confirm this is actually live.
- **Soft-delete enforcement:** `profiles.deleted_at` soft-delete for account deletion — confirm whether session/middleware actually checks this flag or it's currently write-only.

## Hard Constraints (revised)

- Do not change the `/api/upload` response shape without updating this file first.
- Do not modify `backend/services/mock_ai.py` output structure.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or Stripe secret keys to the browser — service-role and payment operations must go through server-side Route Handlers or FastAPI.
- Do not hard-delete storage files on user-initiated "delete report" actions. Soft-delete only.
- `"use client"` only where interactivity requires it.
- Do not build admin features that aren't role-checked at both middleware AND database (RLS) level — one layer is not enough.

## Scope Amendment — Supabase Schema & Next.js Route Handlers (added 2026-06-25)

The original "no backend changes" constraint applied to a build that had no reason
to touch the database schema. That has changed. The following is now **explicitly
in scope**, separate from and not a loosening of the FastAPI lock below:

**Now in scope:**
- Supabase schema changes (new columns, new tables, new RLS policies) via the
  Supabase Dashboard or a tracked SQL migration — when a feature genuinely
  requires persisted state that doesn't exist yet (e.g. a user tier/role column).
- New Next.js Route Handlers (`app/api/.../route.ts`) that use
  `SUPABASE_SERVICE_ROLE_KEY` server-side for operations RLS legitimately
  blocks from the client (e.g. an anonymous contact-form insert, an
  admin-only write). The service-role key must never be exposed to the
  client or bundled into client-side code.
- Adjusting existing RLS policies when a new role/tier genuinely requires
  different read/write rules than currently exist.

**Still explicitly out of scope — this part is unchanged:**
- No FastAPI/Python code changes, anywhere, for any reason.
- No changes to the `/api/upload` request or response contract.
- No new FastAPI endpoints, including to "make a feature easier" — if new
  server-side logic is needed, it goes in a Next.js Route Handler, not Python.
- The CORS/local-dev backend configuration is unchanged.

**Any schema change must be reported back explicitly** — the exact SQL or
Dashboard change made, on which table, and why — using the same disclosure
standard already required elsewhere in this build for schema verification
(see the Dashboard/History build's schema-introspection step). Do not make
a schema change silently as a side effect of an unrelated feature.
