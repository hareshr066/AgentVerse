import sys
import os

# Fix Python path for shared module if not already set
_current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_parent_root = os.path.abspath(os.path.join(_current_dir, "..", ".."))
if _parent_root not in sys.path:
    sys.path.insert(0, _parent_root)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.v1.endpoints import forecast
from app.core.config import settings
from app.core.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize db schema on startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=f"{settings.PROJECT_NAME} - ManuSphere AI Intelligence Module",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router)
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

