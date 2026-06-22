import os
from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client

# Load secrets from the .env file
load_dotenv()

# Initialize the FastAPI app
app = FastAPI(title="ThreadCounty API")

# Connect to Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def read_root():
    return {"status": "online", "message": "ThreadCounty Backend API is running."}

@app.get("/test-db")
def test_db():
    """A quick test route to verify the database connection"""
    try:
        # Tries to read from the profiles table
        response = supabase.table("profiles").select("*").limit(1).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}