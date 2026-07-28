from fastapi import FastAPI
from app.routers import router as workflow_router
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.include_router(workflow_router)

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "status": "running"
    }

@app.get("/health")
def get_health():
    return {
        "service": settings.APP_NAME,
        "status": "healthy"
    }
