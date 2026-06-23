@AGENTS.md

# CLAUDE.md — ThreadCounty

This file is project memory. Read it in full before making changes. It describes what exists, what doesn't, and the contracts that must not be broken.

## What ThreadCounty Is

An AI-powered textile analysis SaaS. Manufacturers/researchers upload macro images of fabric and get back automated analysis: thread density, warp/weft counts, fabric type, confidence score, and AI suggestions.

This is a hackathon project. **Mock AI data is explicitly allowed by the judges.** The backend returns realistic-looking mock analysis, not real CV inference. Judging weight is on UI/UX polish, responsiveness, and a flawless user flow — not on the AI being real.

## Repo Structure (Monorepo)

```
threadcounty-hackathon/
├── frontend/                 # Next.js — NOT YET BUILT
│   ├── src/app/
│   ├── src/components/ui/    # Shadcn components
│   ├── src/lib/supabase.ts   # Supabase client
│   └── .env.local
└── backend/                  # Python FastAPI — 100% COMPLETE, DO NOT MODIFY
    ├── core/database.py
    ├── routers/upload.py
    ├── services/mock_ai.py
    └── main.py
```

## Current Status

| Layer               | Status                                                |
| ------------------- | ----------------------------------------------------- |
| Backend (FastAPI)   | **Done.** Running locally at `http://127.0.0.1:8000`. |
| Database (Supabase) | **Done.** Tables + RLS + storage bucket all live.     |
| Frontend (Next.js)  | **Not started.** This is the only remaining work.     |

Do not write backend Python code, database schema, or SQL migrations. If something seems broken on the backend side, the default assumption is the frontend request is malformed — see "Debugging Rule" below.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** Python, FastAPI (complete, locked)
- **Database/Auth/Storage:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)

## Database State (Supabase) — Reference Only

Tables already exist: `profiles`, `subscriptions`, `uploads`, `reports`, `notifications`, `contact_messages`.
Row-Level Security (RLS) is active on all of them.
Storage bucket `fabric-images` is public and active.

The frontend should read/write through the Supabase client and through the FastAPI endpoint below — it does not need to create or alter any of this.

## Backend State (FastAPI) — Reference Only

- Base URL (local dev): `http://127.0.0.1:8000`
- CORS is configured to accept requests only from `http://localhost:3000`. If the frontend dev server runs on a different port, CORS will silently fail requests — keep frontend on port 3000 or flag the mismatch rather than trying to patch backend CORS config.

## The API Contract (must not be guessed at — this is exact)

### `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request payload (FormData fields):**
| Field | Type | Notes |
|---|---|---|
| `file` | File | Raw image file object. Must be an image. |
| `user_id` | string | Supabase Auth UID. For local dev, use hardcoded mock: `f1752a35-8422-4cd0-b7bc-2bf07286301a` |

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

### Debugging Rule

If a call to `/api/upload` fails or returns unexpected data: **assume the frontend's FormData payload is incorrectly formatted first.** Common causes, in order of likelihood:

1. `file` not appended as an actual `File`/`Blob` (e.g. appending a string or base64 instead)
2. `user_id` missing from the FormData
3. `Content-Type` header manually set to `application/json` or set explicitly at all (let the browser set the multipart boundary itself — don't hand-set `Content-Type` on a FormData fetch)
4. Dev server not running on `localhost:3000` (CORS will reject silently)

Do not attempt to "fix" this by modifying backend CORS or routes. Fix the request shape on the frontend.

## Mandatory Pages

| Route                     | Purpose                                                                                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                       | Landing — Hero, Features, Workflow, Mock Testimonials, Pricing Cards                                                                                                                                                                                              |
| `/login`, `/signup`       | Auth UI, wired to Supabase Auth                                                                                                                                                                                                                                   |
| `/dashboard`              | Welcome user, total uploads, recent reports, quick actions                                                                                                                                                                                                        |
| `/dashboard/upload`       | Drag-and-drop image upload with realistic loading state                                                                                                                                                                                                           |
| `/dashboard/results/[id]` | Uploaded image + AI JSON results, progress bars, count cards. **Data Fetch Rule:** fetch this directly from the Supabase `reports` table using `src/lib/supabase.ts`. Do not attempt to fetch this from the FastAPI backend — it has no GET endpoint for reports. |

### Read vs. Write Architecture

FastAPI is exclusively for the `POST /api/upload` heavy lifting (the mock AI processing step). For all other data retrieval — a user's past reports, the dashboard's upload history, loading a specific result by ID — query Supabase directly from Next.js using `@supabase/supabase-js`. Do not invent new Python/FastAPI endpoints to serve reads that Supabase can already answer directly.

## Design Bar

This is judged primarily on visual polish. Treat every page as a premium SaaS surface:

- Dark mode supported
- Framer Motion for meaningful transitions (not gratuitous animation)
- Shadcn UI as the component baseline: `Card`, `Button`, `Input`, `Label`, `Progress`, `Table`
- Full mobile responsiveness on every view, not just desktop
- The upload-loading state should narrate fake progress with copy like "Analyzing weave tension…", "Calculating density…" — this is part of "selling the AI experience" and is explicitly endorsed by the brief, not a hack to hide.

## Hard Constraints (do not cross these)

- No backend code changes. No SQL. No schema edits.
- No changing the `/api/upload` contract (request shape or response shape) to make the frontend's life easier — conform the frontend to the contract, not the other way around.
- No swapping Supabase, FastAPI, or the core stack for something else without it being raised explicitly first.
- `"use client"` only where interactivity actually requires it — don't blanket-apply it to the whole app.
