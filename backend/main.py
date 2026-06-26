from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload

app = FastAPI(title="ThreadCounty API")

# Setup CORS so your Next.js frontend is allowed to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our modular routers
app.include_router(upload.router, prefix="/api", tags=["Uploads"])


@app.get("/")
def read_root():
    return {"status": "online", "message": "ThreadCounty Production Backend is running."}