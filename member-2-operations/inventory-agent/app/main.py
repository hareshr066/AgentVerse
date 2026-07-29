from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.inventory import router as inventory_router
from app.api.products import router as products_router
from app.api.inventories import router as inventories_router
from app.api.suppliers import router as suppliers_router
from app.api.deliveries import router as deliveries_router
from app.routers import router as inventory_crud_router
from app.config import settings
from app.database import Base, engine
from app.core import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        from app.models import Product, Supplier, SupplierDelivery, Inventory
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Sync live data from Neon PostgreSQL over HTTPS (Port 443)
        try:
            from app.neon_sync import sync_neon_to_engine
            sync_neon_to_engine(engine, "inventory")
            logger.info("Neon PostgreSQL data synced successfully.")
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

app.include_router(health_router)
app.include_router(inventory_router)
app.include_router(products_router)
app.include_router(inventories_router)
app.include_router(suppliers_router)
app.include_router(deliveries_router)
app.include_router(inventory_crud_router)

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "database": "Neon PostgreSQL (Synced)"
    }
