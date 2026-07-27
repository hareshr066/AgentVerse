from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.supply import router as supply_router

app = FastAPI(
    title="Supply Chain Agent",
    version="1.0.0",
)

# Register routers
app.include_router(health_router)
app.include_router(supply_router)

@app.get("/")
def read_root():
    return {
        "service": "Supply Chain Agent",
        "status": "running"
    }
