import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from core.database import supabase
from services.mock_ai import analyze_fabric_image

router = APIRouter()

@router.post("/upload")
async def upload_fabric_image(
    file: UploadFile = File(...),
    user_id: str = Form(...), # We require the frontend to tell us whose account this is
    ai_model: str = Form("standard")
):
    try:
        # Check Upload Limits before processing
        profile_res = supabase.table("profiles").select("tier").eq("id", user_id).execute()
        tier = profile_res.data[0]["tier"] if profile_res.data and "tier" in profile_res.data[0] else "free"
        
        limits = {"free": 5, "student": 100, "professional": 100, "enterprise": None}
        limit = limits.get(tier, 5)
        
        if limit is not None:
            # Count current month uploads unconditionally
            from datetime import datetime
            start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
            count_res = supabase.table("uploads").select("id", count="exact").eq("user_id", user_id).gte("created_at", start_of_month).execute()
            current_count = count_res.count if count_res.count is not None else 0
            
            if current_count >= limit:
                return JSONResponse(status_code=402, content={
                    "status": "error",
                    "code": "upload_limit_exceeded",
                    "message": f"You've used all {limit} uploads for this month. Upgrade to Pro for 100 uploads/month.",
                    "current_count": current_count,
                    "limit": limit
                })
        
        if ai_model == "precision" and tier == "free":
            return JSONResponse(status_code=403, content={
                "status": "error",
                "code": "precision_model_not_allowed",
                "message": "Precision Vision model requires Student or Professional plan."
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
            "image_url": image_url,
            "file_name": file.filename,
            "file_size": len(file_bytes),
            "status": "completed"
        }).execute()
        
        upload_id = upload_record.data[0]['id']
        
        # 5. Run the Mock AI Analysis
        ai_results = analyze_fabric_image(file.filename)
        
        # 6. Insert record into 'reports' table
        report_record = supabase.table("reports").insert({
            "upload_id": upload_id,
            "user_id": user_id,
            "thread_density": ai_results["thread_density"],
            "warp_count": ai_results["warp_count"],
            "weft_count": ai_results["weft_count"],
            "fabric_type": ai_results["fabric_type"],
            "confidence_score": ai_results["confidence_score"],
            "ai_suggestions": ai_results["ai_suggestions"]
        }).execute()
        
        # 7. Return the final payload to the frontend
        return {
            "status": "success",
            "message": "Image processed successfully",
            "image_url": image_url,
            "report": report_record.data[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")