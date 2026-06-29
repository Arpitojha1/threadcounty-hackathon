import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# EXPLICIT FLAG: This client uses the SUPABASE_SERVICE_ROLE_KEY and completely 
# bypasses Row Level Security (RLS). This is intentional for backend-side 
# writes where the server performs actions after its own validations.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# This creates a singleton instance of your database connection
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)