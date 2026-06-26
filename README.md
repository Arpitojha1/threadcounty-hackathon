# ThreadCounty

ThreadCounty is a modern web application that automates the tedious process of measuring thread density, warp/weft counts, and fabric classification using computer vision and macro photography. Built for independent designers, researchers, and large-scale textile manufacturers.

## Project Architecture

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion.
- **Backend / DB**: Supabase (PostgreSQL, Auth, Storage).
- **Processing Engine**: The project originally targets a FastAPI Python backend for heavy AI image processing. For ease of deployment and the hackathon context, a standalone Next.js API route mock (`/api/upload`) has been implemented, allowing the entire application to run seamlessly on Vercel.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the `frontend` directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   
   # Leave empty to use the Next.js API mock, or set to your Python backend URL:
   NEXT_PUBLIC_API_URL=
   
   # Required for the Mock Next.js API Route to bypass RLS for inserts:
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Known Limitations & Hackathon Tradeoffs

To meet the deadline, the following conscious tradeoffs were made:
- **Email Confirmation Disabled:** Supabase auth is configured to allow instant logins without requiring email verification.
- **Remember Me Functionality:** The "Remember Me" checkbox uses a cross-tab safe implementation via session cookies. Supabase's default persistent auth is overridden by stripping the `max-age` directive via middleware when the user does *not* opt-in to being remembered.
- **Backend Mocking:** The Vercel deployment relies on a mocked Next.js API route to simulate the FastAPI computer vision engine. This route inserts mock analysis data into the database to allow the rest of the application (History, Dashboard, Results) to function normally.
- **RLS Restrictions on Marketing Forms:** The `/pricing` and `/contact` forms currently use styled "Coming Soon" or simulated success states. This prevents silent Row-Level Security failures since the required insert policies for anonymous users were not configured in the database schema.
- **Avatar Uploads Disabled:** Profile picture uploads were intentionally dropped to avoid a critical bug where the automated History report cleanup logic blindly purged the entire `fabric-images` bucket.
- **Report Soft Deletion and Quota:** Deleting a report from History merely soft-deletes its visibility. It does NOT refund the user's quota. The original image file remains in storage indefinitely, and re-uploading the exact same file will correctly trigger a new upload, consuming quota a second time. A scheduled backend cron job to permanently hard-delete storage files from soft-deleted reports past N days remains aspirational future work.

## Documentation

- `db_schema.md`: Consolidated database schema and RLS context.
- `api_doc.md`: API contract between the frontend and the image processing engine.
