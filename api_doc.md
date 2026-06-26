# ThreadCounty API Documentation

This document outlines the API contract for the ThreadCounty backend. For the purposes of the hackathon and ease of deployment, this contract is implemented by both the original Python FastAPI backend and a Next.js API Route Mock.

## POST `/api/upload`

Processes a raw macro image of fabric, stores it in Supabase, and runs the computer vision analysis to generate a structural report.

### Request Format
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file` (File): The image file to analyze (JPEG, PNG, WebP). Max size 10MB.
  - `user_id` (String): The UUID of the authenticated user performing the upload.

### Success Response (200 OK)
- **Content-Type**: `application/json`

```json
{
  "status": "success",
  "message": "Image processed successfully",
  "image_url": "https://[project].supabase.co/storage/v1/object/public/fabric-images/[filename].png",
  "report": {
    "id": "uuid-string",
    "upload_id": "uuid-string",
    "user_id": "uuid-string",
    "thread_density": 82.4,
    "warp_count": 34,
    "weft_count": 48,
    "fabric_type": "Plain Weave Linen",
    "confidence_score": 96.2,
    "ai_suggestions": [
      "Weave tension appears uniform across the sample.",
      "No significant surface defects detected."
    ]
  }
}
```

### Error Responses
- **422 Unprocessable Entity**: Missing `file` or `user_id` in the form data.
- **500 Internal Server Error**: Database insertion failed, storage upload failed, or computer vision model crashed. The response will contain a `detail` key with the error message.
