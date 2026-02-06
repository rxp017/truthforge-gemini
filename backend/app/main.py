from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.verify import router as verify_router

app = FastAPI(title="TruthForge API")

# --- THIS IS THE VIP PASS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all connections (Frontend, Postman, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, etc.)
    allow_headers=["*"],
)
# ----------------------------

app.include_router(verify_router, prefix="/api")
