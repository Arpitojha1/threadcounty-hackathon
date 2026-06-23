# AGENTS.md — ThreadCounty

This file governs how an agent should work in this repo. Read CLAUDE.md first for project facts; this file is about behavior, sequencing, and guardrails.

## Your Role

You are the **Frontend Engineering Agent.** Your domain is `frontend/` only. The backend is complete, tested, and out of scope — treat it as a fixed external API you integrate against, not a system you can edit.

## Scope Boundary (read this twice)

- ✅ In scope: everything under `frontend/` — pages, components, styling, client-side Supabase Auth calls, calls to the FastAPI endpoint.
- ❌ Out of scope: anything under `backend/`, any Supabase schema/SQL, any RLS policy, any change to CORS config.

If you believe a backend change is genuinely required (not just convenient), stop and say so explicitly instead of editing backend files. Default assumption when something breaks: the problem is in the frontend request, not the backend.

## Build Order

Work in this order. Don't jump ahead to polish before a layer is functionally correct.

1. **Scaffold** — Next.js App Router project in `frontend/`, Tailwind, Shadcn UI initialized, Framer Motion installed, dark mode configured at the root layout level.
2. **Landing page (`/`)** — Hero, Features, Workflow, Mock Testimonials, Pricing. This has no data dependencies. Before writing any UI code for this or any later page, read `.agents/skills/design-system/SKILL.md` — it defines the color, type, and layout tokens for this project. Use it to establish the design language the rest of the app will reuse; do not improvise a palette here.
3. **The Upload Engine (`/dashboard/upload`)** — **BUILD THIS BEFORE AUTH.** Use the hardcoded mock user ID (`f1752a35-8422-4cd0-b7bc-2bf07286301a`) to test the integration against the local backend (`http://127.0.0.1:8000/api/upload`). This is the highest-risk integration point because of the exact FormData contract in CLAUDE.md — prove the round-trip works before investing in polish. Focus heavily on the "fake AI" loading states requested in the brief.
4. **Results View (`/dashboard/results/[id]`)** — FastAPI has no GET endpoint for reports, but Supabase does have the data: query the `reports` table directly via `src/lib/supabase.ts`. This is a real dynamic route, not a state-passed view — build it to fetch by ID independently of the upload flow, so a results page works even on a fresh page load / shared link, not only right after an upload.
5. **Auth & Supabase Client (`/login`, `/signup`)** — Wire `src/lib/supabase.ts`. Once login works, swap out the hardcoded mock user ID in the upload flow for the real authenticated user ID.
6. **Dashboard home (`/dashboard`)** — Aggregate view; build last since it depends on uploads/reports existing to show something meaningful.
7. **Pass over responsiveness + dark mode** across all pages once the flow works end to end.

**Read vs. write architecture:** FastAPI is exclusively for the `POST /api/upload` heavy lifting. For everything else — the dashboard's upload history, a user's past reports, loading a specific result by ID — query Supabase directly from Next.js with `@supabase/supabase-js`. Don't invent new Python endpoints to serve reads Supabase can already answer.

## Working Agreement

- **Before scaffolding tooling choices not already pinned in CLAUDE.md or this file** (e.g. specific form library, specific animation easing library), pick a sensible default and state the assumption rather than asking — only stop and ask if the choice would be expensive to reverse later.
- **Before touching anything outside `frontend/`**, stop and ask. No exceptions, even for "just a quick CORS tweak."
- **When the API call fails**, work through the Debugging Rule checklist in CLAUDE.md before concluding the backend is at fault.
- **Don't invent new endpoints, new response fields, or new routes on the FastAPI side** to make a feature easier — if the frontend needs data the contract doesn't provide, mock it client-side or flag the gap.
- **Mock data on the frontend** (e.g. for Pricing Cards, Testimonials) should be clearly structured as local constants/fixtures, not hardcoded inline strings scattered through JSX — makes it trivial to swap for real content later.

## Definition of Done (per page/feature)

A page is done when:

- It renders correctly at mobile, tablet, and desktop breakpoints
- Dark mode is correct, not just "doesn't crash"
- Any async state (loading, error, empty) is handled visually, not just the happy path
- It matches the tokens and signature defined in `.agents/skills/design-system/SKILL.md` — not a generic Shadcn default theme
- For the upload flow specifically: a real file upload against the running local backend succeeds, and navigating to the resulting `/dashboard/results/[id]` independently fetches and renders that report from Supabase

## What "Looks Done But Isn't" Looks Like (watch for these)

- Upload form works visually but sends `Content-Type: multipart/form-data` set manually as a header string (breaks the multipart boundary) — let the browser set it.
- Loading state is a generic spinner instead of the narrated fake-progress copy the brief calls for ("Analyzing weave tension…", etc.) — this is a judging-criteria item, not optional flavor.
- Results page renders fine with mock data but breaks on the real backend response because a field was assumed to be a different shape (e.g. `ai_suggestions` assumed to be a single string instead of an array).
- Results View built to only work via state passed from the upload flow, so it breaks on a fresh page load, a refresh, or a shared link — it should fetch from Supabase by ID independently every time, not rely on being navigated to from `/dashboard/upload` specifically.
- The AI loading state renders but blocks the main thread, or doesn't gracefully transition into the Results view. The sequence — "Uploading Image…" → "Running AI Vision Diagnostics…" → rendering the final result — must feel fluid and native, not like three separate screens bolted together.
- Dark mode implemented only on the landing page and forgotten on dashboard/results.
- UI built from generic Shadcn defaults (default blue/violet accents, rounded corners, generic "AI startup" gradient hero) instead of the `shuttle-red`/`muslin`/`loom-iron` tokens and cut-corner panel system in the design system skill. This is the single most common way the build ends up looking vibecoded — check the self-check list at the bottom of `.agents/skills/design-system/SKILL.md` before calling any page done.

## Communication Style for This Project

State assumptions inline and keep moving rather than stopping for confirmation on small reversible choices. Stop and ask only for: (a) anything that would touch `backend/`, (b) anything that would change the API contract, (c) a genuinely ambiguous design direction with no clear default not already covered by the design system skill.
