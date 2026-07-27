from fastapi import FastAPI
from app.api.health import router as health_router

app = FastAPI(
    title="Supply Chain Agent",
    version="1.0.0",
)

# Register health router
app.include_router(health_router)

@app.get("/")
def read_root():
    return {
        "service": "Supply Chain Agent",
        "status": "running"
    }
