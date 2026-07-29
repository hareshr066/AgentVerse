import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

# Fix Python path for shared module if not already set
_current_dir = os.path.dirname(os.path.abspath(__file__)) # app/core
_project_root = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", "..")) # repository root
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from shared.database import (
    get_db,
    SessionLocal,
    Base,
    engine,
    check_db_connection,
    mask_url
)

logger = logging.getLogger("production-agent.database")

# Build sync database URL for connection testing
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+asyncpg://"):
    sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
else:
    sync_url = db_url

use_postgres = False
try:
    test_engine = create_engine(
        sync_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 2}
    )
    with test_engine.connect() as conn:
        pass
    use_postgres = True
    logger.info("Connected to Neon PostgreSQL cloud database via TCP.")
except Exception:
    logger.info("Outbound TCP 5432 restricted or unreachable. Operating via Member 2 SQLite database fallback.")

if use_postgres:
    engine = test_engine
    db_url_async = sync_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    async_engine = create_async_engine(db_url_async, echo=False)
else:
    inv_db_path = os.path.join(_project_root, "member-2-operations", "inventory-agent", "manusphere_inventory.db")
    engine = create_engine(f"sqlite:///{inv_db_path}", connect_args={"check_same_thread": False})
    async_engine = create_async_engine(f"sqlite+aiosqlite:///{inv_db_path}", echo=False, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    async with async_session() as session:
        yield session
