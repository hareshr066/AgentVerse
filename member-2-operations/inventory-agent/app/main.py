from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.inventory import router as inventory_router
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.include_router(health_router)
app.include_router(inventory_router)

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "status": "running"
    }


