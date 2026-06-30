# ThreadCounty

ThreadCounty is a modern web application that provides AI-powered textile analysis. Users can upload images of fabrics and receive detailed reports including thread density, warp/weft counts, and fabric type identification.

## Live Demo

- **Frontend Application**: [https://threadcounty-hackathon.vercel.app](https://threadcounty-hackathon.vercel.app)
- **Backend API**: `https://threadcounty-hackathon-production.up.railway.app`
- *Note: For the purposes of this hackathon demo, the AI analysis engine is fully mocked. Uploading an image triggers a simulated processing delay and returns randomly generated, plausible textile data.*

**To try the demo:**
1. Visit the live URL and sign up for an account.
2. Navigate to the dashboard and upload a clear image of a fabric.
3. View the generated textile report detailing the mock AI analysis results.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS v4, shadcn/ui components, Framer Motion.
- **Backend**: FastAPI (Python 3), Uvicorn.
- **Database, Auth & Storage**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage).
- **Deployment**: Vercel (Frontend), Railway (Backend).

## Architecture Overview

ThreadCounty uses a deliberate read/write split architecture:
- **FastAPI Backend**: Handles the `POST /api/upload` endpoint and the mocked AI processing step exclusively. Deployed on Railway.
- **Next.js Frontend**: All reads (fetching reports, notifications, user profiles) and direct user interactions (like marking notifications as read) are executed securely via the Supabase client directly against the database, bypassing the FastAPI backend entirely.

This avoids building a redundant secondary backend layer for standard CRUD operations that Supabase can already serve efficiently.

### Repository Structure

```
threadcounty-hackathon/
├── frontend/             # Next.js Application
│   ├── public/           # Static assets
│   └── src/
│       ├── app/          # Next.js App Router pages & API routes
│       ├── components/   # UI components (shadcn & custom)
│       └── lib/          # Supabase client configurations
├── backend/              # FastAPI Application
│   ├── core/             # Database connection setup
│   ├── routers/          # API endpoints (upload.py)
│   └── services/         # Mock AI implementation
├── _stale/               # Archived planning documents
└── scripts/              # Helper scripts
```

## Database Schema

The database consists of 6 primary tables in the `public` schema. *(Note: The repository contains `schema.sql` as a provisioning script, but the live database has drifted slightly — e.g. `profiles.is_admin` exists in production but not in the original script.)*

- **`profiles`**: User metadata (full name, username, avatar, `is_admin` flag).
- **`subscriptions`**: The single source of truth for a user's plan tier (free, student, professional, enterprise) and quota cycle.
- **`uploads`**: Immutable log of all image uploads. Used as the ground truth for quota tracking.
- **`reports`**: The result of the AI analysis. Contains fabric metrics and soft-delete capabilities.
- **`notifications`**: User alerts and messages.
- **`contact_messages`**: Publicly submitted contact form inquiries (Insert-only for users).

Full live column inventory:

```text
Table: profiles
  - id: uuid
  - full_name: text
  - username: text
  - avatar_url: text
  - is_admin: boolean | default: false (manual flag, no self-service signup path)
  - created_at: timestamptz | default: now()
  - updated_at: timestamptz | default: now()

Table: subscriptions
  - id: uuid | default: gen_random_uuid()
  - user_id: uuid
  - plan_tier: subscription_tier enum | default: free
  - status: subscription_status enum | default: active
  - current_period_start: timestamptz | default: now()
  - current_period_end: timestamptz | default: now() + 30 days
  - created_at: timestamptz | default: now()
  - updated_at: timestamptz | default: now()

Table: uploads
  - id: uuid | default: gen_random_uuid()
  - user_id: uuid
  - file_path: text
  - file_size_bytes: bigint
  - ai_model: text | default: standard
  - created_at: timestamptz | default: now()

Table: reports
  - id: uuid | default: gen_random_uuid()
  - user_id: uuid
  - upload_id: uuid
  - image_url: text
  - thread_density: numeric
  - warp_count: integer
  - weft_count: integer
  - fabric_type: text
  - confidence_score: numeric
  - ai_suggestions: text[]
  - deleted_at: timestamptz (soft delete)
  - created_at: timestamptz | default: now()

Table: notifications
  - id: uuid | default: gen_random_uuid()
  - user_id: uuid
  - title: text
  - body: text
  - is_read: boolean | default: false
  - created_at: timestamptz | default: now()

Table: contact_messages
  - id: uuid | default: gen_random_uuid()
  - name: text
  - email: text
  - message: text
  - created_at: timestamptz | default: now()
```

**Row-Level Security**: All 6 tables have RLS enabled. Standard policy shape is "users can read/write only their own rows," with `contact_messages` as the sole exception (public insert-only, no select for anyone but the service role). The exact live policy list could not be re-introspected via the REST API for this document (`pg_policies` isn't exposed through the schema cache without a direct Postgres connection), but this matches what `schema.sql` defines and was manually spot-checked during development.

## API Documentation

The FastAPI backend exposes one endpoint for AI processing. All other reads/writes go directly through the Supabase client from the frontend (see Architecture Overview).

### `POST /api/upload`

**Base URL**: `https://threadcounty-hackathon-production.up.railway.app`

**Content-Type:** `multipart/form-data`

**Request fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | Must be an image. |
| `user_id` | string | Yes | Supabase Auth UID of the uploading user. |
| `ai_model` | string | No | Defaults to `"standard"`. |

**Success response — `200 OK`:**
```json
{
  "status": "success",
  "message": "Image processed successfully",
  "image_url": "https://wlrsmo...supabase.co/storage/v1/object/public/fabric-images/...",
  "report": {
    "id": "uuid-string",
    "thread_density": 105.42,
    "warp_count": 45,
    "weft_count": 60,
    "fabric_type": "Cotton Twill",
    "confidence_score": 95.5,
    "ai_suggestions": [
      "Weave tension appears uniform.",
      "No surface defects detected."
    ]
  }
}
```

**Error responses:**

| Status | When | Example body |
|---|---|---|
| `400` / `422` | Missing `file` or `user_id`, or `file` is not a valid image | `{"detail": "A valid image file is required."}` |
| `402` / `403` | User has hit their plan tier's monthly upload quota | `{"detail": "Upload limit reached for your current plan."}` |
| `500` | Unexpected server-side failure (sanitized — no raw Postgres/Supabase error text is ever returned to the client) | `{"detail": "Something went wrong processing your upload."}` |

Quota limits are tracked against the immutable `uploads` table (never `reports`, since soft-deleted reports must not refund quota) and scoped to each user's current 30-day `subscriptions` billing period, not a calendar month.

**Known gap**: the backend's tier-limits mapping currently only has explicit entries for `free`, and the original intended entries for `student`/`professional`/`enterprise` are missing — those tiers silently fall back to the free tier's limit (5/period) rather than their intended higher limits. This is a known, accepted hackathon-scope gap, not a bug fixed before submission.

**CORS**: the Railway backend's CORS policy allowlists the live Vercel frontend origin. A real upload from the deployed Vercel site through to the Railway backend has been tested and confirmed working end-to-end (not just configured — actually verified).

## Design System

The application employs a refined "neo-brutalist" aesthetic. Key elements include hard-edged components with offset shadows, high-contrast borders, and cut-corner paneling to create a technical, tactile feel appropriate for an engineering tool. Check `frontend/SKILLS.md` in the repository for the full styling specification.

## Local Development Setup

**No setup is required to try the product** — the Live Demo links above are fully functional and connected to the real production database. The steps below are only needed if you want to run ThreadCounty yourself, against your own Supabase project (e.g. to inspect the code running live, or modify it).

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- A Supabase account (free tier is enough) — you will create your own project, this app does not require access to the original one

### 1. Create and Provision a Supabase Project
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and run the entire contents of `backend/schema.sql` (or wherever it lives in your copy of the repo) as one paste. This creates all 6 tables, the `subscription_tier`/`subscription_status` enums, the `handle_new_user()` signup trigger, RLS policies, and the `fabric-images` storage bucket.
3. **Known drift**: `schema.sql` does not include the `profiles.is_admin` column that exists on the live production database (see Known Limitations). After running the schema, also run:
   ```sql
   alter table public.profiles add column is_admin boolean not null default false;
   ```
4. Run the verification queries in `backend/verify.sql` (one block at a time, reading the actual output) to confirm: all 6 tables exist, RLS is enabled on each, the storage bucket exists and is public, and the signup trigger correctly creates both a `profiles` and `subscriptions` row. Don't skip this — "the SQL ran without error" is not the same as "matches what the app expects."
5. From your new project's Settings → API page, collect: the Project URL, the `anon` public key, and the `service_role` key (keep this one secret).

### 2. Environment Variables
**Do not commit actual secrets.**

**`frontend/.env.local`** requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_URL` — defaults to `http://127.0.0.1:8000` for local dev; production deployment points this at the Railway URL above instead.

**`backend/.env`** requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the values collected in step 1.5 above for both files — they point at your own fresh Supabase project, not the original one.

### 3. Running the Backend
```bash
cd backend
python -m venv venv
# Activate venv (e.g., `venv\Scripts\activate` on Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Granting Yourself Admin Access
There is no signup flow for this — see Known Limitations. After signing up through the running app, run this in your Supabase SQL Editor, using the UID from `auth.users` (or `profiles`) for the account you want elevated:
```sql
update public.profiles set is_admin = true where id = '<your-user-uuid-here>';
```

## Deployment

- **Frontend**: Deployed continuously via Vercel at `https://threadcounty-hackathon.vercel.app`.
- **Backend**: Deployed on Railway at `https://threadcounty-hackathon-production.up.railway.app`.
- **CORS**: The FastAPI backend is configured to accept requests from both `http://localhost:3000` (local dev) and the production Vercel frontend URL. This has been confirmed working against a real upload from the live deployed site, not just by code review.

## Known Limitations

This is a hackathon project, purpose-built for a weekend judging window — not a production system. The following are intentional scope decisions, not oversights:

- **Mock AI Analysis**: As permitted by the hackathon rules, the computer vision engine is completely mocked. Uploads return realistic-looking randomized textile data rather than real CV inference.
- **Mocked Billing/Checkout**: The student/professional/enterprise upgrade flow has no real payment processor behind it. Plan changes happen instantly with no actual transaction.
- **Admin Access — Manual Only**: There is no signup flow or in-app UI to become an admin. To grant admin access, run the following in the Supabase SQL Editor (Dashboard → SQL Editor → New Query), replacing the UUID with the target user's `id` from `auth.users` or `profiles`:
  ```sql
  update public.profiles set is_admin = true where id = '<user-uuid-here>';
  ```
- **Contact Form — No Email Notification**: The "Contact Us" form writes successfully to the `contact_messages` table, but no transactional email is sent on submission. Supabase's project is running on the default mailer, which only delivers to addresses belonging to the Supabase organization's own team members — there is no custom SMTP provider configured. Submissions are visible by querying `contact_messages` directly in the Supabase dashboard.
- **Auth Emails — Team Addresses Only**: Email confirmation and password reset emails work, but only for email addresses that belong to the Supabase project's team members, for the same default-mailer reason above. A real end user signing up with an arbitrary email will not receive a confirmation email.
- **Tier Limits Gap**: See the Known Gap note in the API Documentation section above — non-free tiers silently use the free tier's quota limit due to missing dict keys in the backend.
- **`schema.sql` Drift**: The live database has at least one column (`profiles.is_admin`) not reflected in the committed `schema.sql`. The live schema is the source of truth; the SQL file is a provisioning script, not a perfectly synced mirror.
- **RLS Policy List Not Independently Re-verified for This Document**: Policies match what `schema.sql` defines and were manually checked during development, but could not be re-queried live via the REST API without a direct Postgres connection string.

## Hackathon Context

This project was built over a single weekend for a hackathon. The judging criteria heavily weighted UI/UX polish, a flawless user flow, and clear architectural decisions over implementing real machine learning models. As such, the focus has been placed on the design system, the robust Next.js/Supabase integration, and the seamless user experience.
