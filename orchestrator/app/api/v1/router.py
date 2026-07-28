from fastapi import APIRouter
from app.api.v1.endpoints import status, pipeline
from shared.db_endpoints import router as db_router

api_router = APIRouter()
api_router.include_router(status.router, prefix="/status", tags=["status"])
api_router.include_router(pipeline.router, tags=["pipeline"])
api_router.include_router(db_router)

