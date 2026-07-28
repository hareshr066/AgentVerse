from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
import socket
from urllib.parse import urlparse
import logging

logger = logging.getLogger("demand-agent.database")

db_url = settings.DATABASE_URL

# Sync TCP reachability check to prevent hanging on blocked firewalls
reachable = False
try:
    parsed = urlparse(db_url)
    host = parsed.hostname
    port = parsed.port or 5432
    if host:
        with socket.create_connection((host, port), timeout=2.0):
            reachable = True
except Exception:
    pass

if not reachable and "sqlite" not in db_url:
    logger.warning("Neon cloud database is unreachable on port %d. Falling back to local SQLite.", port)
    db_url = "sqlite+aiosqlite:///manusphere_fallback.db"

engine = create_async_engine(db_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
