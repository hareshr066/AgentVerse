import sys
import os
import logging
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

# Build async database URL if needed
db_url_async = settings.DATABASE_URL
if db_url_async.startswith("postgresql://"):
    db_url_async = db_url_async.replace("postgresql://", "postgresql+asyncpg://")
elif db_url_async.startswith("postgres://"):
    db_url_async = db_url_async.replace("postgres://", "postgresql+asyncpg://")

connect_args = {}
if "sqlite" in db_url_async:
    connect_args = {"check_same_thread": False}

try:
    async_engine = create_async_engine(db_url_async, echo=False, connect_args=connect_args)
    async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
except Exception as err:
    logger.warning("Could not initialize async_engine for %s: %s", mask_url(db_url_async), str(err))
    fallback_url = "sqlite+aiosqlite:///manusphere_fallback.db"
    async_engine = create_async_engine(fallback_url, echo=False)
    async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def get_async_db():
    async with async_session() as session:
        yield session
