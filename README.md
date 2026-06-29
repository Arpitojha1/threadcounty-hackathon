# ThreadCounty

ThreadCounty is a modern web application that provides AI-powered textile analysis. Users can upload images of fabrics and receive detailed reports including thread density, warp/weft counts, and fabric type identification.

## Live Demo

- **Frontend Application**: [https://threadcounty-hackathon.vercel.app](https://threadcounty-hackathon.vercel.app)
- *Note: For the purposes of this hackathon demo, the AI analysis engine is fully mocked. Uploading an image triggers a simulated 2-second processing delay and returns randomly generated, plausible textile data.*

**To try the demo:**
1. Visit the live URL and sign up for an account.
2. Navigate to the dashboard and upload a clear image of a fabric.
3. View the generated textile report detailing the mock AI analysis results.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS v4, shadcn/ui components, Framer Motion.
- **Backend**: FastAPI (Python 3), Uvicorn.
- **Database, Auth & Storage**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage).
- **Deployment**: Vercel (Frontend). Backend hosting is currently pending/local via Cloudflared tunnel.

## Architecture Overview

ThreadCounty uses a deliberate read/write split architecture:
- **FastAPI Backend**: Handles the `POST /api/upload` endpoint and the mocked AI processing step exclusively.
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

The database consists of 6 primary tables in the `public` schema. *(Note: The repository contains `schema.sql` as a provisioning script, but the live database has drifted slightly—e.g., `profiles.is_admin` exists in production but not in the original script).*

- **`profiles`**: User metadata (full name, avatar, `is_admin` flag).
- **`subscriptions`**: The single source of truth for a user's plan tier (free, student, professional, enterprise) and quota cycle.
- **`uploads`**: Immutable log of all image uploads. Used as the ground truth for quota tracking.
- **`reports`**: The result of the AI analysis. Contains fabric metrics and soft-delete capabilities.
- **`notifications`**: User alerts and messages.
- **`contact_messages`**: Publicly submitted contact form inquiries (Insert-only for users).

## API Contract

The FastAPI backend exposes the following endpoint for AI processing:

**`POST /api/upload`**

**Request:** `multipart/form-data`
- `file`: The image file to analyze.
- `user_id`: String, the Supabase UUID of the uploading user.
- `ai_model`: String, optional (defaults to `"standard"`).

**Response:** `application/json`
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

## Design System

The application employs a refined "neo-brutalist" aesthetic. Key elements include hard-edged components with offset shadows, high-contrast borders, and cut-corner paneling to create a technical, tactile feel appropriate for an engineering tool. Check `frontend/SKILLS.md` in the repository for the full styling specification.

## Local Development Setup

To run ThreadCounty locally, follow these steps:

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- A Supabase project

### Environment Variables
You will need to request the `.env` values from the project owner. **Do not commit actual secrets.**

**`frontend/.env.local`** requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_URL` (Defaults to `http://127.0.0.1:8000` if not set)

**`backend/.env`** requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Running the Backend
```bash
cd backend
python -m venv venv
# Activate venv (e.g., `venv\Scripts\activate` on Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment

- **Frontend**: Deployed continuously via Vercel at `https://threadcounty-hackathon.vercel.app`.
- **Backend**: Currently configured for local hosting and exposed via a `cloudflared` tunnel for the demo. Railway migration is pending. 
- **CORS**: The FastAPI backend is configured to accept requests from both `http://localhost:3000` and the production Vercel frontend URL.

## Known Limitations

- **Mock AI Analysis**: As permitted by the hackathon rules, the computer vision engine is completely mocked.
- **[CONFIRM: RLS policies]**: The exact live Row-Level Security policies could not be automatically introspected via the API, though the schema intends for users to only access their own data.
- **Backend Hosting**: The backend currently relies on a temporary tunnel rather than a persistent production host.

## Hackathon Context

This project was built over a single weekend for a hackathon. The judging criteria heavily weighted UI/UX polish, a flawless user flow, and clear architectural decisions over implementing real machine learning models. As such, the focus has been placed on the design system, the robust Next.js/Supabase integration, and the seamless user experience.
