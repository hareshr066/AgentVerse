from fastapi import FastAPI, Depends
import httpx
from app.routers import router as workflow_router
from app.config import settings
from app.dependencies import get_http_client
import app.services as services
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
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
async def get_health(client: httpx.AsyncClient = Depends(get_http_client)):
    return await services.get_health_status(client)
