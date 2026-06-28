import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime, timezone, timedelta
from fastapi.responses import JSONResponse
from core.database import supabase
from services.mock_ai import analyze_fabric_image

router = APIRouter()

TIER_LIMITS = {
    'free': 5,
    'student': 15,
    'professional': 100,
    'enterprise': float('inf')
}

@router.post("/upload")
async def upload_fabric_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    ai_model: str = Form("standard")
):
    try:
        # Validate file is an image
        if not file.content_type.startswith("image/"):
            return JSONResponse(status_code=400, content={
                "status": "error",
                "message": "Invalid file type. Only images are allowed."
            })

        # 1. Phase 2B: Free Tier Quota Enforcement
        sub_response = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
        if not sub_response.data:
            return JSONResponse(status_code=400, content={
                "status": "error",
                "message": "User subscription not found."
            })
            
        subscription = sub_response.data[0]
        
        plan_tier = subscription.get("plan_tier")
        limit = TIER_LIMITS.get(plan_tier, 5)
        
        if limit < float('inf'):
            period_start = subscription.get("current_period_start")
            period_end = subscription.get("current_period_end")
            
            uploads_count_res = supabase.table("uploads").select("id", count="exact").eq("user_id", user_id).gte("created_at", period_start).lte("created_at", period_end).execute()
            current_count = uploads_count_res.count if uploads_count_res.count else 0
            
            print(f"QUOTA CHECK -> user_id: {user_id}, plan_tier: {plan_tier}, limit: {limit}, period_start: {period_start}, period_end: {period_end}, current_count: {current_count}")
            
            if current_count >= limit:
                return JSONResponse(status_code=402, content={
                    "status": "error",
                    "code": "upload_limit_exceeded",
                    "message": f"You've used all {limit} uploads for this month. Upgrade to Pro for 100 uploads/month.",
                    "current_count": current_count,
                    "limit": limit
                })

        # 1. Read the file into memory
        file_bytes = await file.read()
        file_extension = file.filename.split('.')[-1]
        
        # 2. Generate a unique safe filename to prevent overwriting
        unique_filename = f"{user_id}/{uuid.uuid4()}.{file_extension}"
        
        # 3. Upload raw image to Supabase Storage Bucket ('fabric-images')
        upload_response = supabase.storage.from_("fabric-images").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        
        # Get the public URL to send back to the frontend
        image_url = supabase.storage.from_("fabric-images").get_public_url(unique_filename)
        
        # 4. Insert record into 'uploads' table
        upload_record = supabase.table("uploads").insert({
            "user_id": user_id,
            "file_path": unique_filename,
            "file_size_bytes": len(file_bytes),
            "ai_model": ai_model
        }).execute()
        
        upload_id = upload_record.data[0]['id']
        
        # 5. Run the Mock AI Analysis
        ai_results = analyze_fabric_image(file.filename)
        
        # 6. Insert record into 'reports' table
        report_record = supabase.table("reports").insert({
            "upload_id": upload_id,
            "user_id": user_id,
            "image_url": image_url,
            "thread_density": ai_results["thread_density"],
            "warp_count": ai_results["warp_count"],
            "weft_count": ai_results["weft_count"],
            "fabric_type": ai_results["fabric_type"],
            "confidence_score": ai_results["confidence_score"],
            "ai_suggestions": ai_results["ai_suggestions"]
        }).execute()
        
        # 7. Return the final payload to the frontend
        report_data = report_record.data[0]
        return {
            "status": "success",
            "message": "Image processed successfully",
            "image_url": image_url,
            "report": {
                "id": report_data["id"],
                "thread_density": report_data["thread_density"],
                "warp_count": report_data["warp_count"],
                "weft_count": report_data["weft_count"],
                "fabric_type": report_data["fabric_type"],
                "confidence_score": report_data["confidence_score"],
                "ai_suggestions": report_data["ai_suggestions"]
            }
        }
        
    except Exception as e:
        # Sanitize exception details to prevent raw postgres error strings 
        # from reaching the client
        print(f"Server error during upload: {str(e)}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "An internal server error occurred while processing the upload."
        })

@router.post("/upgrade")
async def upgrade_subscription(user_id: str = Form(...), plan_tier: str = Form(...)):
    # 1. Fetch current subscription
    sub_res = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
    if not sub_res.data:
        return JSONResponse(status_code=400, content={"error": "Subscription not found"})
        
    # 2. Update to new tier and restart billing cycle
    now = datetime.now(timezone.utc)
    new_end = now + timedelta(days=30)
    
    update_res = supabase.table("subscriptions").update({
        "plan_tier": plan_tier,
        "current_period_start": now.isoformat(),
        "current_period_end": new_end.isoformat(),
        "updated_at": now.isoformat()
    }).eq("user_id", user_id).execute()
    
    return {"status": "success", "subscription": update_res.data[0]}