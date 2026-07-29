from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import router as supplier_crud_router
from app.config import settings
from app.database import Base, engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supply_agent")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        from app.models import Supplier
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Sync live data from Neon PostgreSQL over HTTPS (Port 443)
        try:
            from app.neon_sync import sync_neon_to_engine
            sync_neon_to_engine(engine, "supply")
            logger.info("Neon PostgreSQL supplier data synced successfully.")
        except Exception as se:
            logger.warning("Neon sync warning: %s", str(se))
            
    except Exception as e:
        logger.error("Failed to initialize database tables: %s", str(e), exc_info=True)
    yield
    engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(supplier_crud_router)

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "database": "Neon PostgreSQL (Synced)"
    }

@app.get("/health")
def get_health():
    return {
        "service": settings.APP_NAME,
        "status": "healthy"
    }
