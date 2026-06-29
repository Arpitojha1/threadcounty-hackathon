import os
from supabase import create_client

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321")
# We need the service role key to bypass RLS and update the report
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# if not set, let's try reading from .env.local
if not supabase_key:
    try:
        with open(".env.local", "r") as f:
            for line in f:
                if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                    supabase_url = line.strip().split("=")[1].strip('"')
                elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    supabase_key = line.strip().split("=")[1].strip('"')
    except:
        pass

print(f"URL: {supabase_url}")
supabase = create_client(supabase_url, supabase_key)

# 1. Fetch a real report
response = supabase.table("reports").select("*").limit(1).execute()
if not response.data:
    print("No reports found!")
    exit(1)

report = response.data[0]
report_id = report["id"]
original_url = report["image_url"]

print(f"Found report ID: {report_id}")
print(f"Original image_url: {original_url}")

# 2. Update to a deliberately broken URL
broken_url = "https://invalid.example.com/fake.jpg"
print(f"Updating image_url to {broken_url}...")
supabase.table("reports").update({"image_url": broken_url}).eq("id", report_id).execute()

print("Database updated.")

# 3. Restore the original URL
print(f"Restoring original image_url to {original_url}...")
supabase.table("reports").update({"image_url": original_url}).eq("id", report_id).execute()
print("Restored.")
