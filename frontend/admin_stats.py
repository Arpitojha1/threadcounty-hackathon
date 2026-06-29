import os
from supabase import create_client

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

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

supabase = create_client(supabase_url, supabase_key)

# 1. Total uploads (platform-wide)
uploads_res = supabase.table("uploads").select("id", count="exact").execute()
total_uploads = uploads_res.count

# 2. Total reports
reports_res = supabase.table("reports").select("id", count="exact").execute()
total_reports = reports_res.count

active_reports_res = supabase.table("reports").select("id", count="exact").is_("deleted_at", "null").execute()
active_reports = active_reports_res.count
soft_deleted_reports = total_reports - active_reports

# 3. Tier distribution
subs_res = supabase.table("subscriptions").select("plan_tier").execute()
tier_counts = {"free": 0, "student": 0, "professional": 0, "enterprise": 0}
for sub in subs_res.data:
    tier = sub.get("plan_tier", "free")
    tier_counts[tier] = tier_counts.get(tier, 0) + 1

# 4. Average confidence score
scores_res = supabase.table("reports").select("confidence_score").execute()
scores = [r["confidence_score"] for r in scores_res.data if r.get("confidence_score") is not None]
avg_confidence = round(sum(scores) / len(scores), 1) if scores else 0

# 5. Storage used
sizes_res = supabase.table("uploads").select("file_size_bytes").execute()
total_bytes = sum([r["file_size_bytes"] for r in sizes_res.data if r.get("file_size_bytes") is not None])

print(f"Total Uploads: {total_uploads}")
print(f"Total Reports: {total_reports} (Active: {active_reports}, Deleted: {soft_deleted_reports})")
print(f"Tier Distribution: {tier_counts}")
print(f"Average Confidence: {avg_confidence}%")
print(f"Total Storage (Bytes): {total_bytes}")
