import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

logger.info("=== STARTUP ENV CHECK ===")
logger.info(f"SUPABASE_URL loaded: {'Yes' if supabase_url else 'No'} (length: {len(supabase_url) if supabase_url else 0})")
logger.info(f"SUPABASE_SERVICE_ROLE_KEY loaded: {'Yes' if supabase_key else 'No'} (length: {len(supabase_key) if supabase_key else 0})")
logger.info("=========================")

app = FastAPI(title="ThreadCounty API")

# Setup CORS so your Next.js frontend is allowed to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                          # Next.js local dev
        "https://threadcounty-hackathon.vercel.app",       # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our modular routers
app.include_router(upload.router, prefix="/api", tags=["Uploads"])


@app.get("/")
def read_root():
    return {"status": "online", "message": "ThreadCounty Production Backend is running."}