from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.config import settings

# Create a reusable async database engine for PostgreSQL
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for debugging SQL statements
    pool_pre_ping=True,
)
